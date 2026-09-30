using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Cosmos.Linq;
using System.Linq.Expressions;
using Trend.API.Models;

namespace Trend.API.Filters
{
    public enum SearchMatchMode
    {
        All,
        Any
    }

    public class TransactionFilters
    {
        public bool DateFilter { get; set; }
        public DateTime DateOldest { get; set; }
        public DateTime DateLatest { get; set; }
        public bool CategoryFilter { get; set; }
        public List<string>? SelectedCategoryIds { get; set; }
        public string? SearchText { get; set; }
        public SearchMatchMode Match { get; set; } = SearchMatchMode.All;

        public FeedIterator<Transaction> GetFeedIterator(Container TransactionsContainer, string userId)
        {
            var queryable = TransactionsContainer.GetItemLinqQueryable<Transaction>();

            var query = queryable.Where(t => t.UserId == userId);
            var filterPredicate = BuildPredicate();
            if (filterPredicate != null)
                query = query.Where(filterPredicate);

            return query.ToFeedIterator();
        }

        public Expression<Func<Transaction, bool>>? BuildPredicate()
        {
            List<Expression<Func<Transaction, bool>>> filterGroups = new();

            // in case the t.DateOfTransaction was recorded with hours and minutes too, it won't compare
            // correctly with the DateLatest, which has no hours, minutes, so it compares it to midnight.
            // instead, we compare less than the next day.
            DateTime dateLatestExclusive = DateLatest.AddDays(1);
            if (DateFilter)
                filterGroups.Add(t => t.DateOfTransaction >= DateOldest && t.DateOfTransaction < dateLatestExclusive);

            if (CategoryFilter && SelectedCategoryIds is { Count: > 0 })
            {
                List<Expression<Func<Transaction, bool>>> categoryConditions = new();
                foreach (string categoryId in SelectedCategoryIds.Distinct())
                {
                    string selectedCategoryId = categoryId;
                    categoryConditions.Add(t => t.Categories.Any(c => c.Id == selectedCategoryId));
                }

                filterGroups.Add(CombineConditions(categoryConditions, Match)!);
            }

            List<Expression<Func<Transaction, bool>>> searchConditions = new();
            foreach (string searchTerm in ParseSearchTerms(SearchText))
            {
                string normalizedTerm = searchTerm.ToLowerInvariant();
                searchConditions.Add(t =>
                    t.TransactionDescription.ToLower().Contains(normalizedTerm) ||
                    t.Categories.Any(c => c.CategoryName.ToLower().Contains(normalizedTerm)));
            }

            if (searchConditions.Count > 0)
                filterGroups.Add(CombineConditions(searchConditions, Match)!);

            return CombineConditions(filterGroups, SearchMatchMode.All);
        }

        private static Expression<Func<Transaction, bool>>? CombineConditions(
            IReadOnlyList<Expression<Func<Transaction, bool>>> conditions,
            SearchMatchMode match)
        {
            if (conditions.Count == 0)
                return null;

            ParameterExpression parameter = Expression.Parameter(typeof(Transaction), "transaction");
            Expression body = ReplaceParameter(conditions[0], parameter);

            foreach (Expression<Func<Transaction, bool>> condition in conditions.Skip(1))
            {
                Expression nextBody = ReplaceParameter(condition, parameter);
                body = match == SearchMatchMode.All
                    ? Expression.AndAlso(body, nextBody)
                    : Expression.OrElse(body, nextBody);
            }

            return Expression.Lambda<Func<Transaction, bool>>(body, parameter);
        }

        public static IReadOnlyList<string> ParseSearchTerms(string? searchText)
        {
            List<string> terms = new();
            if (string.IsNullOrWhiteSpace(searchText))
                return terms;

            int position = 0;
            while (position < searchText.Length)
            {
                while (position < searchText.Length && char.IsWhiteSpace(searchText[position]))
                    position++;

                if (position >= searchText.Length)
                    break;

                bool quoted = searchText[position] == '"';
                if (quoted)
                    position++;

                int start = position;
                while (position < searchText.Length &&
                    (quoted ? searchText[position] != '"' : !char.IsWhiteSpace(searchText[position])))
                    position++;

                string term = searchText[start..position].Trim();
                if (term.Length > 0)
                    terms.Add(term);

                if (quoted && position < searchText.Length && searchText[position] == '"')
                    position++;
            }

            return terms;
        }

        private static Expression ReplaceParameter(
            Expression<Func<Transaction, bool>> expression,
            ParameterExpression parameter)
        {
            return new ParameterReplaceVisitor(expression.Parameters[0], parameter)
                .Visit(expression.Body)!;
        }

        private sealed class ParameterReplaceVisitor(
            ParameterExpression source,
            ParameterExpression target) : ExpressionVisitor
        {
            protected override Expression VisitParameter(ParameterExpression node)
            {
                return node == source ? target : base.VisitParameter(node);
            }
        }
    }
}
