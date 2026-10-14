using AppointmentSystem.Application.DTOs;
using AppointmentSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AppointmentSystem.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    ICustomerService customerService,
    IStaffService staffService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto req, CancellationToken ct = default)
    {
        if (req.Role.Equals("Staff", StringComparison.OrdinalIgnoreCase) ||
            req.Role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
        {
            var (ok, msg, staff) = await staffService.LoginAsync(req.Email, req.Password, ct);
            if (!ok || staff is null)
                return Unauthorized(new { success = false, message = msg });

            return Ok(new LoginResponseDto
            {
                Success = true,
                Message = "Đăng nhập nhân viên thành công.",
                Staff = staff,
                Token = $"mock-jwt-token-staff-{staff.Id}"
            });
        }
        else
        {
            var (ok, msg, customer) = await customerService.LoginAsync(req.Email, req.Password, ct);
            if (!ok || customer is null)
                return Unauthorized(new { success = false, message = msg });

            return Ok(new LoginResponseDto
            {
                Success = true,
                Message = "Đăng nhập khách hàng thành công.",
                Customer = customer,
                Token = $"mock-jwt-token-customer-{customer.Id}"
            });
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto req, CancellationToken ct = default)
    {
        var (ok, msg, customer) = await customerService.RegisterAsync(req, ct);
        if (!ok || customer is null)
            return BadRequest(new { success = false, message = msg });

        return Ok(new LoginResponseDto
        {
            Success = true,
            Message = msg,
            Customer = customer,
            Token = $"mock-jwt-token-customer-{customer.Id}"
        });
    }

    [HttpGet("staffs")]
    public async Task<IActionResult> GetStaffs(CancellationToken ct = default)
    {
        var list = await staffService.GetAllAsync(ct);
        return Ok(list);
    }
}
