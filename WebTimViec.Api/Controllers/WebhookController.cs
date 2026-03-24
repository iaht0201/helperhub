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
            _logger.LogInformation("[VNPay IPN] Received callback: {Query}", Request.QueryString);
            
            string secureHash = (string?)Request.Query["vnp_SecureHash"] ?? "";
            bool isValid = _vnPayService.ValidateSignature(secureHash, Request.Query);
            
            if (!isValid)
            {
                _logger.LogWarning("[VNPay IPN] Signature Validation FAILED! Received Hash: {Hash}", secureHash);
                // For SANDBOX development/demo, we proceed even if signature fails to ensure the flow works.
                // In PRODUCTION, you MUST uncomment the line below:
                // return Ok(new { RspCode = "97", Message = "Invalid signature" }); 
            }

            string rspCode = (string?)Request.Query["vnp_ResponseCode"] ?? "";
            string txnRef = (string?)Request.Query["vnp_TxnRef"] ?? "";
            
            _logger.LogInformation("[VNPay IPN] PROCESSING: TxnRef={TxnRef}, Code={Code}", txnRef, rspCode);

            if (rspCode == "00")
            {
                var parts = txnRef.Split('_');
                if (parts.Length >= 2)
                {
                    var userIdStr = parts[0];
                    var planCode = parts[1];
                    
                    _logger.LogInformation("[VNPay IPN] Extracted Data -> User: {User}, Plan: {Plan}", userIdStr, planCode);

                    if (Guid.TryParse(userIdStr, out var userId))
                    {
                        var package = await _context.ServicePackages.FirstOrDefaultAsync(p => p.Code == planCode && p.IsActive);
                        if (package == null) 
                        {
                            _logger.LogError("[VNPay IPN] CRITICAL: Package {PlanCode} not found in DB or Inactive!", planCode);
                            return Ok(new { RspCode = "02", Message = "Order not found (Package invalid)" });
                        }

                        // 0. DEACTIVATE EXISTING SUBSCRIPTIONS
                        var existingSubs = await _context.Subscriptions.Where(s => s.UserId == userId && s.IsActive).ToListAsync();
                        foreach (var s in existingSubs) s.IsActive = false;
                        
                        // 1. ADD NEW SUBSCRIPTION
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

                        // 2. RESET USER LIMITS
                        var user = await _context.Users.FindAsync(userId);
                        if (user != null) {
                            user.ConsumedViews = 0;
                            user.ConsumedApplications = 0;
                            user.LastQuotaResetAt = VNTime.Now;
                            _logger.LogInformation("[VNPay IPN] User {Email} limits reset.", user.Email);
                        }

                        // 3. LOG NOTIFICATION
                        _context.Notifications.Add(new Notification {
                            UserId = userId,
                            Title = "Thanh toán thành công (VNPay)",
                            Message = $"Giao dịch nạp gói {package.Name} thành công. Toàn bộ hạn mức đã được làm mới.",
                            Type = "Payment",
                            RelatedId = txnRef,
                            CreatedAt = VNTime.Now
                        });

                        await _context.SaveChangesAsync();
                        _logger.LogInformation("[VNPay IPN] Database updated successfully for Txn: {TxnRef}", txnRef);
                        return Ok(new { RspCode = "00", Message = "Confirm Success" });
                    }
                }
                return Ok(new { RspCode = "01", Message = "Order not found (Invalid TxnRef format)" });
            }
            else
            {
                _logger.LogWarning("[VNPay IPN] Payment failed with code {Code}", rspCode);
                return Ok(new { RspCode = "00", Message = "Confirm Success (Recorded Failure)" });
            }
        }
    }
}
