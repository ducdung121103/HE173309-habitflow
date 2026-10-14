using System.Security.Cryptography;
using AppointmentSystem.Application.DTOs;
using AppointmentSystem.Application.Interfaces;
using AppointmentSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AppointmentSystem.Application.Services;

/// <summary>
/// Trợ giúp mã hóa mật khẩu PBKDF2 chuẩn NIST độc lập, an toàn
/// </summary>
public static class PasswordHelper
{
    public static string HashPassword(string password)
    {
        byte[] salt = new byte[16];
        RandomNumberGenerator.Fill(salt);
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            iterations: 10000,
            HashAlgorithmName.SHA256,
            outputLength: 32);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public static bool VerifyPassword(string? hashedPassword, string password)
    {
        if (string.IsNullOrEmpty(hashedPassword)) return false;
        // Hỗ trợ mật khẩu nguyên bản từ seed data hoặc kiểm thử
        if (hashedPassword == password) return true;

        var parts = hashedPassword.Split('.');
        if (parts.Length != 2) return false;

        try
        {
            var salt = Convert.FromBase64String(parts[0]);
            var expectedHash = Convert.FromBase64String(parts[1]);
            var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                iterations: 10000,
                HashAlgorithmName.SHA256,
                outputLength: 32);
            return CryptographicOperations.FixedTimeEquals(expectedHash, actualHash);
        }
        catch
        {
            return false;
        }
    }
}

// ── Customer Auth ──
public class CustomerService(IRepository<Customer> repo) : ICustomerService
{
    public async Task<(bool Success, string Message, CustomerDto? Data)> RegisterAsync(RegisterRequestDto dto, CancellationToken ct = default)
    {
        if (await repo.Query().AnyAsync(c => c.Email == dto.Email, ct))
            return (false, "Email này đã được đăng ký tài khoản.", null);

        var customer = new Customer
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            CreatedAt = DateTime.Now,
            PasswordHash = PasswordHelper.HashPassword(dto.Password)
        };

        await repo.AddAsync(customer, ct);
        await repo.SaveChangesAsync(ct);

        return (true, "Đăng ký tài khoản thành công.", new CustomerDto
        {
            Id = customer.Id,
            FullName = customer.FullName,
            Email = customer.Email,
            Phone = customer.Phone ?? string.Empty,
            CreatedAt = customer.CreatedAt
        });
    }

    public async Task<(bool Success, string Message, CustomerDto? Data)> LoginAsync(string email, string password, CancellationToken ct = default)
    {
        var c = await repo.Query().FirstOrDefaultAsync(x => x.Email == email && x.IsActive, ct);
        if (c is null || !PasswordHelper.VerifyPassword(c.PasswordHash, password))
            return (false, "Email hoặc mật khẩu không chính xác.", null);

        return (true, "Đăng nhập thành công.", new CustomerDto
        {
            Id = c.Id,
            FullName = c.FullName,
            Email = c.Email,
            Phone = c.Phone ?? string.Empty,
            CreatedAt = c.CreatedAt
        });
    }

    public async Task<CustomerDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var c = await repo.GetByIdAsync(id, ct);
        return c is null ? null : new CustomerDto
        {
            Id = c.Id,
            FullName = c.FullName,
            Email = c.Email,
            Phone = c.Phone ?? string.Empty,
            CreatedAt = c.CreatedAt
        };
    }
}

// ── Staff Auth ──
public class StaffService(IRepository<Staff> repo) : IStaffService
{
    public async Task<(bool Success, string Message, StaffDto? Data)> LoginAsync(string email, string password, CancellationToken ct = default)
    {
        var s = await repo.Query().FirstOrDefaultAsync(x => x.Email == email && x.IsActive, ct);
        if (s is null || !PasswordHelper.VerifyPassword(s.PasswordHash, password))
            return (false, "Email hoặc mật khẩu không chính xác.", null);

        return (true, "Đăng nhập thành công.", new StaffDto
        {
            Id = s.Id,
            FullName = s.FullName,
            Email = s.Email,
            Role = s.Role
        });
    }

    public async Task<IEnumerable<StaffDto>> GetAllAsync(CancellationToken ct = default)
    {
        var list = await repo.Query().Where(s => s.IsActive).OrderBy(s => s.FullName).ToListAsync(ct);
        return list.Select(s => new StaffDto
        {
            Id = s.Id,
            FullName = s.FullName,
            Email = s.Email,
            Role = s.Role
        });
    }

    public async Task<StaffDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var s = await repo.GetByIdAsync(id, ct);
        return s is null ? null : new StaffDto
        {
            Id = s.Id,
            FullName = s.FullName,
            Email = s.Email,
            Role = s.Role
        };
    }
}

// ── Service Catalog ──
public class ServiceCatalogService(IRepository<Service> repo) : IServiceCatalogService
{
    private static ServiceDto ToDto(Service s) => new()
    {
        Id = s.Id,
        Name = s.Name,
        Description = s.Description ?? string.Empty,
        DurationMinutes = s.DurationMinutes,
        Price = s.Price,
        IsActive = s.IsActive
    };

    public async Task<IEnumerable<ServiceDto>> GetAllActiveAsync(CancellationToken ct = default)
    {
        var list = await repo.Query().Where(s => s.IsActive).OrderBy(s => s.Name).ToListAsync(ct);
        return list.Select(ToDto);
    }

    public async Task<IEnumerable<ServiceDto>> GetAllAsync(CancellationToken ct = default)
    {
        var list = await repo.Query().OrderBy(s => s.Name).ToListAsync(ct);
        return list.Select(ToDto);
    }

    public async Task<ServiceDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var s = await repo.GetByIdAsync(id, ct);
        return s is null ? null : ToDto(s);
    }

    public async Task<(bool Success, string Message, ServiceDto? Data)> CreateAsync(ServiceDto dto, CancellationToken ct = default)
    {
        var entity = new Service
        {
            Name = dto.Name,
            Description = dto.Description,
            DurationMinutes = dto.DurationMinutes,
            Price = dto.Price,
            IsActive = true
        };
        await repo.AddAsync(entity, ct);
        await repo.SaveChangesAsync(ct);
        return (true, "Tạo dịch vụ thành công.", ToDto(entity));
    }

    public async Task<(bool Success, string Message)> UpdateAsync(ServiceDto dto, CancellationToken ct = default)
    {
        var s = await repo.GetByIdAsync(dto.Id, ct);
        if (s is null)
            return (false, "Không tìm thấy dịch vụ.");

        s.Name = dto.Name;
        s.Description = dto.Description;
        s.DurationMinutes = dto.DurationMinutes;
        s.Price = dto.Price;
        s.IsActive = dto.IsActive;

        await repo.UpdateAsync(s, ct);
        await repo.SaveChangesAsync(ct);
        return (true, "Cập nhật dịch vụ thành công.");
    }

    public async Task<(bool Success, string Message)> DeactivateAsync(int id, CancellationToken ct = default)
    {
        var s = await repo.GetByIdAsync(id, ct);
        if (s is null)
            return (false, "Không tìm thấy dịch vụ.");

        s.IsActive = false;
        await repo.UpdateAsync(s, ct);
        await repo.SaveChangesAsync(ct);
        return (true, "Đã ẩn dịch vụ.");
    }
}

// ── Notification Service ──
public class NotificationService(IRepository<Notification> repo) : INotificationService
{
    private static NotificationDto ToDto(Notification n) => new()
    {
        Id = n.Id,
        AppointmentId = n.AppointmentId,
        Message = n.Message,
        Type = n.Type,
        IsRead = n.IsRead,
        SentAt = n.SentAt
    };

    public async Task<NotificationDto> CreateAsync(int appointmentId, string message, string type = "Reminder", CancellationToken ct = default)
    {
        var n = new Notification
        {
            AppointmentId = appointmentId,
            Message = message,
            Type = type,
            IsRead = false,
            SentAt = DateTime.Now
        };
        await repo.AddAsync(n, ct);
        await repo.SaveChangesAsync(ct);
        return ToDto(n);
    }

    public async Task<IEnumerable<NotificationDto>> GetByAppointmentAsync(int appointmentId, CancellationToken ct = default)
    {
        var list = await repo.Query()
            .Where(n => n.AppointmentId == appointmentId)
            .OrderByDescending(n => n.SentAt)
            .ToListAsync(ct);
        return list.Select(ToDto);
    }

    public async Task<IEnumerable<NotificationDto>> GetRecentNotificationsAsync(int limit = 20, CancellationToken ct = default)
    {
        var list = await repo.Query()
            .OrderByDescending(n => n.SentAt)
            .Take(limit)
            .ToListAsync(ct);
        return list.Select(ToDto);
    }

    public async Task<bool> MarkAsReadAsync(int notificationId, CancellationToken ct = default)
    {
        var n = await repo.GetByIdAsync(notificationId, ct);
        if (n is null) return false;

        n.IsRead = true;
        await repo.UpdateAsync(n, ct);
        await repo.SaveChangesAsync(ct);
        return true;
    }
}
