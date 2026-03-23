using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebTimViec.Api.Data;
using WebTimViec.Api.Entities;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using WebTimViec.Api.Hubs;

namespace WebTimViec.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MessageController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;

        public MessageController(AppDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] SendMsgDto dto)
        {
            var senderId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            
            var msg = new Message
            {
                Id = Guid.NewGuid(),
                SenderId = senderId,
                ReceiverId = dto.ReceiverId,
                JobPostId = dto.JobId,
                Content = dto.Content,
                CreatedAt = DateTime.UtcNow
            };

            _context.Messages.Add(msg);
            await _context.SaveChangesAsync();

            // Broadcast message via SignalR to the receiver's group
            await _hubContext.Clients.Group(dto.ReceiverId.ToString())
                .SendAsync("ReceiveMessage", msg);

            return Ok(msg);
        }

        [HttpGet("conversation/{jobId}/{otherId}")]
        public async Task<IActionResult> GetConversation(Guid jobId, Guid otherId)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            
            var messages = await _context.Messages
                .Where(m => m.JobPostId == jobId && 
                            ((m.SenderId == userId && m.ReceiverId == otherId) || 
                             (m.SenderId == otherId && m.ReceiverId == userId)))
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();
            
            return Ok(messages);
        }

        [HttpGet("inbox")]
        public async Task<IActionResult> GetInbox()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            
            // Get last message in each conversation
            // Grouping by (other person, job)
            var inbox = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Include(m => m.JobPost)
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();
            
            return Ok(inbox);
        }
    }

    public class SendMsgDto
    {
        public Guid ReceiverId { get; set; }
        public Guid JobId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
