using Trend.API.Models;

namespace Trend.API.Services
{
    public static class RecurrenceCalculator
    {
        public static IReadOnlyList<DateTime> GetDueDates(
            TransactionRule transactionRule,
            DateTime throughDate,
            DateTime? afterDate = null)
        {
            List<DateTime> dueDates = new();
            DateTime dueDate = transactionRule.UseMonthEnd
                ? new DateTime(
                    transactionRule.StartDate.Year,
                    transactionRule.StartDate.Month,
                    DateTime.DaysInMonth(transactionRule.StartDate.Year, transactionRule.StartDate.Month))
                : transactionRule.StartDate.Date;
            DateTime through = throughDate.Date;
            DateTime generateFrom = transactionRule.GenerateFromDate.Date;
            DateTime? endDate = transactionRule.EndDate?.Date;

            while (dueDate <= through && (!endDate.HasValue || dueDate <= endDate.Value))
            {
                if (dueDate >= generateFrom && (!afterDate.HasValue || dueDate > afterDate.Value.Date))
                    dueDates.Add(dueDate);
                if (dueDates.Count >= 10000)
                    throw new InvalidOperationException("A recurrence cannot create more than 10,000 transactions at once.");

                dueDate = GetNextDate(transactionRule, dueDate);
            }

            return dueDates;
        }

        public static DateTime GetNextDate(
            TransactionRule transactionRule,
            DateTime currentDate)
        {
            if (transactionRule.RecurrenceInterval < 1)
                throw new ArgumentOutOfRangeException(nameof(transactionRule.RecurrenceInterval));

            if (transactionRule.RecurrenceUnit == RecurrenceUnits.Days)
                return currentDate.Date.AddDays(transactionRule.RecurrenceInterval);

            if (transactionRule.RecurrenceUnit == RecurrenceUnits.Weeks)
                return currentDate.Date.AddDays(7 * transactionRule.RecurrenceInterval);

            if (transactionRule.RecurrenceUnit != RecurrenceUnits.Months)
                throw new ArgumentException("Recurrence unit must be days, weeks, or months.");

            DateTime targetMonth = new DateTime(currentDate.Year, currentDate.Month, 1)
                .AddMonths(transactionRule.RecurrenceInterval);
            if (transactionRule.UseMonthEnd)
                return new DateTime(
                    targetMonth.Year,
                    targetMonth.Month,
                    DateTime.DaysInMonth(targetMonth.Year, targetMonth.Month));

            int anchorDay = transactionRule.StartDate.Day;
            int day = Math.Min(anchorDay, DateTime.DaysInMonth(targetMonth.Year, targetMonth.Month));
            return new DateTime(targetMonth.Year, targetMonth.Month, day);
        }
    }
}