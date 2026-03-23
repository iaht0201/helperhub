using System;
using System.ComponentModel.DataAnnotations;

namespace WebTimViec.Api.Entities
{
    public class Notification
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        public Guid UserId { get; set; }
        public virtual User? User { get; set; }
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        public string Message { get; set; } = string.Empty;
        
        public string? Type { get; set; } // System, Approval, Invitation, Application
        
        public string? RelatedId { get; set; } // JobId or ApplicationId
        
        public bool IsRead { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
