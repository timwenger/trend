import '@angular/compiler';
import { TransactionsFilterComponent } from './transactions-filter.component';
import { Category } from '../category';
import { Transaction } from '../transaction';
import { ElementRef } from '@angular/core';

describe('TransactionsFilterComponent', () => {
  it('builds a category filter for a single Either category', () => {
    const component = createComponent();
    component.createForm();
    const eitherCategory = createCategory('credit-card', 'Credit Card', null);
    component.filterForm.controls['multiSelectDropdown'].setValue([eitherCategory]);

    const filter = component.buildFilter(component.filterForm, 'Posted');

    expect(filter.categoryFilter).toBe(true);
    expect(filter.selectedCategoryIds).toEqual(['credit-card']);
  });

  it('applies an Either-only filter even if assignment validation marks the category control invalid', () => {
    const component = createComponent();
    component.createForm();
    component.filterForm.controls['multiSelectDropdown'].setValue([
      createCategory('credit-card', 'Credit Card', null),
    ]);
    component.filterForm.controls['multiSelectDropdown'].setErrors({
      categorySelection: true,
    });
    const getTransactions = vi.spyOn(component, 'getTransactions').mockImplementation(() => {});

    component.onSubmit();

    expect(getTransactions).toHaveBeenCalledOnce();
  });

  it('totals Either-filter results using each transaction typed category', () => {
    const component = createComponent();
    const eitherCategory = createCategory('credit-card', 'Credit Card', null);
    const transactions = [
      createTransaction(25, [eitherCategory, createCategory('food', 'Food', false)]),
      createTransaction(100, [eitherCategory, createCategory('refund', 'Refund', true)]),
    ];

    const totals = component['calculateTotals'](transactions);

    expect(totals).toEqual({ expenses: 25, income: 100 });
  });

  it('prorates each selected category target over the inclusive filter range', () => {
    const component = createComponent();
    component.createForm();
    const food = {
      ...createCategory('food', 'Food', false),
      thirtyDayTarget: 1000,
    };
    const pay = {
      ...createCategory('pay', 'Pay', true),
      thirtyDayTarget: 3000,
    };
    component.filterForm.controls['multiSelectDropdown'].setValue([food, pay]);
    component.filterForm.controls['dateOfOldestTransaction'].setValue(new Date(2026, 9, 1));
    component.filterForm.controls['dateOfLatestTransaction'].setValue(new Date(2026, 9, 10));
    component.allCategories = [food, pay];
    component.configuredFilter = component.buildFilter(component.filterForm, 'Posted');

    expect(component.selectedCategoryTargets).toEqual([
      { category: food, amount: 1000 / 3 },
      { category: pay, amount: 1000 },
    ]);
  });

  it('does not show targets when all categories are selected implicitly', () => {
    const component = createComponent();
    component.createForm();
    component.filterForm.controls['multiSelectDropdown'].setValue(null);
    component.configuredFilter = component.buildFilter(component.filterForm, 'Posted');

    expect(component.selectedCategoryTargets).toEqual([]);
  });

  it('wraps Tab from the last filter control to the previous-date button', () => {
    const { component, host } = createComponentWithHost();
    const first = addFirstDateInput(host);
    const last = addButton(host, 'find-submit');
    const focus = vi.spyOn(first, 'focus');
    const activeElement = vi.spyOn(document, 'activeElement', 'get').mockReturnValue(last);
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });

    component.wrapKeyboardNavigation(event);

    expect(event.defaultPrevented).toBe(true);
    expect(focus).toHaveBeenCalledOnce();
    activeElement.mockRestore();
    host.remove();
  });

  it('focuses the previous-date button when the page controls become ready', () => {
    const { component, host } = createComponentWithHost();
    addFirstDateInput(host);
    const previousDate = document.createElement('button');
    previousDate.className = 'date-nav-btn';
    host.appendChild(previousDate);
    const focus = vi.spyOn(previousDate, 'focus');

    component.focusInitialControl();

    expect(focus).toHaveBeenCalledOnce();
    host.remove();
  });

  it('wraps Shift+Tab from the previous-date button to the last filter control', () => {
    const { component, host } = createComponentWithHost();
    const first = addFirstDateInput(host);
    const last = addButton(host, 'find-submit');
    const focus = vi.spyOn(last, 'focus');
    const activeElement = vi.spyOn(document, 'activeElement', 'get').mockReturnValue(first);
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      cancelable: true,
    });

    component.wrapKeyboardNavigation(event);

    expect(event.defaultPrevented).toBe(true);
    expect(focus).toHaveBeenCalledOnce();
    activeElement.mockRestore();
    host.remove();
  });
});

function createComponent(): TransactionsFilterComponent {
  return createComponentWithHost().component;
}

function createComponentWithHost(): {
  component: TransactionsFilterComponent;
  host: HTMLElement;
} {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const component = new TransactionsFilterComponent(
    {} as never,
    {
      getShortDate: (date: Date) =>
        `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`,
    } as never,
    {} as never,
    {} as never,
    new ElementRef(host),
  );
  return { component, host };
}

function addButton(host: HTMLElement, containerClass: string): HTMLButtonElement {
  const button = document.createElement('button');
  const container = document.createElement('div');
  container.className = containerClass;
  container.appendChild(button);
  host.appendChild(container);
  return button;
}

function addFirstDateInput(host: HTMLElement): HTMLInputElement {
  const container = document.createElement('div');
  container.className = 'add-date';
  const input = document.createElement('input');
  input.className = 'p-datepicker-input';
  container.appendChild(input);
  host.appendChild(container);
  return input;
}

function createCategory(id: string, categoryName: string, isIncome: boolean | null): Category {
  return {
    id,
    categoryName,
    isIncome,
    isInactive: false,
    isPinned: false,
  };
}

function createTransaction(amount: number, categories: Category[]): Transaction {
  return {
    id: String(amount),
    dateTimeWhenRecorded: new Date(),
    dateOfTransaction: new Date(),
    amount,
    transactionDescription: '',
    categories,
  };
}
