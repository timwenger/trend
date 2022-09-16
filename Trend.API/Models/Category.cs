using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Trend.API.Models
{
    public class Category
    {
        [Required]
        public int Id { get; set; }
        [Required]
        public string CategoryName { get; set; } = string.Empty;
        [Required]
        public string UserId { get; set; } = string.Empty;

        // avoid an infinitely recursive json object loop
        // https://docs.microsoft.com/en-us/ef/core/querying/related-data/serialization
        [JsonIgnore]
        public List<Transaction>? Transactions { get; set; }
    }
}
