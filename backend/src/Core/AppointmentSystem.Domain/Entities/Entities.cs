using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppointmentSystem.Domain.Entities;

public class Customer
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}

public class Staff
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(20)]
    public string Role { get; set; } = "Staff";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}

public class Service
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public int DurationMinutes { get; set; } = 30;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}

public class Appointment
{
    public int Id { get; set; }

    public int CustomerId { get; set; }

    public int? StaffId { get; set; }

    public int ServiceId { get; set; }

    public DateOnly AppointmentDate { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "Pending";

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    public Customer Customer { get; set; } = null!;

    public Staff? Staff { get; set; }

    public Service Service { get; set; } = null!;

    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}

public class Notification
{
    public int Id { get; set; }

    public int AppointmentId { get; set; }

    [Required, MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    [MaxLength(30)]
    public string Type { get; set; } = "Reminder";

    public bool IsRead { get; set; } = false;

    public DateTime SentAt { get; set; } = DateTime.Now;

    public Appointment Appointment { get; set; } = null!;
}
