import { Injectable } from '@angular/core';
import { ChartData, ChartDataset } from 'chart.js';
import { Transaction } from './transaction';
import { Category } from './category';

export interface SeriesSelection {
  customCategoryIds: string[];
}

export interface StoredDefaults extends SeriesSelection {
  chart1DaysAgo: number;
  chart2DaysAgo: number;
  chart1ShowPriorYear: boolean;
  chart2ShowPriorYear: boolean;
}

const STORAGE_KEY = 'trend-defaults';
const INCOME_COLOR = '#4caf50';
const EXPENSE_COLOR = '#f44336';
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
    };
  }

  loadDefaults(): StoredDefaults {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as StoredDefaults;
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
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private computeTrailing(
    transactions: Transaction[],
    datePoints: Date[],
    windowDays: number,
    categoryFilter: (c: Category) => boolean,
  ): number[] {
    return datePoints.map(pointDate => {
      const windowStart = new Date(pointDate);
      windowStart.setDate(pointDate.getDate() - windowDays + 1);
      return transactions
        .filter(t => {
          const d = new Date(t.dateOfTransaction);
          d.setHours(0, 0, 0, 0);
          return d >= windowStart && d <= pointDate && t.categories.some(categoryFilter);
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    });
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
      if (t.categories.some(c => c.isIncome)) income += Math.abs(t.amount);
      else expenses += Math.abs(t.amount);
    }
    return { income, expenses };
  }

  buildChartData(
    startDate: Date,
    endDate: Date,
    transactions: Transaction[],
    allCategories: Category[],
    selection: SeriesSelection,
    showPriorYear = false,
    includeScatterDots = false,
  ): ChartData<'line'> {
    const datePoints = this.buildDatePoints(startDate, endDate);
    const windowDays = Math.max(1, datePoints.length);
    const labels = datePoints.map(d => this.formatLabel(d));

    // Prior-year lookup points: same x-axis positions, but look up data from 1 year earlier
    const priorYearPoints = datePoints.map(d => {
      const shifted = new Date(d);
      shifted.setFullYear(d.getFullYear() - 1);
      return shifted;
    });

    const datasets: ChartDataset<'line'>[] = [];

    const addSeries = (
      label: string,
      color: string,
      filter: (c: Category) => boolean,
      lookupPoints: Date[],
      dashed: boolean,
    ) => {
      datasets.push({
        label,
        data: this.computeTrailing(transactions, lookupPoints, windowDays, filter),
        borderColor: color,
        backgroundColor: this.hexToRgba(color, 0.08),
        tension: 0.3,
        fill: false,
        borderDash: dashed ? [5, 5] : [],
        pointRadius: 0,
        pointHoverRadius: 4,
      });
    };

    selection.customCategoryIds.forEach((catId, i) => {
      if (catId === '__income__') {
        addSeries('Total Income', INCOME_COLOR, c => c.isIncome, datePoints, false);
        if (showPriorYear) addSeries('Total Income (prior year)', INCOME_COLOR, c => c.isIncome, priorYearPoints, true);
      } else if (catId === '__expenses__') {
        addSeries('Total Expenses', EXPENSE_COLOR, c => !c.isIncome, datePoints, false);
        if (showPriorYear) addSeries('Total Expenses (prior year)', EXPENSE_COLOR, c => !c.isIncome, priorYearPoints, true);
      } else {
        const cat = allCategories.find(c => c.id === catId);
        if (!cat) return;
        const color = CUSTOM_COLORS[i % CUSTOM_COLORS.length];
        addSeries(cat.categoryName, color, c => c.id === catId, datePoints, false);
        if (showPriorYear) addSeries(`${cat.categoryName} (prior year)`, color, c => c.id === catId, priorYearPoints, true);
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
          seriesFilter = t => t.categories.some(c => c.isIncome);
        } else if (catId === '__expenses__') {
          color = EXPENSE_COLOR;
          seriesFilter = t => t.categories.every(c => !c.isIncome);
        } else {
          color = CUSTOM_COLORS[i % CUSTOM_COLORS.length];
          seriesFilter = t => t.categories.some(c => c.id === catId);
        }

        const scatterData = transactions
          .filter(t => {
            const d = new Date(t.dateOfTransaction); d.setHours(0, 0, 0, 0);
            return d >= start && d <= end && seriesFilter(t);
          })
          .map(t => {
            const d = new Date(t.dateOfTransaction); d.setHours(0, 0, 0, 0);
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
