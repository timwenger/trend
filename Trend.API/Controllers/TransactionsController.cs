using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Trend.API.Filters;
using Trend.API.Models;

namespace Trend.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableCors("AngularDebugging")]
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

        [HttpGet]
        public async Task<ActionResult> GetAllTransactions([FromQuery] TransactionFilters transactionFilters)
        {
            // loading data from related tables
            // https://docs.microsoft.com/en-us/ef/core/querying/related-data/
            Transaction[] filteredTransactions = await transactionFilters.GetTransactionQuery(_dbContext).Include(trans => trans.Category).ToArrayAsync();
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

        [HttpPut("{id}")]
        public async Task<ActionResult> PutTransaction(int id, Transaction transaction)
        {
            if (id != transaction.Id)
                return BadRequest();

            _dbContext.Entry(transaction).State = EntityState.Modified;

            try
            {
                await _dbContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_dbContext.Transactions.Any(t => t.Id == id))
                    return NotFound();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<Transaction>> DeleteTransaction(int id)
        {
            Transaction? transaction = await _dbContext.Transactions.FindAsync(id);
            if (transaction == null)
                return NotFound();

            _dbContext.Transactions.Remove(transaction);

            await _dbContext.SaveChangesAsync();
            return transaction;
        }
    }    
}