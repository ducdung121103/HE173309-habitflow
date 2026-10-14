using AppointmentSystem.Application.DTOs;
using AppointmentSystem.Application.Interfaces;
using AppointmentSystem.Domain.Entities;
using AppointmentSystem.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AppointmentSystem.Application.Services;

public class AppointmentService(
    IRepository<Appointment> appointmentRepo,
    IRepository<Service> serviceRepo) : IAppointmentService
{
    private static AppointmentDto ToDto(Appointment a) => new()
    {
        Id = a.Id,
        CustomerId = a.CustomerId,
        CustomerName = a.Customer?.FullName ?? string.Empty,
        CustomerEmail = a.Customer?.Email ?? string.Empty,
        CustomerPhone = a.Customer?.Phone ?? string.Empty,
        StaffId = a.StaffId,
        StaffName = a.Staff?.FullName ?? "Chưa phân công",
        ServiceId = a.ServiceId,
        ServiceName = a.Service?.Name ?? string.Empty,
        ServicePrice = a.Service?.Price ?? 0,
        AppointmentDate = a.AppointmentDate.ToDateTime(TimeOnly.MinValue),
        StartTime = a.StartTime.ToString("HH:mm"),
        EndTime = a.EndTime.ToString("HH:mm"),
        Status = a.Status,
        StatusVietnamese = AppointmentStatusExtensions.ToVietnamese(a.Status),
        Notes = a.Notes ?? string.Empty,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt
    };

    private IQueryable<Appointment> WithIncludes()
        => appointmentRepo.Query()
            .Include(a => a.Customer)
            .Include(a => a.Staff)
            .Include(a => a.Service);

    public async Task<IEnumerable<AppointmentDto>> GetAllAsync(CancellationToken ct = default)
    {
        var list = await WithIncludes().OrderByDescending(a => a.AppointmentDate).ThenByDescending(a => a.StartTime).ToListAsync(ct);
        return list.Select(ToDto);
    }

    public async Task<IEnumerable<AppointmentDto>> GetByCustomerAsync(int customerId, CancellationToken ct = default)
    {
        var list = await WithIncludes()
            .Where(a => a.CustomerId == customerId)
            .OrderByDescending(a => a.AppointmentDate)
            .ThenByDescending(a => a.StartTime)
            .ToListAsync(ct);
        return list.Select(ToDto);
    }

    public async Task<IEnumerable<AppointmentDto>> GetByStatusAsync(string status, CancellationToken ct = default)
    {
        var list = await WithIncludes()
            .Where(a => a.Status == status)
            .OrderBy(a => a.AppointmentDate)
            .ThenBy(a => a.StartTime)
            .ToListAsync(ct);
        return list.Select(ToDto);
    }

    public async Task<IEnumerable<AppointmentDto>> GetUpcomingAsync(int minutesAhead, CancellationToken ct = default)
    {
        var now = DateTime.Now;
        var today = DateOnly.FromDateTime(now);
        var cutoff = TimeOnly.FromDateTime(now.AddMinutes(minutesAhead));
        var nowTime = TimeOnly.FromDateTime(now);

        var list = await WithIncludes()
            .Where(a => a.Status == AppointmentStatusExtensions.Confirmed
                     && a.AppointmentDate == today
                     && a.StartTime >= nowTime
                     && a.StartTime <= cutoff)
            .OrderBy(a => a.StartTime)
            .ToListAsync(ct);

        return list.Select(ToDto);
    }

    public async Task<AppointmentDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var a = await WithIncludes().FirstOrDefaultAsync(x => x.Id == id, ct);
        return a is null ? null : ToDto(a);
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync(CancellationToken ct = default)
    {
        var all = await WithIncludes().ToListAsync(ct);
        var today = DateOnly.FromDateTime(DateTime.Today);

        return new DashboardStatsDto
        {
            TotalAppointments = all.Count,
            PendingCount = all.Count(a => a.Status == AppointmentStatusExtensions.Pending),
            ConfirmedCount = all.Count(a => a.Status == AppointmentStatusExtensions.Confirmed),
            CompletedCount = all.Count(a => a.Status == AppointmentStatusExtensions.Completed),
            CancelledCount = all.Count(a => a.Status == AppointmentStatusExtensions.Cancelled),
            UpcomingTodayCount = all.Count(a => a.AppointmentDate == today && a.Status == AppointmentStatusExtensions.Confirmed),
            TotalRevenue = all.Where(a => a.Status == AppointmentStatusExtensions.Completed).Sum(a => a.Service?.Price ?? 0)
        };
    }

    public async Task<ConflictCheckResponseDto> CheckConflictAsync(ConflictCheckRequestDto dto, CancellationToken ct = default)
    {
        if (!DateOnly.TryParse(dto.Date, out var date) || !TimeOnly.TryParse(dto.StartTime, out var start))
        {
            return new ConflictCheckResponseDto { HasConflict = false, Message = "Định dạng ngày hoặc giờ không hợp lệ." };
        }

        var service = await serviceRepo.GetByIdAsync(dto.ServiceId, ct);
        if (service is null)
        {
            return new ConflictCheckResponseDto { HasConflict = false, Message = "Dịch vụ không tồn tại." };
        }

        var end = start.AddMinutes(service.DurationMinutes);

        var conflicts = await appointmentRepo.Query()
            .Where(a => a.AppointmentDate == date
                     && a.Status != AppointmentStatusExtensions.Cancelled
                     && (!dto.ExcludeAppointmentId.HasValue || a.Id != dto.ExcludeAppointmentId.Value)
                     && a.StartTime < end
                     && a.EndTime > start)
            .Select(a => $"{a.StartTime:HH\\:mm} - {a.EndTime:HH\\:mm}")
            .ToListAsync(ct);

        if (conflicts.Count > 0)
        {
            return new ConflictCheckResponseDto
            {
                HasConflict = true,
                Message = $"Khung giờ {start:HH:mm} - {end:HH:mm} đã bị trùng với lịch hẹn khác.",
                ConflictingSlots = conflicts
            };
        }

        return new ConflictCheckResponseDto
        {
            HasConflict = false,
            Message = $"Khung giờ {start:HH:mm} - {end:HH:mm} khả dụng."
        };
    }

    public async Task<(bool Success, string Message, AppointmentDto? Data)> CreateAsync(CreateAppointmentDto dto, CancellationToken ct = default)
    {
        if (!DateOnly.TryParse(dto.AppointmentDate, out var date))
            return (false, "Ngày hẹn không đúng định dạng (yyyy-MM-dd).", null);

        if (!TimeOnly.TryParse(dto.StartTime, out var start))
            return (false, "Giờ hẹn không đúng định dạng (HH:mm).", null);

        var service = await serviceRepo.GetByIdAsync(dto.ServiceId, ct);
        if (service is null || !service.IsActive)
            return (false, "Dịch vụ không tồn tại hoặc tạm ngưng hoạt động.", null);

        var end = start.AddMinutes(service.DurationMinutes);

        // Strict Concurrency & Overlap Prevention (ACID double-booking check)
        var conflict = await appointmentRepo.Query().AnyAsync(a =>
            a.AppointmentDate == date &&
            a.Status != AppointmentStatusExtensions.Cancelled &&
            a.StartTime < end &&
            a.EndTime > start, ct);

        if (conflict)
            return (false, $"Khung giờ {start:HH:mm} - {end:HH:mm} ngày {date:dd/MM/yyyy} đã có người đặt trước.", null);

        var appt = new Appointment
        {
            CustomerId = dto.CustomerId,
            ServiceId = dto.ServiceId,
            AppointmentDate = date,
            StartTime = start,
            EndTime = end,
            Status = AppointmentStatusExtensions.Pending,
            Notes = dto.Notes,
            CreatedAt = DateTime.Now
        };

        await appointmentRepo.AddAsync(appt, ct);
        await appointmentRepo.SaveChangesAsync(ct);

        var created = await WithIncludes().FirstOrDefaultAsync(a => a.Id == appt.Id, ct);
        return (true, "Đặt lịch hẹn thành công!", created is null ? null : ToDto(created));
    }

    public async Task<(bool Success, string Message, AppointmentDto? Data)> ConfirmAsync(int id, int staffId, CancellationToken ct = default)
    {
        var appt = await appointmentRepo.Query().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (appt is null)
            return (false, "Không tìm thấy lịch hẹn.", null);

        if (appt.Status != AppointmentStatusExtensions.Pending)
            return (false, $"Lịch hẹn đang ở trạng thái '{AppointmentStatusExtensions.ToVietnamese(appt.Status)}', không thể xác nhận.", null);

        appt.Status = AppointmentStatusExtensions.Confirmed;
        appt.StaffId = staffId;
        appt.UpdatedAt = DateTime.Now;

        await appointmentRepo.UpdateAsync(appt, ct);
        await appointmentRepo.SaveChangesAsync(ct);

        var updated = await WithIncludes().FirstOrDefaultAsync(a => a.Id == appt.Id, ct);
        return (true, "Xác nhận lịch hẹn thành công.", updated is null ? null : ToDto(updated));
    }

    public async Task<(bool Success, string Message, AppointmentDto? Data)> CancelAsync(int id, string? reason = null, CancellationToken ct = default)
    {
        var appt = await appointmentRepo.Query().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (appt is null)
            return (false, "Không tìm thấy lịch hẹn.", null);

        if (appt.Status == AppointmentStatusExtensions.Completed || appt.Status == AppointmentStatusExtensions.Cancelled)
            return (false, $"Không thể hủy lịch hẹn đã '{AppointmentStatusExtensions.ToVietnamese(appt.Status)}'.", null);

        appt.Status = AppointmentStatusExtensions.Cancelled;
        if (!string.IsNullOrWhiteSpace(reason))
        {
            appt.Notes = string.IsNullOrWhiteSpace(appt.Notes) ? $"Lý do hủy: {reason}" : $"{appt.Notes} | Lý do hủy: {reason}";
        }
        appt.UpdatedAt = DateTime.Now;

        await appointmentRepo.UpdateAsync(appt, ct);
        await appointmentRepo.SaveChangesAsync(ct);

        var updated = await WithIncludes().FirstOrDefaultAsync(a => a.Id == appt.Id, ct);
        return (true, "Hủy lịch hẹn thành công.", updated is null ? null : ToDto(updated));
    }

    public async Task<(bool Success, string Message, AppointmentDto? Data)> CompleteAsync(int id, CancellationToken ct = default)
    {
        var appt = await appointmentRepo.Query().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (appt is null)
            return (false, "Không tìm thấy lịch hẹn.", null);

        if (appt.Status != AppointmentStatusExtensions.Confirmed)
            return (false, "Chỉ có thể hoàn thành lịch hẹn đã được xác nhận.", null);

        appt.Status = AppointmentStatusExtensions.Completed;
        appt.UpdatedAt = DateTime.Now;

        await appointmentRepo.UpdateAsync(appt, ct);
        await appointmentRepo.SaveChangesAsync(ct);

        var updated = await WithIncludes().FirstOrDefaultAsync(a => a.Id == appt.Id, ct);
        return (true, "Lịch hẹn đã được đánh dấu hoàn thành.", updated is null ? null : ToDto(updated));
    }
}
