using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;

namespace WebTimViec.Api.Services
{
    public class VnPayService : IVnPayService
    {
        private readonly IConfiguration _configuration;

        public VnPayService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string CreatePaymentUrl(string txnRef, decimal amount, string orderInfo, string ipAddress)
        {
            var vnpUrl = _configuration["VnPaySettings:BaseUrl"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
            var vnpReturnUrl = _configuration["VnPaySettings:ReturnUrl"] ?? "";
            var vnpTmnCode = _configuration["VnPaySettings:TmnCode"] ?? "";
            var vnpHashSecret = _configuration["VnPaySettings:HashSecret"] ?? "";
            var vnpVersion = _configuration["VnPaySettings:Version"] ?? "2.1.0";

            var vnpData = new SortedList<string, string>(new VnPayComparer());
            vnpData.Add("vnp_Version", vnpVersion);
            vnpData.Add("vnp_Command", "pay");
            vnpData.Add("vnp_TmnCode", vnpTmnCode);
            vnpData.Add("vnp_Amount", ((long)(amount * 100)).ToString()); 
            vnpData.Add("vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss"));
            vnpData.Add("vnp_CurrCode", "VND");
            
            if (string.IsNullOrEmpty(ipAddress) || ipAddress == "::1") 
                ipAddress = "127.0.0.1";
            vnpData.Add("vnp_IpAddr", ipAddress);
            vnpData.Add("vnp_Locale", "vi");
            vnpData.Add("vnp_OrderInfo", orderInfo);
            vnpData.Add("vnp_OrderType", "billpayment");
            vnpData.Add("vnp_ReturnUrl", vnpReturnUrl);
            vnpData.Add("vnp_TxnRef", txnRef);

            var queryBuilder = new StringBuilder();
            foreach (var kv in vnpData)
            {
                if (!string.IsNullOrEmpty(kv.Value))
                {
                    // Use WebUtility.UrlEncode to match Demo behavior (encodes space as +)
                    queryBuilder.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                }
            }

            string queryString = queryBuilder.ToString();
            string baseUrlWithQuery = vnpUrl + "?" + queryString;
            
            // Sign data is exactly the query string WITHOUT the last '&'
            string signData = queryString;
            if (signData.Length > 0)
            {
                signData = signData.Remove(signData.Length - 1, 1);
            }

            string vnpSecureHash = HmacSha512(vnpHashSecret, signData);
            string paymentUrl = baseUrlWithQuery + "vnp_SecureHash=" + vnpSecureHash;
            
            System.IO.File.AppendAllText("/tmp/vnpay_debug.log", $"[{DateTime.Now}] URL: {paymentUrl}\nSignData: {signData}\n\n");

            return paymentUrl;
        }

        public bool ValidateSignature(string secureHash, IQueryCollection query)
        {
            var vnpHashSecret = _configuration["VnPaySettings:HashSecret"] ?? "";
            var vnpData = new SortedList<string, string>(new VnPayComparer());

            foreach (var kv in query)
            {
                if (!string.IsNullOrEmpty(kv.Key) && kv.Key.StartsWith("vnp_") && kv.Key != "vnp_SecureHash")
                {
                    vnpData.Add(kv.Key, kv.Value.ToString());
                }
            }

            var hashBuilder = new StringBuilder();
            foreach (var kv in vnpData)
            {
                if (!string.IsNullOrEmpty(kv.Value))
                {
                    hashBuilder.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                }
            }

            string rawData = hashBuilder.ToString();
            if (rawData.Length > 0)
            {
                rawData = rawData.Remove(rawData.Length - 1, 1);
            }

            string calculatedHash = HmacSha512(vnpHashSecret, rawData);
            
            return calculatedHash.Equals(secureHash, StringComparison.InvariantCultureIgnoreCase);
        }

        private string HmacSha512(string key, string inputData)
        {
            var hash = new StringBuilder();
            byte[] keyBytes = Encoding.UTF8.GetBytes(key);
            byte[] inputBytes = Encoding.UTF8.GetBytes(inputData);
            using (var hmac = new HMACSHA512(keyBytes))
            {
                byte[] hashValue = hmac.ComputeHash(inputBytes);
                foreach (var theByte in hashValue)
                {
                    // Use lowercase "x2" to match Demo behavior
                    hash.Append(theByte.ToString("x2"));
                }
            }
            return hash.ToString();
        }
    }

    public class VnPayComparer : IComparer<string?>
    {
        public int Compare(string? x, string? y)
        {
            if (x == y) return 0;
            if (x == null) return -1;
            if (y == null) return 1;
            // Use Ordinal comparison to match Demo behavior
            var vnpCompare = CompareInfo.GetCompareInfo("en-US");
            return vnpCompare.Compare(x, y, CompareOptions.Ordinal);
        }
    }
}
