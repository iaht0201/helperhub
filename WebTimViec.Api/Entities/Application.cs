using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebTimViec.Api.Entities
{
    public class Application
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid JobPostId { get; set; }
        
        [ForeignKey("JobPostId")]
        public virtual JobPost? JobPost { get; set; }
        
        [Required]
        public Guid ApplicantId { get; set; }
        
        [ForeignKey("ApplicantId")]
        public virtual User? Applicant { get; set; }
        
        [Required]
        public string Status { get; set; } = "Pending"; // Pending, Accepted, Rejected
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
