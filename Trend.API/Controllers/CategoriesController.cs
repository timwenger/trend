using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Trend.API.Models;
using Trend.API.Filters;

namespace Trend.API.Controllers
{
    [ApiController]
    [Authorize(Policy = "CanWriteToCategories")]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {

        public readonly TrendDbContext _dbContext;

        /// <summary>
        /// Here we inject a database context.
        /// </summary>
        public CategoriesController(TrendDbContext dbContext)
        {
            _dbContext = dbContext;
            _dbContext.Database.EnsureCreated();
        }

        [HttpGet]
        public async Task<ActionResult> GetAllCategories()
        {
            string? uid = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
            if (uid == null)
                return Unauthorized();

            // loading data from related tables
            // https://docs.microsoft.com/en-us/ef/core/querying/related-data/
            Category[] categories = await _dbContext.Categories
                .Where(c => c.UserId == uid)
                .Include(category => category.Transactions).ToArrayAsync();
            return Ok(categories);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetCategory(int id)
        {
            string? uid = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
            if (uid == null)
                return Unauthorized();

            Category? category = await _dbContext.Categories.FindAsync(id);
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

            category.UserId = uid;
            _dbContext.Categories.Add(category);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(
                "AddCategory",
                new { id = category.Id },
                category);
        }


        [HttpPut("{id}")]
        public async Task<ActionResult> PutCategory(int id, Category category)
        {
            string? uid = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
            if (uid == null || uid != category.UserId)
                return Unauthorized();

            if (id != category.Id)
                return BadRequest();

            _dbContext.Entry(category).State = EntityState.Modified;

            try
            {
                await _dbContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_dbContext.Categories.Any(c => c.Id == id))
                    return NotFound();
                throw;
            }
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<Category>> DeleteCategory(int id)
        {
            string? uid = User.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier)?.Value;
            if (uid == null)
                return Unauthorized();

            Category? category = await _dbContext.Categories.FindAsync(id);
            if (category == null)
                return NotFound();

            if (uid != category.UserId)
                return Unauthorized();

            // Before deleting a category, check if there are any transactions using this category
            TransactionFilters filter = new TransactionFilters
            { CategoryFilter = true, SelectedCategoryIds = new List<int> { id } };

            Transaction[] transactions = await filter.GetTransactionQuery(_dbContext, uid)
                .ToArrayAsync();

            if (transactions.Length > 0)
                return BadRequest();

            _dbContext.Categories.Remove(category);

            await _dbContext.SaveChangesAsync();
            return category;
        }
    }
}