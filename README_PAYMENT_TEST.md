# Hướng Dẫn Test Thanh Toán (Sandbox Environment) - PROJOB

Tài liệu này cung cấp thông tin cần thiết để kiểm tra tính năng thanh toán MoMo và VNPay trên website **PROJOB**.

---

## 1. MoMo Sandbox (Ví MoMo)

Môi trường giả lập của MoMo cho phép bạn test mà không mất phí thật.

- **Số điện thoại**: Sử dụng bất kỳ số điện thoại nào (10-11 chữ số).
- **Mã OTP**: `0000` (4 số) hoặc `000000` (6 số).
- **Mật khẩu ví**: `123456` (Nếu yêu cầu tạo).

### Các bước thực hiện:
1. Đăng nhập vào website PROJOB.
2. Truy cập trang **Nâng cấp gói**.
3. Chọn gói Pro hoặc Pro Max.
4. Chọn phương thức thanh toán **Ví MoMo**.
5. Hệ thống sẽ chuyển hướng sang MoMo. Nhập số điện thoại và OTP `0000`.

---

## 2. VNPay Sandbox (ATM Nội địa / NCB)

VNPay cung cấp thẻ ATM giả lập để test thanh toán qua cổng ngân hàng.

- **Ngân hàng**: Chọn ngân hàng **NCB** (Ngân hàng Quốc dân).
- **Số thẻ**: `9704198526191432198`
- **Tên chủ thẻ**: `NGUYEN VAN A`
- **Ngày phát hành**: `07/15` (Tháng 7, năm 2015).
- **Mã OTP**: `123456`.

### Các bước thực hiện:
1. Tại trang nâng cấp, chọn phương thức **Thanh toán VNPay**.
2. Tại giao diện VNPay, chọn **ATM Nội địa**.
3. Chọn ngân hàng **NCB**.
4. Nhập thông tin thẻ trên và bấm thanh toán. Nhập OTP `123456`.

---

## 3. Các kịch bản Test (Scenario)

| Kịch bản | Hành động | Kết quả mong đợi |
| :--- | :--- | :--- |
| **Thanh toán thành công** | Nhập đúng OTP | Redirect về trang Success, Gói được nâng cấp ngay lập tức, Thông báo thành công hiển thị. |
| **Hủy thanh toán** | Nhấn "Hủy" hoặc quay lại từ trang thanh toán | Redirect về trang Subscription, Thông báo đã hủy giao dịch. |
| **Hết hạn giao dịch** | Đợi hế gian thanh toán | Giao dịch thất bại, trạng thái đơn hàng là Canceled. |

---

## 4. Lưu ý quan trọng cho Developer

Để hệ thống PROJOB tự động nâng cấp gói sau khi thanh toán thành công (xử lý IPN/Webhook):

- **Ngrok Tunnel**: Bạn **bắt buộc** phải chạy Ngrok để MoMo/VNPay có thể gọi được vào cổng API của bạn từ internet.
- **Cấu hình**: Cập nhật link Ngrok vào `MomoSettings:NotifyUrl` và `VnPaySettings:ReturnUrl` trong file `appsettings.json`.
- **Log**: Kiểm tra terminal của API để xem log các request IPN trả về.

---
*Tham khảo thêm tại: [MoMo Developers](https://developers.momo.vn/) và [VNPay Sandbox](https://sandbox.vnpayment.vn/apis/)*
