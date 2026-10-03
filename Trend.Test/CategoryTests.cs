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

        private static Category CreateCategory(bool? isIncome)
        {
            return new Category { IsIncome = isIncome };
        }
    }
}
