namespace Trend.API.Models
{
    public class TransactionDetails
    {
        public decimal Amount { get; set; }
        public string TransactionDescription { get; set; } = string.Empty;
        public List<Category> Categories { get; set; } = new List<Category>();
    }
}