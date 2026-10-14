using AppointmentSystem.Application.Interfaces;
using AppointmentSystem.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace AppointmentSystem.Persistence.Repositories;

public class Repository<T>(AppDbContext db) : IRepository<T> where T : class
{
    protected readonly AppDbContext _db = db;
    protected readonly DbSet<T> _dbSet = db.Set<T>();

    public IQueryable<T> Query() => _dbSet.AsQueryable();

    public async Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default)
        => await _dbSet.ToListAsync(ct);

    public async Task<T?> GetByIdAsync(int id, CancellationToken ct = default)
        => await _dbSet.FindAsync([id], ct);

    public async Task AddAsync(T entity, CancellationToken ct = default)
    {
        await _dbSet.AddAsync(entity, ct);
    }

    public Task UpdateAsync(T entity, CancellationToken ct = default)
    {
        _dbSet.Update(entity);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await GetByIdAsync(id, ct);
        if (entity is not null)
        {
            _dbSet.Remove(entity);
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        => await _db.SaveChangesAsync(ct);
}
