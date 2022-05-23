using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Trend.API.Models
{
    public class TrendDbContext : DbContext
    {
        // The documentation for Entity Framework:
        // https://docs.microsoft.com/en-us/ef/core/


        // import transactions
        // write a couple linq queries as per above, 
        // figure out how to specify those params through the API. 
        // with params in the url?
        // with a request body?
        // in a json object?
        // time to use postman?

        // for finding the description column, to add '' around it
        //    (\d\d-\w*-\d\d','\d\d-\w*-\d\d',-?\d+\.?\d*,)(.*)(,\d+\r\n)




        // a Context object represents a session with the database.
        // So your transactions controller has this object injected, available for use.

        // Category.cs and Transaction.cs are 'entity classes'. You get instances of 
        // your entities by querying the db witht LINQ queries

        // This is a key part of Entity Framework. Entity Framework Core is a modern object-database mapper for .NET.
        //Here, LINQ queries against this Tranactions DbSet will be translated into queries on the DB. Hover over DbSet to see!
        //This means that I won't have to make database SELECT query strings, get JSON objects, and parse to my own
        //class objects. It's all done automatically with Entitiy Framework.
        public virtual DbSet<Transaction> Transactions { get; set; }
        public virtual DbSet<Category> Categories { get; set; }

        public TrendDbContext(DbContextOptions<TrendDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasDefaultSchema("Transactions");
            // how the entity classes model the db tables. Ex: which
            // entries are required, how the entities are related
            new CategoryEntityConfig().Configure(modelBuilder.Entity<Category>());
            new TransactionEntityConfig().Configure(modelBuilder.Entity<Transaction>());

            
        }

        public class CategoryEntityConfig : IEntityTypeConfiguration<Category>
        {
            public void Configure(EntityTypeBuilder<Category> modelBuilder)
            {
                modelBuilder.ToTable("Categories");

                modelBuilder
                .HasKey(c => c.Id);

            // being explicit on how the models are related 
            // commented out because it's not perfect. When getting transactions, it limits the results to 1 transaction per category
            //https://docs.microsoft.com/en-us/ef/core/modeling/relationships?tabs=fluent-api%2Cfluent-api-simple-key%2Csimple-key
                //modelBuilder
                //.HasMany(c => c.Transactions)
                //.WithOne(t => t.Category)
                //.HasForeignKey(t => t.Id);
            }
        }

        public class TransactionEntityConfig : IEntityTypeConfiguration<Transaction>
        {
            public void Configure(EntityTypeBuilder<Transaction> modelBuilder)
            {
                modelBuilder.ToTable("Transactions"); // default is the DbSet's property name, but just being explicit here
                modelBuilder.HasKey(t => t.Id);
            }
        }
    }
}
