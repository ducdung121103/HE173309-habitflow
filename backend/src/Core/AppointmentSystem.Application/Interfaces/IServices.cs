using AppointmentSystem.Application.DTOs;

namespace AppointmentSystem.Application.Interfaces;

// ── Generic Repository ──
public interface IRepository<T> where T : class
{
    IQueryable<T> Query();
    Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default);
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
    Task UpdateAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

// ── Strongly Typed SignalR Client Interface ──
public interface IAppointmentClient
{
    Task ReceiveAppointmentUpdate(AppointmentDto appointment, string action, string message);
    Task NewReminderNotification(string message, int appointmentId, DateTime sentAt);
    Task ReceiveStatusChange(int appointmentId, string newStatus, string message);
}

// ── Appointment Service ──
public interface IAppointmentService
{
    Task<IEnumerable<AppointmentDto>> GetAllAsync(CancellationToken ct = default);
    Task<IEnumerable<AppointmentDto>> GetByCustomerAsync(int customerId, CancellationToken ct = default);
    Task<IEnumerable<AppointmentDto>> GetByStatusAsync(string status, CancellationToken ct = default);
    Task<IEnumerable<AppointmentDto>> GetUpcomingAsync(int minutesAhead, CancellationToken ct = default);
    Task<AppointmentDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<DashboardStatsDto> GetDashboardStatsAsync(CancellationToken ct = default);
    Task<ConflictCheckResponseDto> CheckConflictAsync(ConflictCheckRequestDto dto, CancellationToken ct = default);
    Task<(bool Success, string Message, AppointmentDto? Data)> CreateAsync(CreateAppointmentDto dto, CancellationToken ct = default);
    Task<(bool Success, string Message, AppointmentDto? Data)> ConfirmAsync(int id, int staffId, CancellationToken ct = default);
    Task<(bool Success, string Message, AppointmentDto? Data)> CancelAsync(int id, string? reason = null, CancellationToken ct = default);
    Task<(bool Success, string Message, AppointmentDto? Data)> CompleteAsync(int id, CancellationToken ct = default);
}

// ── Auth Services ──
public interface ICustomerService
{
    Task<(bool Success, string Message, CustomerDto? Data)> RegisterAsync(RegisterRequestDto dto, CancellationToken ct = default);
    Task<(bool Success, string Message, CustomerDto? Data)> LoginAsync(string email, string password, CancellationToken ct = default);
    Task<CustomerDto?> GetByIdAsync(int id, CancellationToken ct = default);
}

public interface IStaffService
{
    Task<(bool Success, string Message, StaffDto? Data)> LoginAsync(string email, string password, CancellationToken ct = default);
    Task<IEnumerable<StaffDto>> GetAllAsync(CancellationToken ct = default);
    Task<StaffDto?> GetByIdAsync(int id, CancellationToken ct = default);
}

// ── Service Catalog ──
public interface IServiceCatalogService
{
    Task<IEnumerable<ServiceDto>> GetAllActiveAsync(CancellationToken ct = default);
    Task<IEnumerable<ServiceDto>> GetAllAsync(CancellationToken ct = default);
    Task<ServiceDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<(bool Success, string Message, ServiceDto? Data)> CreateAsync(ServiceDto dto, CancellationToken ct = default);
    Task<(bool Success, string Message)> UpdateAsync(ServiceDto dto, CancellationToken ct = default);
    Task<(bool Success, string Message)> DeactivateAsync(int id, CancellationToken ct = default);
}

// ── Notification Service ──
public interface INotificationService
{
    Task<NotificationDto> CreateAsync(int appointmentId, string message, string type = "Reminder", CancellationToken ct = default);
    Task<IEnumerable<NotificationDto>> GetByAppointmentAsync(int appointmentId, CancellationToken ct = default);
    Task<IEnumerable<NotificationDto>> GetRecentNotificationsAsync(int limit = 20, CancellationToken ct = default);
    Task<bool> MarkAsReadAsync(int notificationId, CancellationToken ct = default);
}
