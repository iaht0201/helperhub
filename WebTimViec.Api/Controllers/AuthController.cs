using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebTimViec.Api.DTOs;
using WebTimViec.Api.Entities;
using WebTimViec.Api.Services;
using WebTimViec.Api.Helpers;

namespace WebTimViec.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto request)
        {
            var user = await _authService.Register(request);
            if (user == null) return BadRequest("Email already exists");

            return Ok(user);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto request)
        {
            var token = await _authService.Login(request);
            if (token == "UNVERIFIED") return Unauthorized("Vui lòng xác nhận email của bạn vào link đã được gửi tới hòm thư.");
            if (token == null) return Unauthorized("Invalid username or password");

            return Ok(new { token });
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto request)
        {
            Console.WriteLine($"[AuthControler] Received Google Token starting with: {request.IdToken.Substring(0, Math.Min(10, request.IdToken.Length))}...");
            var token = await _authService.LoginWithGoogle(request.IdToken, request.Role);
            if (token == null) return Unauthorized("Invalid Google Token");

            return Ok(new { token });
        }

        [HttpPost("test-email")]
        public async Task<IActionResult> TestEmail([FromQuery] string to)
        {
            try {
                await _authService.SendTestEmail(to);
                return Ok(new { message = "Test email sent successfully! Please check your inbox." });
            } catch (Exception ex) {
                return BadRequest(new { message = "Email failed!", error = ex.Message });
            }
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string email, [FromQuery] string token)
        {
            var result = await _authService.VerifyEmail(email, token);
            if (!result) return BadRequest("Invalid or expired verification token");
            return Ok(new { message = "Xác nhận email thành công!" });
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile(UpdateProfileDto request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            var result = await _authService.UpdateProfileAsync(Guid.Parse(userIdStr), request);
            if (!result) return NotFound();

            return Ok(new { message = "Cập nhật hồ sơ thành công!" });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            var user = await _authService.GetUserById(Guid.Parse(userIdStr));
            if (user == null) return NotFound();

            var activeSub = user.Subscriptions?
                .Where(s => s.IsActive && s.ExpiredAt > VNTime.Now)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefault();

            var resp = new UserResponseDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                WorkingRole = user.WorkingRole ?? (user.Role == "Admin" ? "Employer" : user.Role),
                Phone = user.Phone,
                Address = user.Address,
                Age = user.Age,
                Gender = user.Gender,
                IsSubscribed = user.Role == "Admin" || activeSub != null,
                SubscriptionTier = user.Role == "Admin" ? "PROMAX_YEARLY" : activeSub?.ServicePackage?.Code,
                SubscriptionExpiredAt = user.Role == "Admin" ? VNTime.Now.AddYears(100) : activeSub?.ExpiredAt,
                Skills = user.Skills,
                Experience = user.Experience,
                ConsumedViews = user.ConsumedViews,
                ConsumedApplications = user.ConsumedApplications,
                PreferredCategories = user.PreferredCategories,
                PreferredLocation = user.PreferredLocation,
                MaxViews = user.Role == "Admin" ? -1 : (activeSub?.ServicePackage?.MaxViews ?? 1),
                MaxApplications = user.Role == "Admin" ? -1 : (activeSub?.ServicePackage?.MaxApplications ?? 1),
                NextQuotaResetAt = user.Role == "Admin" ? null : user.CreatedAt.AddMonths(((VNTime.Now.Year - user.CreatedAt.Year) * 12 + VNTime.Now.Month - user.CreatedAt.Month) + (VNTime.Now.Day >= user.CreatedAt.Day ? 1 : 0))
            };

            return Ok(resp);
        }

        [HttpPost("toggle-role")]
        [Authorize]
        public async Task<IActionResult> ToggleRole()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            var user = await _authService.GetUserById(Guid.Parse(userIdStr));
            if (user == null) return NotFound();

            // Check if user has an active premium subscription that ALLOWS role switching
            var canSwitch = user.Role == "Admin" || (user.Subscriptions?.Any(s => s.IsActive && s.ExpiredAt > VNTime.Now && (s.ServicePackage?.AllowRoleSwitch ?? false)) ?? false);
            
            if (!canSwitch) 
            {
                return BadRequest("Tính năng chuyển đổi vai trò chỉ dành cho gói Enterprise. Vui lòng nâng cấp gói để sử dụng.");
            }

            var result = await _authService.ToggleRoleAsync(user.Id);
            if (result == null) return BadRequest("Có lỗi xảy ra khi chuyển đổi vai trò.");

            return Ok(new { role = result });
        }
    }
}
