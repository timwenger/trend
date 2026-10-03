import '@angular/compiler';
import { TransactionsFilterComponent } from './transactions-filter.component';
import { Category } from '../category';
import { Transaction } from '../transaction';

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
});

function createComponent(): TransactionsFilterComponent {
  return new TransactionsFilterComponent(
    {} as never,
    {
      getShortDate: (date: Date) =>
        `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`,
    } as never,
    {} as never,
    {} as never,
  );
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
