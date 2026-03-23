namespace WebTimViec.Api.Services
{
    public interface IVnPayService
    {
        string CreatePaymentUrl(string txnRef, decimal amount, string orderInfo, string ipAddress);
        bool ValidateSignature(string secureHash, IQueryCollection query);
    }
}
