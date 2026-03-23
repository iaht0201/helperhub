using System.Threading.Tasks;
using WebTimViec.Api.DTOs;
using WebTimViec.Api.Entities;

namespace WebTimViec.Api.Services
{
    public interface IAuthService
    {
        Task<User?> Register(RegisterDto request);
        Task<string?> Login(LoginDto request);
        Task<string?> LoginWithGoogle(string idToken, string? role = null);
        Task<User?> GetUserById(Guid id);
        Task<bool> VerifyEmail(string email, string token);
        Task<bool> UpdateProfileAsync(Guid userId, UpdateProfileDto request);
        Task<string?> ToggleRoleAsync(Guid userId);
        Task SendTestEmail(string to);
    }
}
