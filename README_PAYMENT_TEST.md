# Hướng Dẫn Test Thanh Toán MoMo (Môi trường Sandbox)

Tài liệu này cung cấp thông tin cần thiết để kiểm tra tính năng thanh toán MoMo trên website **WebTimViec**.

## 1. Thông tin tài khoản Test MoMo
Bạn có thể sử dụng bất kỳ số điện thoại nào (10 chữ số) để thực hiện thanh toán trên môi trường Sandbox của MoMo.

- **Số điện thoại**: Tùy chọn (Ví dụ: `0901234567`, `0333444555`...)
- **Mã OTP**: `0000` hoặc `000000`
- **Mật khẩu ví**: `123456` (Nếu yêu cầu tạo)

## 2. Các bước thực hiện Test

### Cách 1: Test trên trình duyệt (Web Payment)
1. Truy cập trang **Nâng cấp gói** trên website.
2. Chọn gói Pro hoặc Pro Max.
3. Chọn phương thức thanh toán **Ví MoMo**.
4. Hệ thống sẽ chuyển hướng sang trang thanh toán của MoMo Sandbox.
5. Nhập số điện thoại bất kỳ và mã OTP `0000` để hoàn tất.

### Cách 2: Test bằng App MoMo (Mobile)
Nếu bạn muốn trải nghiệm quét mã QR:
1. Gỡ cài đặt ứng dụng MoMo thật trên điện thoại.
2. Tải và cài đặt **Ứng dụng MoMo Test**:
   - Android: [Tải tại đây](https://developers.momo.vn/v3/vi/download/)
   - iOS: Cần qua TestFlight (Xem link trên).
3. Sử dụng app Test để quét mã QR hiển thị trên website.

## 3. Các kịch bản Test (Scenario)

| Kịch bản | Hành động | Kết quả mong đợi |
| :--- | :--- | :--- |
| **Thanh toán thành công** | Nhập OTP `0000` | Redirect về trang Success, Gói được nâng cấp, Thông báo thành công. |
| **Hủy thanh toán** | Nhấn "Hủy" hoặc quay lại từ trang MoMo | Redirect về trang Subscription, Thông báo đã hủy giao dịch. |
| **Hết hạn giao dịch** | Đợi 10 phút không thanh toán | Giao dịch thất bại trên hệ thống. |

## 4. Lưu ý quan trọng
- Đây là môi trường **Sandbox**, không trừ tiền thật trong tài khoản của bạn.
- Mọi giao dịch test sẽ bắt đầu bằng mã `WebTimViec_...`.
- Nếu gặp lỗi "Giao dịch không tồn tại", hãy kiểm tra lại cấu hình `MomoConfig` trong file `appsettings.json` của Backend.

---
*Tham khảo thêm tại: [MoMo Developers Test Instructions](https://developers.momo.vn/v3/vi/docs/payment/onboarding/test-instructions/)*
