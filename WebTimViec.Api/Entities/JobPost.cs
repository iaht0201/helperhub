using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebTimViec.Api.Entities
{
    public class JobPost
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string JobType { get; set; } = "Part-time"; // Full-time, Part-time
        
        [Required]
        public string ServiceType { get; set; } = string.Empty; // Giúp việc, Trông trẻ, v.v.
        
        public Guid? JobCategoryId { get; set; }
        
        [ForeignKey("JobCategoryId")]
        public virtual JobCategory? Category { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Salary { get; set; }
        
        [Required]
        public string Location { get; set; } = string.Empty;
        
        public string? WorkingTime { get; set; }
        
        public string? GenderRequired { get; set; }
        
        public int AgeMin { get; set; }
        
        public int AgeMax { get; set; }
        
        public string? Description { get; set; }
        
        public string? Skills { get; set; }
        
        public string? Experience { get; set; }
        
        public bool IsForWorker { get; set; } // true = worker post, false = homeowner post
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public bool IsApproved { get; set; } = false;
        
        public bool IsPriority { get; set; } = false;
        
        public bool IsActive { get; set; } = true;

    }
}
