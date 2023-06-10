using Newtonsoft.Json;

namespace Trend.API.Models
{
    public class Transaction
    {
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; } = string.Empty;
        public DateTime DateTimeWhenRecorded { get; set; }
        public DateTime DateOfTransaction { get; set; }
        public decimal Amount { get; set; }
        public string TransactionDescription { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        // new here guarantees the category list will never be null (though it may be empty)
        public List<Category> Categories { get; set; } = new List<Category>(); 
    }
}
