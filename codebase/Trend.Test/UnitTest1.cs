using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System;
using System.Collections.Generic;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Trend.API.Controllers;
using Trend.API.Filters;
using Trend.API.Models;

namespace Trend.Test
{

    // how to mock the db and use an in-memory db
    // https://docs.microsoft.com/en-us/ef/ef6/fundamentals/testing/mocking

    // testing Entity framework core
    // https://docs.microsoft.com/en-us/ef/core/testing/

    // https://stackoverflow.com/questions/39481353/how-do-i-moq-the-applicationdbcontext-in-net-core

    [TestClass]
    public class UnitTest1
    {
        //[TestMethod]
        //public void TestMethod1()
        //{
        //}

        //[TestMethod]
        //public async Task GetAllCategories_orders_by_name()
        //{
        //    var data = new List<Transaction>
        //    {
        //        new Transaction { TransactionDescription = "BBB" },
        //        new Transaction { TransactionDescription = "ZZZ" },
        //        new Transaction { TransactionDescription = "AAA" },
        //    }.AsQueryable();

        //    var mockSet = new Mock<DbSet<Transaction>>();

        //    mockSet.As<IDbAsyncEnumerable<Transaction>>()
        //        .Setup(m => m.GetAsyncEnumerator())
        //        .Returns(new TestDbAsyncEnumerator<Transaction>(data.GetEnumerator()));

        //    mockSet.As<IQueryable<Transaction>>()
        //        .Setup(m => m.Provider)
        //        .Returns(new TestDbAsyncQueryProvider<Transaction>(data.Provider));

        //    mockSet.As<IQueryable<Transaction>>().Setup(m => m.Expression).Returns(data.Expression);
        //    mockSet.As<IQueryable<Transaction>>().Setup(m => m.ElementType).Returns(data.ElementType);
        //    mockSet.As<IQueryable<Transaction>>().Setup(m => m.GetEnumerator()).Returns(data.GetEnumerator());

        //    var optionsBuilder = new DbContextOptionsBuilder<TrendDbContext>();
        //    var mockContext = new Mock<TrendDbContext>(optionsBuilder.Options);
        //    mockContext.Setup(t => t.Transactions).Returns(mockSet.Object);

        //    var service = new TransactionsController(mockContext.Object);

        //    // I need to return a list / array. Not Ok(list) like I do in TransactionsController
        //    // maybe I need to make utility method that the http method and the unit tests can use.


        //    var transactionFilters = new TransactionFilters();

        //    Transaction[] transactions = await transactionFilters.GetTransactionQuery(mockContext.Object).ToArrayAsync();
        //    Assert.AreEqual(3, transactions);
        //    Assert.AreEqual("AAA", transactions[0].TransactionDescription);
        //    Assert.AreEqual("BBB", transactions[1].TransactionDescription);
        //    Assert.AreEqual("ZZZ", transactions[2].TransactionDescription);
        //}


        [TestMethod]
        public async Task UsingInMemoryDb()
        {
            // Now that I am using an in-memory db, I need a way to seed the db with this data...
            // until then, the test won't pass because there are 0 results in the returned transactns array
            var data = new List<Transaction>
            {
                new Transaction { TransactionDescription = "BBB" },
                new Transaction { TransactionDescription = "ZZZ" },
                new Transaction { TransactionDescription = "AAA" },
            }.AsQueryable();


            var optionsBuilder = new DbContextOptionsBuilder<TrendDbContext>();
            optionsBuilder.UseInMemoryDatabase("UnitTestDb");
            var _dbContext = new TrendDbContext(optionsBuilder.Options);

            var transactionFilters = new TransactionFilters();

            Transaction[] transactions = await transactionFilters.GetTransactionQuery(_dbContext).ToArrayAsync();

            Assert.AreEqual(3, transactions);
            Assert.AreEqual("AAA", transactions[0].TransactionDescription);
            Assert.AreEqual("BBB", transactions[1].TransactionDescription);
            Assert.AreEqual("ZZZ", transactions[2].TransactionDescription);
        }
    }

    internal class TestDbAsyncQueryProvider<TEntity> : IDbAsyncQueryProvider
    {
        private readonly IQueryProvider _inner;

        internal TestDbAsyncQueryProvider(IQueryProvider inner)
        {
            _inner = inner;
        }

        public IQueryable CreateQuery(Expression expression)
        {
            return new TestDbAsyncEnumerable<TEntity>(expression);
        }

        public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
        {
            return new TestDbAsyncEnumerable<TElement>(expression);
        }

        public object Execute(Expression expression)
        {
            return _inner.Execute(expression);
        }

        public TResult Execute<TResult>(Expression expression)
        {
            return _inner.Execute<TResult>(expression);
        }

        public Task<object> ExecuteAsync(Expression expression, CancellationToken cancellationToken)
        {
            return Task.FromResult(Execute(expression));
        }

        public Task<TResult> ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken)
        {
            return Task.FromResult(Execute<TResult>(expression));
        }
    }

    internal class TestDbAsyncEnumerable<T> : EnumerableQuery<T>, IDbAsyncEnumerable<T>, IQueryable<T>
    {
        public TestDbAsyncEnumerable(IEnumerable<T> enumerable)
            : base(enumerable)
        { }

        public TestDbAsyncEnumerable(Expression expression)
            : base(expression)
        { }

        public IDbAsyncEnumerator<T> GetAsyncEnumerator()
        {
            return new TestDbAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
        }

        IDbAsyncEnumerator IDbAsyncEnumerable.GetAsyncEnumerator()
        {
            return GetAsyncEnumerator();
        }

        IQueryProvider IQueryable.Provider
        {
            get { return new TestDbAsyncQueryProvider<T>(this); }
        }
    }

    internal class TestDbAsyncEnumerator<T> : IDbAsyncEnumerator<T>
    {
        private readonly IEnumerator<T> _inner;

        public TestDbAsyncEnumerator(IEnumerator<T> inner)
        {
            _inner = inner;
        }

        public void Dispose()
        {
            _inner.Dispose();
        }

        public Task<bool> MoveNextAsync(CancellationToken cancellationToken)
        {
            return Task.FromResult(_inner.MoveNext());
        }

        public T Current
        {
            get { return _inner.Current; }
        }

        object IDbAsyncEnumerator.Current
        {
            get { return Current; }
        }
    }
}