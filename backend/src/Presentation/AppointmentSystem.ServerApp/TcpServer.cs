using System.Collections.Concurrent;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using AppointmentSystem.Application.DTOs;
using AppointmentSystem.Application.Interfaces;
using AppointmentSystem.Communication.Protocol;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AppointmentSystem.ServerApp;

/// <summary>
/// TCP Server lắng nghe kết nối từ Desktop App (Admin/Staff).
/// Đã giải quyết triệt để Captive Dependency & Concurrency:
/// - Không inject trực tiếp Scoped Service hay DbContext vào Singleton.
/// - Inject IServiceScopeFactory và tạo scope độc lập trong mỗi connection.
/// - Quản lý bất đồng bộ bằng async/await, truyền CancellationToken và theo dõi Active Connections để Graceful Shutdown.
/// </summary>
public class TcpServer(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<TcpServer> logger)
{
    private readonly int _port = configuration.GetValue<int>("NetworkSettings:TcpPort", 5050);
    private readonly string _httpNotifyUrl = configuration.GetValue<string>("NetworkSettings:HttpUrl", "http://localhost:5000") + "/api/internal/notify";
    private TcpListener? _listener;
    private readonly ConcurrentDictionary<string, Task> _activeConnections = new();
    private static readonly HttpClient _httpClient = new();

    public async Task StartAsync(CancellationToken ct)
    {
        _listener = new TcpListener(IPAddress.Any, _port);
        _listener.Start();
        logger.LogInformation("✅ [TCP Server] Đang lắng nghe tại cổng {Port} (TCP Socket)", _port);
        logger.LogInformation("🔗 [TCP Server] SignalR notification bridge: {Url}", _httpNotifyUrl);

        try
        {
            while (!ct.IsCancellationRequested)
            {
                TcpClient client;
                try
                {
                    client = await _listener.AcceptTcpClientAsync(ct);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex) when (!ct.IsCancellationRequested)
                {
                    logger.LogError(ex, "❌ Lỗi khi Accept client kết nối");
                    continue;
                }

                var remote = client.Client.RemoteEndPoint?.ToString() ?? "unknown";
                var connId = Guid.NewGuid().ToString("N");
                logger.LogInformation("🔌 [TCP] Client kết nối: {Remote} (Id={ConnId})", remote, connId);

                // Concurrency an toàn: mỗi client xử lý bằng Task độc lập với scope riêng
                var task = HandleClientAsync(client, remote, connId, ct);
                _activeConnections.TryAdd(connId, task);

                _ = task.ContinueWith(_ => { _activeConnections.TryRemove(connId, out var _); }, TaskScheduler.Default);
            }
        }
        finally
        {
            await GracefulShutdownAsync();
        }
    }

    private async Task GracefulShutdownAsync()
    {
        logger.LogInformation("🛑 [TCP Server] Đang thực hiện Graceful Shutdown...");

        try
        {
            _listener?.Stop();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Lỗi dừng TcpListener");
        }

        var activeTasks = _activeConnections.Values.ToArray();
        if (activeTasks.Length > 0)
        {
            logger.LogInformation("⏳ Chờ {Count} kết nối TCP hiện hành hoàn tất xử lý (timeout 5s)...", activeTasks.Length);
            var completedTask = await Task.WhenAny(Task.WhenAll(activeTasks), Task.Delay(5000));
            if (completedTask != Task.WhenAll(activeTasks))
            {
                logger.LogWarning("⚠️ Một số kết nối TCP chưa hoàn tất trong thời gian timeout graceful shutdown.");
            }
        }

        logger.LogInformation("✅ [TCP Server] Đã dừng an toàn hoàn toàn.");
    }

    private async Task HandleClientAsync(TcpClient client, string remote, string connId, CancellationToken ct)
    {
        using var _ = client;
        var stream = client.GetStream();
        var sw = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            var buffer = new byte[65536];
            var read = await stream.ReadAsync(buffer, ct);
            if (read == 0) return;

            var json = Encoding.UTF8.GetString(buffer, 0, read);
            var req = JsonSerializer.Deserialize<TcpRequest>(json)
                      ?? throw new InvalidOperationException("Request TCP không đúng cấu trúc.");

            logger.LogInformation("📨 [TCP:{Remote}] Action={Action}", remote, req.Action);

            // TẠO SCOPE ĐỘC LẬP TỪ IServiceScopeFactory (Tránh Captive Dependency)
            using var scope = scopeFactory.CreateScope();
            var appointmentService = scope.ServiceProvider.GetRequiredService<IAppointmentService>();
            var staffService = scope.ServiceProvider.GetRequiredService<IStaffService>();
            var serviceCatalog = scope.ServiceProvider.GetRequiredService<IServiceCatalogService>();

            var resp = await ProcessRequestAsync(req, appointmentService, staffService, serviceCatalog, ct);

            var respBytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(resp));
            await stream.WriteAsync(respBytes, ct);

            sw.Stop();
            logger.LogInformation("✅ [TCP:{Remote}] Action={Action} | {Ms}ms | Success={Status}",
                remote, req.Action, sw.ElapsedMilliseconds, resp.Success);
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("ℹ️ [TCP:{Remote}] Thao tác bị hủy do shutdown.", remote);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "❌ [TCP:{Remote}] Lỗi xử lý request", remote);
            try
            {
                var errResp = new TcpResponse { Success = false, Message = ex.Message };
                var errBytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(errResp));
                await stream.WriteAsync(errBytes, CancellationToken.None);
            }
            catch
            {
                // Client đã ngắt kết nối
            }
        }
    }

    private async Task<TcpResponse> ProcessRequestAsync(
        TcpRequest req,
        IAppointmentService appointmentService,
        IStaffService staffService,
        IServiceCatalogService serviceCatalog,
        CancellationToken ct)
    {
        return req.Action switch
        {
            TcpActions.Login => await HandleLoginAsync(req.PayloadJson, staffService, ct),
            TcpActions.GetAppointments => await HandleGetAppointmentsAsync(req.PayloadJson, appointmentService, ct),
            TcpActions.GetAppointmentById => await HandleGetAppointmentByIdAsync(req.PayloadJson, appointmentService, ct),
            TcpActions.ConfirmAppointment => await HandleConfirmAsync(req.PayloadJson, appointmentService, ct),
            TcpActions.CancelAppointment => await HandleCancelAsync(req.PayloadJson, appointmentService, ct),
            TcpActions.CompleteAppointment => await HandleCompleteAsync(req.PayloadJson, appointmentService, ct),
            TcpActions.GetServices => await HandleGetServicesAsync(serviceCatalog, ct),
            TcpActions.CreateService => await HandleCreateServiceAsync(req.PayloadJson, serviceCatalog, ct),
            TcpActions.UpdateService => await HandleUpdateServiceAsync(req.PayloadJson, serviceCatalog, ct),
            TcpActions.DeactivateService => await HandleDeactivateServiceAsync(req.PayloadJson, serviceCatalog, ct),
            TcpActions.GetDashboardStats => await HandleGetStatsAsync(appointmentService, ct),
            _ => new TcpResponse { Success = false, Message = $"Action '{req.Action}' không được hỗ trợ." }
        };
    }

    private static async Task<TcpResponse> HandleLoginAsync(string payload, IStaffService staffService, CancellationToken ct)
    {
        var req = JsonSerializer.Deserialize<LoginRequestDto>(payload);
        if (req is null) return new TcpResponse { Success = false, Message = "Dữ liệu đăng nhập trống." };

        var (ok, msg, data) = await staffService.LoginAsync(req.Email, req.Password, ct);
        return ok
            ? new TcpResponse { Success = true, Message = msg, DataJson = JsonSerializer.Serialize(data) }
            : new TcpResponse { Success = false, Message = msg };
    }

    private static async Task<TcpResponse> HandleGetAppointmentsAsync(string payload, IAppointmentService apptService, CancellationToken ct)
    {
        var filter = string.IsNullOrEmpty(payload) ? null
                   : JsonSerializer.Deserialize<Dictionary<string, string>>(payload);
        var status = filter?.GetValueOrDefault("status");

        var list = string.IsNullOrEmpty(status)
                 ? await apptService.GetAllAsync(ct)
                 : await apptService.GetByStatusAsync(status, ct);

        return new TcpResponse { Success = true, DataJson = JsonSerializer.Serialize(list) };
    }

    private static async Task<TcpResponse> HandleGetAppointmentByIdAsync(string payload, IAppointmentService apptService, CancellationToken ct)
    {
        var dict = JsonSerializer.Deserialize<Dictionary<string, int>>(payload);
        if (dict is null || !dict.TryGetValue("id", out var id))
            return new TcpResponse { Success = false, Message = "Thiếu id lịch hẹn." };

        var appt = await apptService.GetByIdAsync(id, ct);
        return appt is not null
            ? new TcpResponse { Success = true, DataJson = JsonSerializer.Serialize(appt) }
            : new TcpResponse { Success = false, Message = $"Không tìm thấy lịch hẹn #{id}." };
    }

    private async Task<TcpResponse> HandleConfirmAsync(string payload, IAppointmentService apptService, CancellationToken ct)
    {
        var dict = JsonSerializer.Deserialize<Dictionary<string, int>>(payload);
        if (dict is null || !dict.TryGetValue("id", out var id))
            return new TcpResponse { Success = false, Message = "Thiếu id lịch hẹn." };

        var staffId = dict.GetValueOrDefault("staffId", 1);
        var (ok, msg, data) = await apptService.ConfirmAsync(id, staffId, ct);

        if (ok && data is not null)
        {
            await TriggerSignalRBridgeAsync(data.Id, data.CustomerId, "Lịch hẹn đã được xác nhận qua Desktop App.", "StatusChanged");
        }

        return new TcpResponse { Success = ok, Message = msg, DataJson = data is null ? "" : JsonSerializer.Serialize(data) };
    }

    private async Task<TcpResponse> HandleCancelAsync(string payload, IAppointmentService apptService, CancellationToken ct)
    {
        var dict = JsonSerializer.Deserialize<Dictionary<string, int>>(payload);
        if (dict is null || !dict.TryGetValue("id", out var id))
            return new TcpResponse { Success = false, Message = "Thiếu id lịch hẹn." };

        var (ok, msg, data) = await apptService.CancelAsync(id, "Hủy từ Desktop Staff App", ct);

        if (ok && data is not null)
        {
            await TriggerSignalRBridgeAsync(data.Id, data.CustomerId, "Lịch hẹn đã bị hủy từ Desktop App.", "StatusChanged");
        }

        return new TcpResponse { Success = ok, Message = msg, DataJson = data is null ? "" : JsonSerializer.Serialize(data) };
    }

    private async Task<TcpResponse> HandleCompleteAsync(string payload, IAppointmentService apptService, CancellationToken ct)
    {
        var dict = JsonSerializer.Deserialize<Dictionary<string, int>>(payload);
        if (dict is null || !dict.TryGetValue("id", out var id))
            return new TcpResponse { Success = false, Message = "Thiếu id lịch hẹn." };

        var (ok, msg, data) = await apptService.CompleteAsync(id, ct);

        if (ok && data is not null)
        {
            await TriggerSignalRBridgeAsync(data.Id, data.CustomerId, "Lịch hẹn đã hoàn thành từ Desktop App.", "StatusChanged");
        }

        return new TcpResponse { Success = ok, Message = msg, DataJson = data is null ? "" : JsonSerializer.Serialize(data) };
    }

    private static async Task<TcpResponse> HandleGetServicesAsync(IServiceCatalogService serviceCatalog, CancellationToken ct)
    {
        var list = await serviceCatalog.GetAllAsync(ct);
        return new TcpResponse { Success = true, DataJson = JsonSerializer.Serialize(list) };
    }

    private static async Task<TcpResponse> HandleCreateServiceAsync(string payload, IServiceCatalogService serviceCatalog, CancellationToken ct)
    {
        var dto = JsonSerializer.Deserialize<ServiceDto>(payload);
        if (dto is null) return new TcpResponse { Success = false, Message = "Dữ liệu dịch vụ trống." };

        var (ok, msg, data) = await serviceCatalog.CreateAsync(dto, ct);
        return new TcpResponse { Success = ok, Message = msg, DataJson = data is null ? "" : JsonSerializer.Serialize(data) };
    }

    private static async Task<TcpResponse> HandleUpdateServiceAsync(string payload, IServiceCatalogService serviceCatalog, CancellationToken ct)
    {
        var dto = JsonSerializer.Deserialize<ServiceDto>(payload);
        if (dto is null) return new TcpResponse { Success = false, Message = "Dữ liệu dịch vụ trống." };

        var (ok, msg) = await serviceCatalog.UpdateAsync(dto, ct);
        return new TcpResponse { Success = ok, Message = msg };
    }

    private static async Task<TcpResponse> HandleDeactivateServiceAsync(string payload, IServiceCatalogService serviceCatalog, CancellationToken ct)
    {
        var dict = JsonSerializer.Deserialize<Dictionary<string, int>>(payload);
        if (dict is null || !dict.TryGetValue("id", out var id))
            return new TcpResponse { Success = false, Message = "Thiếu id dịch vụ." };

        var (ok, msg) = await serviceCatalog.DeactivateAsync(id, ct);
        return new TcpResponse { Success = ok, Message = msg };
    }

    private static async Task<TcpResponse> HandleGetStatsAsync(IAppointmentService apptService, CancellationToken ct)
    {
        var stats = await apptService.GetDashboardStatsAsync(ct);
        return new TcpResponse { Success = true, DataJson = JsonSerializer.Serialize(stats) };
    }

    private async Task TriggerSignalRBridgeAsync(int apptId, int customerId, string message, string type)
    {
        try
        {
            var payload = JsonSerializer.Serialize(new
            {
                appointmentId = apptId,
                customerId,
                message,
                type
            });
            var content = new StringContent(payload, Encoding.UTF8, "application/json");
            await _httpClient.PostAsync(_httpNotifyUrl, content);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Không thể gọi WebAPI notify bridge từ TCP Server: {Msg}", ex.Message);
        }
    }
}
