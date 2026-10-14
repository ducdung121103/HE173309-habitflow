using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using AppointmentSystem.Communication.Protocol;

namespace AppointmentSystem.DesktopApp.Helpers;

/// <summary>
/// Helper duy nhất để Desktop App giao tiếp với ServerApp qua TCP.
/// Desktop App KHÔNG reference Persistence, chỉ dùng Application DTOs và Communication Protocol.
/// </summary>
public static class TcpClientHelper
{
    private const string ServerHost = "127.0.0.1";
    private const int ServerPort = 5050;

    public static async Task<TcpResponse> SendAsync(string action, object? payload = null)
    {
        try
        {
            using var client = new TcpClient();
            await client.ConnectAsync(ServerHost, ServerPort);

            var req = new TcpRequest
            {
                Action = action,
                PayloadJson = payload is null ? string.Empty : JsonSerializer.Serialize(payload)
            };

            var stream = client.GetStream();
            var reqBytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(req));
            await stream.WriteAsync(reqBytes);

            var buffer = new byte[65536];
            var read = await stream.ReadAsync(buffer);
            var json = Encoding.UTF8.GetString(buffer, 0, read);

            return JsonSerializer.Deserialize<TcpResponse>(json)
                   ?? new TcpResponse { Success = false, Message = "Phản hồi rỗng từ server." };
        }
        catch (Exception ex)
        {
            return new TcpResponse { Success = false, Message = $"Lỗi kết nối server: {ex.Message}" };
        }
    }

    /// <summary>Deserialize DataJson từ TcpResponse thành kiểu T</summary>
    public static T? Deserialize<T>(TcpResponse resp)
        => string.IsNullOrEmpty(resp.DataJson)
           ? default
           : JsonSerializer.Deserialize<T>(resp.DataJson);
}
