import '@angular/compiler';
import { Category } from './category';
import { TrendAggregationService } from './trend-aggregation.service';
import { Transaction } from './transaction';

describe('TrendAggregationService', () => {
  const category: Category = {
    id: 'food',
    categoryName: 'Food',
    isIncome: false,
    isInactive: false,
    isPinned: false,
    thirtyDayTarget: 900,
  };

  it('adds a 30-day target line for an individually selected category', () => {
    const service = new TrendAggregationService();

    const result = service.buildChartData(
      new Date(2026, 9, 1),
      new Date(2026, 9, 2),
      [],
      [category],
      { customCategoryIds: [category.id] },
      30,
    );

    const target = result.datasets.find(dataset => dataset.label === 'Food target');
    expect(target?.data).toEqual([900, 900]);
    expect(target?.borderDash).toEqual([7, 5]);
  });

  it('scales a 30-day target to the rolling window and keeps prior year solid and thin', () => {
    const service = new TrendAggregationService();

    const result = service.buildChartData(
      new Date(2026, 9, 1),
      new Date(2026, 9, 1),
      [],
      [category],
      { customCategoryIds: [category.id] },
      365,
      true,
    );

    const target = result.datasets.find(dataset => dataset.label === 'Food target');
    const priorYear = result.datasets.find(dataset => dataset.label === 'Food (prior year)');
    expect(target?.data).toEqual([10_950]);
    expect(priorYear?.borderDash).toEqual([]);
    expect(priorYear?.borderWidth).toBe(1);
  });

  it('does not add targets for aggregate total series', () => {
    const service = new TrendAggregationService();

    const result = service.buildChartData(
      new Date(2026, 9, 1),
      new Date(2026, 9, 1),
      [],
      [category],
      { customCategoryIds: ['__expenses__'] },
      30,
    );

    expect(result.datasets.map(dataset => dataset.label)).toEqual(['Expenses']);
  });

  it('computes rolling category and transaction-type totals without counting duplicate category tags', () => {
    const service = new TrendAggregationService();
    const incomeCategory: Category = {
      ...category,
      id: 'income',
      categoryName: 'Income',
      isIncome: true,
    };
    const transactions: Transaction[] = [
      createTransaction(new Date(2026, 9, 1), 10, [category, category]),
      createTransaction(new Date(2026, 9, 2), 20, [category]),
      createTransaction(new Date(2026, 9, 3), 5, [incomeCategory]),
    ];

    const result = service.buildChartData(
      new Date(2026, 9, 1),
      new Date(2026, 9, 3),
      transactions,
      [category, incomeCategory],
      { customCategoryIds: [category.id, '__expenses__', '__income__'] },
      2,
    );

    expect(result.datasets.find(dataset => dataset.label === 'Food')?.data).toEqual([10, 30, 20]);
    expect(result.datasets.find(dataset => dataset.label === 'Expenses')?.data).toEqual([10, 30, 20]);
    expect(result.datasets.find(dataset => dataset.label === 'Income')?.data).toEqual([0, 0, 5]);
  });

  it('builds a year-long chart over a large history in under one second', () => {
    const service = new TrendAggregationService();
    const transactions = Array.from({ length: 20_000 }, (_, index) => {
      const date = new Date(2024, 0, 1);
      date.setDate(date.getDate() + index % 1000);
      return createTransaction(date, index + 1, [category]);
    });
    const startedAt = performance.now();

    const result = service.buildChartData(
      new Date(2025, 9, 1),
      new Date(2026, 9, 1),
      transactions,
      [category],
      { customCategoryIds: [category.id] },
      365,
    );

    expect(result.datasets[0].data).toHaveLength(366);
    expect(performance.now() - startedAt).toBeLessThan(1_000);
  });
});

function createTransaction(
  date: Date | string,
  amount: number,
  categories: Category[],
): Transaction {
  const transactionDate = new Date(date);
  return {
    id: `${transactionDate.toISOString()}-${amount}`,
    dateTimeWhenRecorded: transactionDate,
    dateOfTransaction: transactionDate,
    amount,
    transactionDescription: '',
    categories,
  };
}
