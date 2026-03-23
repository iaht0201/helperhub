using System.Text.Json.Serialization;

namespace WebTimViec.Api.DTOs
{
    public class SePayWebhookRequest
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("gateway")]
        public string? Gateway { get; set; }

        [JsonPropertyName("transaction_date")]
        public string? TransactionDate { get; set; }

        [JsonPropertyName("account_number")]
        public string? AccountNumber { get; set; }

        [JsonPropertyName("amount_in")]
        public decimal AmountIn { get; set; }

        [JsonPropertyName("amount_out")]
        public decimal AmountOut { get; set; }

        [JsonPropertyName("accumulated_balance")]
        public decimal AccumulatedBalance { get; set; }

        [JsonPropertyName("code")]
        public string? Code { get; set; }

        [JsonPropertyName("content")]
        public string? Content { get; set; } 

        [JsonPropertyName("reference_number")]
        public string? ReferenceNumber { get; set; }

        [JsonPropertyName("body")]
        public string? Body { get; set; }
    }
}
