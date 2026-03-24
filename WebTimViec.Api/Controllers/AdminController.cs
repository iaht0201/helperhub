using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebTimViec.Api.Data;
using WebTimViec.Api.Entities;

namespace WebTimViec.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly Microsoft.AspNetCore.SignalR.IHubContext<WebTimViec.Api.Hubs.ChatHub> _hubContext;

        public AdminController(AppDbContext context, Microsoft.AspNetCore.SignalR.IHubContext<WebTimViec.Api.Hubs.ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalJobs = await _context.JobPosts.CountAsync();
            var totalApplications = await _context.Applications.CountAsync();
            var activeSubscriptions = await _context.Subscriptions.CountAsync(s => s.IsActive && s.ExpiredAt > DateTime.UtcNow);
            
            // Basic activity stats
            var newUsersToday = await _context.Users.CountAsync(u => u.CreatedAt >= DateTime.UtcNow.Date);
            var newJobsToday = await _context.JobPosts.CountAsync(u => u.CreatedAt >= DateTime.UtcNow.Date);

            return Ok(new
            {
                TotalUsers = totalUsers,
                TotalJobs = totalJobs,
                TotalApplications = totalApplications,
                ActiveSubscriptions = activeSubscriptions,
                NewUsersToday = newUsersToday,
                NewJobsToday = newJobsToday,
                PendingJobs = await _context.JobPosts.CountAsync(j => !j.IsApproved),
                RecentUsers = await _context.Users.OrderByDescending(u => u.CreatedAt).Take(5).ToListAsync()
            });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Include(u => u.Subscriptions)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            // Project to include current package tier
            var result = users.Select(u => new
            {
                u.Id,
                u.Email,
                u.FullName,
                u.Role,
                u.WorkingRole,
                u.Phone,
                u.IsActive,
                u.CreatedAt,
                u.ConsumedViews,
                u.ConsumedApplications,
                CurrentPackage = u.Subscriptions
                    .Where(s => s.IsActive && s.ExpiredAt > DateTime.UtcNow)
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => s.Tier)
                    .FirstOrDefault() ?? "FREE"
            });

            return Ok(result);
        }

        [HttpPost("users/{userId}/assign-package")]
        public async Task<IActionResult> AssignPackage(Guid userId, [FromBody] AssignPackageRequest request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            var package = await _context.ServicePackages.FirstOrDefaultAsync(p => p.Code == request.PackageCode);
            if (package == null) return BadRequest("Gói cước không tồn tại");

            // Deactivate old subscriptions
            var oldSubs = await _context.Subscriptions.Where(s => s.UserId == userId).ToListAsync();
            foreach (var os in oldSubs) os.IsActive = false;

            var newSub = new Subscription
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Tier = package.Code,
                Amount = package.Price,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                ExpiredAt = DateTime.UtcNow.AddDays(package.Days),
                TransactionId = "ADMIN_ASSIGNED_" + Guid.NewGuid().ToString().Substring(0, 8)
            };

            _context.Subscriptions.Add(newSub);

            // Reset quotas for new package logic if needed
            user.ConsumedViews = 0;
            user.ConsumedApplications = 0;

            await _context.SaveChangesAsync();

            // Create notification for user
            var notification = new Notification
            {
                UserId = userId,
                Title = "Nâng cấp tài khoản",
                Message = $"Quản trị viên đã cấp cho bạn gói {package.Name}. Có hiệu lực đến {newSub.ExpiredAt:dd/MM/yyyy}.",
                Type = "System",
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(newSub);
        }

        public class AssignPackageRequest
        {
            public string PackageCode { get; set; } = string.Empty;
        }

        [HttpGet("jobs")]
        public async Task<IActionResult> GetJobs()
        {
            var jobs = await _context.JobPosts
                .Include(j => j.User)
                .ThenInclude(u => u!.Subscriptions)
                .OrderByDescending(j => j.CreatedAt)
                .ToListAsync();
            return Ok(jobs);
        }

        [HttpPost("toggle-user/{id}")]
        public async Task<IActionResult> ToggleUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.IsActive = !user.IsActive;
            
            // Notify user
            _context.Notifications.Add(new Notification
            {
                UserId = id,
                Title = user.IsActive ? "Tài khoản đã mở khóa" : "Tài khoản bị tạm khóa",
                Message = user.IsActive 
                    ? "Tài khoản của bạn đã được quản trị viên mở khóa. Bạn có thể tiếp tục sử dụng dịch vụ." 
                    : "Tài khoản của bạn đã bị tạm khóa do vi phạm quy định hoặc đang được kiểm tra. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.",
                Type = "AccountStatus",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(new { user.IsActive });
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            
            // 1. Manually identify all dependencies across all tables
            var userJobs = await _context.JobPosts.Where(j => j.UserId == id).ToListAsync();
            var userApps = await _context.Applications.Where(a => a.ApplicantId == id).ToListAsync();
            var userSubs = await _context.Subscriptions.Where(s => s.UserId == id).ToListAsync();
            var userNotifs = await _context.Notifications.Where(n => n.UserId == id).ToListAsync();
            var userViews = await _context.UserJobViews.Where(v => v.UserId == id || v.ViewedUserId == id).ToListAsync();
            var userMsgs = await _context.Messages.Where(m => m.SenderId == id || m.ReceiverId == id).ToListAsync();

            // 2. Identify and remove all dependencies of the user's JobPosts (Applications, messages, views from other users)
            foreach(var job in userJobs) {
                var jobApps = await _context.Applications.Where(a => a.JobPostId == job.Id).ToListAsync();
                var jobViews = await _context.UserJobViews.Where(v => v.JobPostId == job.Id).ToListAsync();
                var jobMsgs = await _context.Messages.Where(m => m.JobPostId == job.Id).ToListAsync();
                _context.Applications.RemoveRange(jobApps);
                _context.UserJobViews.RemoveRange(jobViews);
                _context.Messages.RemoveRange(jobMsgs);
            }

            // 3. Queue direct user dependencies for removal
            _context.Applications.RemoveRange(userApps);
            _context.Subscriptions.RemoveRange(userSubs);
            _context.Notifications.RemoveRange(userNotifs);
            _context.UserJobViews.RemoveRange(userViews);
            _context.Messages.RemoveRange(userMsgs);

            // 4. Save changes once to clear ALL foreign key references to the jobs and the user
            await _context.SaveChangesAsync();

            // 5. Now it is safe to remove the JobPosts and the User
            _context.JobPosts.RemoveRange(userJobs);
            _context.Users.Remove(user);
            
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] User userData)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.FullName = userData.FullName;
            user.Email = userData.Email;
            user.Role = userData.Role;
            user.Phone = userData.Phone;

            await _context.SaveChangesAsync();
            return Ok(user);
        }

        [HttpPost("jobs/{id}/approve")]
        public async Task<IActionResult> ApproveJob(Guid id)
        {
            var job = await _context.JobPosts.Include(j => j.User).FirstOrDefaultAsync(j => j.Id == id);
            if (job == null) return NotFound();

            job.IsApproved = true;

            // Notify user
            var notification = new Notification
            {
                UserId = job.UserId,
                Title = "Tin đăng được duyệt",
                Message = $"Tin đăng '{job.Title}' của bạn đã được quản trị viên duyệt và công khai.",
                Type = "Approval",
                RelatedId = job.Id.ToString(),
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();
            
            // Real-time Notify via SignalR
            try {
                await _hubContext.Clients.Group(job.UserId.ToString()).SendAsync("ReceiveNotification", notification);
            } catch { /* Silent */ }

            return Ok();
        }

        [HttpDelete("jobs/{id}")]
        public async Task<IActionResult> DeleteJob(Guid id)
        {
            var job = await _context.JobPosts.FindAsync(id);
            if (job == null) return NotFound();

            // Notify user about deletion (before removing from DB)
            var notification = new Notification
            {
                UserId = job.UserId,
                Title = "Tin đăng bị gỡ bỏ",
                Message = $"Tin đăng '{job.Title}' của bạn đã bị gỡ bỏ bởi quản trị viên do vi phạm quy định nội dung của HelperHub.",
                Type = "System",
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            _context.JobPosts.Remove(job);
            await _context.SaveChangesAsync();
            return Ok();
        }

        // Service Package Management
        [HttpGet("packages")]
        public async Task<IActionResult> GetPackages()
        {
            return Ok(await _context.ServicePackages.OrderBy(p => p.Price).ToListAsync());
        }

        [HttpPost("packages")]
        public async Task<IActionResult> CreatePackage([FromBody] ServicePackage package)
        {
            package.Id = Guid.NewGuid();
            package.CreatedAt = DateTime.UtcNow;
            _context.ServicePackages.Add(package);
            await _context.SaveChangesAsync();
            return Ok(package);
        }

        [HttpPut("packages/{id}")]
        public async Task<IActionResult> UpdatePackage(Guid id, [FromBody] ServicePackage packageData)
        {
            var package = await _context.ServicePackages.FindAsync(id);
            if (package == null) return NotFound();

            package.Name = packageData.Name;
            package.Code = packageData.Code;
            package.Price = packageData.Price;
            package.Days = packageData.Days;
            package.Description = packageData.Description;
            package.MaxViews = packageData.MaxViews;
            package.MaxApplications = packageData.MaxApplications;
            package.MaxJobPosts = packageData.MaxJobPosts;
            package.NeedsApproval = packageData.NeedsApproval;
            package.IsPriority = packageData.IsPriority;
            package.SupportLevel = packageData.SupportLevel;
            package.AllowRoleSwitch = packageData.AllowRoleSwitch;
            package.IsActive = packageData.IsActive;

            await _context.SaveChangesAsync();
            return Ok(package);
        }

        [HttpDelete("packages/{id}")]
        public async Task<IActionResult> DeletePackage(Guid id)
        {
            var package = await _context.ServicePackages.FindAsync(id);
            if (package == null) return NotFound();

            _context.ServicePackages.Remove(package);
            await _context.SaveChangesAsync();
            return Ok();
        }
        [HttpGet("subscriptions")]
        public async Task<IActionResult> GetSubscriptions()
        {
            var subs = await _context.Subscriptions
                .Include(s => s.User)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
            
            var result = subs.Select(s => new {
                s.Id,
                s.TransactionId,
                s.Tier,
                s.Amount,
                s.IsActive,
                s.CreatedAt,
                s.ExpiredAt,
                UserEmail = s.User?.Email,
                UserName = s.User?.FullName
            });

            return Ok(result);
        }

        // Job Category Management
        [HttpGet("categories")]
        public async Task<IActionResult> GetAdminCategories()
        {
            return Ok(await _context.JobCategories.OrderBy(c => c.Name).ToListAsync());
        }

        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] JobCategory category)
        {
            category.Id = Guid.NewGuid();
            category.CreatedAt = DateTime.UtcNow;
            _context.JobCategories.Add(category);
            await _context.SaveChangesAsync();
            return Ok(category);
        }

        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] JobCategory categoryData)
        {
            var category = await _context.JobCategories.FindAsync(id);
            if (category == null) return NotFound();

            category.Name = categoryData.Name;
            category.Code = categoryData.Code;
            category.IconName = categoryData.IconName;
            category.IsActive = categoryData.IsActive;

            await _context.SaveChangesAsync();
            return Ok(category);
        }

        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(Guid id)
        {
            var category = await _context.JobCategories.FindAsync(id);
            if (category == null) return NotFound();

            // Check if any jobs use this category
            if (await _context.JobPosts.AnyAsync(j => j.JobCategoryId == id))
            {
                return BadRequest("Không thể xóa danh mục đang có tin tuyển dụng. Hãy chuyển các tin sang danh mục khác trước.");
            }

            _context.JobCategories.Remove(category);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
