using Trend.API.Models;

namespace Trend.API.Filters
{
    public class TransactionFilters
    {
        // https://stackoverflow.com/questions/5541234/creating-dynamic-queries-with-entity-framework
        public bool DateFilter { get; set; }
        public DateTime DateOldest { get; set; }
        public DateTime DateLatest { get; set; }

        public bool CategoryFilter { get; set; }
        public List<int> SelectedCategoryIds{ get; set; }

        public IQueryable<Transaction> GetTransactionQuery(TrendDbContext dbContext)
        {
            IQueryable<Transaction> query = dbContext.Set<Transaction>();

            if (DateFilter)
                query = query
                .Where(t => DateTime.Compare(t.DateOfTransaction, DateOldest) >= 0)
                .Where(t => DateTime.Compare(t.DateOfTransaction, DateLatest) <= 0);

            if (CategoryFilter)
                query = query
                .Where(t => SelectedCategoryIds.Contains( t.CategoryId) );

            return query;
        }
    }
}
