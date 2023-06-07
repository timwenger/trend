using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Cosmos.Linq;
using Trend.API.Models;

namespace Trend.API.Filters
{
    public class TransactionFilters
    {
        public bool DateFilter { get; set; }
        public DateTime DateOldest { get; set; }
        public DateTime DateLatest { get; set; }
        public bool CategoryFilter { get; set; }
        public List<string>? SelectedCategoryIds { get; set; }


        public FeedIterator<Transaction> GetFeedIterator(Container TransactionsContainer, string userId)
        {
            var queryable = TransactionsContainer.GetItemLinqQueryable<Transaction>();

            var query = queryable.Where(t => t.UserId == userId);

            if (DateFilter)
                query = query
                .Where(t => t.DateOfTransaction > DateOldest && t.DateOfTransaction < DateLatest);

            if (CategoryFilter && SelectedCategoryIds != null)
                query = query
                .Where(t => t.Categories.Any(c => SelectedCategoryIds.Contains(c.Id)));

            FeedIterator<Transaction> iterator = query.ToFeedIterator();

            return iterator;
        }
    }
}
