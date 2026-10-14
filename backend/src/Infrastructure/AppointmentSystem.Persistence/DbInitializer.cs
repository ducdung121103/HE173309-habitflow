using AppointmentSystem.Domain.Entities;
using AppointmentSystem.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AppointmentSystem.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext db, ILogger logger, CancellationToken ct = default)
    {
        try
        {
            await db.Database.EnsureCreatedAsync(ct);

            // Check if data exists
            if (await db.Services.AnyAsync(ct))
            {
                return; // DB already seeded
            }

            logger.LogInformation("🌱 Seeding initial data with Unicode Vietnamese strings...");

            // 1. Staff
            var staffs = new List<Staff>
            {
                new() { FullName = "Quản trị viên", Email = "admin@appointment.com", PasswordHash = "123456", Role = "Admin" },
                new() { FullName = "Trần Nhân Viên", Email = "staff@appointment.com", PasswordHash = "123456", Role = "Staff" },
                new() { FullName = "Bác sĩ Hoàng Nam", Email = "doctor@appointment.com", PasswordHash = "123456", Role = "Staff" }
            };
            await db.Staffs.AddRangeAsync(staffs, ct);

            // 2. Services
            var services = new List<Service>
            {
                new() { Name = "Tư vấn cơ bản", Description = "Buổi tư vấn khám và đánh giá ban đầu 30 phút", DurationMinutes = 30, Price = 200000 },
                new() { Name = "Khám chuyên sâu", Description = "Khám tổng quát chuyên sâu và tư vấn chi tiết 60 phút", DurationMinutes = 60, Price = 500000 },
                new() { Name = "Theo dõi định kỳ", Description = "15 phút kiểm tra sức khỏe và chỉ số định kỳ", DurationMinutes = 15, Price = 100000 },
                new() { Name = "Khám tổng quát", Description = "Gói khám sức khỏe toàn diện các chuyên khoa", DurationMinutes = 90, Price = 750000 }
            };
            await db.Services.AddRangeAsync(services, ct);

            // 3. Customers
            var customers = new List<Customer>
            {
                new() { FullName = "Nguyễn Văn Khách", Email = "khachhang@gmail.com", Phone = "0901234567", PasswordHash = "123456" },
                new() { FullName = "Phạm Thị Test", Email = "phamtest@gmail.com", Phone = "0912345678", PasswordHash = "123456" },
                new() { FullName = "Lê Thu Trang", Email = "lethutrang@gmail.com", Phone = "0988776655", PasswordHash = "123456" }
            };
            await db.Customers.AddRangeAsync(customers, ct);
            await db.SaveChangesAsync(ct);

            // 4. Appointments
            var today = DateOnly.FromDateTime(DateTime.Today);
            var appointments = new List<Appointment>
            {
                new()
                {
                    CustomerId = customers[0].Id,
                    StaffId = staffs[1].Id,
                    ServiceId = services[0].Id,
                    AppointmentDate = today.AddDays(1),
                    StartTime = new TimeOnly(9, 0),
                    EndTime = new TimeOnly(9, 30),
                    Status = "Pending",
                    Notes = "Lần đầu tiên đặt lịch khám"
                },
                new()
                {
                    CustomerId = customers[0].Id,
                    StaffId = staffs[1].Id,
                    ServiceId = services[1].Id,
                    AppointmentDate = today.AddDays(2),
                    StartTime = new TimeOnly(14, 0),
                    EndTime = new TimeOnly(15, 0),
                    Status = "Confirmed",
                    Notes = "Tái khám theo chỉ định"
                },
                new()
                {
                    CustomerId = customers[1].Id,
                    StaffId = staffs[2].Id,
                    ServiceId = services[3].Id,
                    AppointmentDate = today.AddDays(3),
                    StartTime = new TimeOnly(8, 30),
                    EndTime = new TimeOnly(10, 0),
                    Status = "Confirmed",
                    Notes = "Khám tổng quát định kỳ hàng năm"
                },
                new()
                {
                    CustomerId = customers[2].Id,
                    StaffId = staffs[1].Id,
                    ServiceId = services[2].Id,
                    AppointmentDate = today.AddDays(1),
                    StartTime = new TimeOnly(10, 30),
                    EndTime = new TimeOnly(10, 45),
                    Status = "Pending",
                    Notes = "Kiểm tra huyết áp và xét nghiệm"
                }
            };
            await db.Appointments.AddRangeAsync(appointments, ct);
            await db.SaveChangesAsync(ct);

            // 5. Notifications
            var notifications = new List<Notification>
            {
                new()
                {
                    AppointmentId = appointments[0].Id,
                    Message = "Lịch hẹn #1 đã được tạo và đang chờ duyệt.",
                    Type = "General"
                },
                new()
                {
                    AppointmentId = appointments[1].Id,
                    Message = "Nhắc nhở: Lịch hẹn Khám chuyên sâu vào ngày mai lúc 14:00.",
                    Type = "Reminder"
                }
            };
            await db.Notifications.AddRangeAsync(notifications, ct);
            await db.SaveChangesAsync(ct);

            logger.LogInformation("✅ Database seeded successfully!");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "❌ Error occurred while seeding database");
        }
    }
}
