using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebTimViec.Api.Data;
using WebTimViec.Api.Entities;
using WebTimViec.Api.Services;
using System.Security.Claims;

namespace WebTimViec.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ApplicationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IJobService _jobService;
        private readonly Microsoft.AspNetCore.SignalR.IHubContext<WebTimViec.Api.Hubs.ChatHub> _hubContext;

        public ApplicationController(AppDbContext context, IJobService jobService, Microsoft.AspNetCore.SignalR.IHubContext<WebTimViec.Api.Hubs.ChatHub> hubContext)
        {
            _context = context;
            _jobService = jobService;
            _hubContext = hubContext;
        }

        [HttpPost("{jobId}")]
        public async Task<IActionResult> Apply(Guid jobId)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            
            var user = await _context.Users.Include(u => u.Subscriptions).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return Unauthorized();

            var existing = await _context.Applications
                .FirstOrDefaultAsync(a => a.JobPostId == jobId && a.ApplicantId == userId);
            
            if (existing != null)
                return BadRequest("Bạn đã ứng tuyển công việc này rồi.");

            // Check Subscription & Quota
            var activeSub = await _context.Subscriptions
                .Include(s => s.ServicePackage)
                .FirstOrDefaultAsync(s => s.UserId == userId && s.IsActive && s.ExpiredAt > DateTime.UtcNow);

            var package = activeSub?.ServicePackage;
            if (package == null) {
                package = await _context.ServicePackages.FirstOrDefaultAsync(p => p.Code == "BASIC");
            }
            
            int maxApps = package?.MaxApplications ?? 1;
            
            if (user.Role != "Admin" && maxApps != -1)
            {
                if (user.ConsumedApplications >= maxApps)
                {
                    return BadRequest($"Bạn đã hết lượt ứng tuyển ({user.ConsumedApplications}/{maxApps}). Vui lòng nâng cấp tài khoản để ứng tuyển thêm.");
                }
            }
            
            user.ConsumedApplications++;

            var application = new Application
            {
                Id = Guid.NewGuid(),
                JobPostId = jobId,
                ApplicantId = userId,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Applications.Add(application);

            // Notify Job/Profile Owner
            var job = await _context.JobPosts.FindAsync(jobId);
            if (job != null)
            {
                var notification = new Notification
                {
                    UserId = job.UserId,
                    Title = job.IsForWorker ? "Bạn có lời mời công việc mới" : "Có ứng viên ứng tuyển mới",
                    Message = $"'{user.FullName}' vừa {(job.IsForWorker ? "mời" : "ứng tuyển")} vào tin '{job.Title}' của bạn.",
                    Type = job.IsForWorker ? "Invitation" : "Application",
                    RelatedId = application.Id.ToString(),
                    CreatedAt = DateTime.UtcNow
                };
                _context.Notifications.Add(notification);

                // ALSO NOTIFY THE APPLICANT
                _context.Notifications.Add(new Notification
                {
                    UserId = userId,
                    Title = "Ứng tuyển thành công",
                    Message = $"Bạn đã ứng tuyển vào tin '{job.Title}'. Trạng thái: Đang chờ phản hồi.",
                    Type = "Application",
                    RelatedId = application.Id.ToString(),
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            
            // Real-time Notify via SignalR
            try {
                // To Job/Profile Owner
                await _hubContext.Clients.Group(job.UserId.ToString()).SendAsync("ReceiveNotification", new { 
                    Title = job.IsForWorker ? "Bạn có lời mời công việc mới" : "Có ứng viên ứng tuyển mới",
                    Message = $"'{user.FullName}' vừa {(job.IsForWorker ? "mời" : "ứng tuyển")} vào tin '{job.Title}' của bạn.",
                    Type = job.IsForWorker ? "Invitation" : "Application"
                });
            } catch { /* Silent */ }

            return Ok(application);
        }

        [HttpGet("job/{jobId}")]
        public async Task<IActionResult> GetJobApplications(Guid jobId)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            var userId = Guid.Parse(userIdStr);
            
            var job = await _context.JobPosts.FindAsync(jobId);
            if (job == null) return NotFound();
            if (job.UserId != userId && !User.IsInRole("Admin")) return Forbid();

            var apps = await _context.Applications
                .Include(a => a.Applicant)
                .Where(a => a.JobPostId == jobId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            // Mask applicant phone numbers if not unlocked
            foreach (var app in apps)
            {
                if (app.Applicant != null)
                {
                    bool isVisible = _jobService.IsProfileVisible(userId, app.ApplicantId);
                    if (!isVisible && !User.IsInRole("Admin"))
                    {
                        app.Applicant.Phone = "•••• ••• •••";
                        app.Applicant.Email = "••••••••@••••.•••";
                    }
                }
            }
            
            return Ok(apps);
        }

        [HttpPost("view-applicant/{applicantId}")]
        public async Task<IActionResult> ViewApplicant(Guid applicantId)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            var userId = Guid.Parse(userIdStr);

            var success = await _jobService.TrackProfileView(userId, applicantId);
            if (success) return Ok();

            return BadRequest("Bạn đã hết lượt xem hồ sơ. Vui lòng nâng cấp tài khoản để xem thêm.");
        }

        [HttpGet("my-applications")]
        public async Task<IActionResult> GetMyApplications()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            var userId = Guid.Parse(userIdStr);
            var apps = await _context.Applications
                .Include(a => a.JobPost)
                .Where(a => a.ApplicantId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
            
            return Ok(apps);
        }

        // Employer updates application status (Accept/Reject)
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest request)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            var userId = Guid.Parse(userIdStr);

            var app = await _context.Applications
                .Include(a => a.JobPost)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (app == null) return NotFound();
            if (app.JobPost?.UserId != userId) return Forbid();

            app.Status = request.Status;

            // Notify Applicant
            var notification = new Notification
            {
                UserId = app.ApplicantId,
                Title = "Trạng thái hồ sơ",
                Message = $"Hồ sơ của bạn cho '{app.JobPost?.Title}' đã được chủ nhà {(request.Status == "Accepted" ? "chấp nhận" : "từ chối")}.",
                Type = "StatusUpdate",
                RelatedId = app.Id.ToString(),
                CreatedAt = DateTime.UtcNow
            };
            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();
            return Ok(app);
        }

        // Worker sees accepted/invited jobs as their "Invitations"
        [HttpGet("invitations")]
        public async Task<IActionResult> GetMyInvitations()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            var userId = Guid.Parse(userIdStr);

            // Invitations = applications where status was set to Accepted by employer OR applications to my jobs
            var invitations = await _context.Applications
                .Include(a => a.Applicant)
                .Include(a => a.JobPost)
                    .ThenInclude(j => j!.User)
                .Where(a => (a.ApplicantId == userId && a.Status == "Accepted") || a.JobPost!.UserId == userId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            var result = invitations.Select(a => new
            {
                a.Id,
                a.JobPostId,
                a.Status,
                a.CreatedAt,
                Applicant = a.Applicant == null ? null : new
                {
                    a.Applicant.FullName,
                    a.Applicant.Phone,
                    a.Applicant.Email
                },
                JobPost = a.JobPost == null ? null : new
                {
                    a.JobPost.Id,
                    a.JobPost.Title,
                    a.JobPost.Location,
                    a.JobPost.Salary,
                    User = a.JobPost.User == null ? null : new
                    {
                        a.JobPost.User.FullName,
                        a.JobPost.User.Phone
                    }
                }
            });

            return Ok(result);
        }
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}

