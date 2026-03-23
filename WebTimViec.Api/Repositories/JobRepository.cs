using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WebTimViec.Api.Data;
using WebTimViec.Api.Entities;

namespace WebTimViec.Api.Repositories
{
    public class JobRepository : IJobRepository
    {
        private readonly AppDbContext _context;

        public JobRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<JobPost?> GetJobByIdAsync(Guid id)
        {
            return await _context.JobPosts.Include(j => j.User).Include(j => j.Category).FirstOrDefaultAsync(j => j.Id == id);
        }

        public async Task<IEnumerable<JobPost>> GetAllJobsAsync()
        {
            return await _context.JobPosts.Include(j => j.User).Include(j => j.Category).OrderByDescending(j => j.CreatedAt).ToListAsync();
        }

        public async Task<IEnumerable<JobPost>> GetJobsByUserAsync(Guid userId)
        {
            return await _context.JobPosts.Include(j => j.Category).Where(j => j.UserId == userId).ToListAsync();
        }

        public async Task<JobPost> AddJobAsync(JobPost job)
        {
            await _context.JobPosts.AddAsync(job);
            await _context.SaveChangesAsync();
            return job;
        }

        public async Task<JobPost> UpdateJobAsync(JobPost job)
        {
            _context.JobPosts.Update(job);
            await _context.SaveChangesAsync();
            return job;
        }

        public async Task<bool> DeleteJobAsync(Guid id)
        {
            var job = await _context.JobPosts.FindAsync(id);
            if (job == null) return false;
            _context.JobPosts.Remove(job);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(IEnumerable<JobPost> Items, int TotalCount)> SearchJobsAsync(string? location, string? type, string? service, decimal? minSalary, string? queryText, bool? isForWorker = null, string? sort = null, int page = 1, int pageSize = 10)
        {
            var query = _context.JobPosts.Include(j => j.User).Include(j => j.Category).AsQueryable();
            query = query.Where(j => j.IsApproved);

            
            if (isForWorker.HasValue)
            {
                query = query.Where(j => j.IsForWorker == isForWorker.Value);
            }
            if (!string.IsNullOrEmpty(location))
            {
                // Normalize location: strip common Vietnamese province prefixes for partial matching
                var normalizedLocation = location
                    .Replace("Thành phố ", "", StringComparison.OrdinalIgnoreCase)
                    .Replace("Tỉnh ", "", StringComparison.OrdinalIgnoreCase)
                    .Replace("TP. ", "", StringComparison.OrdinalIgnoreCase)
                    .Trim();

                query = query.Where(j => 
                    j.Location.Contains(location) || 
                    j.Location.Contains(normalizedLocation)
                );
            }
            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(j => j.JobType == type);
            }
            if (!string.IsNullOrEmpty(service))
            {
                var serviceList = service.Split(',').Select(s => s.Trim()).ToList();
                query = query.Where(j => serviceList.Any(s => j.ServiceType.Contains(s)));
            }
            if (minSalary.HasValue)
            {
                query = query.Where(j => j.Salary >= minSalary.Value);
            }
            if (!string.IsNullOrEmpty(queryText))
            {
                var keywords = queryText.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                foreach (var keyword in keywords)
                {
                    var search = $"%{keyword}%";
                    query = query.Where(j => 
                        EF.Functions.ILike(AppDbContext.Unaccent(j.Title), AppDbContext.Unaccent(search)) || 
                        (j.Description != null && EF.Functions.ILike(AppDbContext.Unaccent(j.Description), AppDbContext.Unaccent(search))) ||
                        EF.Functions.ILike(AppDbContext.Unaccent(j.ServiceType), AppDbContext.Unaccent(search))
                    );
                }
            }

            // Apply sorting
            query = sort?.ToLower() switch
            {
                "newest" => query.OrderByDescending(j => j.CreatedAt),
                "oldest" => query.OrderBy(j => j.CreatedAt),
                "salary_high" => query.OrderByDescending(j => j.Salary),
                "salary_low" => query.OrderBy(j => j.Salary),
                _ => query.OrderByDescending(j => j.CreatedAt) // Default: newest
            };

            int totalCount = await query.CountAsync();
            var items = await query.Skip((page - 1) * pageSize)
                                   .Take(pageSize)
                                   .ToListAsync();
            
            return (items, totalCount);
        }
    }
}
