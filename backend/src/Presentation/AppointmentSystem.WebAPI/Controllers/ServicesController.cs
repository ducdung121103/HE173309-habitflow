using AppointmentSystem.Application.DTOs;
using AppointmentSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AppointmentSystem.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController(IServiceCatalogService serviceCatalog) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetActive(CancellationToken ct = default)
    {
        var services = await serviceCatalog.GetAllActiveAsync(ct);
        return Ok(services);
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
    {
        var services = await serviceCatalog.GetAllAsync(ct);
        return Ok(services);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct = default)
    {
        var s = await serviceCatalog.GetByIdAsync(id, ct);
        if (s is null) return NotFound(new { message = $"Không tìm thấy dịch vụ #{id}." });
        return Ok(s);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ServiceDto dto, CancellationToken ct = default)
    {
        var (ok, msg, data) = await serviceCatalog.CreateAsync(dto, ct);
        if (!ok || data is null) return BadRequest(new { success = false, message = msg });
        return CreatedAtAction(nameof(GetById), new { id = data.Id }, new { success = true, message = msg, data });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ServiceDto dto, CancellationToken ct = default)
    {
        dto.Id = id;
        var (ok, msg) = await serviceCatalog.UpdateAsync(dto, ct);
        if (!ok) return BadRequest(new { success = false, message = msg });
        return Ok(new { success = true, message = msg });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Deactivate(int id, CancellationToken ct = default)
    {
        var (ok, msg) = await serviceCatalog.DeactivateAsync(id, ct);
        if (!ok) return BadRequest(new { success = false, message = msg });
        return Ok(new { success = true, message = msg });
    }
}
