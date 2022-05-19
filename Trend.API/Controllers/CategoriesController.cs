using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Trend.API.Models;

namespace Trend.API.Controllers
{
    [ApiController]
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

        [EnableCors("AngularDebugging")]
        [HttpGet]
        public async Task<ActionResult> GetAllCategories()
        {
            // loading data from related tables
            // https://docs.microsoft.com/en-us/ef/core/querying/related-data/
            Category[] categories = await _dbContext.Categories.Include(category => category.Transactions).ToArrayAsync();
            return Ok(await _dbContext.Categories.ToArrayAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetCategory(int id)
        {
            Category category = await _dbContext.Categories.FindAsync(id);
            if (category != null)
                return Ok(category);
            return NotFound();
        }

        [HttpPost]
        public async Task<ActionResult> AddCategory(Category category)
        {
            if (!ModelState.IsValid)
                return BadRequest();

            _dbContext.Categories.Add(category);
            await _dbContext.SaveChangesAsync();

            return CreatedAtAction(
                "AddCategory",
                new { id = category.Id },
                category);
        }
    }
}