using System.ComponentModel.DataAnnotations;
using Newtonsoft.Json;

namespace Trend.API.Models
{
    public class TransactionRule
    {
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTime DateTimeWhenRecorded { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime GenerateFromDate { get; set; }
        public DateTime? EndDate { get; set; }
        [Range(1, 1000)]
        public int RecurrenceInterval { get; set; } = 1;
        [Required]
        public string RecurrenceUnit { get; set; } = RecurrenceUnits.Months;
        public bool UseMonthEnd { get; set; }
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
        public List<Category> Categories
        {
            get => Details.Categories;
            set => Details.Categories = value ?? new List<Category>();
        }
        public bool IsInactive { get; set; }
    }

    public static class RecurrenceUnits
    {
        public const string Days = "days";
        public const string Weeks = "weeks";
        public const string Months = "months";
    }
}