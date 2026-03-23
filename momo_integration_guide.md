# Tài liệu Tích hợp Thanh toán MoMo (Demo) - WebTimViec

Tài liệu này hướng dẫn cách sử dụng và kiểm tra tính năng thanh toán MoMo đã tích hợp trong dự án WebTimViec.

## 1. Quy trình thanh toán (Payment Flow)

### Bước 1: Yêu cầu thanh toán (Initiate Payment)
- Người dùng chọn gói cước trên Frontend.
- Frontend gọi API `POST /api/subscription/momo-payment` cùng với `planId`.
- Backend nhận yêu cầu, tạo `OrderId`, tính toán `Signature` (chữ ký bảo mật HMAC-SHA256) và gửi request đến cổng MoMo Sandbox.
- MoMo trả về `payUrl`.

### Bước 2: Thanh toán (Payment)
- Frontend chuyển hướng người dùng đến `payUrl`.
- Người dùng thực hiện thanh toán trên trang của MoMo (Sử dụng ví Test hoặc quét mã).

### Bước 3: Hoàn tất (Callback)
- MoMo chuyển hướng người dùng về `RedirectUrl` (đã cấu hình là trang Dashboard).
- MoMo đồng thời gửi một yêu cầu ngầm (IPN - Instant Payment Notification) đến `IpnUrl` của Backend.
- Backend xác thực chữ ký IPN, nếu hợp lệ sẽ cộng ngày sử dụng hoặc kích hoạt tính năng Premium cho người dùng.

## 2. Thông tin môi trường thử nghiệm (Momo Sandbox)

Dự án đang sử dụng thông tin **tài khoản thử nghiệm** (Test/Sandbox) mặc định của MoMo. Bạn không cần thẻ thật để thanh toán.

- **Partner Code:** `MOMOBKUN20180529`
- **Access Key:** `klm05688u9913w7r`
- **Secret Key:** `esB9n6X9v6Y9v7X8v8X9C9V9C9V9F9G`
- **Endpoint:** `https://test-payment.momo.vn/v2/gateway/api/create`

### Cách test thanh toán tại chỗ (Local Testing):
Vì Localhost (`127.0.0.1`) không thể nhận được dữ liệu từ Internet (MoMo), bạn có thể giả lập bước cuối cùng bằng cách sử dụng nút **"Xác nhận thanh toán (Demo)"** trên giao diện Web khi đang ở trang thanh toán để Backend kích hoạt gói cước ngay lập tức mà không cần chờ MoMo gọi về.

## 3. Cấu hình hệ thống (appsettings.json)

Bạn có thể thay đổi thông tin MoMo trong file `/WebTimViec.Api/appsettings.json`:

```json
"Momo": {
  "PartnerCode": "MOMOBKUN20180529",
  "AccessKey": "klm05688u9913w7r",
  "SecretKey": "esB9n6X9v6Y9v7X8v8X9C9V9C9V9F9G",
  "Endpoint": "https://test-payment.momo.vn/v2/gateway/api/create",
  "RedirectUrl": "http://localhost:5173/dashboard",
  "IpnUrl": "http://localhost:5281/api/webhook/momo-ipn"
}
```

## 4. Các File quan trọng trong Backend

- `Services/MomoService.cs`: Chứa logic tạo chữ ký (Signature) và gọi API MoMo.
- `Controllers/SubscriptionController.cs`: Cổng nhận yêu cầu từ Web.
- `Controllers/WebhookController.cs`: Xử lý dữ liệu trả về từ MoMo để cộng tiền/gói cước.

## 5. Tài liệu chính thức từ MoMo

- [Cổng phát triển MoMo (MoMo Developers)](https://developers.momo.vn/)
- [Tài liệu API All-In-One](https://developers.momo.vn/v2/vi/docs/servicer/all-in-one/)
