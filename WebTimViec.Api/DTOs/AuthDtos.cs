namespace WebTimViec.Api.DTOs
{
    public class RegisterDto
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Role { get; set; } = "Worker"; // Admin, Homeowner, Worker
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public int Age { get; set; }
        public string? Gender { get; set; }
        public string? PreferredCategories { get; set; }
        public string? PreferredLocation { get; set; }
    }

    public class LoginDto
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class UserResponseDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Role { get; set; } = null!;
        public string? WorkingRole { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public int Age { get; set; }
        public string? Gender { get; set; }
        public bool IsSubscribed { get; set; }
        public string? SubscriptionTier { get; set; } // PRO, PROMAX, etc.
        public DateTime? SubscriptionExpiredAt { get; set; }
        public string? Skills { get; set; }
        public string? Experience { get; set; }
        public int ConsumedViews { get; set; }
        public int ConsumedApplications { get; set; }
        public int MaxViews { get; set; }
        public int MaxApplications { get; set; }
        public string? PreferredCategories { get; set; }
        public string? PreferredLocation { get; set; }
        public DateTime? NextQuotaResetAt { get; set; }
    }
    public class GoogleLoginDto
    {
        public string IdToken { get; set; } = null!;
        public string? Role { get; set; } // Optional: "Worker" or "Homeowner"
    }

    public class UpdateProfileDto
    {
        public string FullName { get; set; } = null!;
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public int Age { get; set; }
        public string? Gender { get; set; }
        public string? Skills { get; set; }
        public string? Experience { get; set; }
        public string? PreferredCategories { get; set; }
        public string? PreferredLocation { get; set; }
    }
}
