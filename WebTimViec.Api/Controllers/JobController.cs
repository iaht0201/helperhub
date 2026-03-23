using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebTimViec.Api.DTOs;
using WebTimViec.Api.Entities;
using WebTimViec.Api.Services;

namespace WebTimViec.Api.Controllers
{
    [ApiController]
    [Route("api/jobs")]
    public class JobController : ControllerBase
    {
        private readonly IJobService _jobService;

        public JobController(IJobService jobService)
        {
            _jobService = jobService;
        }

        [HttpGet("my")]
        [Authorize]
        public async Task<IActionResult> GetMyJobs()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr == null) return Unauthorized();

            var result = await _jobService.GetJobsByUser(Guid.Parse(userIdStr));
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetJobs(
            [FromQuery] string? location, 
            [FromQuery] string? jobType, 
            [FromQuery] string? serviceType,
            [FromQuery] decimal? minSalary,
            [FromQuery] string? query,
            [FromQuery] bool? isForWorker,
            [FromQuery] string? sort,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12)
        {
            var result = await _jobService.SearchJobs(location, jobType, serviceType, minSalary, query, isForWorker, sort, page, pageSize);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetJob(Guid id)
        {
            var job = await _jobService.GetJobById(id);
            if (job == null) return NotFound();
            
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            bool isVisible = false;
            
            if (!string.IsNullOrEmpty(userIdStr))
            {
                isVisible = _jobService.IsPhoneVisible(Guid.Parse(userIdStr), id);
            }

            // Also allow the Job Owner or Admin to see the phone
            bool isOwner = userIdStr != null && Guid.Parse(userIdStr) == job.UserId;
            bool isAdmin = User.IsInRole("Admin");

            if (!isVisible && !isOwner && !isAdmin && job.User != null)
            {
                job.User.Phone = "•••• ••• •••"; // Use a more realistic mask
            }

            return Ok(job);
        }

        [HttpPost("{id}/view-info")]
        [Authorize]
        public async Task<IActionResult> ViewJobInfo(Guid id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr == null) return Unauthorized();

            var success = await _jobService.TrackJobView(Guid.Parse(userIdStr), id);
            if (success) return Ok();
            
            return BadRequest("Bạn đã hết lượt xem thông tin miễn phí. Vui lòng nâng cấp tài khoản để xem thêm.");
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateJob(JobPost job)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr == null) return Unauthorized();

            job.UserId = Guid.Parse(userIdStr);
            job.CreatedAt = DateTime.UtcNow;

            var result = await _jobService.CreateJob(job);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteJob(Guid id)
        {
            var job = await _jobService.GetJobById(id);
            if (job == null) return NotFound();

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdStr == null || (Guid.Parse(userIdStr) != job.UserId && !User.IsInRole("Admin")))
            {
                return Unauthorized();
            }

            await _jobService.DeleteJob(id);
            return Ok();
        }

        [HttpGet("{id}/suggest-workers")]
        [Authorize]
        public async Task<IActionResult> GetSuggestedWorkers(Guid id)
        {
            var result = await _jobService.SuggestWorkers(id);
            return Ok(result);
        }
    }
}
