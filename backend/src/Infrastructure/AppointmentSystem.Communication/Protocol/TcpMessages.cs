namespace AppointmentSystem.Communication.Protocol;

/// <summary>
/// Gói tin Desktop App gửi lên ServerApp qua TCP (serialize JSON)
/// </summary>
public class TcpRequest
{
    public string Action { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = string.Empty;
}

/// <summary>
/// Gói tin ServerApp trả về Desktop App (serialize JSON)
/// </summary>
public class TcpResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string DataJson { get; set; } = string.Empty;
}

/// <summary>
/// Danh sách Action TCP hợp lệ
/// </summary>
public static class TcpActions
{
    public const string Login = "Login";
    public const string GetAppointments = "GetAppointments";
    public const string GetAppointmentById = "GetAppointmentById";
    public const string ConfirmAppointment = "ConfirmAppointment";
    public const string CancelAppointment = "CancelAppointment";
    public const string CompleteAppointment = "CompleteAppointment";
    public const string GetServices = "GetServices";
    public const string CreateService = "CreateService";
    public const string UpdateService = "UpdateService";
    public const string DeactivateService = "DeactivateService";
    public const string GetDashboardStats = "GetDashboardStats";
}
