using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebTimViec.Api.Data;
using WebTimViec.Api.DTOs;
using WebTimViec.Api.Entities;
using WebTimViec.Api.Services;
using System.Text.Json;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using WebTimViec.Api.Helpers;

namespace WebTimViec.Api.Controllers
{
    [ApiController]
    [Route("api/webhook")]
    public class WebhookController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IVnPayService _vnPayService;
        private readonly ILogger<WebhookController> _logger;

        public WebhookController(
            AppDbContext context, 
            IVnPayService vnPayService,
            ILogger<WebhookController> logger)
        {
            _context = context;
            _vnPayService = vnPayService;
            _logger = logger;
        }

        [HttpGet("vnpay-ipn")]
        public async Task<IActionResult> VnPayIPN()
        {
            string secureHash = (string?)Request.Query["vnp_SecureHash"] ?? "";
            if (string.IsNullOrEmpty(secureHash) || !_vnPayService.ValidateSignature(secureHash, Request.Query))
            {
                return Ok(new { RspCode = "97", Message = "Invalid signature" });
            }
 
            string rspCode = (string?)Request.Query["vnp_ResponseCode"] ?? "";
            string txnRef = (string?)Request.Query["vnp_TxnRef"] ?? "";

            if (rspCode == "00")
            {
                var parts = txnRef.Split('_');
                if (parts.Length >= 2)
                {
                    var userIdStr = parts[0];
                    var planCode = parts[1];

                    if (Guid.TryParse(userIdStr, out var userId))
                    {
                        var package = await _context.ServicePackages.FirstOrDefaultAsync(p => p.Code == planCode && p.IsActive);
                        if (package != null)
                        {
                            // 0. DEACTIVATE EXISTING SUBSCRIPTIONS
                            var existingSubs = await _context.Subscriptions.Where(s => s.UserId == userId && s.IsActive).ToListAsync();
                            foreach (var s in existingSubs) 
                            {
                                s.IsActive = false;
                            }
                            
                            // 1. ADD NEW SUBSCRIPTION (not update existing) for history
                            var subscription = new Subscription {
                                Id = Guid.NewGuid(),
                                UserId = userId,
                                CreatedAt = VNTime.Now,
                                ServicePackageId = package.Id,
                                ExpiredAt = VNTime.Now.AddDays(package.Days),
                                IsActive = true,
                                Tier = package.Code,
                                Amount = package.Price,
                                TransactionId = txnRef
                            };
                            _context.Subscriptions.Add(subscription);

                            // 2. RESET Credits
                            var user = await _context.Users.FindAsync(userId);
                            if (user != null) {
                                user.ConsumedViews = 0;
                                user.ConsumedApplications = 0;
                                user.LastQuotaResetAt = VNTime.Now;
                            }
                            // 3. Send Notification
                            _context.Notifications.Add(new Notification {
                                UserId = userId,
                                Title = "Thanh toán thành công",
                                Message = $"Giao dịch nạp gói {package.Name} thành công. Tài khoản của bạn đã được nâng cấp và làm mới lượt xem.",
                                Type = "Payment",
                                RelatedId = txnRef,
                                CreatedAt = VNTime.Now
                            });
                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }
            else
            {
                // FAILURE CASE
                var parts = txnRef.Split('_');
                if (parts.Length >= 2 && Guid.TryParse(parts[0], out var userId))
                {
                    _context.Notifications.Add(new Notification {
                        UserId = userId,
                        Title = "Thanh toán thất bại",
                        Message = $"Giao dịch {txnRef} không thành công (Mã lỗi: {rspCode}). Vui lòng kiểm tra lại phương thức thanh toán.",
                        Type = "Payment",
                        RelatedId = txnRef,
                        CreatedAt = VNTime.Now
                    });
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new { RspCode = "00", Message = "Confirm Success" });
        }






    }
}
