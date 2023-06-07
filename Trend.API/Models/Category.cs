using Newtonsoft.Json;

namespace Trend.API.Models
{
    public class Category
    {
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public bool IsIncome { get; set; }
        public int Weighting { get; set; }
    }
}
