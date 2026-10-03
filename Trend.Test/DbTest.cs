using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Trend.API.Controllers;
using Trend.API.Filters;
using Trend.API.Models;
using Xunit;

namespace Trend.Test
{
    public class TransactionFiltersTest
    {
        [Fact]
        public void ParseSearchTerms_PreservesQuotedPhrases()
        {
            IReadOnlyList<string> terms = TransactionFilters.ParseSearchTerms(" transit  \"monthly pass\" ");

            Assert.Equal(new[] { "transit", "monthly pass" }, terms);
        }

        [Theory]
        [InlineData(SearchMatchMode.All, 1)]
        [InlineData(SearchMatchMode.Any, 3)]
        public void BuildPredicate_AppliesMatchModeWithinSelectedCategories(SearchMatchMode match, int expectedCount)
        {
            var filters = new TransactionFilters
            {
                CategoryFilter = true,
                SelectedCategoryIds = new List<string> { "mpp", "rrsp", "paycheck" },
                Match = match
            };
            Transaction[] transactions =
            {
                CreateTransaction("Combined", "mpp", "rrsp", "paycheck"),
                CreateTransaction("Pension", "mpp"),
                CreateTransaction("Savings", "rrsp"),
                CreateTransaction("Other", "unrelated")
            };

            Transaction[] matches = transactions.Where(filters.BuildPredicate()!.Compile()).ToArray();

            Assert.Equal(expectedCount, matches.Length);
        }

        [Fact]
        public void BuildPredicate_AlwaysIntersectsDateCategoryAndSearchGroups()
        {
            var filters = new TransactionFilters
            {
                DateFilter = true,
                DateOldest = new DateTime(2026, 1, 1),
                DateLatest = new DateTime(2026, 1, 31),
                CategoryFilter = true,
                SelectedCategoryIds = new List<string> { "income" },
                SearchText = "paycheck bonus",
                Match = SearchMatchMode.Any
            };
            Transaction[] transactions =
            {
                CreateTransaction("Paycheck", new DateTime(2026, 1, 15), "income"),
                CreateTransaction("Bonus", new DateTime(2025, 12, 15), "income"),
                CreateTransaction("Paycheck", new DateTime(2026, 1, 15), "expense"),
                CreateTransaction("Coffee", new DateTime(2026, 1, 15), "income")
            };

            Transaction[] matches = transactions.Where(filters.BuildPredicate()!.Compile()).ToArray();

            Assert.Single(matches);
        }

        [Fact]
        public void BuildPredicate_SearchesDescriptionAndCategoryNameCaseInsensitively()
        {
            var filters = new TransactionFilters { SearchText = "bus" };
            Transaction[] transactions =
            {
                CreateTransaction("BUS fare", "travel", "Commuting"),
                CreateTransaction("Monthly pass", "travel", "Bus and train"),
                CreateTransaction("Coffee", "food", "Dining")
            };

            Transaction[] matches = transactions.Where(filters.BuildPredicate()!.Compile()).ToArray();

            Assert.Equal(2, matches.Length);
        }

        [Fact]
        public void MatchesRecurringStatus_DefaultsToPostedTransactions()
        {
            var filters = new TransactionFilters();

            Assert.True(filters.HasValidRecurringStatus());
            Assert.Equal(RecurringStatuses.Posted, filters.RecurringStatus);
            Assert.False(RecurringStatuses.IsValid(null));
            Assert.False(RecurringStatuses.IsPosted(null));
            Assert.True(filters.MatchesRecurringStatus(new Transaction()));
            Assert.True(filters.MatchesRecurringStatus(new Transaction { RecurringStatus = RecurringStatuses.Accepted }));
            Assert.False(filters.MatchesRecurringStatus(new Transaction { RecurringStatus = RecurringStatuses.Pending }));
            Assert.False(filters.MatchesRecurringStatus(new Transaction { RecurringStatus = RecurringStatuses.Skipped }));
        }

        [Fact]
        public void MatchesRecurringStatus_UsesRequestedStatus()
        {
            var filters = new TransactionFilters { RecurringStatus = RecurringStatuses.Pending };

            Assert.True(filters.HasValidRecurringStatus());
            Assert.True(filters.MatchesRecurringStatus(new Transaction { RecurringStatus = RecurringStatuses.Pending }));
            Assert.False(filters.MatchesRecurringStatus(new Transaction { RecurringStatus = RecurringStatuses.Accepted }));
        }

        private static Transaction CreateTransaction(string description, params string[] categoryIds)
        {
            return CreateTransaction(description, default, categoryIds);
        }

        private static Transaction CreateTransaction(
            string description,
            DateTime dateOfTransaction,
            params string[] categoryIds)
        {
            return new Transaction
            {
                TransactionDescription = description,
                DateOfTransaction = dateOfTransaction,
                Categories = categoryIds
                    .Select(categoryId => new Category { Id = categoryId, CategoryName = categoryId })
                    .ToList()
            };
        }
    }

    public class TestDatabaseFixture
    {
        // How to test with a real DB (not in-memory, but can still be local):
        // https://docs.microsoft.com/en-us/ef/core/testing/testing-with-the-database

        // with docker installed, I used this command to create a local db:
        // docker run --name TrendTestContainer -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=Test12345" -p 5555:1433 -d mcr.microsoft.com/mssql/server:2019-latest
/*        private const string ConnectionString = @"Server=localhost,5555;Database=TestDb;User ID=SA;Password=Test12345;Connection Timeout=30;";

        private static readonly object _lock = new();
        private static bool _databaseInitialized;

        public TestDatabaseFixture()
        {
            lock (_lock)
            {
                if (!_databaseInitialized)
                {
                    using (var context = CreateContext())
                    {
                        context.Database.EnsureDeleted();
                        context.Database.EnsureCreated();

                        context.AddRange(
                            new Transaction { Category = new Category { CategoryName = "Outdoors"}, DateOfTransaction = new DateTime(2022, 1, 1), DateTimeWhenRecorded = new DateTime(2022, 1, 3), Amount = 300, TransactionDescription = "Camping gear" }
                            );
                        context.SaveChanges();
                    }

                    _databaseInitialized = true;
                }
            }
        }

        public TrendDbContext CreateContext()
            => new TrendDbContext(
                new DbContextOptionsBuilder<TrendDbContext>()
                    .UseSqlServer(ConnectionString)
                    .Options);
    }
    public class DbTest : IClassFixture<TestDatabaseFixture>
    {
        public DbTest(TestDatabaseFixture fixture) => Fixture = fixture;
        public TestDatabaseFixture Fixture { get; }


        [Fact]
        public async Task GetSeededData()
        {
            //using var context = Fixture.CreateContext();
            //var transactionFilters = new TransactionFilters();
            //Transaction[] filteredTransactions = await transactionFilters.GetTransactionQuery(context).Include(trans => trans.Category).ToArrayAsync();

            //Assert.Equal("Camping gear", filteredTransactions[0].TransactionDescription);
        }
*/
    }
}