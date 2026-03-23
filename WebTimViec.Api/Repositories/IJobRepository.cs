using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebTimViec.Api.Entities;

namespace WebTimViec.Api.Repositories
{
    public interface IJobRepository
    {
        Task<JobPost?> GetJobByIdAsync(Guid id);
        Task<IEnumerable<JobPost>> GetAllJobsAsync();
        Task<IEnumerable<JobPost>> GetJobsByUserAsync(Guid userId);
        Task<JobPost> AddJobAsync(JobPost job);
        Task<JobPost> UpdateJobAsync(JobPost job);
        Task<bool> DeleteJobAsync(Guid id);
        Task<(IEnumerable<JobPost> Items, int TotalCount)> SearchJobsAsync(string? location, string? type, string? service, decimal? minSalary, string? query, bool? isForWorker = null, string? sort = null, int page = 1, int pageSize = 10);
    }
}
