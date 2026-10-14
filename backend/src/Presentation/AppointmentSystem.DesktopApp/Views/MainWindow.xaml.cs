using System.Windows;
using AppointmentSystem.Application.DTOs;
using AppointmentSystem.Communication.Protocol;
using AppointmentSystem.DesktopApp.Helpers;

namespace AppointmentSystem.DesktopApp.Views;

public partial class MainWindow : Window
{
    public StaffDto? CurrentStaff { get; set; }
    private string _currentStatusFilter = string.Empty;

    public MainWindow()
    {
        InitializeComponent();
        Loaded += MainWindow_Loaded;
    }

    private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        if (CurrentStaff != null)
        {
            Title = $"Hệ thống Quản lý Lịch hẹn - Nhân viên: {CurrentStaff.FullName} ({CurrentStaff.Role})";
        }

        await LoadAppointmentsAsync();
        await LoadServicesAsync();
    }

    private async Task LoadAppointmentsAsync(string? status = null)
    {
        _currentStatusFilter = status ?? string.Empty;
        TxtStatus.Text = "Đang tải danh sách lịch hẹn qua TCP Port 5050...";

        var filter = string.IsNullOrEmpty(status) ? null : new Dictionary<string, string> { { "status", status } };
        var resp = await TcpClientHelper.SendAsync(TcpActions.GetAppointments, filter);

        if (resp.Success)
        {
            var list = TcpClientHelper.Deserialize<List<AppointmentDto>>(resp);
            DgAppointments.ItemsSource = list;
            TxtStatus.Text = $"Đã tải {list?.Count ?? 0} lịch hẹn. (Cập nhật: {DateTime.Now:HH:mm:ss})";
        }
        else
        {
            TxtStatus.Text = $"Lỗi: {resp.Message}";
            MessageBox.Show(resp.Message, "Thông báo TCP", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }

    private async Task LoadServicesAsync()
    {
        var resp = await TcpClientHelper.SendAsync(TcpActions.GetServices, null);
        if (resp.Success)
        {
            var list = TcpClientHelper.Deserialize<List<ServiceDto>>(resp);
            DgServices.ItemsSource = list;
        }
    }

    private async void BtnAll_Click(object sender, RoutedEventArgs e)
    {
        TabMain.SelectedIndex = 0;
        await LoadAppointmentsAsync();
    }

    private async void BtnPending_Click(object sender, RoutedEventArgs e)
    {
        TabMain.SelectedIndex = 0;
        await LoadAppointmentsAsync("Pending");
    }

    private async void BtnConfirmed_Click(object sender, RoutedEventArgs e)
    {
        TabMain.SelectedIndex = 0;
        await LoadAppointmentsAsync("Confirmed");
    }

    private async void BtnStats_Click(object sender, RoutedEventArgs e)
    {
        TxtStatus.Text = "Đang lấy thống kê...";
        var resp = await TcpClientHelper.SendAsync(TcpActions.GetDashboardStats, null);
        if (resp.Success)
        {
            var stats = TcpClientHelper.Deserialize<DashboardStatsDto>(resp);
            if (stats != null)
            {
                var msg = $"📊 THỐNG KÊ LỊCH HẸN HỆ THỐNG:\n\n" +
                          $"• Tổng số lịch hẹn: {stats.TotalAppointments}\n" +
                          $"• Đang chờ duyệt (Pending): {stats.PendingCount}\n" +
                          $"• Đã xác nhận (Confirmed): {stats.ConfirmedCount}\n" +
                          $"• Đã hoàn thành (Completed): {stats.CompletedCount}\n" +
                          $"• Đã hủy (Cancelled): {stats.CancelledCount}\n" +
                          $"• Lịch hẹn hôm nay: {stats.TodayCount}\n" +
                          $"• Tổng doanh thu dự kiến: {stats.TotalRevenue:N0} VNĐ";
                MessageBox.Show(msg, "Báo cáo Thống kê", MessageBoxButton.OK, MessageBoxImage.Information);
            }
        }
        else
        {
            MessageBox.Show(resp.Message, "Lỗi lấy thống kê", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    private void BtnServices_Click(object sender, RoutedEventArgs e)
    {
        TabMain.SelectedIndex = 1;
    }

    private async void BtnRefresh_Click(object sender, RoutedEventArgs e)
    {
        if (TabMain.SelectedIndex == 0)
        {
            await LoadAppointmentsAsync(string.IsNullOrEmpty(_currentStatusFilter) ? null : _currentStatusFilter);
        }
        else
        {
            await LoadServicesAsync();
        }
    }

    private void BtnLogout_Click(object sender, RoutedEventArgs e)
    {
        var login = new LoginWindow();
        login.Show();
        Close();
    }

    private async void BtnConfirm_Click(object sender, RoutedEventArgs e)
    {
        if (DgAppointments.SelectedItem is not AppointmentDto appt)
        {
            MessageBox.Show("Vui lòng chọn một lịch hẹn để xác nhận.", "Thông báo", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        var staffId = CurrentStaff?.Id ?? 1;
        var req = new Dictionary<string, int> { { "id", appt.Id }, { "staffId", staffId } };
        var resp = await TcpClientHelper.SendAsync(TcpActions.ConfirmAppointment, req);

        if (resp.Success)
        {
            MessageBox.Show($"Lịch hẹn #{appt.Id} đã được xác nhận thành công!", "Thành công", MessageBoxButton.OK, MessageBoxImage.Information);
            await LoadAppointmentsAsync(string.IsNullOrEmpty(_currentStatusFilter) ? null : _currentStatusFilter);
        }
        else
        {
            MessageBox.Show(resp.Message, "Lỗi xác nhận", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }

    private async void BtnCancel_Click(object sender, RoutedEventArgs e)
    {
        if (DgAppointments.SelectedItem is not AppointmentDto appt)
        {
            MessageBox.Show("Vui lòng chọn một lịch hẹn để hủy.", "Thông báo", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        var confirm = MessageBox.Show($"Bạn có chắc chắn muốn hủy lịch hẹn #{appt.Id}?", "Xác nhận hủy", MessageBoxButton.YesNo, MessageBoxImage.Question);
        if (confirm != MessageBoxResult.Yes) return;

        var req = new Dictionary<string, int> { { "id", appt.Id } };
        var resp = await TcpClientHelper.SendAsync(TcpActions.CancelAppointment, req);

        if (resp.Success)
        {
            MessageBox.Show($"Lịch hẹn #{appt.Id} đã được hủy.", "Thành công", MessageBoxButton.OK, MessageBoxImage.Information);
            await LoadAppointmentsAsync(string.IsNullOrEmpty(_currentStatusFilter) ? null : _currentStatusFilter);
        }
        else
        {
            MessageBox.Show(resp.Message, "Lỗi hủy lịch", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }

    private async void BtnComplete_Click(object sender, RoutedEventArgs e)
    {
        if (DgAppointments.SelectedItem is not AppointmentDto appt)
        {
            MessageBox.Show("Vui lòng chọn một lịch hẹn để hoàn thành.", "Thông báo", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        var req = new Dictionary<string, int> { { "id", appt.Id } };
        var resp = await TcpClientHelper.SendAsync(TcpActions.CompleteAppointment, req);

        if (resp.Success)
        {
            MessageBox.Show($"Lịch hẹn #{appt.Id} đã đánh dấu hoàn thành!", "Thành công", MessageBoxButton.OK, MessageBoxImage.Information);
            await LoadAppointmentsAsync(string.IsNullOrEmpty(_currentStatusFilter) ? null : _currentStatusFilter);
        }
        else
        {
            MessageBox.Show(resp.Message, "Lỗi hoàn thành lịch", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }

    private async void BtnSaveService_Click(object sender, RoutedEventArgs e)
    {
        if (string.IsNullOrWhiteSpace(TxtServiceName.Text))
        {
            MessageBox.Show("Tên dịch vụ không được để trống.", "Cảnh báo", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!int.TryParse(TxtDuration.Text, out var duration) || duration <= 0)
        {
            MessageBox.Show("Thời lượng phải là số nguyên dương.", "Cảnh báo", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!decimal.TryParse(TxtPrice.Text, out var price) || price < 0)
        {
            MessageBox.Show("Giá tiền không hợp lệ.", "Cảnh báo", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var dto = new CreateServiceDto
        {
            Name = TxtServiceName.Text.Trim(),
            Description = TxtDescription.Text.Trim(),
            DurationMinutes = duration,
            Price = price
        };

        var resp = await TcpClientHelper.SendAsync(TcpActions.CreateService, dto);
        if (resp.Success)
        {
            MessageBox.Show("Thêm dịch vụ mới thành công!", "Thành công", MessageBoxButton.OK, MessageBoxImage.Information);
            TxtServiceName.Clear();
            TxtDescription.Clear();
            await LoadServicesAsync();
        }
        else
        {
            MessageBox.Show(resp.Message, "Lỗi lưu dịch vụ", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }

    private async void BtnDeactivateService_Click(object sender, RoutedEventArgs e)
    {
        if (DgServices.SelectedItem is not ServiceDto svc)
        {
            MessageBox.Show("Vui lòng chọn một dịch vụ từ danh sách.", "Thông báo", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        var req = new Dictionary<string, int> { { "id", svc.Id } };
        var resp = await TcpClientHelper.SendAsync(TcpActions.DeactivateService, req);
        if (resp.Success)
        {
            MessageBox.Show($"Đã thay đổi trạng thái dịch vụ '{svc.Name}'.", "Thành công", MessageBoxButton.OK, MessageBoxImage.Information);
            await LoadServicesAsync();
        }
        else
        {
            MessageBox.Show(resp.Message, "Lỗi cập nhật dịch vụ", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }
}
