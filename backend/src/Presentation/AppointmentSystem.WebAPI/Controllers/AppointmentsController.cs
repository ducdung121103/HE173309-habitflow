using AppointmentSystem.Application.DTOs;
using AppointmentSystem.Application.Interfaces;
using AppointmentSystem.Domain.Enums;
using AppointmentSystem.WebAPI.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace AppointmentSystem.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController(
    IAppointmentService appointmentService,
    INotificationService notificationService,
    IHubContext<AppointmentHub, IAppointmentClient> hubContext,
    ILogger<AppointmentsController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status = null,
        [FromQuery] int? customerId = null,
        CancellationToken ct = default)
    {
        if (customerId.HasValue)
        {
            var customerList = await appointmentService.GetByCustomerAsync(customerId.Value, ct);
            return Ok(customerList);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var statusList = await appointmentService.GetByStatusAsync(status, ct);
            return Ok(statusList);
        }

        var all = await appointmentService.GetAllAsync(ct);
        return Ok(all);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct = default)
    {
        var appt = await appointmentService.GetByIdAsync(id, ct);
        if (appt is null) return NotFound(new { message = $"Không tìm thấy lịch hẹn #{id}." });
        return Ok(appt);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct = default)
    {
        var stats = await appointmentService.GetDashboardStatsAsync(ct);
        return Ok(stats);
    }

    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcoming([FromQuery] int minutesAhead = 60, CancellationToken ct = default)
    {
        var upcoming = await appointmentService.GetUpcomingAsync(minutesAhead, ct);
        return Ok(upcoming);
    }

    [HttpPost("check-conflict")]
    public async Task<IActionResult> CheckConflict([FromBody] ConflictCheckRequestDto dto, CancellationToken ct = default)
    {
        var result = await appointmentService.CheckConflictAsync(dto, ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAppointmentDto dto, CancellationToken ct = default)
    {
        var (ok, msg, data) = await appointmentService.CreateAsync(dto, ct);
        if (!ok || data is null)
        {
            return BadRequest(new { success = false, message = msg });
        }

        // Tạo Notification lưu DB
        await notificationService.CreateAsync(data.Id, $"Lịch hẹn mới #{data.Id} cho dịch vụ '{data.ServiceName}' đã được tạo.", "General", ct);

        // Real-time broadcast qua SignalR Hub
        try
        {
            await hubContext.Clients.All.ReceiveAppointmentUpdate(
                data,
                "CREATED",
                $"Lịch hẹn #{data.Id} vừa được đặt thành công bởi {data.CustomerName}."
            );

            await hubContext.Clients.Group($"customer_{data.CustomerId}").ReceiveStatusChange(
                data.Id,
                data.Status,
                $"Lịch hẹn #{data.Id} của bạn đã được tiếp nhận và đang chờ duyệt."
            );
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Lỗi broadcast SignalR khi tạo lịch hẹn #{Id}", data.Id);
        }

        return CreatedAtAction(nameof(GetById), new { id = data.Id }, new { success = true, message = msg, data });
    }

    [HttpPost("{id:int}/confirm")]
    public async Task<IActionResult> Confirm(int id, [FromBody] ConfirmRequest? body, CancellationToken ct = default)
    {
        int staffId = body?.StaffId ?? 1;
        var (ok, msg, data) = await appointmentService.ConfirmAsync(id, staffId, ct);
        if (!ok || data is null)
        {
            return BadRequest(new { success = false, message = msg });
        }

        await notificationService.CreateAsync(data.Id, $"Lịch hẹn #{data.Id} đã được xác nhận.", "StatusChanged", ct);

        try
        {
            await hubContext.Clients.All.ReceiveAppointmentUpdate(
                data,
                "CONFIRMED",
                $"Lịch hẹn #{data.Id} đã được xác nhận bởi nhân viên {data.StaffName}."
            );

            await hubContext.Clients.Group($"customer_{data.CustomerId}").ReceiveStatusChange(
                data.Id,
                AppointmentStatusExtensions.Confirmed,
                $"Lịch hẹn #{data.Id} của bạn đã được xác nhận thành công!"
            );
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Lỗi broadcast SignalR khi xác nhận lịch #{Id}", id);
        }

        return Ok(new { success = true, message = msg, data });
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, [FromBody] CancelRequest? body, CancellationToken ct = default)
    {
        var (ok, msg, data) = await appointmentService.CancelAsync(id, body?.Reason, ct);
        if (!ok || data is null)
        {
            return BadRequest(new { success = false, message = msg });
        }

        await notificationService.CreateAsync(data.Id, $"Lịch hẹn #{data.Id} đã bị hủy. {body?.Reason}", "StatusChanged", ct);

        try
        {
            await hubContext.Clients.All.ReceiveAppointmentUpdate(
                data,
                "CANCELLED",
                $"Lịch hẹn #{data.Id} đã bị hủy."
            );

            await hubContext.Clients.Group($"customer_{data.CustomerId}").ReceiveStatusChange(
                data.Id,
                AppointmentStatusExtensions.Cancelled,
                $"Lịch hẹn #{data.Id} đã được hủy."
            );
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Lỗi broadcast SignalR khi hủy lịch #{Id}", id);
        }

        return Ok(new { success = true, message = msg, data });
    }

    [HttpPost("{id:int}/complete")]
    public async Task<IActionResult> Complete(int id, CancellationToken ct = default)
    {
        var (ok, msg, data) = await appointmentService.CompleteAsync(id, ct);
        if (!ok || data is null)
        {
            return BadRequest(new { success = false, message = msg });
        }

        await notificationService.CreateAsync(data.Id, $"Lịch hẹn #{data.Id} đã hoàn thành.", "StatusChanged", ct);

        try
        {
            await hubContext.Clients.All.ReceiveAppointmentUpdate(
                data,
                "COMPLETED",
                $"Lịch hẹn #{data.Id} đã hoàn tất buổi hẹn."
            );

            await hubContext.Clients.Group($"customer_{data.CustomerId}").ReceiveStatusChange(
                data.Id,
                AppointmentStatusExtensions.Completed,
                $"Cảm ơn bạn đã sử dụng dịch vụ! Lịch hẹn #{data.Id} đã hoàn thành."
            );
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Lỗi broadcast SignalR khi hoàn thành lịch #{Id}", id);
        }

        return Ok(new { success = true, message = msg, data });
    }
}

public record ConfirmRequest(int? StaffId);
public record CancelRequest(string? Reason);
