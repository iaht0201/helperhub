using System;
using System.ComponentModel.DataAnnotations;

namespace WebTimViec.Api.Entities
{
    public class ServicePackage
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Code { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public long Price { get; set; }
        
        [Required]
        public int Days { get; set; }
        
        public string Description { get; set; } = string.Empty;
        
        public int MaxViews { get; set; } = -1; // -1 means unlimited
        
        public int MaxApplications { get; set; } = -1; // -1 means unlimited
        
        public int MaxJobPosts { get; set; } = -1; // -1 means unlimited
        
        public bool NeedsApproval { get; set; } = true;
        
        public bool IsPriority { get; set; } = false;
        
        [MaxLength(50)]
        public string SupportLevel { get; set; } = "Basic"; // e.g., 24/7, Fast, Normal
        
        public bool AllowRoleSwitch { get; set; } = false;

        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
