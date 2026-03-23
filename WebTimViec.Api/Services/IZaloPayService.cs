using WebTimViec.Api.DTOs;

namespace WebTimViec.Api.Services
{
    public interface IZaloPayService
    {
        Task<ZaloPayCreateOrderResponse?> CreateOrder(string appTransId, long amount, string description, string appUser, string embedData = "{}", string item = "[]");
        bool ValidateCallback(ZaloPayCallbackRequest request);
    }
}
