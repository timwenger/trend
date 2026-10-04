using Trend.API.Models;
using Xunit;

namespace Trend.Test
{
    public class CategoryTests
    {
        [Fact]
        public void GetSelectionError_AllowsSameTypeWithEitherCategories()
        {
            Category[] categories =
            {
                CreateCategory(false),
                CreateCategory(false),
                CreateCategory(null),
            };

            Assert.Null(Category.GetSelectionError(categories));
        }

        [Fact]
        public void GetSelectionError_RejectsMixedIncomeAndExpenseCategories()
        {
            Category[] categories =
            {
                CreateCategory(true),
                CreateCategory(false),
            };

            Assert.Equal(
                "Income and Expense categories cannot be combined.",
                Category.GetSelectionError(categories));
        }

        [Fact]
        public void GetSelectionError_RejectsEitherOnlyCategories()
        {
            Category[] categories = { CreateCategory(null) };

            Assert.Equal(
                "An Either category must be accompanied by an Income or Expense category.",
                Category.GetSelectionError(categories));
        }

        [Fact]
        public void GetTargetError_RejectsTargetForEitherCategory()
        {
            Category category = new() { IsIncome = null, ThirtyDayTarget = 1000 };

            Assert.Equal(
                "30 day target is only available for Income or Expense categories.",
                category.GetTargetError());
        }

        [Fact]
        public void GetTargetError_RejectsNegativeTarget()
        {
            Category category = new() { IsIncome = false, ThirtyDayTarget = -1 };

            Assert.Equal("30 day target cannot be negative.", category.GetTargetError());
        }

        private static Category CreateCategory(bool? isIncome)
        {
            return new Category { IsIncome = isIncome };
        }
    }
}
