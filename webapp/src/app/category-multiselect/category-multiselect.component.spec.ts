import '@angular/compiler';
import { SimpleChange } from '@angular/core';
import { Category } from '../category';
import { CategoryMultiselectComponent } from './category-multiselect.component';

describe('CategoryMultiselectComponent', () => {
  it('puts additional options above pinned and active categories', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: false }),
    });
    const component = new CategoryMultiselectComponent(
      { nativeElement: {} } as never,
      {
        filterCategoriesByName: (categories: Category[], filter: string) =>
          categories.filter(category =>
            category.categoryName.toLowerCase().includes(filter.toLowerCase())
          ),
      } as never,
      {} as never,
    );
    component.additionalOptions = [createCategory('__expenses__', 'Total Expenses')];
    component.options = [
      createCategory('inactive', 'Inactive', false, true),
      createCategory('normal', 'Normal'),
      createCategory('pinned', 'Pinned', true),
    ];

    component.ngOnChanges({
      options: new SimpleChange(undefined, component.options, true),
      additionalOptions: new SimpleChange(undefined, component.additionalOptions, true),
    });

    expect(component.filteredOptions.map(option => option.id)).toEqual([
      '__expenses__',
      'pinned',
      'normal',
    ]);
    expect(component.isAdditionalOption(component.filteredOptions[0])).toBe(true);
    vi.unstubAllGlobals();
  });
});

function createCategory(
  id: string,
  categoryName: string,
  isPinned = false,
  isInactive = false,
): Category {
  return {
    id,
    categoryName,
    isIncome: false,
    isPinned,
    isInactive,
  };
}