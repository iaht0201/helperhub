using System.Text.Json.Serialization;

namespace WebTimViec.Api.DTOs
{
    public class ZaloPayCreateOrderRequest
    {
        [JsonPropertyName("app_id")]
        public int AppId { get; set; }

        [JsonPropertyName("app_trans_id")]
        public string AppTransId { get; set; } = string.Empty;

        [JsonPropertyName("app_user")]
        public string AppUser { get; set; } = string.Empty;

        [JsonPropertyName("app_time")]
        public long AppTime { get; set; }

        [JsonPropertyName("amount")]
        public long Amount { get; set; }

        [JsonPropertyName("item")]
        public string Item { get; set; } = "[]";

        [JsonPropertyName("embed_data")]
        public string EmbedData { get; set; } = "{}";

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("bank_code")]
        public string BankCode { get; set; } = "zalopayapp";

        [JsonPropertyName("mac")]
        public string Mac { get; set; } = string.Empty;
        
        [JsonPropertyName("callback_url")]
        public string CallbackUrl { get; set; } = string.Empty;
    }

    public class ZaloPayCreateOrderResponse
    {
        [JsonPropertyName("return_code")]
        public int ReturnCode { get; set; }

        [JsonPropertyName("return_message")]
        public string ReturnMessage { get; set; } = string.Empty;

        [JsonPropertyName("sub_return_code")]
        public int SubReturnCode { get; set; }

        [JsonPropertyName("sub_return_message")]
        public string SubReturnMessage { get; set; } = string.Empty;

        [JsonPropertyName("order_url")]
        public string OrderUrl { get; set; } = string.Empty;

        [JsonPropertyName("zp_trans_token")]
        public string ZpTransToken { get; set; } = string.Empty;
    }

    public class ZaloPayCallbackRequest
    {
        [JsonPropertyName("data")]
        public string Data { get; set; } = string.Empty;

        [JsonPropertyName("mac")]
        public string Mac { get; set; } = string.Empty;
    }

    public class ZaloPayCallbackData
    {
        [JsonPropertyName("app_id")]
        public int AppId { get; set; }

        [JsonPropertyName("app_trans_id")]
        public string AppTransId { get; set; } = string.Empty;

        [JsonPropertyName("app_time")]
        public long AppTime { get; set; }

        [JsonPropertyName("app_user")]
        public string AppUser { get; set; } = string.Empty;

        [JsonPropertyName("amount")]
        public long Amount { get; set; }

        [JsonPropertyName("embed_data")]
        public string EmbedData { get; set; } = string.Empty;

        [JsonPropertyName("item")]
        public string Item { get; set; } = string.Empty;

        [JsonPropertyName("zp_trans_id")]
        public long ZpTransId { get; set; }

        [JsonPropertyName("server_time")]
        public long ServerTime { get; set; }

        [JsonPropertyName("channel")]
        public int Channel { get; set; }

        [JsonPropertyName("merchant_user_id")]
        public string MerchantUserId { get; set; } = string.Empty;

        [JsonPropertyName("user_fee_amount")]
        public long UserFeeAmount { get; set; }

        [JsonPropertyName("discount_amount")]
        public long DiscountAmount { get; set; }
    }
}
