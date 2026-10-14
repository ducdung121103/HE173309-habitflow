using AppointmentSystem.Application.Interfaces;
using AppointmentSystem.Application.Services;
using AppointmentSystem.Persistence;
using AppointmentSystem.Persistence.Context;
using AppointmentSystem.Persistence.Repositories;
using AppointmentSystem.WebAPI.Hubs;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ── Database (EF Core) ──
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=.\\SQLEXPRESS;Database=AppointmentSystemDB;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;";

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(connectionString));

// ── Scoped Services & Repositories (SOLID - Clean Architecture) ──
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IServiceCatalogService, ServiceCatalogService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// ── SignalR Hub ──
builder.Services.AddSignalR(opt =>
{
    opt.EnableDetailedErrors = true;
});

// ── CORS for Next.js Frontend ──
const string AllowFrontendCors = "AllowFrontendCors";
var frontendUrl = builder.Configuration["NetworkSettings:FrontendUrl"] ?? "http://localhost:3000";

builder.Services.AddCors(options =>
{
    options.AddPolicy(AllowFrontendCors, policy =>
    {
        policy.WithOrigins(frontendUrl, "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Auto-seed database if empty
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    await DbInitializer.SeedAsync(db, logger);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseCors(AllowFrontendCors);

app.UseAuthorization();

// ── SignalR Hub Endpoints ──
// Map both /hubs/appointments (for modern Next.js client) and /appointmentHub (for backward compatibility)
app.MapHub<AppointmentHub>("/hubs/appointments");
app.MapHub<AppointmentHub>("/appointmentHub");

app.MapControllers();

app.Run();
