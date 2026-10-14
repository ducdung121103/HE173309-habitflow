using AppointmentSystem.Application.DTOs;
using AppointmentSystem.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace AppointmentSystem.WebAPI.Hubs;

/// <summary>
/// SignalR Hub quản lý kênh giao tiếp thời gian thực hai chiều giữa Web Client (Next.js) và Server.
/// Hỗ trợ typed client events thông qua IAppointmentClient, cơ chế nhóm khách hàng/nhân viên,
/// và phục vụ broadcast khi có lịch mới, thay đổi trạng thái hoặc nhắc nhở.
/// </summary>
public class AppointmentHub : Hub<IAppointmentClient>
{
    private readonly ILogger<AppointmentHub> _logger;

    public AppointmentHub(ILogger<AppointmentHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("🔌 Client connected to AppointmentHub: ConnectionId={ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("🔌 Client disconnected from AppointmentHub: ConnectionId={ConnectionId}, Reason={Reason}",
            Context.ConnectionId, exception?.Message ?? "Normal closure");
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Cho phép Client đăng ký lắng nghe cập nhật dành riêng cho khách hàng theo CustomerId
    /// </summary>
    public async Task JoinCustomerGroup(int customerId)
    {
        var groupName = $"customer_{customerId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        _logger.LogInformation("Client {ConnectionId} joined customer group: {Group}", Context.ConnectionId, groupName);
    }

    /// <summary>
    /// Cho phép Client nhân viên/bác sĩ đăng ký nhận toàn bộ sự kiện hệ thống
    /// </summary>
    public async Task JoinStaffGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "staff_group");
        _logger.LogInformation("Client {ConnectionId} joined staff group", Context.ConnectionId);
    }

    /// <summary>
    /// Broadcast cập nhật trạng thái lịch hẹn tới toàn bộ client liên quan
    /// </summary>
    public async Task BroadcastStatusChange(int appointmentId, string newStatus, string message)
    {
        _logger.LogInformation("Broadcasting status change: ApptId={Id}, Status={Status}", appointmentId, newStatus);
        await Clients.All.ReceiveStatusChange(appointmentId, newStatus, message);
    }
}
