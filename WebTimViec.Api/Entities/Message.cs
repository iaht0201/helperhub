using System;

namespace WebTimViec.Api.Entities
{
    public class Message
    {
        public Guid Id { get; set; }
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public Guid JobPostId { get; set; } // Context of the conversation
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;

        // Navigation properties
        public User? Sender { get; set; }
        public User? Receiver { get; set; }
        public JobPost? JobPost { get; set; }
    }
}
