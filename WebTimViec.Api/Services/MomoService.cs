using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using WebTimViec.Api.DTOs;

namespace WebTimViec.Api.Services
{
    public class MomoService : IMomoService
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public MomoService(IConfiguration config, HttpClient httpClient)
        {
            _config = config;
            _httpClient = httpClient;
        }

        public async Task<MomoCreatePaymentResponse?> SendPaymentRequest(string orderId, long amount, string orderInfo, string extraData)
        {
            var partnerCode = _config["MomoSettings:PartnerCode"] ?? "MOMOBKUN20180529";
            var accessKey = _config["MomoSettings:AccessKey"];
            var secretKey = _config["MomoSettings:SecretKey"];
            var endpoint = _config["MomoSettings:Endpoints:Create"] ?? "https://test-payment.momo.vn/v2/gateway/api/create";
            var requestId = orderId; // Match orderId
            var requestType = "captureWallet";
            var redirectUrl = "http://localhost:5173/payment-success"; 
            var ipnUrl = "https://joint-honest-lark.ngrok-free.app/api/webhook/momo-ipn"; 
            var localExtraData = extraData ?? ""; 
            var localOrderInfo = orderInfo ?? ""; 

            if (string.IsNullOrEmpty(accessKey) || string.IsNullOrEmpty(secretKey))
            {
                throw new Exception("MoMo AccessKey or SecretKey is missing in configuration.");
            }

            // FIXED ORDER AS PER MoMo SPEC (WITH accessKey)
            var rawSignature =
                $"accessKey={accessKey}" +
                $"&amount={amount}" +
                $"&extraData={localExtraData}" +
                $"&ipnUrl={ipnUrl}" +
                $"&orderId={orderId}" +
                $"&orderInfo={localOrderInfo}" +
                $"&partnerCode={partnerCode}" +
                $"&redirectUrl={redirectUrl}" +
                $"&requestId={requestId}" +
                $"&requestType={requestType}";

            var signature = HmacSha256(rawSignature, secretKey ?? "");

            // DEBUG LOGS - VERY DETAILED
            Console.WriteLine("------------------- MOMO SIGNATURE DEBUG -------------------");
            Console.WriteLine("PARTNER CODE: " + partnerCode);
            Console.WriteLine("ACCESS KEY  : " + accessKey);
            Console.WriteLine("SECRET KEY  : " + secretKey);
            Console.WriteLine("RAW STRING  : " + rawSignature);
            Console.WriteLine("SIGNATURE   : " + signature);
            Console.WriteLine("------------------------------------------------------------");

            var requestBody = new MomoPaymentRequest
            {
                PartnerCode = partnerCode,
                AccessKey = accessKey ?? "",
                RequestId = requestId,
                Amount = amount,
                OrderId = orderId,
                OrderInfo = localOrderInfo,
                RedirectUrl = redirectUrl,
                IpnUrl = ipnUrl,
                ExtraData = localExtraData,
                RequestType = requestType,
                Signature = signature
            };

            var content = new StringContent(JsonSerializer.Serialize(requestBody, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(endpoint, content);
            
            var body = await response.Content.ReadAsStringAsync();
            if (response.IsSuccessStatusCode)
            {
                return JsonSerializer.Deserialize<MomoCreatePaymentResponse>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            else
            {
                // Log detailed error from MoMo to Console
                Console.WriteLine("MoMo Error Response: " + body);
            }

            return null;
        }

        public bool ValidateIPN(MomoIPNRequest request)
        {
            var accessKey = _config["MomoSettings:AccessKey"] ?? "";
            var secretKey = _config["MomoSettings:SecretKey"] ?? "";

            var rawSignature = $"accessKey={accessKey}&amount={request.Amount}&extraData={request.ExtraData}&message={request.Message}&orderId={request.OrderId}&orderInfo={request.OrderInfo}&orderType={request.OrderType}&partnerCode={request.PartnerCode}&requestId={request.RequestId}&responseTime={request.ResponseTime}&resultCode={request.ResultCode}&transId={request.TransId}";
            var signature = HmacSha256(rawSignature, secretKey);

            return signature == request.Signature;
        }

        private string HmacSha256(string message, string key)
        {
            byte[] keyByte = Encoding.UTF8.GetBytes(key);
            byte[] messageBytes = Encoding.UTF8.GetBytes(message);
            using (var hmacsha256 = new HMACSHA256(keyByte))
            {
                byte[] hashmessage = hmacsha256.ComputeHash(messageBytes);
                return BitConverter.ToString(hashmessage).Replace("-", "").ToLower();
            }
        }
    }
}
