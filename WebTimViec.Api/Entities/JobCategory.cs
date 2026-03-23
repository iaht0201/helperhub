using System;
using System.ComponentModel.DataAnnotations;

namespace WebTimViec.Api.Entities
{
    public class JobCategory
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public string Code { get; set; } = string.Empty;
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? IconName { get; set; } // Lucide icon name like "Cpu", "Compass", etc.
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public bool IsActive { get; set; } = true;
    }
}
