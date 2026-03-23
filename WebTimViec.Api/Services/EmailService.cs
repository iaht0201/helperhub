using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace WebTimViec.Api.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string htmlMessage)
        {
            try
            {
                var host = _configuration["SmtpSettings:Host"] ?? "smtp.gmail.com";
                var port = int.Parse(_configuration["SmtpSettings:Port"] ?? "587");
                var user = _configuration["SmtpSettings:User"] ?? "your_email@gmail.com";
                var pass = _configuration["SmtpSettings:Password"] ?? "your_app_password";
                var enableSsl = bool.Parse(_configuration["SmtpSettings:EnableSsl"] ?? "true");

                var client = new SmtpClient(host, port)
                {
                    Credentials = new NetworkCredential(user, pass),
                    EnableSsl = enableSsl
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(user, "HelperHub Admin"),
                    Subject = subject,
                    Body = htmlMessage,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(to);

                // Try to send real email only if explicitly configured, otherwise log and "mock" handle it
                if (user != "your_email@gmail.com")
                {
                    await client.SendMailAsync(mailMessage);
                    _logger.LogInformation("Email sent successfully to {to}", to);
                }
                else
                {
                    _logger.LogWarning("Mock Email (Since SMTP not configured):\nTo: {to}\nSubject: {subject}\nBody: {body}", to, subject, htmlMessage);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email to {to}", to);
                throw;
            }
        }
    }
}
