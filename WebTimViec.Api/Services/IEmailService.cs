using System.Threading.Tasks;

namespace WebTimViec.Api.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string htmlMessage);
    }
}
