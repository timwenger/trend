using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Trend.API.Models;
using Trend.API.Services;
using Xunit;

namespace Trend.Test
{
    public class RecurrenceCalculatorTests
    {
        [Fact]
        public void MonthlyRecurrenceClampsThenReturnsToAnchorDay()
        {
            TransactionRule transactionRule = new()
            {
                StartDate = new DateTime(2026, 1, 31),
                GenerateFromDate = new DateTime(2026, 1, 31),
                RecurrenceInterval = 1,
                RecurrenceUnit = RecurrenceUnits.Months,
            };

            IReadOnlyList<DateTime> dueDates = RecurrenceCalculator.GetDueDates(
                transactionRule,
                new DateTime(2026, 3, 31));

            Assert.Equal(
                new[]
                {
                    new DateTime(2026, 1, 31),
                    new DateTime(2026, 2, 28),
                    new DateTime(2026, 3, 31),
                },
                dueDates);
        }

        [Fact]
        public void MonthEndRecurrenceAlwaysUsesLastDayOfMonth()
        {
            TransactionRule transactionRule = new()
            {
                StartDate = new DateTime(2026, 1, 15),
                GenerateFromDate = new DateTime(2026, 1, 15),
                RecurrenceInterval = 1,
                RecurrenceUnit = RecurrenceUnits.Months,
                UseMonthEnd = true,
            };

            IReadOnlyList<DateTime> dueDates = RecurrenceCalculator.GetDueDates(
                transactionRule,
                new DateTime(2026, 3, 31));

            Assert.Equal(
                new[]
                {
                    new DateTime(2026, 1, 31),
                    new DateTime(2026, 2, 28),
                    new DateTime(2026, 3, 31),
                },
                dueDates);
        }

        [Fact]
        public void WeeklyRecurrenceHonorsIntervalAndInclusiveEndDate()
        {
            TransactionRule transactionRule = new()
            {
                StartDate = new DateTime(2026, 1, 1),
                GenerateFromDate = new DateTime(2026, 1, 1),
                EndDate = new DateTime(2026, 1, 29),
                RecurrenceInterval = 2,
                RecurrenceUnit = RecurrenceUnits.Weeks,
            };

            IReadOnlyList<DateTime> dueDates = RecurrenceCalculator.GetDueDates(
                transactionRule,
                new DateTime(2026, 2, 28));

            Assert.Equal(
                new[]
                {
                    new DateTime(2026, 1, 1),
                    new DateTime(2026, 1, 15),
                    new DateTime(2026, 1, 29),
                },
                dueDates);
        }

        [Fact]
        public void DailyRecurrenceHonorsIntervalAndInclusiveEndDate()
        {
            TransactionRule transactionRule = new()
            {
                StartDate = new DateTime(2026, 1, 1),
                GenerateFromDate = new DateTime(2026, 1, 1),
                EndDate = new DateTime(2026, 1, 7),
                RecurrenceInterval = 2,
                RecurrenceUnit = RecurrenceUnits.Days,
            };

            IReadOnlyList<DateTime> dueDates = RecurrenceCalculator.GetDueDates(
                transactionRule,
                new DateTime(2026, 1, 31));

            Assert.Equal(
                new[]
                {
                    new DateTime(2026, 1, 1),
                    new DateTime(2026, 1, 3),
                    new DateTime(2026, 1, 5),
                    new DateTime(2026, 1, 7),
                },
                dueDates);
        }

        [Fact]
        public void RecurrenceCanGenerateOnlyAfterLatestScheduledOccurrence()
        {
            TransactionRule transactionRule = new()
            {
                StartDate = new DateTime(2021, 1, 31),
                GenerateFromDate = new DateTime(2021, 1, 31),
                RecurrenceInterval = 1,
                RecurrenceUnit = RecurrenceUnits.Months,
            };

            IReadOnlyList<DateTime> dueDates = RecurrenceCalculator.GetDueDates(
                transactionRule,
                new DateTime(2026, 3, 31),
                new DateTime(2026, 1, 31));

            Assert.Equal(
                new[]
                {
                    new DateTime(2026, 2, 28),
                    new DateTime(2026, 3, 31),
                },
                dueDates);
        }

        [Fact]
        public void ComposedDetailsKeepFlatJsonContract()
        {
            Transaction transaction = new()
            {
                Details = new TransactionDetails
                {
                    Amount = 50m,
                    TransactionDescription = "Phone bill",
                    Categories = new List<Category>
                    {
                        new() { Id = "utilities", CategoryName = "Utilities" },
                    },
                },
            };

            string json = JsonConvert.SerializeObject(transaction);
            Transaction? roundTripped = JsonConvert.DeserializeObject<Transaction>(json);

            Assert.Contains("\"Amount\":50.0", json);
            Assert.Contains("\"TransactionDescription\":\"Phone bill\"", json);
            Assert.Contains("\"Categories\":[", json);
            Assert.DoesNotContain("\"Details\"", json);
            Assert.NotNull(roundTripped);
            Assert.Equal(50m, roundTripped.Details.Amount);
            Assert.Equal("Phone bill", roundTripped.Details.TransactionDescription);
            Assert.Single(roundTripped.Details.Categories);
        }
    }
}