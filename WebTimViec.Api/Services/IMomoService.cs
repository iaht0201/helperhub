using WebTimViec.Api.DTOs;

namespace WebTimViec.Api.Services
{
    public interface IMomoService
    {
        Task<MomoCreatePaymentResponse?> SendPaymentRequest(string orderId, long amount, string orderInfo, string extraData);
        bool ValidateIPN(MomoIPNRequest request);
    }
}
