import '@angular/compiler';
import { Category } from './category';
import { TrendAggregationService } from './trend-aggregation.service';

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
});
