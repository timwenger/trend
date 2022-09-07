using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Trend.API.Models
{
    public class User
    {
        [Required]
        public string Id { get; set; }
        [Required]
        public string UserName { get; set; }

        // avoid an infinitely recursive json object loop
        // https://docs.microsoft.com/en-us/ef/core/querying/related-data/serialization
        [JsonIgnore]
        public List<Transaction>? Transactions { get; set; }
    }
}
