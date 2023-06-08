using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Trend.API.Models;
using Trend.API.Filters;
using Microsoft.AspNetCore.Cors;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Cosmos.Linq;

namespace Trend.API.Controllers
{
    [ApiController]
    [EnableCors("ProductionOrDevEnvironment")]
    [Authorize(Policy = "CanWriteToCategories")]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly Container CategoriesContainer;
        private readonly Container TransactionsContainer;


        public CategoriesController(TrendDbContext dbContext)
        {
            CategoriesContainer = dbContext.GetContainer("Categories");
            TransactionsContainer = dbContext.GetContainer("Transactions");
        }

        [HttpGet]
        public async Task<ActionResult> GetAllCategories()
        {
            string? uid = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
            if (uid == null)
                return Unauthorized();

            var queryableCategories = CategoriesContainer.GetItemLinqQueryable<Category>();
            using FeedIterator<Category> categoriesFeed = queryableCategories
                .Where(category => category.UserId ==  uid)
                .ToFeedIterator();

            List<Category> categories = new();

            while (categoriesFeed.HasMoreResults)
            {
                var response = await categoriesFeed.ReadNextAsync();
                foreach (Category item in response)
                    categories.Add(item);
            }

            return Ok(categories);
        }
        
        [HttpGet("{id}")]
        public async Task<ActionResult> GetCategory(string id)
        {
            string? uid = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
            if (uid == null)
                return Unauthorized();

            Category category = await CategoriesContainer.ReadItemAsync<Category>(
                id: id,
                partitionKey: new PartitionKey(id)
            );

            if (category == null)
                return NotFound();

            if (uid != category.UserId)
                return Unauthorized();

            return Ok(category);
        }

        
        [HttpPost]
        public async Task<ActionResult> AddCategory(Category category)
        {
            string? uid = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
            if (uid == null)
                return Unauthorized(); 
            
            if (!ModelState.IsValid)
                return BadRequest();

            category.Id = Guid.NewGuid().ToString();
            category.UserId = uid;

            Category? createdItem = null;
            try
            {
                createdItem = await CategoriesContainer.CreateItemAsync(
                    item: category,
                    partitionKey: new PartitionKey(category.Id)
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
                "AddCategory",
                new { id = createdItem.Id },
                createdItem);
        }
        

        [HttpPut("{id}")]
        public async Task<ActionResult> PutCategory(string id, Category category)
        {
            string? uid = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
            if (uid == null || uid != category.UserId)
                return Unauthorized();

            if (id != category.Id.ToString())
                return BadRequest();

            Category? replacedCategory = null;
            try
            {
                replacedCategory = await CategoriesContainer.ReplaceItemAsync(
                    item: category,
                    id: id,
                    partitionKey: new PartitionKey(id)
                );
            }
            catch (CosmosException e)
            {
                if(e.StatusCode == System.Net.HttpStatusCode.Forbidden)
                    return Forbid(e.Message);
                else 
                    return NotFound(e.Message);  // includes too many requests
            }


            // Update all the transaction documents that use this category
            // This is a lot of processing, but I think that's okay, since you don't normally change a category
            TransactionFilters filters = new ();
            filters.CategoryFilter = true;
            filters.SelectedCategoryIds = new List<string> { category.Id };

            FeedIterator<Transaction> transactionsFeed = filters.GetFeedIterator(TransactionsContainer, uid);

            List<Transaction> transThatNeedUpdating = new();

            while (transactionsFeed.HasMoreResults)
            {
                var response = await transactionsFeed.ReadNextAsync();
                foreach (Transaction item in response)
                    transThatNeedUpdating.Add(item);
            }

            foreach(Transaction toReplace in transThatNeedUpdating)
            {
                for (int i = 0; i < toReplace.Categories.Count; i++)
                {
                    if (toReplace.Categories[i].Id == replacedCategory.Id)
                        toReplace.Categories[i] = replacedCategory;
                }

                try
                {
                    await TransactionsContainer.ReplaceItemAsync(
                        item: toReplace,
                        id: toReplace.Id,
                        partitionKey: new PartitionKey(toReplace.Id)
                    );
                }
                catch (CosmosException e)
                {
                    if (e.StatusCode == System.Net.HttpStatusCode.Forbidden)
                        return Forbid(e.Message);
                    else
                        return NotFound(e.Message);  // includes too many requests
                }
            }

            return NoContent();
        }

        
        [HttpDelete("{id}")]
        public async Task<ActionResult<Category>> DeleteCategory(string id)
        {
            string? uid = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
            if (uid == null)
                return Unauthorized();

            Category category = await CategoriesContainer.ReadItemAsync<Category>(
                id: id,
                partitionKey: new PartitionKey(id)
            );

            if (category == null)
                return NotFound();

            if (uid != category.UserId)
                return Unauthorized();


            // Before deleting a category, check if there are any transactions using this category
            TransactionFilters filter = new TransactionFilters
            { CategoryFilter = true, SelectedCategoryIds = new List<string> { id } };

            FeedIterator<Transaction> transactionsFeed = filter.GetFeedIterator(TransactionsContainer, uid);
            List<Transaction> existingTransactions = new();

            while (transactionsFeed.HasMoreResults)
            {
                var response = await transactionsFeed.ReadNextAsync();
                foreach (Transaction item in response)
                    existingTransactions.Add(item);
            }

            if (existingTransactions.Count > 0)
                return BadRequest();

            try
            {
                await CategoriesContainer.DeleteItemAsync<Category>(id, new PartitionKey(id));
            }
            catch (CosmosException e)
            {
                return NotFound(e.Message);  // too many requests
            }

            return category;
        }
        
    }
}