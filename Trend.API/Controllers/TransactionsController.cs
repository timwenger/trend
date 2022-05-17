using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Trend.API.Filters;
using Trend.API.Models;

namespace Trend.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {

        public readonly TrendDbContext _dbContext;

        /// <summary>
        /// Here we inject a database context.
        /// </summary>
        public TransactionsController(TrendDbContext dbContext)
        {
            _dbContext = dbContext;
            _dbContext.Database.EnsureCreated();
        }

        [EnableCors("AngularDebugging")]
        [HttpGet]
        public async Task<ActionResult> GetAllTransactions()
        {
            // loading data from related tables
            // https://docs.microsoft.com/en-us/ef/core/querying/related-data/

            var transactionFilters = new TransactionFilters
            {
                DateFilter = true,
                DateOldest = new DateTime(2022, 1, 1),
                DateLatest = new DateTime(2022, 1, 31)
            };

            Transaction[] filteredTransactions = await transactionFilters.GetTransactionQuery(_dbContext).Include(trans => trans.Category).ToArrayAsync();
            //Transaction[] transactions = await _dbContext.Transactions.ToArrayAsync();
            return Ok(filteredTransactions);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetTransaction(int id)
        { 
            Transaction transaction = await _dbContext.Transactions.FindAsync(id);
            //transaction.Category
            if (transaction != null)
                return Ok(transaction);
            return NotFound();
        }

        [HttpPost]
        public async Task<ActionResult> AddTransaction(Transaction transaction)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            _dbContext.Transactions.Add(transaction);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(
                "AddTransaction",
                new { id = transaction.Id },
                transaction);
        }
    }    
}