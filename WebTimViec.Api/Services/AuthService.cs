using System;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using WebTimViec.Api.Data;
using WebTimViec.Api.DTOs;
using WebTimViec.Api.Entities;
using WebTimViec.Api.Repositories;
using WebTimViec.Api.Helpers;

namespace WebTimViec.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly AppDbContext _context;

        public AuthService(IUserRepository userRepository, IConfiguration configuration, IEmailService emailService, AppDbContext context)
        {
            _userRepository = userRepository;
            _configuration = configuration;
            _emailService = emailService;
            _context = context;
        }

        public async Task<User?> Register(RegisterDto request)
        {
            var existing = await _userRepository.GetUserByEmailAsync(request.Email);
            if (existing != null) return null;

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            string token = Guid.NewGuid().ToString("N");

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                PasswordHash = passwordHash,
                FullName = request.FullName,
                Role = request.Role,
                Age = request.Age,
                Gender = request.Gender,
                Address = request.Address,
                Phone = request.Phone,
                PreferredCategories = request.PreferredCategories,
                PreferredLocation = request.PreferredLocation,
                IsActive = true,
                CreatedAt = VNTime.Now,
                IsEmailVerified = false, 
                EmailVerificationToken = token
            };

            var addedUser = await _userRepository.AddUserAsync(user);

            // Send Verification Email
            try
            {
                var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "http://localhost:5173";
                var verifyLink = $"{frontendUrl}/verify-email?email={Uri.EscapeDataString(user.Email)}&token={token}";

                await _emailService.SendEmailAsync(user.Email, "Xác nhận tài khoản HelperHub", 
                    $@"<div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
                        <h2 style='color: #EA580C;'>Chào mừng {user.FullName} đến với HelperHub!</h2>
                        <p>Cảm ơn bạn đã đăng ký thành viên. Vui lòng xác nhận địa chỉ email để bắt đầu sử dụng đầy đủ tính năng của hệ thống.</p>
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='{verifyLink}' style='background-color: #EA580C; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold;'>Xác nhận Email ngay</a>
                        </div>
                        <p style='font-size: 12px; color: #666;'>Nếu nút trên không hoạt động, bạn có thể copy link sau vào trình duyệt:</p>
                        <p style='font-size: 10px; color: #999;'>{verifyLink}</p>
                        <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                        <p style='font-size: 11px; color: #999;'>Đây là email tự động, vui lòng không trả lời.</p>
                    </div>");
            }
            catch (Exception ex)
            {
                // Log error but don't fail registration if email fails (optional strategy)
                Console.WriteLine($"[Email Error] Failed to send verification email to {user.Email}: {ex.Message}");
            }

            // Send Welcome Notification
            _context.Notifications.Add(new Notification {
                UserId = addedUser.Id,
                Title = "Chào mừng bạn!",
                Message = $"Chào mừng {addedUser.FullName} đến với HelperHub. Hãy cập nhật hồ sơ và bắt đầu tìm kiếm những cơ hội mới ngay nhé!",
                Type = "System",
                CreatedAt = VNTime.Now
            });
            await _context.SaveChangesAsync();

            return addedUser;
        }

        public async Task<string?> Login(LoginDto request)
        {
            var user = await _userRepository.GetUserByEmailAsync(request.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return null;
            }

            if (!user.IsEmailVerified)
            {
                return "UNVERIFIED";
            }

            return CreateToken(user);
        }

        public async Task<string?> LoginWithGoogle(string idToken, string? role = null)
        {
            try
            {
                var settings = new Google.Apis.Auth.GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new List<string> { _configuration["AppSettings:GoogleClientId"]! }
                };

                var payload = await Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync(idToken, settings);
                
                var user = await _userRepository.GetUserByEmailAsync(payload.Email);

                if (user == null)
                {
                    // Create new user for Google login
                    user = new User
                    {
                        Id = Guid.NewGuid(),
                        Email = payload.Email,
                        FullName = payload.Name,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")), // Random pass
                        Role = role ?? "Worker", // User-selected or default role
                        IsActive = true,
                        CreatedAt = VNTime.Now,
                        IsEmailVerified = true // Google login is already verified
                    };
                    await _userRepository.AddUserAsync(user);
                }
                else if (!user.IsEmailVerified)
                {
                    user.IsEmailVerified = true;
                    user.EmailVerificationToken = null;
                    await _userRepository.UpdateUserAsync(user);
                }

                return CreateToken(user);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GoogleLogin Error] {ex.Message}");
                if (ex.InnerException != null) 
                    Console.WriteLine($"[GoogleLogin Inner Error] {ex.InnerException.Message}");
                
                return null;
            }
        }

        public async Task<User?> GetUserById(Guid id)
        {
            var user = await _userRepository.GetUserByIdAsync(id);
            if (user == null) return null;

            // Monthly Reset Quota Logic
            var now = VNTime.Now;
            
            // Calculate how many months passed since CreatedAt to find the current "billing month" start
            int monthsSinceCreated = (now.Year - user.CreatedAt.Year) * 12 + now.Month - user.CreatedAt.Month;
            if (now.Day < user.CreatedAt.Day) monthsSinceCreated--;

            // The target reset date for the current cycle
            var currentCycleStart = user.CreatedAt.AddMonths(monthsSinceCreated);

            // If we haven't reset for the current cycle, do it now
            if (user.LastQuotaResetAt < currentCycleStart)
            {
                user.ConsumedViews = 0;
                user.ConsumedApplications = 0;
                user.LastQuotaResetAt = now; // Mark as reset for this cycle
                await _userRepository.UpdateUserAsync(user);
                Console.WriteLine($"[QuotaReset] User {user.Email} quota reset for cycle starting {currentCycleStart:yyyy-MM-dd}");
            }

            return user;
        }

        public async Task<bool> VerifyEmail(string email, string token)
        {
            var user = await _userRepository.GetUserByEmailAsync(email);
            if (user == null) 
            {
                Console.WriteLine($"[VerifyEmail] User not found: {email}");
                return false;
            }

            if (user.IsEmailVerified) 
            {
                Console.WriteLine($"[VerifyEmail] User already verified: {email}");
                return true; 
            }

            if (user.EmailVerificationToken != token)
            {
                Console.WriteLine($"[VerifyEmail] Token mismatch for {email}. DB: {user.EmailVerificationToken}, Requested: {token}");
                return false;
            }

            user.IsEmailVerified = true;
            user.EmailVerificationToken = null;
            await _userRepository.UpdateUserAsync(user);
            Console.WriteLine($"[VerifyEmail] Successfully verified: {email}");
            return true;
        }

        public async Task<bool> UpdateProfileAsync(Guid userId, UpdateProfileDto request)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null) return false;

            user.FullName = request.FullName;
            user.Phone = request.Phone;
            user.Address = request.Address;
            user.Age = request.Age;
            user.Gender = request.Gender;
            user.Skills = request.Skills;
            user.Experience = request.Experience;
            user.PreferredCategories = request.PreferredCategories;
            user.PreferredLocation = request.PreferredLocation;

            await _userRepository.UpdateUserAsync(user);
            return true;
        }

        public async Task<string?> ToggleRoleAsync(Guid userId)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null) return null;

            var currentWorkingRole = user.WorkingRole ?? (user.Role == "Admin" ? "Employer" : user.Role);
            var nextRole = (currentWorkingRole == "Worker") ? "Employer" : "Worker";

            // If not admin, we also change the core role for permissions and searching
            if (user.Role != "Admin")
            {
                user.Role = nextRole;
            }

            user.WorkingRole = nextRole;
            await _userRepository.UpdateUserAsync(user);

            return nextRole;
        }

        private string CreateToken(User user)
        {
            List<Claim> claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("FullName", user.FullName)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration.GetSection("AppSettings:Token").Value!));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var token = new JwtSecurityToken(
                claims: claims,
                expires: VNTime.Now.AddDays(1),
                signingCredentials: creds
            );

            var jwt = new JwtSecurityTokenHandler().WriteToken(token);

            return jwt;
        }

        public async Task SendTestEmail(string to)
        {
            await _emailService.SendEmailAsync(to, "Test Email from HelperHub", 
                "<h2>HelperHub Email Connection Test</h2>" +
                $"<p>This is a test email sent at {VNTime.Now:HH:mm:ss dd/MM/yyyy}.</p>" +
                "<p>If you see this, your SMTP configuration is working correctly!</p>");
        }
    }
}
