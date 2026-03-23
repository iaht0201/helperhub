using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebTimViec.Api.Entities;

using WebTimViec.Api.DTOs;

namespace WebTimViec.Api.Services
{
    public interface IJobService
    {
        Task<JobPost?> GetJobById(Guid id);
        Task<IEnumerable<JobPost>> GetJobsByUser(Guid userId);
        Task<PagedResult<JobPost>> SearchJobs(string? location, string? type, string? service, decimal? minSalary, string? query, bool? isForWorker = null, string? sort = null, int page = 1, int pageSize = 10);
        Task<JobPost> CreateJob(JobPost job);
        Task<bool> DeleteJob(Guid id);
        Task<IEnumerable<User>> SuggestWorkers(Guid jobId);
        bool IsPhoneVisible(Guid userId, Guid jobId); // Logic to check subscription or free views
        Task<bool> TrackJobView(Guid userId, Guid jobId); // Consume a free view or record premium view
        bool IsProfileVisible(Guid userId, Guid targetUserId);
        Task<bool> TrackProfileView(Guid userId, Guid targetUserId);
    }
}
