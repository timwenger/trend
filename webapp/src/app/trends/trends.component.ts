import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { Chart, ChartData, ChartOptions, LegendItem } from 'chart.js';
import { ApiService } from '../api.service';
import { Category } from '../category';
import { Transaction } from '../transaction';
import { TrendAggregationService, SeriesSelection, StoredDefaults } from '../trend-aggregation.service';

interface AxisBounds {
  yMin?: number;
  yMax?: number;
  y1Min?: number;
  y1Max?: number;
}

@Component({
  selector: 'app-trends',
  templateUrl: './trends.component.html',
  styleUrls: ['./trends.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class TrendsComponent implements OnInit {

  private readonly chart1RollingDays = 30;
  private readonly chart2RollingDays = 365;

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
  chart1StartAtZero = false;
  chart2StartAtZero = false;

  chart1Start!: Date;
  chart1End!: Date;
  chart2Start!: Date;
  chart2End!: Date;

  chart1Data: ChartData<'line'> = { labels: [], datasets: [] };
  chart2Data: ChartData<'line'> = { labels: [], datasets: [] };

  chart1Options: ChartOptions<'line'> = this.buildChartOptions(this.chart1StartAtZero);
  chart2Options: ChartOptions<'line'> = this.buildChartOptions(this.chart2StartAtZero);

  private activeScrubChart: 1 | 2 | null = null;
  private scrubStartX = 0;
  private scrubAccumulatedPx = 0;
  private activeScrubSpanDays = 1;
  private activeScrubPlotWidthPx = 1;
  private chart1ScrubLightMode = false;
  private chart2ScrubLightMode = false;
  annualDateOnlyScrub = false;

  private buildChartOptions(startAtZero: boolean, disableAnimation = false, fixedBounds?: AxisBounds, showPriorYear = false): ChartOptions<'line'> {
    return {
    responsive: true,
    maintainAspectRatio: false,
    animation: disableAnimation ? false : { duration: 300 },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'line',
          generateLabels: chart => {
            const defaultLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart) as LegendItem[];
            return defaultLabels
              .filter(item => !item.text?.startsWith('__scatter__'))
              .filter(item => !item.text?.endsWith(' (prior year)'))
              .map(item => ({
                ...item,
                text: showPriorYear ? `${item.text} (prior year dashed)` : item.text,
              }));
          },
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
      x: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: window.innerWidth <= 600 ? 4 : 8,
          minRotation: 0,
          maxRotation: 0,
        },
      },
      y: {
        min: fixedBounds?.yMin ?? (startAtZero ? 0 : undefined),
        max: fixedBounds?.yMax,
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
        min: fixedBounds?.y1Min ?? (startAtZero ? 0 : undefined),
        max: fixedBounds?.y1Max,
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
  }

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
    this.chart1StartAtZero = defaults.chart1StartAtZero ?? false;
    this.chart2StartAtZero = defaults.chart2StartAtZero ?? false;
    this.chart1Options = this.buildChartOptions(this.chart1StartAtZero, false, undefined, this.chart1ShowPriorYear);
    this.chart2Options = this.buildChartOptions(this.chart2StartAtZero, false, undefined, this.chart2ShowPriorYear);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.chart1Start = this.aggregation.daysAgoToDate(defaults.chart1DaysAgo);
    this.chart1End = new Date(today);
    this.chart2Start = this.aggregation.daysAgoToDate(defaults.chart2DaysAgo);
    this.chart2End = new Date(today);
  }

  // The earliest date we've already fetched transactions for
  private fetchedFrom: Date = new Date();

  private computeEarliestNeededRaw(): Date {
    // Rolling windows are fixed regardless of displayed date range.
    const span1 = this.chart1RollingDays;
    const span2 = this.chart2RollingDays;

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

  private computeFetchStartDate(rawEarliestNeeded: Date): Date {
    const msPerDay = 86_400_000;

    // Fetch 2x the currently needed history so scrubbing can move backwards
    // without triggering immediate re-fetches.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fetchStart = new Date(rawEarliestNeeded);
    const neededDays = Math.max(1, Math.ceil((today.getTime() - rawEarliestNeeded.getTime()) / msPerDay));
    fetchStart.setDate(fetchStart.getDate() - neededDays);

    return fetchStart;
  }

  private fetchTransactions(): void {
    const rawEarliest = this.computeEarliestNeededRaw();
    const fetchStart = this.computeFetchStartDate(rawEarliest);
    this.fetchedFrom = new Date(fetchStart);

    const today = new Date();
    const filter = {
      dateFilter: true,
      dateOldest: fetchStart.toISOString().split('T')[0],
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
    const needed = this.computeEarliestNeededRaw();
    if (needed < this.fetchedFrom) {
      // Need older data — re-fetch everything, then rebuild both charts
      this.loading = true;
      this.cdr.markForCheck();
      this.fetchTransactions();
    } else {
      // Data already covers it — only rebuild the affected chart
      if (chartNum === 1) {
        this.chart1Options = this.buildChartOptions(this.chart1StartAtZero, false, undefined, this.chart1ShowPriorYear);
        this.refreshChart1();
      } else {
        this.chart2Options = this.buildChartOptions(this.chart2StartAtZero, false, undefined, this.chart2ShowPriorYear);
        this.refreshChart2();
      }
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

  onStartAtZeroChange(chartNum: 1 | 2): void {
    this.defaultSaved = false;
    if (chartNum === 1) {
      this.chart1Options = this.buildChartOptions(this.chart1StartAtZero, false, undefined, this.chart1ShowPriorYear);
    } else {
      this.chart2Options = this.buildChartOptions(this.chart2StartAtZero, false, undefined, this.chart2ShowPriorYear);
    }
    this.saveYAxisDefaultsToStorage();
    this.cdr.markForCheck();
  }

  private saveScatterToStorage(): void {
    const defaults = this.aggregation.loadDefaults();
    defaults.chart1ShowScatter = this.chart1ShowScatter;
    defaults.chart2ShowScatter = this.chart2ShowScatter;
    this.aggregation.saveDefaults(defaults);
  }

  private saveYAxisDefaultsToStorage(): void {
    const defaults = this.aggregation.loadDefaults();
    defaults.chart1StartAtZero = this.chart1StartAtZero;
    defaults.chart2StartAtZero = this.chart2StartAtZero;
    this.aggregation.saveDefaults(defaults);
  }

  onDateChange(): void {
    this.defaultSaved = false;
    // Re-fetch if the new date range needs older data than we already have
    const needed = this.computeEarliestNeededRaw();
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
      this.chart1StartAtZero, this.chart2StartAtZero,
    );
    this.aggregation.saveDefaults(defaults);
    this.defaultSaved = true;
    this.cdr.markForCheck();
  }

  private refreshChart1(): void {
    const showPriorYear = this.chart1ShowPriorYear && !this.chart1ScrubLightMode;
    const showScatter = this.chart1ShowScatter && !this.chart1ScrubLightMode;
    this.chart1Data = this.aggregation.buildChartData(
      this.chart1Start, this.chart1End,
      this.transactions, this.allCategories, this.selection,
      this.chart1RollingDays,
      showPriorYear,
      showScatter,
    );
  }

  private refreshChart2(): void {
    const showPriorYear = this.chart2ShowPriorYear && !this.chart2ScrubLightMode;
    const showScatter = this.chart2ShowScatter && !this.chart2ScrubLightMode;
    this.chart2Data = this.aggregation.buildChartData(
      this.chart2Start, this.chart2End,
      this.transactions, this.allCategories, this.selection,
      this.chart2RollingDays,
      showPriorYear,
      showScatter,
    );
  }

  private refreshCharts(): void {
    this.refreshChart1();
    this.refreshChart2();
  }

  private getFixedBoundsForScrub(chartData: ChartData<'line'>, startAtZero: boolean): AxisBounds {
    let yMin = Number.POSITIVE_INFINITY;
    let yMax = Number.NEGATIVE_INFINITY;
    let y1Min = Number.POSITIVE_INFINITY;
    let y1Max = Number.NEGATIVE_INFINITY;

    for (const dataset of chartData.datasets) {
      const values = (dataset.data ?? []) as Array<number | { y?: number }>;
      for (const point of values) {
        const value = typeof point === 'number' ? point : point?.y;
        if (typeof value !== 'number' || Number.isNaN(value)) continue;

        if ((dataset as any).yAxisID === 'y1') {
          if (value < y1Min) y1Min = value;
          if (value > y1Max) y1Max = value;
        } else {
          if (value < yMin) yMin = value;
          if (value > yMax) yMax = value;
        }
      }
    }

    const normalized = (min: number, max: number): { min?: number; max?: number } => {
      if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: undefined, max: undefined };
      if (startAtZero) min = 0;
      if (min === max) {
        const delta = Math.max(10, Math.abs(min) * 0.05);
        min -= delta;
        max += delta;
      }

      const range = Math.max(1, max - min);
      const paddedMin = startAtZero ? 0 : (min - range * 0.05);
      const paddedMax = max + range * 0.05;

      // Snap bounds to a "nice" step (1/2/5 x 10^n) so drag-time axis labels
      // are stable and easy to read.
      const targetTicks = 6;
      const roughStep = Math.max(1, (paddedMax - paddedMin) / targetTicks);
      const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
      const residual = roughStep / magnitude;

      let niceResidual = 10;
      if (residual <= 1) niceResidual = 1;
      else if (residual <= 2) niceResidual = 2;
      else if (residual <= 5) niceResidual = 5;

      const step = niceResidual * magnitude;
      const niceMin = startAtZero ? 0 : Math.floor(paddedMin / step) * step;
      const niceMax = Math.ceil(paddedMax / step) * step;

      return { min: niceMin, max: niceMax };
    };

    const y = normalized(yMin, yMax);
    const y1 = normalized(y1Min, y1Max);
    return {
      yMin: y.min,
      yMax: y.max,
      y1Min: y1.min,
      y1Max: y1.max,
    };
  }

  onChartScrubStart(chartNum: 1 | 2, event: PointerEvent): void {
    this.activeScrubChart = chartNum;
    this.scrubStartX = event.clientX;
    this.scrubAccumulatedPx = 0;

    const container = event.currentTarget as HTMLElement | null;
    this.activeScrubPlotWidthPx = Math.max(1, container?.clientWidth ?? 1);
    const msPerDay = 86_400_000;
    const spanStart = chartNum === 1 ? this.chart1Start : this.chart2Start;
    const spanEnd = chartNum === 1 ? this.chart1End : this.chart2End;
    this.activeScrubSpanDays = Math.max(1, Math.round((spanEnd.getTime() - spanStart.getTime()) / msPerDay));

    if (chartNum === 1) {
      const fixedBounds = this.getFixedBoundsForScrub(this.chart1Data, this.chart1StartAtZero);
      this.chart1ScrubLightMode = true;
      this.chart1Options = this.buildChartOptions(this.chart1StartAtZero, true, fixedBounds, this.chart1ShowPriorYear);
      this.refreshChart1();
    } else {
      this.annualDateOnlyScrub = true;
      const fixedBounds = this.getFixedBoundsForScrub(this.chart2Data, this.chart2StartAtZero);
      this.chart2ScrubLightMode = true;
      this.chart2Options = this.buildChartOptions(this.chart2StartAtZero, true, fixedBounds, this.chart2ShowPriorYear);
      // Skip chart re-render at scrub start for annual chart; we only update dates while dragging.
    }
    this.cdr.markForCheck();
  }

  @HostListener('window:pointermove', ['$event'])
  onGlobalPointerMove(event: PointerEvent): void {
    if (this.activeScrubChart === null) return;

    const delta = event.clientX - this.scrubStartX;
    this.scrubStartX = event.clientX;
    this.scrubAccumulatedPx += delta;

    const daysPerPixel = this.activeScrubSpanDays / this.activeScrubPlotWidthPx;
    const dayShift = Math.trunc(this.scrubAccumulatedPx * daysPerPixel);
    if (dayShift === 0) return;

    const consumedPx = dayShift / daysPerPixel;
    this.scrubAccumulatedPx -= consumedPx;
    this.shiftChartWindow(this.activeScrubChart, -dayShift);
  }

  @HostListener('window:pointerup')
  onGlobalPointerUp(): void {
    if (this.activeScrubChart === 1) {
      this.chart1ScrubLightMode = false;
      this.chart1Options = this.buildChartOptions(this.chart1StartAtZero, false, undefined, this.chart1ShowPriorYear);
      this.refreshChart1();
    } else if (this.activeScrubChart === 2) {
      this.annualDateOnlyScrub = false;
      this.chart2ScrubLightMode = false;
      this.chart2Options = this.buildChartOptions(this.chart2StartAtZero, false, undefined, this.chart2ShowPriorYear);
      this.refreshChart2();
    }
    this.activeScrubChart = null;
    this.scrubAccumulatedPx = 0;
    this.activeScrubSpanDays = 1;
    this.activeScrubPlotWidthPx = 1;
    this.cdr.markForCheck();
  }

  @HostListener('window:pointercancel')
  onGlobalPointerCancel(): void {
    this.onGlobalPointerUp();
  }

  private shiftChartWindow(chartNum: 1 | 2, shiftDays: number): void {
    if (shiftDays === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (chartNum === 1) {
      const nextStart = new Date(this.chart1Start);
      const nextEnd = new Date(this.chart1End);
      nextStart.setDate(nextStart.getDate() + shiftDays);
      nextEnd.setDate(nextEnd.getDate() + shiftDays);
      if (nextEnd > today) return;
      this.chart1Start = nextStart;
      this.chart1End = nextEnd;
    } else {
      const nextStart = new Date(this.chart2Start);
      const nextEnd = new Date(this.chart2End);
      nextStart.setDate(nextStart.getDate() + shiftDays);
      nextEnd.setDate(nextEnd.getDate() + shiftDays);
      if (nextEnd > today) return;
      this.chart2Start = nextStart;
      this.chart2End = nextEnd;
    }

    const needed = this.computeEarliestNeededRaw();
    if (needed < this.fetchedFrom) {
      this.loading = true;
      this.cdr.markForCheck();
      this.fetchTransactions();
      return;
    }

    if (chartNum === 1) {
      this.refreshChart1();
    } else if (!this.annualDateOnlyScrub) {
      this.refreshChart2();
    }
    this.cdr.markForCheck();
  }

  get annualScrubXAxisLabels(): string[] {
    const maxTicksLimit = window.innerWidth <= 600 ? 4 : 8;
    const plotWidth = Math.max(1, this.activeScrubPlotWidthPx);
    // Approximate Chart.js autoskip by enforcing a minimum pixel budget per label.
    const minPixelsPerLabel = 120;
    const widthConstrainedTicks = Math.floor(plotWidth / minPixelsPerLabel);
    const ticks = Math.max(2, Math.min(maxTicksLimit, widthConstrainedTicks));
    const labels: string[] = [];
    const start = new Date(this.chart2Start);
    const end = new Date(this.chart2End);
    const totalMs = end.getTime() - start.getTime();

    for (let i = 0; i < ticks; i++) {
      const ratio = ticks === 1 ? 0 : i / (ticks - 1);
      const d = new Date(start.getTime() + totalMs * ratio);
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const day = d.getDate();
      const yy = String(d.getFullYear() % 100).padStart(2, '0');
      labels.push(`${month} ${day} '${yy}`);
    }

    return labels;
  }
}

