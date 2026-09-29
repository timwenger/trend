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
        [InlineData(SearchMatchMode.Any, 4)]
        public void BuildPredicate_CombinesActiveConditions(SearchMatchMode match, int expectedCount)
        {
            var filters = new TransactionFilters
            {
                CategoryFilter = true,
                SelectedCategoryIds = new List<string> { "transport" },
                SearchText = "TRANSIT pass",
                Match = match
            };
            Transaction[] transactions =
            {
                CreateTransaction("Transit pass", "transport", "Commuting"),
                CreateTransaction("Transit ticket", "travel", "Commuting"),
                CreateTransaction("Monthly pass", "travel", "Commuting"),
                CreateTransaction("Coffee", "transport", "Commuting")
            };

            Transaction[] matches = transactions.Where(filters.BuildPredicate()!.Compile()).ToArray();

            Assert.Equal(expectedCount, matches.Length);
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

        private static Transaction CreateTransaction(string description, string categoryId, string categoryName)
        {
            return new Transaction
            {
                TransactionDescription = description,
                Categories = new List<Category>
                {
                    new() { Id = categoryId, CategoryName = categoryName }
                }
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