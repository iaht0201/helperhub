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

        public AdminController(AppDbContext context)
        {
            _context = context;
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
            await _context.SaveChangesAsync();
            return Ok(new { user.IsActive });
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            
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
            return Ok();
        }

        [HttpDelete("jobs/{id}")]
        public async Task<IActionResult> DeleteJob(Guid id)
        {
            var job = await _context.JobPosts.FindAsync(id);
            if (job == null) return NotFound();

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
    }
}
