using AppointmentSystem.Application.Interfaces;
using AppointmentSystem.Application.Services;
using AppointmentSystem.Persistence.Context;
using AppointmentSystem.Persistence.Repositories;
using AppointmentSystem.ServerApp;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

var host = Host.CreateDefaultBuilder(args)
    .ConfigureAppConfiguration((ctx, config) =>
    {
        config.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);
        config.AddEnvironmentVariables();
    })
    .ConfigureServices((ctx, services) =>
    {
        var connectionString = ctx.Configuration.GetConnectionString("DefaultConnection")
            ?? "Server=.\\SQLEXPRESS;Database=AppointmentSystemDB;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;";

        // Database - Scoped
        services.AddDbContext<AppDbContext>(opt =>
            opt.UseSqlServer(connectionString));

        // Repository & Services - Scoped (Clean Architecture)
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IAppointmentService, AppointmentService>();
        services.AddScoped<IStaffService, StaffService>();
        services.AddScoped<IServiceCatalogService, ServiceCatalogService>();
        services.AddScoped<INotificationService, NotificationService>();

        // TCP Server (Singleton - duy nhất 1 TcpListener trên 1 port)
        // Không captive dependency vì TcpServer inject IServiceScopeFactory!
        services.AddSingleton<TcpServer>();
    })
    .ConfigureLogging(logging =>
    {
        logging.ClearProviders();
        logging.AddConsole();
        logging.SetMinimumLevel(LogLevel.Information);
    })
    .Build();

var logger = host.Services.GetRequiredService<ILogger<Program>>();
var config = host.Services.GetRequiredService<IConfiguration>();
var port = config.GetValue<int>("NetworkSettings:TcpPort", 5050);

Console.WriteLine("=================================================");
Console.WriteLine("     APPOINTMENT SYSTEM - TCP SOCKET SERVER      ");
Console.WriteLine($"     Listening Port: {port}                       ");
Console.WriteLine("     Clean Architecture & Concurrency Safe       ");
Console.WriteLine("     Press Ctrl+C to Stop Gracefully             ");
Console.WriteLine("=================================================");

using var cts = new CancellationTokenSource();
Console.CancelKeyPress += (sender, eventArgs) =>
{
    eventArgs.Cancel = true;
    logger.LogInformation("⚠️ Nhận tín hiệu dừng (SIGINT / Ctrl+C), đang bắt đầu Graceful Shutdown...");
    cts.Cancel();
};

var server = host.Services.GetRequiredService<TcpServer>();
await server.StartAsync(cts.Token);
