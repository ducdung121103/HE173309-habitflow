using AppointmentSystem.Application.Interfaces;
using AppointmentSystem.Application.Services;
using AppointmentSystem.Persistence.Context;
using AppointmentSystem.Persistence.Repositories;
using AppointmentSystem.ReminderWorker;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = Host.CreateApplicationBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=.\\SQLEXPRESS;Database=AppointmentSystemDB;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;";

// Database - Scoped
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(connectionString));

// Repositories & Services - Scoped
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IServiceCatalogService, ServiceCatalogService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// HttpClientFactory for resilient HTTP calls
builder.Services.AddHttpClient("WebApiClient", client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
});

// Register Background Worker Service
builder.Services.AddHostedService<ReminderWorker>();

var host = builder.Build();
host.Run();
