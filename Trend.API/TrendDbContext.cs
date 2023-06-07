using Microsoft.Azure.Cosmos;

namespace Trend.API.Models
{
    public class TrendDbContext
    {
        private Database Database { get; set; }
        public TrendDbContext()
        {
            string endpoint = Environment.GetEnvironmentVariable("COSMOS_ENDPOINT", EnvironmentVariableTarget.Machine) ?? string.Empty;
            string accountKey = Environment.GetEnvironmentVariable("COSMOS_KEY", EnvironmentVariableTarget.Machine) ?? string.Empty;

            CosmosClient client = new(endpoint, accountKey);

            Database = client.GetDatabase(id: "trend-nosql-db");
        }

        public Container GetContainer(string id)
        {
            return Database.GetContainer(id);
        }
    }
}
