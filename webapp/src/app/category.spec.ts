import { Category, compareCategories, compareManagedCategories } from './category';

describe('compareCategories', () => {
  it('sorts pinned categories first and alphabetically within each group', () => {
    const categories: Category[] = [
      createCategory('Zebra', false),
      createCategory('Travel', true),
      createCategory('Dining', false),
      createCategory('Bills', true),
    ];

    categories.sort(compareCategories);

    expect(categories.map(category => category.categoryName)).toEqual([
      'Bills',
      'Travel',
      'Dining',
      'Zebra',
    ]);
  });
});

describe('compareManagedCategories', () => {
  it('sorts by pinned, Either, Income, Expense, and category name', () => {
    const categories: Category[] = [
      createCategory('Zebra expense', false, false),
      createCategory('Beta income', true, true),
      createCategory('Alpha expense', true, false),
      createCategory('Zebra either', true, null),
      createCategory('Alpha either', true, null),
      createCategory('Alpha income', true, true),
      createCategory('Unpinned either', false, null),
    ];

    categories.sort(compareManagedCategories);

    expect(categories.map(category => category.categoryName)).toEqual([
      'Alpha either',
      'Zebra either',
      'Alpha income',
      'Beta income',
      'Alpha expense',
      'Unpinned either',
      'Zebra expense',
    ]);
  });
});

function createCategory(
  categoryName: string,
  isPinned: boolean,
  isIncome: boolean | null = false,
): Category {
  return {
    id: categoryName,
    categoryName,
    isIncome,
    isInactive: false,
    isPinned,
  };
}
