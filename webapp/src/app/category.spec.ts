import { Category, compareCategories } from './category';

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

function createCategory(categoryName: string, isPinned: boolean): Category {
  return {
    id: categoryName,
    categoryName,
    isIncome: false,
    isInactive: false,
    isPinned,
  };
}
