using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebTimViec.Api.Entities
{
    public class UserJobView
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
        
        public Guid? JobPostId { get; set; }
        
        [ForeignKey("JobPostId")]
        public virtual JobPost? JobPost { get; set; }

        public Guid? ViewedUserId { get; set; }

        [ForeignKey("ViewedUserId")]
        public virtual User? ViewedUser { get; set; }
        
        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
    }
}
