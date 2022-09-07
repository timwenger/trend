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
        // your entities by querying the db with LINQ queries

        // This is a key part of Entity Framework. Entity Framework Core is a modern object-database mapper for .NET.
        //Here, LINQ queries against this Tranactions DbSet will be translated into queries on the DB. Hover over DbSet to see!
        //This means that I won't have to make database SELECT query strings, get JSON objects, and parse to my own
        //class objects. It's all done automatically with Entitiy Framework.
        public virtual DbSet<Transaction> Transactions { get; set; }
        public virtual DbSet<Category> Categories { get; set; }
        public virtual DbSet<User> Users { get; set; }

        public TrendDbContext(DbContextOptions<TrendDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasDefaultSchema("Transactions");
            // how the entity classes model the db tables. Ex: which
            // entries are required, how the entities are related
            new TransactionEntityConfig().Configure(modelBuilder.Entity<Transaction>()); 
            new CategoryEntityConfig().Configure(modelBuilder.Entity<Category>());
            new UserEntityConfig().Configure(modelBuilder.Entity<User>());
            


        }

        public class TransactionEntityConfig : IEntityTypeConfiguration<Transaction>
        {
            public void Configure(EntityTypeBuilder<Transaction> modelBuilder)
            {
                modelBuilder.ToTable("Transactions"); // default is the DbSet's property name, but just being explicit here
                modelBuilder.HasKey(t => t.Id);
                modelBuilder.Property(t => t.Amount).HasPrecision(14,2); // 999,000,000,000.00 up to 999 billion, 2 decimal places   
            }
        }

        public class CategoryEntityConfig : IEntityTypeConfiguration<Category>
        {
            public void Configure(EntityTypeBuilder<Category> modelBuilder)
            {
                modelBuilder.ToTable("Categories");

                modelBuilder.HasKey(c => c.Id);

                // being explicit on how the models are related 
                //https://docs.microsoft.com/en-us/ef/core/modeling/relationships?tabs=fluent-api%2Cfluent-api-simple-key%2Csimple-key
                modelBuilder
                .HasMany(c => c.Transactions)
                .WithOne(t => t.Category)
                .HasForeignKey(t => t.CategoryId);
            }
        }

        public class UserEntityConfig : IEntityTypeConfiguration<User>
        {
            public void Configure(EntityTypeBuilder<User> modelBuilder)
            {
                modelBuilder.ToTable("Users");
                modelBuilder.HasKey(u => u.Id);

                modelBuilder
                .HasMany(u => u.Transactions)
                .WithOne(t => t.User)
                .HasForeignKey(t => t.UserId);
            }
        }
    }
}
