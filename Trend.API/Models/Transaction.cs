using System.ComponentModel.DataAnnotations;

namespace Trend.API.Models
{
    public class Transaction
    {
        public int Id { get; set; }
        [Required]
        public DateTime DateTimeWhenRecorded { get; set; }
        [Required]
        public DateTime DateOfTransaction { get; set; }
        [Required]
        public decimal Amount { get; set; }
        public string TransactionDescription { get; set; } = string.Empty;
        [Required]
        public int CategoryId { get; set; }
        /// <summary>
        /// set UserId to string.Empty, because incoming new transactions don't
        /// have a user id attached yet, and it must contain a non-null value when leaving constructor.
        /// </summary>
        public string UserId { get; set; } = string.Empty;
        public virtual Category? Category { get; set; }
    }
}
