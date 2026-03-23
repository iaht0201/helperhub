using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using WebTimViec.Api.DTOs;

namespace WebTimViec.Api.Services
{
    public class ZaloPayService : IZaloPayService
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public ZaloPayService(IConfiguration config, HttpClient httpClient)
        {
            _config = config;
            _httpClient = httpClient;
        }

        public async Task<ZaloPayCreateOrderResponse?> CreateOrder(string appTransId, long amount, string description, string appUser, string embedData = "{}", string item = "[]")
        {
            var appId = _config["ZaloPaySettings:AppId"] ?? "2553";
            var key1 = _config["ZaloPaySettings:Key1"] ?? "sdng6937S9U935390U";
            var endpoint = _config["ZaloPaySettings:Endpoint"] ?? "https://sb-openapi.zalopay.vn/v2/create";
            var callbackUrl = _config["ZaloPaySettings:CallbackUrl"] ?? "https://joint-honest-lark.ngrok-free.app/api/webhook/zalopay-ipn";
            
            var appTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            
            // Build data string for signature: appId|appTransId|appUser|amount|appTime|embedData|item
            var dataLine = $"{appId}|{appTransId}|{appUser}|{amount}|{appTime}|{embedData}|{item}";
            var mac = HmacSha256(dataLine, key1);

            var requestBody = new ZaloPayCreateOrderRequest
            {
                AppId = int.Parse(appId),
                AppTransId = appTransId,
                AppUser = appUser,
                AppTime = appTime,
                Amount = amount,
                Item = item,
                EmbedData = embedData,
                Description = description,
                Mac = mac,
                CallbackUrl = callbackUrl
            };

            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            
            Console.WriteLine("[ZaloPay Request] " + JsonSerializer.Serialize(requestBody));
            
            var response = await _httpClient.PostAsync(endpoint, content);
            
            var responseBody = await response.Content.ReadAsStringAsync();
            Console.WriteLine("[ZaloPay Response] " + responseBody);
            
            return JsonSerializer.Deserialize<ZaloPayCreateOrderResponse>(responseBody);
        }

        public bool ValidateCallback(ZaloPayCallbackRequest request)
        {
            var key2 = _config["ZaloPaySettings:Key2"] ?? "tr673s72G0628290G";
            var expectedMac = HmacSha256(request.Data, key2);
            return request.Mac == expectedMac;
        }

        private string HmacSha256(string message, string key)
        {
            byte[] keyBytes = Encoding.UTF8.GetBytes(key);
            byte[] messageBytes = Encoding.UTF8.GetBytes(message);
            using (var hmacsha256 = new HMACSHA256(keyBytes))
            {
                byte[] hashBytes = hmacsha256.ComputeHash(messageBytes);
                return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
            }
        }
    }
}
