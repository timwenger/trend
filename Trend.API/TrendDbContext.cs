using Microsoft.Azure.Cosmos;

namespace Trend.API.Models
{
    public class TrendDbContext
    {
        private Database Database { get; set; }
        public TrendDbContext(string endpoint, string accountKey)
        {
            CosmosClient client = new(endpoint, accountKey);

            Database = client.GetDatabase(id: "trend-nosql-db");
        }

        public Container GetContainer(string id)
        {
            return Database.GetContainer(id);
        }
    }
}
