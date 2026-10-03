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
            if (!transactionFilters.HasValidRecurringStatus())
                return BadRequest("Unknown recurring transaction status.");

            using FeedIterator<Transaction> transactionsFeed = transactionFilters.GetFeedIterator(TransactionsContainer, uid);

            List<Transaction> filteredTransactions = new();

            while (transactionsFeed.HasMoreResults)
            {
                var response = await transactionsFeed.ReadNextAsync();
                foreach (Transaction item in response)
                {
                    if (transactionFilters.MatchesRecurringStatus(item))
                        filteredTransactions.Add(item);
                }
            }

            return Ok(filteredTransactions);
        }

        [HttpPost]
        public async Task<ActionResult> AddTransaction(Transaction transaction)
        {
            string? uid = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
            if (uid == null)
                return Unauthorized();

            if (!ModelState.IsValid)
                return BadRequest();

            string? categoryError = Category.GetSelectionError(transaction.Categories);
            if (categoryError != null)
                return BadRequest(categoryError);

            transaction.Id = Guid.NewGuid().ToString();
            transaction.UserId = uid;
            transaction.RecurringStatus = RecurringStatuses.NonRecurring;
            transaction.TransactionRuleId = null;
            transaction.ScheduledOccurrenceDate = null;

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
            if (uid == null)
                return Unauthorized();

            if (id != transaction.Id)
                return BadRequest();

            string? categoryError = Category.GetSelectionError(transaction.Categories);
            if (categoryError != null)
                return BadRequest(categoryError);

            Transaction existingTransaction;
            try
            {
                existingTransaction = await TransactionsContainer.ReadItemAsync<Transaction>(id, new PartitionKey(id));
            }
            catch (CosmosException e) when (e.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return NotFound();
            }

            if (uid != existingTransaction.UserId)
                return Unauthorized();

            bool updatingPending = existingTransaction.RecurringStatus == RecurringStatuses.Pending;
            if (!updatingPending && !RecurringStatuses.IsPosted(existingTransaction.RecurringStatus))
                return NotFound();

            transaction.UserId = existingTransaction.UserId;
            transaction.TransactionRuleId = existingTransaction.TransactionRuleId;
            transaction.ScheduledOccurrenceDate = existingTransaction.ScheduledOccurrenceDate;
            if (updatingPending)
            {
                if (transaction.RecurringStatus != RecurringStatuses.Pending &&
                    transaction.RecurringStatus != RecurringStatuses.Accepted &&
                    transaction.RecurringStatus != RecurringStatuses.Skipped)
                    return BadRequest("A pending transaction can only remain pending, be accepted, or be skipped.");

                transaction.DateOfTransaction = DateTime.SpecifyKind(
                    transaction.DateOfTransaction.Date,
                    DateTimeKind.Unspecified);
                transaction.DateTimeWhenRecorded = transaction.RecurringStatus == RecurringStatuses.Accepted
                    ? DateTime.UtcNow
                    : existingTransaction.DateTimeWhenRecorded;
            }
            else
            {
                transaction.RecurringStatus = existingTransaction.RecurringStatus;
            }

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