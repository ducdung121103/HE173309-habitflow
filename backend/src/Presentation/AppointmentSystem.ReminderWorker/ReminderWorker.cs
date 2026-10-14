using System.Text;
using System.Text.Json;
using AppointmentSystem.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AppointmentSystem.ReminderWorker;

/// <summary>
/// Background Worker Service quét lịch hẹn sắp tới định kỳ.
/// Đã giải quyết Captive Dependency:
/// - Không inject trực tiếp DbContext/IRepository vào BackgroundService (Singleton).
/// - Inject IServiceScopeFactory và tạo scope độc lập trong mỗi chu kỳ quét (CheckAndSendRemindersAsync).
/// - Quản lý bất đồng bộ triệt để bằng async/await và truyền CancellationToken.
/// - Sử dụng IHttpClientFactory để tái sử dụng socket an toàn khi gọi WebAPI.
/// </summary>
public class ReminderWorker(
    IServiceScopeFactory scopeFactory,
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<ReminderWorker> logger) : BackgroundService
{
    private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(configuration.GetValue<int>("NetworkSettings:CheckIntervalSeconds", 60));
    private readonly int _reminderMinutes = configuration.GetValue<int>("NetworkSettings:ReminderMinutesAhead", 60);
    private readonly string _notifyUrl = configuration.GetValue<string>("NetworkSettings:HttpUrl", "http://localhost:5000") + "/api/internal/notify";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("🕐 [ReminderWorker] Đã khởi động background service. Quét mỗi {Interval}s, nhắc trước {Minutes} phút.",
            _checkInterval.TotalSeconds, _reminderMinutes);
        logger.LogInformation("🔗 [ReminderWorker] Endpoint WebAPI SignalR bridge: {Url}", _notifyUrl);

        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckAndSendRemindersAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "❌ Lỗi trong chu kỳ quét ReminderWorker");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("ℹ️ [ReminderWorker] Nhận tín hiệu dừng từ runtime.");
        }
        finally
        {
            logger.LogInformation("🛑 [ReminderWorker] Đã dừng an toàn (Graceful Shutdown).");
        }
    }

    private async Task CheckAndSendRemindersAsync(CancellationToken ct)
    {
        // TẠO SCOPE ĐỘC LẬP BẰNG IServiceScopeFactory CHO MỖI CHU KỲ (Tránh Captive Dependency)
        using var scope = scopeFactory.CreateScope();
        var appointmentService = scope.ServiceProvider.GetRequiredService<IAppointmentService>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var upcoming = (await appointmentService.GetUpcomingAsync(_reminderMinutes, ct)).ToList();
        var nowStr = DateTime.Now.ToString("HH:mm:ss dd/MM/yyyy");

        if (upcoming.Count == 0)
        {
            logger.LogInformation("[{Time}] [ReminderWorker] Không có lịch hẹn cần nhắc.", nowStr);
            return;
        }

        logger.LogInformation("[{Time}] [ReminderWorker] Phát hiện {Count} lịch hẹn sắp diễn ra trong {Minutes} phút tới.",
            nowStr, upcoming.Count, _reminderMinutes);

        var httpClient = httpClientFactory.CreateClient("WebApiClient");

        foreach (var appt in upcoming)
        {
            ct.ThrowIfCancellationRequested();

            var message = $"Nhắc nhở: Lịch hẹn '{appt.ServiceName}' của bạn lúc {appt.StartTime} hôm nay sắp bắt đầu.";

            // 1. Ghi nhận Notification vào cơ sở dữ liệu
            await notificationService.CreateAsync(appt.Id, message, "Reminder", ct);

            // 2. Gửi HTTP Post tới WebAPI Internal Controller để bắn SignalR thời gian thực tới đúng khách hàng
            try
            {
                var payload = JsonSerializer.Serialize(new
                {
                    appointmentId = appt.Id,
                    customerId = appt.CustomerId,
                    message,
                    type = "Reminder"
                });

                var response = await httpClient.PostAsync(
                    _notifyUrl,
                    new StringContent(payload, Encoding.UTF8, "application/json"),
                    ct);

                if (response.IsSuccessStatusCode)
                {
                    logger.LogInformation("✅ [ReminderWorker] Đã đẩy SignalR thông báo lịch #{Id} tới khách #{CustId} thành công.", appt.Id, appt.CustomerId);
                }
                else
                {
                    logger.LogWarning("⚠️ [ReminderWorker] WebAPI trả về status {Code} khi thông báo lịch #{Id}.", response.StatusCode, appt.Id);
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "⚠️ [ReminderWorker] Không thể kết nối WebAPI để đẩy SignalR realtime: {Message}", ex.Message);
            }
        }
    }
}
