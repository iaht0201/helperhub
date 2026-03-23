using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using WebTimViec.Api.Data;
using WebTimViec.Api.Entities;
using WebTimViec.Api.Services;
using System.Security.Claims;
using System.Text;
using WebTimViec.Api.Helpers;

namespace WebTimViec.Api.Controllers
{
    using System.Text.Json.Serialization;

    public record PaymentRequest(
        [property: JsonPropertyName("planCode")] string PlanCode
    );

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SubscriptionController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IVnPayService _vnPayService;

        public SubscriptionController(
            AppDbContext context, 
            IVnPayService vnPayService)
        {
            _context = context;
            _vnPayService = vnPayService;
        }

        [HttpGet("pricing")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPricing()
        {
            var packages = await _context.ServicePackages.Where(p => p.IsActive).OrderBy(p => p.Price).ToListAsync();
            return Ok(packages);
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMySubscriptions()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            var userId = Guid.Parse(userIdStr);
            var subscriptions = await _context.Subscriptions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .Include(s => s.ServicePackage)
                .Select(s => new {
                    s.Id,
                    s.Tier,
                    s.Amount,
                    s.TransactionId,
                    s.IsActive,
                    s.CreatedAt,
                    s.ExpiredAt,
                    PackageName = s.ServicePackage != null ? s.ServicePackage.Name : "N/A"
                })
                .ToListAsync();

            return Ok(subscriptions);
        }
        [HttpPost("vnpay-payment")]
        public async Task<IActionResult> CreateVnPayPayment([FromBody] PaymentRequest request)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdStr == null) return Unauthorized("Vui lòng đăng nhập để thanh toán.");

            ServicePackage? package = null;
            if (Guid.TryParse(request.PlanCode, out Guid guidId))
                package = await _context.ServicePackages.FindAsync(guidId);
            else
                package = await _context.ServicePackages.FirstOrDefaultAsync(p => p.Code == request.PlanCode && p.IsActive);

            if (package == null) return BadRequest("Gói dịch vụ không hợp lệ");

            string txnRef = $"{userIdStr}_{package.Code}_{VNTime.Now.Ticks}";
            string orderInfo = $"Thanh toan {package.Code} cho HelperHub"; // STRICT ASCII ONLY
            string ipAddr = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";

            string payUrl = _vnPayService.CreatePaymentUrl(txnRef, package.Price, orderInfo, ipAddr);

            return Ok(new { PayUrl = payUrl, OrderId = txnRef });
        }




        [HttpPost("activate-mock")]
        public async Task<IActionResult> ActivateMock()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
            
            var latestSub = await _context.Subscriptions
                .Where(s => s.UserId == userId && s.IsActive)
                .OrderByDescending(s => s.ExpiredAt)
                .FirstOrDefaultAsync();

            if (latestSub != null)
            {
                var startDate = (latestSub.ExpiredAt > VNTime.Now) ? latestSub.ExpiredAt : VNTime.Now;
                latestSub.ExpiredAt = startDate.AddMonths(1);
                latestSub.IsActive = true;
            }
            else
            {
                _context.Subscriptions.Add(new Subscription
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    ExpiredAt = VNTime.Now.AddMonths(1),
                    IsActive = true,
                    CreatedAt = VNTime.Now
                });
            }

            // Reset Credits for mock too (always reset when activating a package)
            var userToUpdate = await _context.Users.FindAsync(userId);
            if (userToUpdate != null) {
                userToUpdate.ConsumedViews = 0;
                userToUpdate.ConsumedApplications = 0;
                userToUpdate.LastQuotaResetAt = VNTime.Now;
            }

            _context.Notifications.Add(new Notification {
                UserId = userId,
                Title = "Kích hoạt gói thành công (Mock)",
                Message = "Hệ thống đã ghi nhận kích hoạt gói của bạn. Điểm credit đã được reset.",
                Type = "Transaction",
                CreatedAt = VNTime.Now
            });
            
            await _context.SaveChangesAsync();
            return Ok(new { message = "Gói dịch vụ đã được kích hoạt thành công (Mô phỏng MoMo)!" });
        }

        [HttpPost("create-order")]
        public async Task<IActionResult> CreateOrder([FromBody] PaymentRequest request)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

            var package = await _context.ServicePackages.FirstOrDefaultAsync(p => p.Code.ToUpper() == request.PlanCode.ToUpper());
            
            // AUTO-SEED: Nếu database chưa có các gói chuẩn, tự động tạo nhanh để DEMO mượt mà
            if (package == null)
            {
                var seedPackages = new List<ServicePackage>
                {
                    new ServicePackage { 
                        Id = Guid.NewGuid(), Code = "BASIC", Name = "Gói Basic", Price = 0, Days = 30, IsActive = true, CreatedAt = VNTime.Now, 
                        MaxApplications = 1, MaxViews = 2, MaxJobPosts = 1, 
                        NeedsApproval = true, IsPriority = false, SupportLevel = "24/7 Support"
                    },
                    new ServicePackage { 
                        Id = Guid.NewGuid(), Code = "PRO", Name = "Gói Professional", Price = 199000, Days = 30, IsActive = true, CreatedAt = VNTime.Now, 
                        MaxApplications = 10, MaxViews = 20, MaxJobPosts = 10,
                        NeedsApproval = false, IsPriority = true, SupportLevel = "Fast Support", AllowRoleSwitch = false
                    },
                    new ServicePackage { 
                        Id = Guid.NewGuid(), Code = "ENTERPRISE", Name = "Gói Enterprise", Price = 499000, Days = 30, IsActive = true, CreatedAt = VNTime.Now, 
                        MaxApplications = -1, MaxViews = -1, MaxJobPosts = -1,
                        NeedsApproval = false, IsPriority = true, SupportLevel = "Premium Fast Support", AllowRoleSwitch = true
                    }
                };
                
                _context.ServicePackages.AddRange(seedPackages);
                await _context.SaveChangesAsync();
                
                package = seedPackages.FirstOrDefault(p => p.Code.ToUpper() == request.PlanCode.ToUpper());
            }

            if (package == null) return BadRequest($"Gói '{request.PlanCode}' không tồn tại!");

            var orderId = "ORD_" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper();
            
            // CỘNG DỒN THỜI GIAN: Tìm xem người dùng đã có gói nào còn hạn không
            var latestSub = await _context.Subscriptions
                .Where(s => s.UserId == Guid.Parse(userIdStr) && s.IsActive && s.ExpiredAt > VNTime.Now)
                .OrderByDescending(s => s.ExpiredAt)
                .FirstOrDefaultAsync();

            var startDate = (latestSub != null) ? latestSub.ExpiredAt : VNTime.Now;

            // Tạo Subscription ở trạng thái PENDING
            var subscription = new Subscription
            {
                Id = Guid.NewGuid(),
                UserId = Guid.Parse(userIdStr),
                ServicePackageId = package.Id,
                Tier = package.Code,
                Amount = package.Price,
                TransactionId = orderId,
                IsActive = false, // Chưa kích hoạt
                CreatedAt = VNTime.Now,
                ExpiredAt = startDate.AddDays(package.Days)
            };

            _context.Subscriptions.Add(subscription);
            await _context.SaveChangesAsync();

            return Ok(new { orderId = orderId, amount = package.Price, status = "created" });
        }

        [HttpPost("create-payment")]
        public IActionResult CreatePayment([FromBody] JsonElement body)
        {
            var orderId = body.GetProperty("orderId").GetString();
            // Pointing to Frontend's Fake Gateway route
            string frontendUrl = "http://localhost:5173"; 
            var payUrl = $"{frontendUrl}/fake-gateway?orderId={orderId}";

            return Ok(new { payUrl = payUrl });
        }

        [HttpPost("callback")]
        public async Task<IActionResult> PaymentCallback([FromBody] JsonElement body)
        {
            var orderId = body.GetProperty("orderId").GetString();
            var resultCode = body.GetProperty("resultCode").GetInt32();
            bool isSuccess = resultCode == 0;

            var subscription = await _context.Subscriptions.FirstOrDefaultAsync(s => s.TransactionId == orderId);
            if (subscription == null) return NotFound("Order not found");

            if (isSuccess)
            {
                subscription.IsActive = true;
                subscription.CreatedAt = VNTime.Now; // Reset start time to payment time
                
                // RESET USER CREDIT on payment success
                var userToUpdate = await _context.Users.FindAsync(subscription.UserId);
                if (userToUpdate != null) {
                    userToUpdate.ConsumedViews = 0;
                    userToUpdate.ConsumedApplications = 0;
                    userToUpdate.LastQuotaResetAt = VNTime.Now; // Explicit sync to now
                }
            }
            else
            {
                subscription.IsActive = false;
                // Optionally remove or keep as Failed
            }

            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(subscription.UserId);
            var package = await _context.ServicePackages.FindAsync(subscription.ServicePackageId);

            // NOTIFY USER & ADMINs about the transaction
            try {
                // To User
                _context.Notifications.Add(new Notification {
                    UserId = subscription.UserId,
                    Title = isSuccess ? "Giao dịch thành công" : "Giao dịch thất bại",
                    Message = isSuccess 
                        ? $"Bạn đã nâng cấp thành công gói {package?.Name}. Hạn mức đã được reset về mặc định của gói. Hạn dùng: {subscription.ExpiredAt:dd/MM/yyyy}."
                        : $"Giao dịch cho gói {package?.Name} đã thất bại. Vui lòng thử lại hoặc liên hệ hỗ trợ. Mã đơn: {orderId}",
                    Type = "Transaction",
                    CreatedAt = VNTime.Now
                });

                // To Admin
                var admins = await _context.Users.Where(u => u.Role == "Admin").ToListAsync();
                foreach(var admin in admins) {
                    _context.Notifications.Add(new Notification {
                        UserId = admin.Id,
                        Title = isSuccess ? "Giao dịch mới" : "Giao dịch thất bại (Admin)",
                        Message = $"Người dùng {user?.Email} vừa thực hiện thanh toán gói {package?.Name}. Trạng thái: {(isSuccess ? "THÀNH CÔNG" : "THẤT BẠI")}. Mã đơn: {orderId}",
                        Type = "System",
                        CreatedAt = VNTime.Now
                    });
                }
                await _context.SaveChangesAsync();
            } catch { /* Ignore notification errors to not break payment flow */ }

            return Ok(new { 
                success = true, 
                message = isSuccess ? "Payment success" : "Payment failed",
                redirectUrl = $"/payment-result?orderId={orderId}&status={(isSuccess ? "success" : "failed")}&message={(isSuccess ? "" : "Giao dịch bị từ chối hoặc lỗi kỹ thuật.")}"
            });
        }
    }
}
