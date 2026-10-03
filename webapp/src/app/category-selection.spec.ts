import {
  Category,
  getCategorySelectionError,
  getCategoryTransactionType,
} from './category';

describe('category selection rules', () => {
  it('allows multiple categories of the same type with Either categories', () => {
    expect(getCategorySelectionError([
      createCategory('Cash', false),
      createCategory('Groceries', false),
      createCategory('Costco', null),
    ])).toBeNull();
  });

  it('rejects mixed Income and Expense categories', () => {
    expect(getCategorySelectionError([
      createCategory('Paycheck', true),
      createCategory('Cash', false),
    ])).toBe('Income and Expense categories cannot be combined.');
  });

  it('rejects Either categories without an Income or Expense category', () => {
    expect(getCategorySelectionError([
      createCategory('Costco', null),
    ])).toBe('An Either category must be accompanied by an Income or Expense category.');
  });

  it('uses the first Income or Expense category as the transaction type', () => {
    expect(getCategoryTransactionType([
      createCategory('Costco', null),
      createCategory('Cash', false),
      createCategory('Groceries', false),
    ])).toBe(false);
  });
});

function createCategory(categoryName: string, isIncome: boolean | null): Category {
  return {
    id: categoryName,
    categoryName,
    isIncome,
    isInactive: false,
    isPinned: false,
  };
}
