import '@angular/compiler';
import { SimpleChange } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Category } from '../category';
import { CategoryMultiselectComponent } from './category-multiselect.component';

describe('CategoryMultiselectComponent', () => {
  it('disables the hidden trigger input before a mobile category panel opens', () => {
    vi.stubGlobal('window', {
      matchMedia: () => ({ matches: true }),
    });
    const triggerInput = document.createElement('input');
    const blur = vi.spyOn(triggerInput, 'blur');
    const component = new CategoryMultiselectComponent(
      {
        nativeElement: {
          querySelector: () => triggerInput,
        },
      } as never,
      {} as never,
      {} as never,
    );

    component.prepareMobilePanel();

    expect(triggerInput.readOnly).toBe(true);
    expect(triggerInput.inputMode).toBe('none');
    expect(triggerInput.tabIndex).toBe(-1);
    expect(triggerInput.disabled).toBe(true);
    expect(blur).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

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

  it('makes a category inactive from its dropdown option', () => {
    const category = createCategory('category', 'Category');
    const apiService = {
      setCategoryInactive: vi.fn(() => of(category)),
    };
    const component = createComponent(apiService);
    component.options = [category];
    component.showInactive = true;
    component.ngOnChanges({
      options: new SimpleChange(undefined, component.options, true),
    });

    component.toggleCategoryInactive(new Event('click'), category);

    expect(category.isInactive).toBe(true);
    expect(apiService.setCategoryInactive).toHaveBeenCalledWith(category, true);
    expect(component.filteredOptions).toContain(category);
  });

  it('restores category visibility when the update fails', () => {
    const category = createCategory('category', 'Category');
    const apiService = {
      setCategoryInactive: vi.fn(() => throwError(() => new Error('Update failed'))),
    };
    const component = createComponent(apiService);
    component.options = [category];
    component.ngOnChanges({
      options: new SimpleChange(undefined, component.options, true),
    });

    component.toggleCategoryInactive(new Event('click'), category);

    expect(category.isInactive).toBe(false);
    expect(component.filteredOptions).toContain(category);
  });
});

function createComponent(apiService: object): CategoryMultiselectComponent {
  vi.stubGlobal('window', {
    matchMedia: () => ({ matches: false }),
  });
  return new CategoryMultiselectComponent(
    { nativeElement: {} } as never,
    {
      filterCategoriesByName: (categories: Category[], filter: string) =>
        categories.filter(category =>
          category.categoryName.toLowerCase().includes(filter.toLowerCase())
        ),
    } as never,
    apiService as never,
  );
}

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