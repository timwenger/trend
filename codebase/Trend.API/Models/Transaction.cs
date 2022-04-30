﻿using System.ComponentModel.DataAnnotations;

namespace Trend.API.Models
{
    public class Transaction
    {
        [Required]
        public int Id { get; set; }
        [Required]
        public DateTime DateTimeWhenRecorded { get; set; }
        [Required]
        public DateTime DateOfTransaction { get; set; }
        [Required]
        public decimal Amount { get; set; }
        [Required]
        public string TransactionDescription { get; set; } = string.Empty;
        [Required]
        public int CategoryId { get; set; }

        //[JsonIgnore]
        public virtual Category? Category { get; set; }
    }
}
