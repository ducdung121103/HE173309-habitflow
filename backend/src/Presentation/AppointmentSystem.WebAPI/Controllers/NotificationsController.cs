using AppointmentSystem.Application.Interfaces;
using AppointmentSystem.WebAPI.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace AppointmentSystem.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationsController(INotificationService notificationService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetRecent([FromQuery] int limit = 20, CancellationToken ct = default)
    {
        var list = await notificationService.GetRecentNotificationsAsync(limit, ct);
        return Ok(list);
    }

    [HttpGet("appointment/{appointmentId:int}")]
    public async Task<IActionResult> GetByAppointment(int appointmentId, CancellationToken ct = default)
    {
        var list = await notificationService.GetByAppointmentAsync(appointmentId, ct);
        return Ok(list);
    }

    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id, CancellationToken ct = default)
    {
        var ok = await notificationService.MarkAsReadAsync(id, ct);
        return Ok(new { success = ok });
    }
}

[ApiController]
[Route("api/[controller]")]
public class InternalController(
    IHubContext<AppointmentHub, IAppointmentClient> hubContext,
    IAppointmentService appointmentService,
    ILogger<InternalController> logger) : ControllerBase
{
    [HttpPost("notify")]
    public async Task<IActionResult> Notify([FromBody] InternalNotifyDto req, CancellationToken ct = default)
    {
        logger.LogInformation("📢 Internal Notification received: ApptId={Id}, CustomerId={CustomerId}, Type={Type}",
            req.AppointmentId, req.CustomerId, req.Type);

        try
        {
            if (req.Type == "Reminder")
            {
                if (req.CustomerId.HasValue)
                {
                    await hubContext.Clients.Group($"customer_{req.CustomerId.Value}")
                        .NewReminderNotification(req.Message, req.AppointmentId, DateTime.Now);
                }
                else
                {
                    await hubContext.Clients.All
                        .NewReminderNotification(req.Message, req.AppointmentId, DateTime.Now);
                }
            }
            else if (req.Type == "StatusChanged")
            {
                var appt = await appointmentService.GetByIdAsync(req.AppointmentId, ct);
                if (appt is not null)
                {
                    await hubContext.Clients.All.ReceiveAppointmentUpdate(appt, "STATUS_CHANGED", req.Message);
                }
            }
            else
            {
                await hubContext.Clients.All
                    .NewReminderNotification(req.Message, req.AppointmentId, DateTime.Now);
            }

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to broadcast internal notification");
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}

public class InternalNotifyDto
{
    public int AppointmentId { get; set; }
    public int? CustomerId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "Reminder";
}
