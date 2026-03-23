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
        private readonly IMomoService _momoService;
        private readonly IVnPayService _vnPayService;
        private readonly IZaloPayService _zaloPayService;
        private readonly ILogger<WebhookController> _logger;
        private readonly IOptions<SePaySettings> _sePaySettings;

        public WebhookController(
            AppDbContext context, 
            IMomoService momoService, 
            IVnPayService vnPayService,
            IZaloPayService zaloPayService,
            ILogger<WebhookController> logger,
            IOptions<SePaySettings> sePaySettings)
        {
            _context = context;
            _momoService = momoService;
            _vnPayService = vnPayService;
            _zaloPayService = zaloPayService;
            _logger = logger;
            _sePaySettings = sePaySettings;
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

        [HttpPost("momo-ipn")]
        public async Task<IActionResult> MomoIPN([FromBody] MomoIPNRequest request)
        {
            if (!_momoService.ValidateIPN(request))
            {
                return BadRequest("Signature invalid");
            }

            if (request.ResultCode == 0)
            {
                string extraData = string.Empty;
                try {
                    extraData = Encoding.UTF8.GetString(Convert.FromBase64String(request.ExtraData));
                } catch { extraData = request.ExtraData; }

                var dataParts = extraData.Split('&');
                var userIdStr = dataParts.FirstOrDefault(p => p.StartsWith("userId="))?.Split('=')[1];
                var planId = dataParts.FirstOrDefault(p => p.StartsWith("planId="))?.Split('=')[1];

                if (Guid.TryParse(userIdStr, out var userId))
                {
                    var package = await _context.ServicePackages.FirstOrDefaultAsync(p => p.Code == planId || p.Id.ToString() == planId);
                    if (package != null)
                    {
                        // 1. ADD NEW (History)
                        var subscription = new Subscription {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            CreatedAt = VNTime.Now,
                            ServicePackageId = package.Id,
                            ExpiredAt = VNTime.Now.AddDays(package.Days),
                            IsActive = true,
                            Tier = package.Code,
                            Amount = package.Price,
                            TransactionId = request.TransId.ToString()
                        };
                        _context.Subscriptions.Add(subscription);

                        // 2. RESET Credits
                        var user = await _context.Users.FindAsync(userId);
                        if (user != null) {
                            user.ConsumedViews = 0;
                            user.ConsumedApplications = 0;
                            user.LastQuotaResetAt = VNTime.Now;
                        }
                        await _context.SaveChangesAsync();
                    }
                }
            }

            return NoContent();
        }

        [HttpPost("zalopay-ipn")]
        public async Task<IActionResult> ZaloPayIPN([FromBody] ZaloPayCallbackRequest request)
        {
            if (!_zaloPayService.ValidateCallback(request))
            {
                return Ok(new { return_code = -1, return_message = "Invalid MAC" });
            }

            try
            {
                var data = JsonSerializer.Deserialize<ZaloPayCallbackData>(request.Data);
                if (data == null) return Ok(new { return_code = -1, return_message = "Invalid data" });

                var embedData = JsonSerializer.Deserialize<JsonElement>(data.EmbedData);
                string userIdStr = embedData.GetProperty("userId").GetString() ?? "";
                string planIdStr = embedData.GetProperty("planId").GetString() ?? "";

                if (Guid.TryParse(userIdStr, out var userId) && Guid.TryParse(planIdStr, out var planId))
                {
                    var package = await _context.ServicePackages.FindAsync(planId);
                    if (package != null)
                    {
                        // 1. ADD NEW (History)
                        var subscription = new Subscription {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            CreatedAt = VNTime.Now,
                            ServicePackageId = package.Id,
                            ExpiredAt = VNTime.Now.AddDays(package.Days),
                            IsActive = true,
                            Tier = package.Code,
                            Amount = package.Price,
                            TransactionId = data.AppTransId // Use specific ID from callback
                        };
                        _context.Subscriptions.Add(subscription);

                        // 2. RESET Credits
                        var user = await _context.Users.FindAsync(userId);
                        if (user != null) {
                            user.ConsumedViews = 0;
                            user.ConsumedApplications = 0;
                            user.LastQuotaResetAt = VNTime.Now;
                        }
                        await _context.SaveChangesAsync();
                    }
                }

                return Ok(new { return_code = 1, return_message = "Success" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "ZaloPay IPN Error");
                return Ok(new { return_code = 2, return_message = ex.Message });
            }
        }

        [HttpPost("sepay-ipn")]
        public async Task<IActionResult> SePayIPN([FromBody] SePayWebhookRequest request)
        {
             // 1. Bearer Token Check
            var authHeader = Request.Headers["Authorization"].ToString();
            var expectedToken = "Bearer " + _sePaySettings.Value.ApiKey;

            if (authHeader != expectedToken)
            {
                _logger.LogWarning("[SePay] Unauthorized webhook attempt");
                return Unauthorized();
            }

            // 2. Extract content
            var content = request.Content ?? "";
            _logger.LogInformation($"[SePay] Received IPN: {content}");

            // Example content: "HPHUB 3a4b5c PRO MONTHLY"
            var parts = content.Split(' ');
            if (parts.Length < 3)
            {
                _logger.LogWarning($"[SePay] Invalid content format: {content}");
                return Ok(new { success = true, message = "Ignored invalid content" });
            }

            var userIdPrefix = parts[1];
            var planCodeSymbol = parts[2];
            var billingCycle = parts.Length >= 4 ? parts[3] : "MONTHLY";
            var fullPlanCode = $"{planCodeSymbol}_{billingCycle}";

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id.ToString().StartsWith(userIdPrefix));
            if (user == null)
            {
                _logger.LogError($"[SePay] User with prefix {userIdPrefix} not found");
                return Ok(new { success = true, message = "User not found" });
            }

            var package = await _context.ServicePackages.FirstOrDefaultAsync(p => p.Code == fullPlanCode);
            if (package == null)
            {
                _logger.LogError($"[SePay] Plan {fullPlanCode} not found");
                return Ok(new { success = true, message = "Plan not found" });
            }

            if (request.AmountIn < (decimal)package.Price * 0.95m)
            {
                _logger.LogWarning($"[SePay] Insufficient amount: {request.AmountIn} for plan {package.Price}");
                return Ok(new { success = true, message = "Insufficient amount" });
            }

            // 3. CREATE NEW SUBSCRIPTION (History)
            var subscription = new Subscription {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                ServicePackageId = package.Id,
                ExpiredAt = DateTime.UtcNow.AddDays(package.Days),
                IsActive = true,
                Tier = package.Code,
                Amount = package.Price,
                TransactionId = "SEPAY_" + request.Id
            };
            _context.Subscriptions.Add(subscription);

            // 4. RESET credits
            user.ConsumedViews = 0;
            user.ConsumedApplications = 0;
            user.LastQuotaResetAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogInformation($"[SePay] Subscription ACTIVATED for User {user.Email}");

            return Ok(new { success = true, message = "Subscription activated" });
        }
    }
}
