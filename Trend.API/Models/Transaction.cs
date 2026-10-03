using Newtonsoft.Json;

namespace Trend.API.Models
{
    public class Transaction
    {
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; } = string.Empty;
        public DateTime DateTimeWhenRecorded { get; set; }
        public DateTime DateOfTransaction { get; set; }
        [JsonIgnore]
        public TransactionDetails Details { get; set; } = new TransactionDetails();
        public decimal Amount
        {
            get => Details.Amount;
            set => Details.Amount = value;
        }
        public string TransactionDescription
        {
            get => Details.TransactionDescription;
            set => Details.TransactionDescription = value;
        }
        public string UserId { get; set; } = string.Empty;
        // support legacy transactions without a RecurringStatus
        public string RecurringStatus { get; set; } = RecurringStatuses.NonRecurring;
        public string? TransactionRuleId { get; set; }
        public DateTime? ScheduledOccurrenceDate { get; set; }
        public List<Category> Categories
        {
            get => Details.Categories;
            set => Details.Categories = value ?? new List<Category>();
        }
    }

    public static class RecurringStatuses
    {
        public const string NonRecurring = "NonRecurring";
        public const string Pending = "Pending";
        public const string Accepted = "Accepted";
        public const string Skipped = "Skipped";
        public const string Posted = "Posted";

        public static bool IsValid(string? status) =>
            status == NonRecurring || status == Pending || status == Accepted ||
            status == Skipped || status == Posted;

        public static bool IsPosted(string? status) =>
            status == NonRecurring || status == Accepted;
    }
}
