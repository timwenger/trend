using System.Net;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Cosmos.Linq;
using Trend.API.Models;

namespace Trend.API.Services
{
    public class TransactionRuleService
    {
        private readonly Container transactionRulesContainer;
        private readonly Container transactionsContainer;

        public TransactionRuleService(TrendDbContext dbContext)
        {
            transactionRulesContainer = dbContext.GetContainer("TransactionRules");
            transactionsContainer = dbContext.GetContainer("Transactions");
        }

        public async Task<List<TransactionRule>> GetRulesAsync(string userId)
        {
            using FeedIterator<TransactionRule> feed = transactionRulesContainer
                .GetItemLinqQueryable<TransactionRule>()
                .Where(rule => rule.UserId == userId)
                .ToFeedIterator();

            return await ReadAllAsync(feed);
        }

        public async Task<TransactionRule?> GetRuleAsync(string id)
        {
            try
            {
                return await transactionRulesContainer.ReadItemAsync<TransactionRule>(id, new PartitionKey(id));
            }
            catch (CosmosException exception) when (exception.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }
        }

        public async Task<TransactionRule> CreateRuleAsync(TransactionRule rule)
        {
            return await transactionRulesContainer.CreateItemAsync(rule, new PartitionKey(rule.Id));
        }

        public async Task ReplaceRuleAsync(TransactionRule rule)
        {
            await transactionRulesContainer.ReplaceItemAsync(rule, rule.Id, new PartitionKey(rule.Id));
        }

        public async Task DeleteRuleAsync(TransactionRule rule)
        {
            await DeletePendingForRuleAsync(rule.UserId, rule.Id);
            await transactionRulesContainer.DeleteItemAsync<TransactionRule>(rule.Id, new PartitionKey(rule.Id));
        }

        public async Task<int> GeneratePendingAsync(
            string userId,
            DateTime throughDate,
            TransactionRule? targetRule = null)
        {
            IEnumerable<TransactionRule> rules;
            if (targetRule == null)
                rules = await GetRulesAsync(userId);
            else
                rules = new[] { targetRule };

            int createdCount = 0;

            foreach (TransactionRule rule in rules.Where(rule => !rule.IsInactive))
            {
                DateTime? latestOccurrence = await GetLatestScheduledOccurrenceDateAsync(rule);
                createdCount += await GeneratePendingForRuleAsync(rule, throughDate, latestOccurrence);
            }

            return createdCount;
        }

        public async Task<int> RecalculatePendingForRuleAsync(TransactionRule rule, DateTime throughDate)
        {
            await DeletePendingForRuleAsync(rule.UserId, rule.Id);
            return rule.IsInactive ? 0 : await GeneratePendingForRuleAsync(rule, throughDate);
        }

        public async Task DeletePendingForRuleAsync(string userId, string ruleId)
        {
            using FeedIterator<Transaction> feed = transactionsContainer
                .GetItemLinqQueryable<Transaction>()
                .Where(transaction =>
                    transaction.UserId == userId &&
                    transaction.TransactionRuleId == ruleId &&
                    transaction.RecurringStatus == RecurringStatuses.Pending)
                .ToFeedIterator();

            foreach (Transaction pending in await ReadAllAsync(feed))
                await transactionsContainer.DeleteItemAsync<Transaction>(pending.Id, new PartitionKey(pending.Id));
        }

        private async Task<DateTime?> GetLatestScheduledOccurrenceDateAsync(TransactionRule rule)
        {
            using FeedIterator<DateTime?> feed = transactionsContainer
                .GetItemLinqQueryable<Transaction>()
                .Where(transaction =>
                    transaction.UserId == rule.UserId &&
                    transaction.TransactionRuleId == rule.Id &&
                    transaction.ScheduledOccurrenceDate != null)
                .OrderByDescending(transaction => transaction.ScheduledOccurrenceDate)
                .Select(transaction => transaction.ScheduledOccurrenceDate)
                .Take(1)
                .ToFeedIterator();

            List<DateTime?> dates = await ReadAllAsync(feed);
            return dates.Count == 0 ? null : dates[0];
        }

        private async Task<int> GeneratePendingForRuleAsync(
            TransactionRule rule,
            DateTime throughDate,
            DateTime? afterDate = null)
        {
            int createdCount = 0;
            foreach (DateTime dueDate in RecurrenceCalculator.GetDueDates(rule, throughDate, afterDate))
            {
                Transaction pending = new()
                {
                    Id = $"{rule.Id}:{dueDate:yyyyMMdd}",
                    UserId = rule.UserId,
                    DateTimeWhenRecorded = DateTime.UtcNow,
                    DateOfTransaction = dueDate,
                    Details = new TransactionDetails
                    {
                        Amount = rule.Amount,
                        TransactionDescription = rule.TransactionDescription,
                        Categories = new List<Category>(rule.Categories),
                    },
                    RecurringStatus = RecurringStatuses.Pending,
                    TransactionRuleId = rule.Id,
                    ScheduledOccurrenceDate = dueDate,
                };

                try
                {
                    await transactionsContainer.CreateItemAsync(pending, new PartitionKey(pending.Id));
                    createdCount++;
                }
                catch (CosmosException exception) when (exception.StatusCode == HttpStatusCode.Conflict)
                {
                    // Accepted, skipped, or existing pending occurrences retain the deterministic ID.
                }
            }

            return createdCount;
        }

        private static async Task<List<T>> ReadAllAsync<T>(FeedIterator<T> feed)
        {
            List<T> items = new();
            while (feed.HasMoreResults)
                items.AddRange(await feed.ReadNextAsync());
            return items;
        }
    }
}