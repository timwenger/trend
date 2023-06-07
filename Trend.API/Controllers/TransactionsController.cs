using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using System.Security.Claims;
using Trend.API.Filters;
using Trend.API.Models;

namespace Trend.API.Controllers
{
    [ApiController]
    [EnableCors("ProductionOrDevEnvironment")]
    [Authorize(Policy = "CanWriteToTransactions")]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {

        private readonly Container TransactionsContainer;

        /// <summary>
        /// Here we inject a database context.
        /// </summary>
        public TransactionsController(TrendDbContext dbContext)
        {
            TransactionsContainer = dbContext.GetContainer("Transactions");
        }

        [HttpGet]
        public async Task<ActionResult> GetAllTransactions([FromQuery] TransactionFilters transactionFilters)
        {
            string? uid = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
            if (uid == null)
                return Unauthorized();

            using FeedIterator<Transaction> transactionsFeed = transactionFilters.GetFeedIterator(TransactionsContainer, uid);

            List<Transaction> filteredTransactions = new();

            while (transactionsFeed.HasMoreResults)
            {
                var response = await transactionsFeed.ReadNextAsync();
                foreach (Transaction item in response)
                    filteredTransactions.Add(item);
            }

            return Ok(filteredTransactions);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetTransaction(string id)
        {
            string? uid = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
            if (uid == null)
                return Unauthorized();

            Transaction transaction = await TransactionsContainer.ReadItemAsync<Transaction>(
                id: id,
                partitionKey: new PartitionKey(id)
            );

            if (transaction == null)
                return NotFound();

            if (uid != transaction.UserId)
                return Unauthorized();

            return Ok(transaction);
        }

        [HttpPost]
        public async Task<ActionResult> AddTransaction(Transaction transaction)
        {
            string? uid = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
            if (uid == null)
                return Unauthorized();

            if (!ModelState.IsValid)
                return BadRequest();


            transaction.Id = Guid.NewGuid().ToString();
            transaction.UserId = uid;

            Transaction? createdItem = null;
            try
            {
                createdItem = await TransactionsContainer.CreateItemAsync(
                    item: transaction,
                    partitionKey: new PartitionKey(transaction.Id)
                );
            }
            catch (CosmosException e)
            {
                if (e.StatusCode == System.Net.HttpStatusCode.Forbidden)
                    return Forbid(e.Message);
                else
                    return NotFound(e.Message);  // includes too many requests
            }

            return CreatedAtAction(
                "AddTransaction",
                new { id = transaction.Id },
                transaction);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> PutTransaction(string id, Transaction transaction)
        {
            string? uid = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
            if (uid == null || uid != transaction.UserId)
                return Unauthorized();

            if (id != transaction.Id)
                return BadRequest();

            try
            {
                Transaction replacedItem = await TransactionsContainer.ReplaceItemAsync(
                    item: transaction,
                    id: id,
                    partitionKey: new PartitionKey(id)
                );
            }
            catch (CosmosException e)
            {
                if (e.StatusCode == System.Net.HttpStatusCode.Forbidden)
                    return Forbid(e.Message);
                else
                    return NotFound(e.Message);  // includes too many requests
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<Transaction>> DeleteTransaction(string id)
        {
            string? uid = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
            if (uid == null)
                return Unauthorized();

            Transaction transaction = await TransactionsContainer.ReadItemAsync<Transaction>(
                id: id,
                partitionKey: new PartitionKey(id)
            );

            if (transaction == null)
                return NotFound();

            if (uid != transaction.UserId)
                return Unauthorized();

            try
            {
                await TransactionsContainer.DeleteItemAsync<Transaction>(id, new PartitionKey(id));
            }
            catch (CosmosException e)
            {
                return NotFound(e.Message);  // too many requests
            }

            return transaction;
        }
    }    
}