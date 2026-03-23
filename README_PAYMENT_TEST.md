# Hướng Dẫn Test Thanh Toán (Sandbox Environment) - HelperHub

Tài liệu này cung cấp thông tin cần thiết để kiểm tra tính năng thanh toán VNPay trên website **HelperHub**.

---

## 1. VNPay Sandbox (ATM Nội địa / NCB)

VNPay cung cấp thẻ ATM giả lập để test thanh toán qua cổng ngân hàng. Dự án hiện tại ưu tiên sử dụng VNPay cho môi trường thử nghiệm.

- **Ngân hàng**: Chọn ngân hàng **NCB** (Ngân hàng Quốc dân).
- **Số thẻ**: `9704198526191432198`
- **Tên chủ thẻ**: `NGUYEN VAN A`
- **Ngày phát hành**: `07/15` (Tháng 7, năm 2015).
- **Mã OTP**: `123456`.

### Các bước thực hiện:
1. Đăng nhập vào website HelperHub.
2. Truy cập trang **Nâng cấp gói**.
3. Chọn gói Pro hoặc Pro Max.
4. Chọn phương thức **Thanh toán VNPay**.
5. Tại giao diện VNPay, chọn **ATM Nội địa**.
6. Chọn ngân hàng **NCB**.
7. Nhập thông tin thẻ trên và bấm thanh toán. Nhập OTP `123456`.

---

## 2. Các kịch bản Test (Scenario)

| Kịch bản | Hành động | Kết quả mong đợi |
| :--- | :--- | :--- |
| **Thanh toán thành công** | Nhập đúng OTP | Redirect về trang Success, Gói được nâng cấp ngay lập tức, Thông báo thành công hiển thị. |
| **Hủy thanh toán** | Nhấn "Hủy" hoặc quay lại từ trang thanh toán | Redirect về trang Subscription, Thông báo đã hủy giao dịch. |
| **Hết hạn giao dịch** | Đợi hết thời gian thanh toán | Giao dịch thất bại, trạng thái đơn hàng là Canceled. |

---

## 3. Lưu ý quan trọng cho Developer

Để hệ thống HelperHub tự động nâng cấp gói sau khi thanh toán thành công (xử lý IPN):

- **Ngrok Tunnel**: Bạn **nên** chạy Ngrok để server VNPay có thể gọi được API Callback của bạn từ internet.
- **Cấu hình**: Cập nhật link Ngrok vào `VnPaySettings:ReturnUrl` trong file `appsettings.json`.
- **Log**: Kiểm tra terminal của API để xem log các request IPN trả về.

---
*Tham khảo thêm tại: [VNPay Sandbox Documentation](https://sandbox.vnpayment.vn/apis/)*
