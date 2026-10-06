import { Injectable } from '@angular/core';
import { ChartData, ChartDataset } from 'chart.js';
import { Transaction } from './transaction';
import { Category, getCategoryTransactionType } from './category';

export interface SeriesSelection {
  customCategoryIds: string[];
}

export interface StoredDefaults extends SeriesSelection {
  chart1DaysAgo: number;
  chart2DaysAgo: number;
  chart1ShowPriorYear: boolean;
  chart2ShowPriorYear: boolean;
  chart1ShowScatter: boolean;
  chart2ShowScatter: boolean;
  chart1StartAtZero: boolean;
  chart2StartAtZero: boolean;
}

const STORAGE_KEY = 'trend-defaults';
const INCOME_COLOR = '#4caf50';
const EXPENSE_COLOR = '#f44336';
const MS_PER_DAY = 86_400_000;
const CUSTOM_COLORS = [
  '#2196f3', '#ff9800', '#9c27b0', '#00bcd4', '#795548',
  '#e91e63', '#607d8b', '#ffc107',
];

@Injectable({ providedIn: 'root' })
export class TrendAggregationService {

  factoryDefaults(): StoredDefaults {
    return {
      customCategoryIds: ['__income__', '__expenses__'],
      chart1DaysAgo: 30,
      chart2DaysAgo: 365,
      chart1ShowPriorYear: true,
      chart2ShowPriorYear: false,
      chart1ShowScatter: true,
      chart2ShowScatter: false,
      chart1StartAtZero: false,
      chart2StartAtZero: false,
    };
  }

  loadDefaults(): StoredDefaults {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return {
          ...this.factoryDefaults(),
          ...(JSON.parse(raw) as Partial<StoredDefaults>),
        };
      }
    } catch { /* ignore parse errors */ }
    return this.factoryDefaults();
  }

  saveDefaults(defaults: StoredDefaults): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  }

  defaultsFromCurrentState(
    selection: SeriesSelection,
    chart1Start: Date,
    chart2Start: Date,
    chart1ShowPriorYear: boolean,
    chart2ShowPriorYear: boolean,
    chart1ShowScatter: boolean,
    chart2ShowScatter: boolean,
    chart1StartAtZero: boolean,
    chart2StartAtZero: boolean,
  ): StoredDefaults {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const msPerDay = 86_400_000;
    return {
      customCategoryIds: [...selection.customCategoryIds],
      chart1DaysAgo: Math.round((today.getTime() - chart1Start.getTime()) / msPerDay),
      chart2DaysAgo: Math.round((today.getTime() - chart2Start.getTime()) / msPerDay),
      chart1ShowPriorYear,
      chart2ShowPriorYear,
      chart1ShowScatter,
      chart2ShowScatter,
      chart1StartAtZero,
      chart2StartAtZero,
    };
  }

  daysAgoToDate(daysAgo: number): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - daysAgo);
    return d;
  }

  buildDatePoints(start: Date, end: Date): Date[] {
    const points: Date[] = [];
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    const endNorm = new Date(end);
    endNorm.setHours(0, 0, 0, 0);
    while (cur <= endNorm) {
      points.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return points;
  }

  formatLabel(d: Date): string {
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    const yy = String(d.getFullYear() % 100).padStart(2, '0');
    return `${month} ${day} '${yy}`;
  }

  private toDayTimestamp(value: Date | string): number {
    const date = value instanceof Date ? value : new Date(value);
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private computeTrailing(
    dailyTotals: Map<number, number>,
    points: Date[],
    windowDays: number,
  ): number[] {
    const entries = [...dailyTotals.entries()].sort(([left], [right]) => left - right);
    const totals: number[] = [];
    let startIndex = 0;
    let endIndex = 0;
    let runningTotal = 0;

    for (const point of points) {
      const pointTimestamp = this.toDayTimestamp(point);
      const windowStart = pointTimestamp - (windowDays - 1) * MS_PER_DAY;

      while (endIndex < entries.length && entries[endIndex][0] <= pointTimestamp) {
        runningTotal += entries[endIndex][1];
        endIndex++;
      }
      while (startIndex < endIndex && entries[startIndex][0] < windowStart) {
        runningTotal -= entries[startIndex][1];
        startIndex++;
      }

      totals.push(runningTotal);
    }

    return totals;
  }

  computeTotals(
    startDate: Date,
    endDate: Date,
    transactions: Transaction[],
  ): { income: number; expenses: number } {
    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);     end.setHours(23, 59, 59, 999);
    let income = 0, expenses = 0;
    for (const t of transactions) {
      const d = new Date(t.dateOfTransaction);
      if (d < start || d > end) continue;
      const transactionType = getCategoryTransactionType(t.categories);
      if (transactionType === true) {
        income += Math.abs(t.amount);
      } else if (transactionType === false) {
        expenses += Math.abs(t.amount);
      }
    }
    return { income, expenses };
  }

  buildChartData(
    startDate: Date,
    endDate: Date,
    transactions: Transaction[],
    allCategories: Category[],
    selection: SeriesSelection,
    rollingWindowDays: number,
    showPriorYear = false,
    includeScatterDots = false,
  ): ChartData<'line'> {
    const datePoints = this.buildDatePoints(startDate, endDate);
    const windowDays = Math.max(1, rollingWindowDays);
    const labels = datePoints.map(d => this.formatLabel(d));

    // Prior-year lookup points: same x-axis positions, but look up data from 1 year earlier
    const priorYearPoints = datePoints.map(d => {
      const shifted = new Date(d);
      shifted.setFullYear(d.getFullYear() - 1);
      return shifted;
    });

    const datasets: ChartDataset<'line'>[] = [];
    const selectedCategoryIds = new Set(
      selection.customCategoryIds.filter(id => id !== '__income__' && id !== '__expenses__'),
    );
    const incomeDailyTotals = new Map<number, number>();
    const expenseDailyTotals = new Map<number, number>();
    const categoryDailyTotals = new Map<string, Map<number, number>>();

    for (const categoryId of selectedCategoryIds) {
      categoryDailyTotals.set(categoryId, new Map<number, number>());
    }

    const addDailyTotal = (totals: Map<number, number>, day: number, amount: number): void => {
      totals.set(day, (totals.get(day) ?? 0) + amount);
    };

    for (const transaction of transactions) {
      const day = this.toDayTimestamp(transaction.dateOfTransaction);
      const amount = Math.abs(transaction.amount);
      const transactionType = getCategoryTransactionType(transaction.categories);

      if (transactionType === true) {
        addDailyTotal(incomeDailyTotals, day, amount);
      } else if (transactionType === false) {
        addDailyTotal(expenseDailyTotals, day, amount);
      }

      const matchedCategoryIds = new Set<string>();
      for (const category of transaction.categories) {
        if (selectedCategoryIds.has(category.id) && !matchedCategoryIds.has(category.id)) {
          addDailyTotal(categoryDailyTotals.get(category.id)!, day, amount);
          matchedCategoryIds.add(category.id);
        }
      }
    }

    const addSeries = (
      label: string,
      color: string,
      dailyTotals: Map<number, number>,
      lookupPoints: Date[],
      priorYear: boolean,
    ) => {
      datasets.push({
        label,
        data: this.computeTrailing(dailyTotals, lookupPoints, windowDays),
        borderColor: color,
        backgroundColor: this.hexToRgba(color, 0.08),
        tension: 0.3,
        fill: false,
        borderDash: [],
        borderWidth: priorYear ? 1 : 3,
        pointRadius: 0,
        pointHoverRadius: 4,
      });
    };

    const addTarget = (category: Category, color: string) => {
      if (category.thirtyDayTarget == null) {
        return;
      }

      const target = category.thirtyDayTarget * windowDays / 30;
      datasets.push({
        label: `${category.categoryName} target`,
        data: datePoints.map(() => target),
        borderColor: color,
        backgroundColor: this.hexToRgba(color, 0.08),
        tension: 0,
        fill: false,
        borderDash: [7, 5],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
      });
    };

    selection.customCategoryIds.forEach((catId, i) => {
      if (catId === '__income__') {
        addSeries('Income', INCOME_COLOR, incomeDailyTotals, datePoints, false);
        if (showPriorYear) addSeries('Income (prior year)', INCOME_COLOR, incomeDailyTotals, priorYearPoints, true);
      } else if (catId === '__expenses__') {
        addSeries('Expenses', EXPENSE_COLOR, expenseDailyTotals, datePoints, false);
        if (showPriorYear) addSeries('Expenses (prior year)', EXPENSE_COLOR, expenseDailyTotals, priorYearPoints, true);
      } else {
        const cat = allCategories.find(c => c.id === catId);
        if (!cat) return;
        const color = CUSTOM_COLORS[i % CUSTOM_COLORS.length];
        const dailyTotals = categoryDailyTotals.get(catId)!;
        addSeries(cat.categoryName, color, dailyTotals, datePoints, false);
        if (showPriorYear) addSeries(`${cat.categoryName} (prior year)`, color, dailyTotals, priorYearPoints, true);
        addTarget(cat, color);
      }
    });

    if (includeScatterDots) {
      const start = new Date(startDate); start.setHours(0, 0, 0, 0);
      const end   = new Date(endDate);   end.setHours(23, 59, 59, 999);

      selection.customCategoryIds.forEach((catId, i) => {
        let color: string;
        let seriesFilter: (t: Transaction) => boolean;

        if (catId === '__income__') {
          color = INCOME_COLOR;
          seriesFilter = t => getCategoryTransactionType(t.categories) === true;
        } else if (catId === '__expenses__') {
          color = EXPENSE_COLOR;
          seriesFilter = t => getCategoryTransactionType(t.categories) === false;
        } else {
          color = CUSTOM_COLORS[i % CUSTOM_COLORS.length];
          seriesFilter = t => t.categories.some(c => c.id === catId);
        }

        const scatterData = transactions
          .filter(t => {
            const d = new Date(t.dateOfTransaction);
            d.setHours(0, 0, 0, 0);
            return d >= start && d <= end && seriesFilter(t);
          })
          .map(t => {
            const d = new Date(t.dateOfTransaction);
            d.setHours(0, 0, 0, 0);
            const cats = t.categories.map(c => c.categoryName).join(', ');
            return { x: this.formatLabel(d), y: Math.abs(t.amount), desc: t.transactionDescription, cats };
          });

        datasets.push({
          type: 'scatter' as any,
          label: `__scatter__${catId}`,
          data: scatterData as any,
          borderColor: color,
          backgroundColor: this.hexToRgba(color, 0.75),
          pointStyle: 'crossRot',
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBorderWidth: 2,
          yAxisID: 'y1',
          showLine: false,
          order: -1,  // draw on top of lines
        } as any);
      });
    }

    return { labels, datasets };
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
