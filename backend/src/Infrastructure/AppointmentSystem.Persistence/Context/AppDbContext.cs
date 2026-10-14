using AppointmentSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AppointmentSystem.Persistence.Context;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Customer> Customers { get; set; } = null!;
    public DbSet<Staff> Staffs { get; set; } = null!;
    public DbSet<Service> Services { get; set; } = null!;
    public DbSet<Appointment> Appointments { get; set; } = null!;
    public DbSet<Notification> Notifications { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);

        // ── Customer Configuration ──
        mb.Entity<Customer>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Email).IsRequired().HasMaxLength(100).UseCollation("Latin1_General_CI_AS");
            entity.HasIndex(c => c.Email).IsUnique();
        });

        // ── Staff Configuration ──
        mb.Entity<Staff>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Email).IsRequired().HasMaxLength(100).UseCollation("Latin1_General_CI_AS");
            entity.HasIndex(s => s.Email).IsUnique();
        });

        // ── Appointment Relationships ──
        mb.Entity<Appointment>(entity =>
        {
            entity.HasKey(a => a.Id);

            entity.HasOne(a => a.Customer)
                  .WithMany(c => c.Appointments)
                  .HasForeignKey(a => a.CustomerId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.Staff)
                  .WithMany(s => s.Appointments)
                  .HasForeignKey(a => a.StaffId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(a => a.Service)
                  .WithMany(s => s.Appointments)
                  .HasForeignKey(a => a.ServiceId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Indexes for frequently queried columns (Requirement: AppointmentTime, Status, UserId)
            entity.HasIndex(a => new { a.AppointmentDate, a.StartTime })
                  .HasDatabaseName("IX_Appointments_Date_Time");

            entity.HasIndex(a => new { a.AppointmentDate, a.Status })
                  .HasDatabaseName("IX_Appointments_Date_Status");

            entity.HasIndex(a => a.Status)
                  .HasDatabaseName("IX_Appointments_Status");

            entity.HasIndex(a => a.CustomerId)
                  .HasDatabaseName("IX_Appointments_CustomerId");

            entity.HasIndex(a => a.StaffId)
                  .HasDatabaseName("IX_Appointments_StaffId");
        });

        // ── Notification Relationships & Indexes ──
        mb.Entity<Notification>(entity =>
        {
            entity.HasKey(n => n.Id);

            entity.HasOne(n => n.Appointment)
                  .WithMany(a => a.Notifications)
                  .HasForeignKey(n => n.AppointmentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(n => n.AppointmentId)
                  .HasDatabaseName("IX_Notifications_AppointmentId");

            entity.HasIndex(n => n.IsRead)
                  .HasDatabaseName("IX_Notifications_IsRead");
        });
    }
}
