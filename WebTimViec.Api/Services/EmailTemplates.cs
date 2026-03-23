using System;

namespace WebTimViec.Api.Services
{
    public static class EmailTemplates
    {
        public static string GetVerificationEmail(string fullName, string verifyUrl)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }}
        .wrapper {{ width: 100%; table-layout: fixed; background-color: #f4f7f9; padding-bottom: 40px; }}
        .main {{ background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #1f2937; border-radius: 16px; overflow: hidden; margin-top: 40px; }}
        .header {{ background-color: #ea580c; padding: 40px 20px; text-align: center; }}
        .header h1 {{ margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; text-transform: uppercase; letter-spacing: -1px; }}
        .header h1 span {{ color: #18181b; }}
        .content {{ padding: 40px 30px; text-align: center; }}
        .content h2 {{ font-size: 24px; color: #111827; margin-top: 0; font-weight: 700; }}
        .content p {{ font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 30px; }}
        .cta-container {{ padding: 20px 0 40px; }}
        .cta-button {{ 
            background-color: #ea580c; 
            color: #ffffff !important; 
            padding: 18px 36px; 
            text-decoration: none; 
            font-size: 14px; 
            font-weight: bold; 
            border-radius: 12px; 
            display: inline-block;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.2);
        }}
        .footer {{ padding: 30px; text-align: center; font-size: 12px; color: #9ca3af; line-height: 1.5; }}
        .divider {{ border-top: 1px solid #f3f4f6; margin: 20px 0; }}
    </style>
</head>
<body>
    <center class='wrapper'>
        <table class='main'>
            <tr>
                <td class='header'>
                    <h1>Helper<span>Hub</span></h1>
                </td>
            </tr>
            <tr>
                <td class='content'>
                    <h2>Chào mừng {fullName}!</h2>
                    <p>Cảm ơn bạn đã tin tưởng và lựa chọn <strong>HelperHub</strong>. <br/> Chúng tôi rất vui mừng được hỗ trợ bạn kết nối và tìm kiếm những cơ hội tuyệt vời nhất.</p>
                    <p>Để hoàn tất đăng ký và bắt đầu trải nghiệm, vui lòng xác nhận địa chỉ email của bạn bằng cách nhấn vào nút bên dưới:</p>
                    <div class='cta-container'>
                        <a href='{verifyUrl}' class='cta-button'>Xác nhận Email</a>
                    </div>
                    <div class='divider'></div>
                    <p style='font-size: 13px;'>Nếu nút phía trên không hoạt động, bạn có thể sao chép và dán đường dẫn sau vào trình duyệt:</p>
                    <p style='font-size: 11px; color: #9ca3af; word-break: break-all;'>{verifyUrl}</p>
                </td>
            </tr>
            <tr>
                <td class='footer'>
                    &copy; {DateTime.Now.Year} HelperHub Việt Nam. <br/>
                    Nền tảng kết nối nhân sự giúp việc chuyên nghiệp. <br/>
                    Bạn nhận được email này vì đã đăng ký tài khoản trên HelperHub.
                </td>
            </tr>
        </table>
    </center>
</body>
</html>";
        }
    }
}
