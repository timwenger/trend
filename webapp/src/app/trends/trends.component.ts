import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { ApiService } from '../api.service';
import { Category } from '../category';
import { Transaction } from '../transaction';
import { TrendAggregationService, SeriesSelection, StoredDefaults } from '../trend-aggregation.service';

@Component({
  selector: 'app-trends',
  templateUrl: './trends.component.html',
  styleUrls: ['./trends.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class TrendsComponent implements OnInit {

  allCategories: Category[] = [];
  transactions: Transaction[] = [];
  loading = true;
  errorMessage = '';
  defaultSaved = false;

  selection: SeriesSelection = {
    customCategoryIds: ['__income__', '__expenses__'],
  };

  chart1ShowPriorYear = true;
  chart2ShowPriorYear = false;
  chart1ShowScatter = true;
  chart2ShowScatter = false;

  totalIncome = 0;
  totalExpenses = 0;

  chart1Start!: Date;
  chart1End!: Date;
  chart2Start!: Date;
  chart2End!: Date;

  chart1Data: ChartData<'line'> = { labels: [], datasets: [] };
  chart2Data: ChartData<'line'> = { labels: [], datasets: [] };

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'line',
          filter: item => !item.text?.startsWith('__scatter__'),
        },
      },
      tooltip: {
        callbacks: {
          label: ctx => {
            const raw = ctx.raw as any;
            if (raw?.desc !== undefined) {
              const amt = (raw.y as number).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return ` ${raw.desc} [${raw.cats}]: $${amt}`;
            }
            return ` $${((ctx.parsed.y ?? 0) as number).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: value => {
            const n = +value;
            if (Math.abs(n) >= 1_000_000) return `$${n / 1_000_000}M`;
            if (Math.abs(n) >= 1_000) return `$${n / 1_000}k`;
            return `$${n}`;
          },
        },
      },
      y1: {
        display: window.innerWidth > 600 ? 'auto' : false,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: {
          callback: value => {
            const n = +value;
            if (Math.abs(n) >= 1_000_000) return `$${n / 1_000_000}M`;
            if (Math.abs(n) >= 1_000) return `$${n / 1_000}k`;
            return `$${n}`;
          },
        },
      },
    },
  };

  get categoryGroupOptions() {
    return [
      {
        label: 'Totals',
        items: [
          { id: '__income__', categoryName: 'Total Income' },
          { id: '__expenses__', categoryName: 'Total Expenses' },
        ],
      },
      {
        label: 'Categories',
        items: this.allCategories,
      },
    ];
  }

  constructor(
    private apiService: ApiService,
    private aggregation: TrendAggregationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const defaults = this.aggregation.loadDefaults();
    this.applyDefaults(defaults);

    this.apiService.getCategories().subscribe({
      next: categories => {
        this.allCategories = categories;
        this.fetchTransactions();
      },
      error: () => {
        this.errorMessage = 'Failed to load categories.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private applyDefaults(defaults: StoredDefaults): void {
    this.selection = {
      customCategoryIds: [...defaults.customCategoryIds],
    };
    this.chart1ShowPriorYear = defaults.chart1ShowPriorYear;
    this.chart2ShowPriorYear = defaults.chart2ShowPriorYear;
    this.chart1ShowScatter = defaults.chart1ShowScatter ?? true;
    this.chart2ShowScatter = defaults.chart2ShowScatter ?? false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.chart1Start = this.aggregation.daysAgoToDate(defaults.chart1DaysAgo);
    this.chart1End = new Date(today);
    this.chart2Start = this.aggregation.daysAgoToDate(defaults.chart2DaysAgo);
    this.chart2End = new Date(today);
  }

  // The earliest date we've already fetched transactions for
  private fetchedFrom: Date = new Date();

  private computeEarliestNeeded(): Date {
    const msPerDay = 86_400_000;
    // Trailing window size for each chart = its date span
    const span1 = Math.max(1, Math.round((this.chart1End.getTime() - this.chart1Start.getTime()) / msPerDay));
    const span2 = Math.max(1, Math.round((this.chart2End.getTime() - this.chart2Start.getTime()) / msPerDay));

    // First data point needs data going back windowDays from chartStart
    const base1 = new Date(this.chart1Start); base1.setDate(base1.getDate() - span1);
    const base2 = new Date(this.chart2Start); base2.setDate(base2.getDate() - span2);
    let earliest = base1 < base2 ? base1 : base2;

    // Prior-year pushes each base back another year
    if (this.chart1ShowPriorYear) {
      const py1 = new Date(base1); py1.setFullYear(py1.getFullYear() - 1);
      if (py1 < earliest) earliest = py1;
    }
    if (this.chart2ShowPriorYear) {
      const py2 = new Date(base2); py2.setFullYear(py2.getFullYear() - 1);
      if (py2 < earliest) earliest = py2;
    }
    return earliest;
  }

  private fetchTransactions(): void {
    const earliest = this.computeEarliestNeeded();
    this.fetchedFrom = new Date(earliest);

    const today = new Date();
    const filter = {
      dateFilter: true,
      dateOldest: earliest.toISOString().split('T')[0],
      dateLatest: today.toISOString().split('T')[0],
      categoryFilter: false,
      selectedCategoryIds: [],
    };

    this.apiService.getTransactions(filter).subscribe({
      next: transactions => {
        this.transactions = transactions;
        this.loading = false;
        this.refreshCharts();
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Failed to load transactions.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSelectionChange(): void {
    this.defaultSaved = false;
    this.refreshChart1();
    this.refreshChart2();
    this.cdr.markForCheck();
  }

  onPriorYearChange(chartNum: 1 | 2): void {
    this.defaultSaved = false;
    const needed = this.computeEarliestNeeded();
    if (needed < this.fetchedFrom) {
      // Need older data — re-fetch everything, then rebuild both charts
      this.loading = true;
      this.cdr.markForCheck();
      this.fetchTransactions();
    } else {
      // Data already covers it — only rebuild the affected chart
      if (chartNum === 1) this.refreshChart1();
      else this.refreshChart2();
      this.cdr.markForCheck();
    }
  }

  onChart1ScatterChange(): void {
    this.defaultSaved = false;
    this.saveScatterToStorage();
    this.refreshChart1();
    this.cdr.markForCheck();
  }

  onChart2ScatterChange(): void {
    this.defaultSaved = false;
    this.saveScatterToStorage();
    this.refreshChart2();
    this.cdr.markForCheck();
  }

  private saveScatterToStorage(): void {
    const defaults = this.aggregation.loadDefaults();
    defaults.chart1ShowScatter = this.chart1ShowScatter;
    defaults.chart2ShowScatter = this.chart2ShowScatter;
    this.aggregation.saveDefaults(defaults);
  }

  onDateChange(): void {
    this.defaultSaved = false;
    // Re-fetch if the new date range needs older data than we already have
    const needed = this.computeEarliestNeeded();
    if (needed < this.fetchedFrom) {
      this.loading = true;
      this.cdr.markForCheck();
      this.fetchTransactions();
    } else {
      this.refreshCharts();
      this.cdr.markForCheck();
    }
  }

  saveAsDefault(): void {
    const defaults = this.aggregation.defaultsFromCurrentState(
      this.selection, this.chart1Start, this.chart2Start,
      this.chart1ShowPriorYear, this.chart2ShowPriorYear,
      this.chart1ShowScatter, this.chart2ShowScatter,
    );
    this.aggregation.saveDefaults(defaults);
    this.defaultSaved = true;
    this.cdr.markForCheck();
  }

  private refreshChart1(): void {
    const t1 = this.aggregation.computeTotals(this.chart1Start, this.chart1End, this.transactions);
    this.totalIncome = t1.income;
    this.totalExpenses = t1.expenses;
    this.chart1Data = this.aggregation.buildChartData(
      this.chart1Start, this.chart1End,
      this.transactions, this.allCategories, this.selection,
      this.chart1ShowPriorYear,
      this.chart1ShowScatter,
    );
  }

  private refreshChart2(): void {
    this.chart2Data = this.aggregation.buildChartData(
      this.chart2Start, this.chart2End,
      this.transactions, this.allCategories, this.selection,
      this.chart2ShowPriorYear,
      this.chart2ShowScatter,
    );
  }

  private refreshCharts(): void {
    this.refreshChart1();
    this.refreshChart2();
  }
}

