using System;

namespace WebTimViec.Api.Entities
{
    public class SePaySettings
    {
        public string AccountNumber { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string BankCode { get; set; } = string.Empty;
        public string MerchantId { get; set; } = string.Empty;
    }
}
