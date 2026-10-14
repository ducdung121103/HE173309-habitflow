namespace AppointmentSystem.Application.DTOs;

// ── Customer DTOs ──
public class CustomerDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

// ── Staff DTOs ──
public class StaffDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Staff";
}

// ── Service DTOs ──
public class ServiceDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; }
}

// ── Appointment DTOs ──
public class AppointmentDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public int? StaffId { get; set; }
    public string StaffName { get; set; } = string.Empty;
    public int ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public decimal ServicePrice { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StatusVietnamese { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateAppointmentDto
{
    public int CustomerId { get; set; }
    public int ServiceId { get; set; }
    public string AppointmentDate { get; set; } = string.Empty; // Format: yyyy-MM-dd
    public string StartTime { get; set; } = string.Empty;       // Format: HH:mm
    public string Notes { get; set; } = string.Empty;
}

public class UpdateAppointmentStatusDto
{
    public int Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? StaffId { get; set; }
    public string? Reason { get; set; }
}

public class ConflictCheckRequestDto
{
    public string Date { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public int ServiceId { get; set; }
    public int? ExcludeAppointmentId { get; set; }
}

public class ConflictCheckResponseDto
{
    public bool HasConflict { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string> ConflictingSlots { get; set; } = new();
}

public class DashboardStatsDto
{
    public int TotalAppointments { get; set; }
    public int PendingCount { get; set; }
    public int ConfirmedCount { get; set; }
    public int CompletedCount { get; set; }
    public int CancelledCount { get; set; }
    public int UpcomingTodayCount { get; set; }
    public int TodayCount { get => UpcomingTodayCount; set => UpcomingTodayCount = value; }
    public decimal TotalRevenue { get; set; }
}

public class CreateServiceDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }
}

// ── Auth DTOs ──
public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Customer"; // "Customer", "Staff", "Admin"
}

public class LoginResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public CustomerDto? Customer { get; set; }
    public StaffDto? Staff { get; set; }
}

public class RegisterRequestDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

// ── Notification DTOs ──
public class NotificationDto
{
    public int Id { get; set; }
    public int AppointmentId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "Reminder";
    public bool IsRead { get; set; }
    public DateTime SentAt { get; set; }
}
