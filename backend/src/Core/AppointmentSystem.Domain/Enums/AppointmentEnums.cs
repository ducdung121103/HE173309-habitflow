namespace AppointmentSystem.Domain.Enums;

public enum AppointmentStatus
{
    Pending,
    Confirmed,
    Completed,
    Cancelled
}

public static class AppointmentStatusExtensions
{
    public const string Pending = "Pending";
    public const string Confirmed = "Confirmed";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";

    public static string ToVietnamese(string status) => status switch
    {
        Pending => "Chờ duyệt",
        Confirmed => "Đã xác nhận",
        Completed => "Hoàn thành",
        Cancelled => "Đã hủy",
        _ => status
    };
}

public enum StaffRole
{
    Admin,
    Staff
}

public enum NotificationType
{
    Reminder,
    StatusChanged,
    General
}
