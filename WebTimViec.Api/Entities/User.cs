using System;
using System.ComponentModel.DataAnnotations;

namespace WebTimViec.Api.Entities
{
    public class User
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        [Required]
        public string Role { get; set; } = "Worker"; // Admin, Employer, Worker

        public string? WorkingRole { get; set; } // Role for display in dashboard (Worker, Employer)
        
        [Required]
        public string FullName { get; set; } = string.Empty;
        
        public int Age { get; set; }
        
        public string? Gender { get; set; }
        
        public string? Address { get; set; }
        
        public string? Phone { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsEmailVerified { get; set; } = false;
        
        public string? EmailVerificationToken { get; set; }
        
        public string? Skills { get; set; }
        
        public string? Experience { get; set; }

        public string? PreferredCategories { get; set; } // Comma-separated category codes
        public string? PreferredLocation { get; set; }  // Normalized province name

        public int ConsumedViews { get; set; } = 0;
        public int ConsumedApplications { get; set; } = 0;
        public DateTime LastQuotaResetAt { get; set; } = DateTime.UtcNow;
        
        public virtual ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    }
}
