# Tài liệu Tích hợp Thanh toán MoMo (Sandbox) - PROJOB

Tài liệu này hướng dẫn cách sử dụng và cấu hình tính năng thanh toán MoMo đã tích hợp trong hệ thống PROJOB.

## 1. Quy trình thanh toán (Payment Flow)

1. **Yêu cầu thanh toán**: Người dùng chọn gói (Pro/Pro Max) -> Backend tạo `payUrl` (MoMo Sandbox) kèm theo chữ ký bảo mật HMAC-SHA256.
2. **Thanh toán tại Sandbox**: Người dùng nhập SĐT bất kỳ và OTP `0000` trên trang MoMo.
3. **Xử lý kết quả**: 
   - MoMo chuyển hướng người dùng về `ReturnUrl` (Trang kết quả trên Frontend).
   - MoMo gửi dữ liệu IPN (Instant Payment Notification) về `NotifyUrl` (API Webhook của Backend).
   - Backend xác thực chữ ký IPN và tự động nâng cấp gói hội viên cho người dùng.

## 2. Thông tin cấu hình (Môi trường Test)

Hiện tại dự án sử dụng tài khoản Sandbox mặc định:

- **Partner Code:** `MOMOBKUN20180529`
- **Access Key:** `klm0568887013354`
- **Secret Key:** `esB0WpW9S98m4iYS8855F8W03T49qIsx`
- **Endpoint:** `https://test-payment.momo.vn/v2/gateway/api/create`

### Cấu hình trong `appsettings.json`:
```json
"MomoSettings": {
  "PartnerCode": "MOMOBKUN20180529",
  "PartnerName": "PROJOB",
  "StoreId": "MomoStore",
  "AccessKey": "klm0568887013354",
  "SecretKey": "esB0WpW9S98m4iYS8855F8W03T49qIsx",
  "Endpoints": {
      "Create": "https://test-payment.momo.vn/v2/gateway/api/create"
  },
  "ReturnUrl": "[NGROK_DOMAIN]/subscription/callback",
  "NotifyUrl": "[NGROK_DOMAIN]/api/webhook/momo-ipn"
}
```

## 3. Lưu ý quan trọng cho Local Development

Do MoMo Sandbox cần gửi dữ liệu về máy cá nhân của bạn thông qua internet, bạn cần:
1. **Sử dụng Ngrok** để tạo một đường hầm (tunnel) cho cổng 5173 (nếu dùng Docker) hoặc 5281 (nếu chạy thủ công).
2. Cập nhật `ReturnUrl` và `NotifyUrl` trong `appsettings.json` trùng với domain Ngrok được cấp.

## 4. Các File mã nguồn chính
- `WebTimViec.Api/Services/MomoService.cs`: Xử lý tạo Signature và gọi API.
- `WebTimViec.Api/Controllers/WebhookController.cs`: Tiếp nhận IPN và xử lý kết quả thanh toán.

---
*Phát triển bởi đội ngũ PROJOB.*
