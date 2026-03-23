using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WebTimViec.Api.Entities
{
    public class Subscription
    {
        [Key]
        public Guid Id { get; set; }
        
        [Required]
        public Guid UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
        
        public DateTime ExpiredAt { get; set; }

        public Guid? ServicePackageId { get; set; }
        [ForeignKey("ServicePackageId")]
        public virtual ServicePackage? ServicePackage { get; set; }
        
        public string Tier { get; set; } = "FREE";
        public decimal Amount { get; set; }
        public string? TransactionId { get; set; }

        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
