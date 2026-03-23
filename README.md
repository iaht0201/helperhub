# HelperHub - Hệ thống Tìm kiếm Việc làm & Tuyển dụng Hiện đại

Dự án HelperHub là một nền tảng tuyển dụng thông minh, giúp kết nối Nhà tuyển dụng và Người tìm việc hiệu quả hơn. Hệ thống tích hợp các gói hội viên (Pro/Pro Max), thanh toán trực tuyến và thông báo thời gian thực.

---

## 🚀 Công nghệ sử dụng
- **Backend**: ASP.NET Core 9.0, Entity Framework Core, PostgreSQL/SQLite.
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Framer Motion.
- **Thanh toán**: VNPay (Môi trường Sandbox/Thử nghiệm).
- **Tính năng mới**: Hệ thống thông báo tự động (Real-time Notifications) cho các hoạt động tài khoản và tuyển dụng.
- **Khác**: Google Login, Ngrok (cho Webhook/IPN testing).

---

## ✨ Các tính năng chính
- **Tìm kiếm & Ứng tuyển**: Tìm kiếm việc làm thông minh với bộ lọc đa dạng. Ứng tuyển nhanh chóng chỉ với 1 click.
- **Quản lý Tuyển dụng**: Nhà tuyển dụng dễ dàng đăng tin, quản lý danh sách ứng viên và hồ sơ ứng tuyển.
- **Hội viên (Subscription)**: Hệ thống các gói cước (Basic/Pro/Enterprise) giúp mở rộng hạn mức xem hồ sơ và đăng tin.
- **Thanh toán Trực tuyến**: Tích hợp cổng thanh toán VNPay (Sandbox) để nâng cấp tài khoản tự động và an toàn.
- **Thông báo Real-time**: Nhận thông báo tức thì (SignalR) khi có người ứng tuyển, duyệt tin hoặc xác nhận thanh toán.
- **Hệ thống Admin**: Bảng quản trị toàn diện dành cho Admin để quản lý Người dùng, Tin tuyển dụng và Gói dịch vụ.
- **Bảo mật & Trải nghiệm**: Đăng nhập bằng Google, xác thực Email (SMTP) và hiệu ứng giao diện mượt mà (Framer Motion).

---

## 🐳 Hướng dẫn chạy nhanh bằng Docker (KHUYÊN DÙNG)

> [!IMPORTANT]
> **Ưu điểm khi dùng Docker**: Tự động cấu hình Nginx để tránh lỗi CORS. Cả Frontend và Backend sẽ chạy chung một domain ảo, giúp việc tích hợp thanh toán (Ngrok) trở nên cực kỳ đơn giản.

### 1. Khởi động hệ thống
Mở terminal tại thư mục gốc và chạy:
```bash
docker-compose up --build
```

### 2. Kiến trúc hệ thống qua Docker
```mermaid
graph TD
    User((Người dùng)) -->|Truy cập| Ngrok[Ngrok Tunnel Static Domain]
    Ngrok -->|Forward port 80| Nginx[Nginx Container]
    Nginx -->|Serve Static| UI[React SPA]
    Nginx -->|Proxy /api| Backend[WebAPI - ASP.NET Container]
    Backend -->|CRUD| DB[(PostgreSQL)]
    
    MoMo[MoMo Server] -->|Webhook/IPN| Ngrok
    VNPay[VNPay Server] -->|IPN| Ngrok
```

---

## 🏗 Thiết lập thủ công (Manual Setup)

### 1. Yêu cầu hệ thống
- [.NET SDK 9.0](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js (LTS)](https://nodejs.org/en)

### 2. Thiết lập Backend (WebTimViec.Api)
1. `cd WebTimViec.Api`
2. `dotnet run` (Chạy tại `http://localhost:5281`)

### 3. Thiết lập Frontend (WebTimViec.Web)
1. `cd WebTimViec.Web`
2. `npm install && npm run dev` (Chạy tại `http://localhost:5173`)

---

## 💳 Hướng dẫn Test Thanh toán (Môi trường Sandbox)

Để test tính năng nâng cấp gói hội viên (Pro/Pro Max), bạn sử dụng các thông tin sau:

### VNPay Sandbox (ATM Nội địa / NCB)
- **Ngân hàng**: Chọn ngân hàng **NCB**
- **Số thẻ**: `9704198526191432198`
- **Tên chủ thẻ**: `NGUYEN VAN A`
- **Ngày phát hành**: `07/15`
- **Mã OTP**: `123456`

### 3. Lưu ý về Ngrok (Quan trọng)
Khi test VNPay IPN (xác nhận thanh toán tự động), bạn **nên** sử dụng Ngrok để server VNPay có thể gọi được App của bạn ở local.

---

## 🚀 Hướng dẫn Triển khai Production (VPS/Server)

Để triển khai HelperHub lên môi trường thực tế, bạn thực hiện các bước sau:

### 1. Chuẩn bị VPS & Domain
- Cài đặt **Docker** và **Docker Compose** lên VPS.
- Trỏ Domain (VD: `helperhub.com`) về IP của VPS.

### 2. Thiết lập Biến môi trường
- Trên máy chủ, tạo file `.env` từ `.env.example`.
- Thay đổi `AllowedOrigins` (Backend) và `VITE_API_URL` (Frontend) từ localhost thành Domain thực tế của bạn.
- Cập nhật thông tin **VNPay Thật** (nếu có) thay cho Sandbox.

### 3. Build & Run với Docker
Mở terminal tại thư mục gốc của dự án trên VPS:
```bash
docker-compose --file docker-compose.yml up -d --build
```
Hệ thống sẽ tự động chạy Backend, Frontend và Database ở chế độ ngầm (detached).

### 4. Cấu hình SSL (HTTPS)
- Sử dụng **Nginx Proxy Manager** hoặc **Let's Encrypt** để cấp chứng chỉ SSL miễn phí.
- Truy cập vào website qua `https://` để đảm bảo bảo mật và tính năng Google Login hoạt động tốt.

---

## 🛡 Tài khoản Demo (Admin/Roles)
- **Quản trị viên (Admin)**: `admin@webtimviec.com` | `Password123!`
- **Ứng viên (Candidate)**: `worker_1@example.com` | `Password123!`
- **Nhà tuyển dụng (Employer)**: `employer_1@example.com` | `Password123!`
- **User thường**: `user@example.com` | `Password123!`

---

## 📂 Tài liệu chi tiết
- [Huớng dẫn Test Thanh toán chuyên sâu](README_PAYMENT_TEST.md)

---
*Phát triển bởi đội ngũ HelperHub. Chúc bạn tuyển dụng thành công!*
