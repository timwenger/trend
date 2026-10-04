using Newtonsoft.Json;

namespace Trend.API.Models
{
    public class Category
    {
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public bool? IsIncome { get; set; }
        public bool IsInactive { get; set; }
        public bool IsPinned { get; set; }
        public decimal? ThirtyDayTarget { get; set; }
        public int Weighting { get; set; }

        public string? GetTargetError()
        {
            if (ThirtyDayTarget < 0)
                return "30 day target cannot be negative.";
            if (IsIncome == null && ThirtyDayTarget != null)
                return "30 day target is only available for Income or Expense categories.";

            return null;
        }

        public static string? GetSelectionError(IReadOnlyCollection<Category>? categories)
        {
            if (categories == null || categories.Count == 0)
                return "Select at least one category.";

            bool hasIncome = categories.Any(category => category.IsIncome == true);
            bool hasExpense = categories.Any(category => category.IsIncome == false);
            if (hasIncome && hasExpense)
                return "Income and Expense categories cannot be combined.";
            if (!hasIncome && !hasExpense)
                return "An Either category must be accompanied by an Income or Expense category.";

            return null;
        }
    }
}
