using System.Windows;
using AppointmentSystem.Application.DTOs;
using AppointmentSystem.Communication.Protocol;
using AppointmentSystem.DesktopApp.Helpers;

namespace AppointmentSystem.DesktopApp.Views;

public partial class LoginWindow : Window
{
    public LoginWindow() => InitializeComponent();

    private async void BtnLogin_Click(object sender, RoutedEventArgs e)
    {
        TxtError.Text = "Đang kết nối TCP tới cổng 5050...";
        var req = new LoginRequestDto
        {
            Email = TxtEmail.Text.Trim(),
            Password = TxtPassword.Password,
            Role = "Staff"
        };

        var resp = await TcpClientHelper.SendAsync(TcpActions.Login, req);
        if (!resp.Success)
        {
            TxtError.Text = resp.Message.Contains("kết nối")
                ? "⚠️ Không thể kết nối tới ServerApp TCP socket (Port 5050). Vui lòng khởi chạy ServerApp trước."
                : "❌ " + resp.Message;
            return;
        }

        var staff = TcpClientHelper.Deserialize<StaffDto>(resp);
        var main = new MainWindow { CurrentStaff = staff };
        main.Show();
        Close();
    }
}
