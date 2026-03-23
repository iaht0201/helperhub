using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WebTimViec.Api.Data;
using WebTimViec.Api.Entities;
using WebTimViec.Api.Repositories;
using WebTimViec.Api.Helpers;

using WebTimViec.Api.DTOs;

namespace WebTimViec.Api.Services
{
    public class JobService : IJobService
    {
        private readonly IJobRepository _jobRepository;
        private readonly IUserRepository _userRepository;
        private readonly AppDbContext _context;

        public JobService(IJobRepository jobRepository, IUserRepository userRepository, AppDbContext context)
        {
            _jobRepository = jobRepository;
            _userRepository = userRepository;
            _context = context;
        }

        public async Task<JobPost?> GetJobById(Guid id)
        {
            return await _jobRepository.GetJobByIdAsync(id);
        }

        public async Task<IEnumerable<JobPost>> GetJobsByUser(Guid userId)
        {
            return await _jobRepository.GetJobsByUserAsync(userId);
        }

        public async Task<PagedResult<JobPost>> SearchJobs(string? location, string? type, string? service, decimal? minSalary, string? query, bool? isForWorker = null, string? sort = null, int page = 1, int pageSize = 10)
        {
            var (items, totalCount) = await _jobRepository.SearchJobsAsync(location, type, service, minSalary, query, isForWorker, sort, page, pageSize);
            return new PagedResult<JobPost>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = page,
                PageSize = pageSize
            };
        }

        public async Task<JobPost> CreateJob(JobPost job)
        {
            // 1. Check Package Limits for Posting
            var user = await _context.Users
                .Include(u => u.Subscriptions)
                .ThenInclude(s => s.ServicePackage)
                .FirstOrDefaultAsync(u => u.Id == job.UserId);

            if (user != null)
            {
                var activeSub = user.Subscriptions?.FirstOrDefault(s => s.IsActive && s.ExpiredAt > VNTime.Now);
                int maxPosts = activeSub?.ServicePackage?.MaxJobPosts ?? 3; // Default 3 for free/unknown

                if (maxPosts != -1)
                {
                    var currentPostsCount = await _context.JobPosts.CountAsync(j => j.UserId == job.UserId);
                    if (currentPostsCount >= maxPosts)
                    {
                        throw new InvalidOperationException($"Bạn đã đạt giới hạn tối đa {maxPosts} tin đăng cho gói hiện tại. Vui lòng nâng cấp để đăng thêm!");
                    }
                }

                // 2. Handle Approval and Priority based on Package
                if (activeSub != null && activeSub.ServicePackage != null)
                {
                    job.IsApproved = !activeSub.ServicePackage.NeedsApproval;
                    job.IsPriority = activeSub.ServicePackage.IsPriority;
                }
                else
                {
                    // Default for visitors/free users if any
                    job.IsApproved = true; // Or false, depending on site policy
                    job.IsPriority = false;
                }
            }

            var savedJob = await _jobRepository.AddJobAsync(job);

            // NOTIFY USER & ADMIN about new job post
            try {
                // To User
                _context.Notifications.Add(new Notification {
                    UserId = job.UserId,
                    Title = "Đăng tin thành công",
                    Message = job.IsApproved 
                        ? $"Tin '{job.Title}' của bạn đã được đăng và công khai."
                        : $"Tin '{job.Title}' của bạn đã được gửi và đang chờ quản trị viên duyệt.",
                    Type = "Approval",
                    RelatedId = savedJob.Id.ToString(),
                    CreatedAt = VNTime.Now
                });

                // To Admin
                var admins = await _context.Users.Where(u => u.Role == "Admin").ToListAsync();
                foreach(var admin in admins) {
                    _context.Notifications.Add(new Notification {
                        UserId = admin.Id,
                        Title = "Tin đăng mới",
                        Message = $"Người dùng '{user?.Email}' vừa đăng tin mới: '{job.Title}'. Trạng thái: {(job.IsApproved ? "Đã duyệt" : "Chờ duyệt")}.",
                        Type = "System",
                        RelatedId = savedJob.Id.ToString(),
                        CreatedAt = VNTime.Now
                    });
                }
                await _context.SaveChangesAsync();
            } catch { /* Silence notification errors */ }

            return savedJob;
        }

        public async Task<bool> DeleteJob(Guid id)
        {
            return await _jobRepository.DeleteJobAsync(id);
        }

        public async Task<IEnumerable<User>> SuggestWorkers(Guid jobId)
        {
            var job = await _jobRepository.GetJobByIdAsync(jobId);
            if (job == null) return Enumerable.Empty<User>();

            // Business Logic: Suggesting workers based on requirements
            // Get all workers from DB with their subscriptions
            var workers = await _context.Users
                .Include(u => u.Subscriptions)
                .Where(u => u.Role == "Worker" && u.IsActive)
                .ToListAsync();

            var matched = workers.Where(u =>
                (job.AgeMin == 0 || u.Age >= job.AgeMin) &&
                (job.AgeMax == 0 || u.Age <= job.AgeMax) &&
                (string.IsNullOrEmpty(job.GenderRequired) || u.Gender == job.GenderRequired) &&
                (string.IsNullOrEmpty(job.Location) || (u.Address != null && u.Address.Contains(job.Location)))
            );

            // Sort by Skills and Experience match if present
            if (!string.IsNullOrEmpty(job.Skills) || (job.Experience != null && job.Experience.Length > 0))
            {
                var jobSkills = job.Skills?.Split(',').Select(s => s.Trim().ToLower()).ToList() ?? new List<string>();
                var jobExp = job.Experience?.ToLower().Trim() ?? "";

                matched = matched.OrderByDescending(u => {
                    int score = 0;
                    if (u.Skills != null) score += u.Skills.Split(',').Select(s => s.Trim().ToLower()).Count(s => jobSkills.Contains(s)) * 2;
                    if (u.Experience != null && jobExp.Length > 0 && u.Experience.ToLower().Contains(jobExp)) score += 5;
                    return score;
                });
            }

            // Prioritize Premium Users
            return matched.OrderByDescending(u => u.Subscriptions.Any(s => s.IsActive && s.ExpiredAt > VNTime.Now)).Take(10);
        }

        public bool IsPhoneVisible(Guid userId, Guid jobId)
        {
            var job = _context.JobPosts.Find(jobId);
            var user = _context.Users
                .Include(u => u.Subscriptions)
                .ThenInclude(s => s.ServicePackage)
                .FirstOrDefault(u => u.Id == userId);

            if (user == null || job == null) return false;
            
            if (user.Role == "Admin" || job.UserId == userId) return true;

            var activeSub = user.Subscriptions?.FirstOrDefault(s => s.IsActive && s.ExpiredAt > VNTime.Now);
            if (activeSub?.ServicePackage?.MaxViews == -1) return true;

            var hasUnlocked = _context.UserJobViews.Any(v => v.UserId == userId && v.JobPostId == jobId);
            if (hasUnlocked) return true;

            return false;
        }

        public bool IsProfileVisible(Guid userId, Guid targetUserId)
        {
            var user = _context.Users
                .Include(u => u.Subscriptions)
                .ThenInclude(s => s.ServicePackage)
                .FirstOrDefault(u => u.Id == userId);

            if (user == null) return false;
            if (user.Role == "Admin" || userId == targetUserId) return true;

            var activeSub = user.Subscriptions?.FirstOrDefault(s => s.IsActive && s.ExpiredAt > VNTime.Now);
            if (activeSub?.ServicePackage?.MaxViews == -1) return true;

            var hasUnlocked = _context.UserJobViews.Any(v => v.UserId == userId && v.ViewedUserId == targetUserId);
            if (hasUnlocked) return true;

            return false;
        }

        public async Task<bool> TrackJobView(Guid userId, Guid jobId)
        {
            if (IsPhoneVisible(userId, jobId)) return true;
            return await ConsumeGenericView(userId, jobId, null);
        }

        public async Task<bool> TrackProfileView(Guid userId, Guid targetUserId)
        {
            if (IsProfileVisible(userId, targetUserId)) return true;
            return await ConsumeGenericView(userId, null, targetUserId);
        }

        private async Task<bool> ConsumeGenericView(Guid userId, Guid? jobId, Guid? targetUserId)
        {
            var user = await _context.Users
                .Include(u => u.Subscriptions)
                .ThenInclude(s => s.ServicePackage)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return false;

            var activeSub = user.Subscriptions?.FirstOrDefault(s => s.IsActive && s.ExpiredAt > VNTime.Now);
            int maxViews = activeSub?.ServicePackage?.MaxViews ?? 1; // Default for free users is 1

            if (maxViews == -1 || user.ConsumedViews < maxViews)
            {
                user.ConsumedViews++;
                _context.UserJobViews.Add(new UserJobView 
                { 
                    UserId = userId, 
                    JobPostId = jobId,
                    ViewedUserId = targetUserId,
                    ViewedAt = VNTime.Now 
                });
                
                // NOTIFY USER about credit consumption
                _context.Notifications.Add(new Notification {
                    UserId = userId,
                    Title = "Mở khóa thông tin",
                    Message = $"Bạn vừa dùng 1 lượt xem để mở khóa {(jobId != null ? "số điện thoại tin đăng" : "thông tin cá nhân")}. Lượt xem còn lại: {(maxViews == -1 ? "Vô hạn" : (maxViews - user.ConsumedViews))}.",
                    Type = "System",
                    CreatedAt = VNTime.Now
                });

                await _context.SaveChangesAsync();
                return true;
            }

            return false;
        }
    }
}
