import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService, MessageService, SortEvent } from 'primeng/api';
import { forkJoin, switchMap } from 'rxjs';
import { ApiService } from '../api.service';
import { Category, categorySelectionValidator } from '../category';
import { Transaction } from '../transaction';
import { TransactionRule, TransactionRuleConfig } from '../transaction-rule';
import { Bind } from 'primeng/bind';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { DatePicker } from 'primeng/datepicker';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { CategoryMultiselectComponent } from '../category-multiselect/category-multiselect.component';
import { Button, ButtonDirective, ButtonIcon } from 'primeng/button';
import { Table, SortableColumn, SortIcon } from 'primeng/table';
import { Ripple } from 'primeng/ripple';
import { NgTemplateOutlet, CurrencyPipe, DatePipe } from '@angular/common';
import { TransactionsComponent } from '../transactions/transactions.component';
import { Dialog } from 'primeng/dialog';
import { TouchFocusDirective } from '../touch-focus.directive';

type RecurrenceUnit = 'days' | 'weeks' | 'months';

@Component({
    selector: 'app-recurring-transactions',
    templateUrl: './recurring-transactions.component.html',
    styleUrls: ['./recurring-transactions.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        Bind,
        ConfirmDialog,
        FormsModule,
        ReactiveFormsModule,
        DatePicker,
        Checkbox,
        InputText,
        TouchFocusDirective,
        Select,
        CategoryMultiselectComponent,
        Button,
        Table,
        SortableColumn,
        SortIcon,
        ButtonDirective,
        Ripple,
        ButtonIcon,
        NgTemplateOutlet,
        TransactionsComponent,
        Dialog,
        CurrencyPipe,
        DatePipe,
    ],
})
export class RecurringTransactionsComponent implements OnInit {
  ruleForm = new FormGroup({
    startDate: new FormControl<Date>(this.today(), { nonNullable: true, validators: Validators.required }),
    amount: new FormControl<number | null>(null, Validators.required),
    categories: new FormControl<Category[]>([], {
      nonNullable: true,
      validators: [Validators.required, categorySelectionValidator()],
    }),
    description: new FormControl<string>('', { nonNullable: true }),
    recurrenceInterval: new FormControl<number>(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    recurrenceUnit: new FormControl<RecurrenceUnit>('months', { nonNullable: true, validators: Validators.required }),
    useMonthEnd: new FormControl<boolean>(false, { nonNullable: true }),
    hasEndDate: new FormControl<boolean>(false, { nonNullable: true }),
    endDate: new FormControl<Date | null>({ value: this.oneYearFromToday(), disabled: true }),
  });

  allCategories: Category[] = [];
  transactionRules: TransactionRule[] = [];
  pendingTransactions: Transaction[] = [];
  editingRule: TransactionRule | null = null;
  reactivationTarget: TransactionRule | null = null;
  reactivationDialogVisible = false;

  readonly recurrenceUnits = [
    { label: 'Days', value: 'days' as RecurrenceUnit },
    { label: 'Weeks', value: 'weeks' as RecurrenceUnit },
    { label: 'Months', value: 'months' as RecurrenceUnit },
  ];

  constructor(
    private apiService: ApiService,
    private confirmationService: ConfirmationService,
    private toastService: MessageService,
  ) { }

  ngOnInit(): void {
    this.loadAll();
    this.ruleForm.controls.recurrenceUnit.valueChanges.subscribe(unit => {
      if (unit === 'months') {
        this.ruleForm.controls.useMonthEnd.enable({ emitEvent: false });
      } else {
        this.ruleForm.controls.useMonthEnd.setValue(false);
        this.ruleForm.controls.useMonthEnd.disable({ emitEvent: false });
      }
    });
    this.ruleForm.controls.hasEndDate.valueChanges.subscribe(hasEndDate => {
      if (hasEndDate) {
        this.ruleForm.controls.endDate.enable();
      } else {
        this.ruleForm.controls.endDate.disable();
      }
    });
  }

  get activeRules(): TransactionRule[] {
    return this.transactionRules.filter(rule => !rule.isInactive);
  }

  get inactiveRules(): TransactionRule[] {
    return this.transactionRules.filter(rule => rule.isInactive);
  }

  get isEditingRule(): boolean {
    return this.editingRule != null;
  }

  get recurrenceSummary(): string {
    const value = this.ruleForm.getRawValue();
    const interval = Math.max(1, value.recurrenceInterval || 1);
    const unit = interval === 1 ? value.recurrenceUnit.slice(0, -1) : value.recurrenceUnit;
    const firstOccurrence = this.firstOccurrence(value.startDate, value.recurrenceUnit, value.useMonthEnd);
    const cadence = `every ${interval} ${unit}`;

    if (!value.hasEndDate) {
      return `Repeats indefinitely ${cadence}, with first occurrence on ${this.formatDate(firstOccurrence)}.`;
    }

    if (!value.endDate) {
      return `Repeats ${cadence}, with first occurrence on ${this.formatDate(firstOccurrence)}.`;
    }

    const occurrenceRange = this.occurrenceRange(
      firstOccurrence,
      value.endDate,
      value.startDate,
      interval,
      value.recurrenceUnit,
      value.useMonthEnd,
    );
    if (!occurrenceRange.lastOccurrence) {
      return `Repeats ${cadence}, but no occurrence falls between Active From and Active Until. 0 occurrences in total.`;
    }

    const occurrenceLabel = occurrenceRange.count === 1 ? 'occurrence' : 'occurrences';
    return `Repeats ${cadence}, with first occurrence on ${this.formatDate(firstOccurrence)} and last occurrence on ${this.formatDate(occurrenceRange.lastOccurrence)}. ${occurrenceRange.count} ${occurrenceLabel} in total.`;
  }

  onFormKeyDown(event: KeyboardEvent): void {
    if (!event.ctrlKey || event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.onCategoryShortcut();
  }

  onCategoryShortcut(): void {
    if (this.ruleForm.valid && this.hasValidEndDate()) {
      this.saveRule();
    }
  }

  saveRule(): void {
    if (this.ruleForm.invalid || !this.hasValidEndDate()) {
      this.ruleForm.markAllAsTouched();
      return;
    }

    const config = this.buildRuleConfig();
    if (!this.editingRule) {
      this.apiService.addTransactionRule(config).subscribe(() => {
        this.resetRuleForm();
        this.loadRulesAndPending();
      });
      return;
    }

    const pendingCount = this.pendingForRule(this.editingRule).length;
    this.confirmChange(
      'Update rule?',
      pendingCount > 0
        ? `${pendingCount} pending transaction${pendingCount === 1 ? '' : 's'} will be removed and recalculated. Any pending edits will be lost.`
        : 'The rule will be updated and pending transactions recalculated.',
      'Update',
      () => this.updateRule(config),
    );
  }

  editRule(rule: TransactionRule): void {
    this.editingRule = rule;
    const endDate = rule.endDate ? new Date(rule.endDate) : this.oneYearFromToday();
    this.ruleForm.setValue({
      startDate: new Date(rule.startDate),
      amount: rule.amount,
      categories: [...rule.categories],
      description: rule.transactionDescription ?? '',
      recurrenceInterval: rule.recurrenceInterval,
      recurrenceUnit: rule.recurrenceUnit,
      useMonthEnd: rule.useMonthEnd,
      hasEndDate: rule.endDate != null,
      endDate,
    });
    if (rule.endDate) this.ruleForm.controls.endDate.enable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelRuleEdit(): void {
    this.editingRule = null;
    this.resetRuleForm();
  }

  pauseRule(rule: TransactionRule): void {
    const pendingCount = this.pendingForRule(rule).length;
    this.confirmChange(
      'Pause rule?',
      `${pendingCount} pending transaction${pendingCount === 1 ? '' : 's'} will be removed. Accepted transactions will remain unchanged.`,
      'Pause',
      () => this.setRuleStatus(rule, true, false),
    );
  }

  beginReactivation(rule: TransactionRule): void {
    this.reactivationTarget = rule;
    this.reactivationDialogVisible = true;
  }

  reactivate(catchUpMissed: boolean): void {
    if (!this.reactivationTarget) return;
    this.setRuleStatus(this.reactivationTarget, false, catchUpMissed);
    this.cancelReactivation();
  }

  cancelReactivation(): void {
    this.reactivationDialogVisible = false;
    this.reactivationTarget = null;
  }

  deleteRule(rule: TransactionRule): void {
    const pendingCount = this.pendingForRule(rule).length;
    this.confirmChange(
      'Delete rule?',
      `${pendingCount} pending transaction${pendingCount === 1 ? '' : 's'} will be removed. Accepted transactions will remain unchanged.`,
      'Delete',
      () => this.apiService.deleteTransactionRule(rule).subscribe(() => {
        if (this.editingRule?.id === rule.id) this.cancelRuleEdit();
        this.loadRulesAndPending();
      }),
      true,
    );
  }

  savePending(transaction: Transaction): void {
    this.apiService.updateTransaction({ ...transaction, recurringStatus: 'Pending' }).subscribe();
  }

  acceptPending(transaction: Transaction): void {
    this.apiService.updateTransaction({ ...transaction, recurringStatus: 'Accepted' })
      .subscribe(() => this.removePending(transaction.id));
  }

  skipPending(transaction: Transaction): void {
    this.apiService.updateTransaction({ ...transaction, recurringStatus: 'Skipped' })
      .subscribe(() => this.removePending(transaction.id));
  }

  acceptAllPending(): void {
    if (this.pendingTransactions.length === 0) return;
    this.confirmChange(
      'Accept all pending transactions?',
      `${this.pendingTransactions.length} pending transactions will be posted.`,
      'Accept All',
      () => {
        const pending = [...this.pendingTransactions];
        forkJoin(pending.map(transaction => this.apiService.updateTransaction({
          ...transaction,
          recurringStatus: 'Accepted',
        }))).subscribe(() => {
          const acceptedIds = new Set(pending.map(transaction => transaction.id));
          this.pendingTransactions = this.pendingTransactions
            .filter(transaction => !acceptedIds.has(transaction.id));
          this.toastService.add({
            severity: 'success',
            summary: 'Transactions accepted',
            detail: `${pending.length} transaction${pending.length === 1 ? '' : 's'} accepted.`,
          });
        });
      },
    );
  }

  describeSchedule(rule: TransactionRule): string {
    if (rule.useMonthEnd) return 'Last day of every month';
    const unit = rule.recurrenceInterval === 1 ? rule.recurrenceUnit.slice(0, -1) : rule.recurrenceUnit;
    return `Every ${rule.recurrenceInterval} ${unit}`;
  }

  sortRules(event: SortEvent): void {
    const rules = event.data as TransactionRule[] | undefined;
    const field = event.field;
    const order = event.order ?? 1;
    if (!rules || !field) return;

    rules.sort((left, right) => order * this.compareRuleField(left, right, field));
  }

  private compareRuleField(left: TransactionRule, right: TransactionRule, field: string): number {
    switch (field) {
      case 'startDate':
        return left.startDate.getTime() - right.startDate.getTime();
      case 'schedule':
        return this.compareText(this.describeSchedule(left), this.describeSchedule(right));
      case 'categories':
        return this.compareText(this.categorySortValue(left), this.categorySortValue(right));
      case 'amount':
        return left.amount - right.amount;
      case 'endDate':
        return (left.endDate?.getTime() ?? Number.POSITIVE_INFINITY)
          - (right.endDate?.getTime() ?? Number.POSITIVE_INFINITY);
      default:
        return 0;
    }
  }

  private categorySortValue(rule: TransactionRule): string {
    return rule.categories
      .map(category => category.categoryName)
      .sort((left, right) => this.compareText(left, right))
      .join(', ');
  }

  private compareText(left: string, right: string): number {
    return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
  }

  private updateRule(config: TransactionRuleConfig): void {
    if (!this.editingRule) return;
    const updated: TransactionRule = { ...this.editingRule, ...config };
    this.apiService.updateTransactionRule(updated).subscribe(() => {
      this.editingRule = null;
      this.resetRuleForm();
      this.loadRulesAndPending();
    });
  }

  private setRuleStatus(rule: TransactionRule, isInactive: boolean, catchUpMissed: boolean): void {
    this.apiService.setTransactionRuleStatus(rule, isInactive, catchUpMissed)
      .subscribe(() => this.loadRulesAndPending());
  }

  private pendingForRule(rule: TransactionRule): Transaction[] {
    return this.pendingTransactions.filter(transaction => transaction.transactionRuleId === rule.id);
  }

  private removePending(id: string): void {
    this.pendingTransactions = this.pendingTransactions.filter(transaction => transaction.id !== id);
  }

  private buildRuleConfig(): TransactionRuleConfig {
    const value = this.ruleForm.getRawValue();
    return {
      startDate: value.startDate,
      endDate: value.hasEndDate ? value.endDate : null,
      recurrenceInterval: value.recurrenceInterval,
      recurrenceUnit: value.recurrenceUnit,
      useMonthEnd: value.useMonthEnd,
      amount: value.amount!,
      transactionDescription: value.description.trim(),
      categories: value.categories,
    };
  }

  private hasValidEndDate(): boolean {
    const value = this.ruleForm.getRawValue();
    return !value.hasEndDate || (value.endDate != null && value.endDate >= value.startDate);
  }

  private firstOccurrence(startDate: Date, unit: RecurrenceUnit, useMonthEnd: boolean): Date {
    const start = this.dateOnly(startDate);
    return unit === 'months' && useMonthEnd
      ? new Date(start.getFullYear(), start.getMonth() + 1, 0)
      : start;
  }

  private occurrenceRange(
    firstOccurrence: Date,
    endDate: Date,
    startDate: Date,
    interval: number,
    unit: RecurrenceUnit,
    useMonthEnd: boolean,
  ): { lastOccurrence: Date | null; count: number } {
    const end = this.dateOnly(endDate);
    if (firstOccurrence > end) return { lastOccurrence: null, count: 0 };

    let occurrence = firstOccurrence;
    let count = 1;
    while (true) {
      const next = this.nextOccurrence(occurrence, startDate, interval, unit, useMonthEnd);
      if (next > end) return { lastOccurrence: occurrence, count };
      occurrence = next;
      count++;
    }
  }

  private nextOccurrence(
    current: Date,
    startDate: Date,
    interval: number,
    unit: RecurrenceUnit,
    useMonthEnd: boolean,
  ): Date {
    if (unit === 'days') {
      const next = this.dateOnly(current);
      next.setDate(next.getDate() + interval);
      return next;
    }

    if (unit === 'weeks') {
      const next = this.dateOnly(current);
      next.setDate(next.getDate() + (7 * interval));
      return next;
    }

    const targetMonth = new Date(current.getFullYear(), current.getMonth() + interval, 1);
    if (useMonthEnd) {
      return new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
    }

    const anchorDay = this.dateOnly(startDate).getDate();
    const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
    return new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(anchorDay, lastDay));
  }

  private formatDate(value: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }).format(value);
  }

  private dateOnly(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  private loadAll(): void {
    this.apiService.generatePendingTransactions()
      .pipe(switchMap(() => forkJoin({
        categories: this.apiService.getCategories(),
        rules: this.apiService.getTransactionRules(),
        pending: this.apiService.getPendingTransactions(),
      })))
      .subscribe(({ categories, rules, pending }) => {
        this.allCategories = categories;
        this.transactionRules = this.normalizeRules(rules);
        this.setPendingTransactions(pending);
      });
  }

  private loadRulesAndPending(): void {
    this.apiService.getTransactionRules().subscribe(rules => {
      this.transactionRules = this.normalizeRules(rules);
      this.loadPending();
    });
  }

  private loadPending(): void {
    this.apiService.getPendingTransactions().subscribe(transactions => {
      this.setPendingTransactions(transactions);
    });
  }

  private setPendingTransactions(transactions: Transaction[]): void {
    this.pendingTransactions = transactions.map(transaction => ({
      ...transaction,
      dateOfTransaction: new Date(transaction.dateOfTransaction),
      scheduledOccurrenceDate: transaction.scheduledOccurrenceDate
        ? new Date(transaction.scheduledOccurrenceDate)
        : undefined,
    }));
  }

  private normalizeRules(rules: TransactionRule[]): TransactionRule[] {
    return rules.map(rule => ({
      ...rule,
      startDate: new Date(rule.startDate),
      generateFromDate: new Date(rule.generateFromDate),
      endDate: rule.endDate ? new Date(rule.endDate) : null,
    }));
  }

  private resetRuleForm(): void {
    this.ruleForm.reset({
      startDate: this.today(), amount: null, categories: [], description: '', recurrenceInterval: 1,
      recurrenceUnit: 'months', useMonthEnd: false, hasEndDate: false, endDate: this.oneYearFromToday(),
    });
    this.ruleForm.controls.endDate.disable();
  }

  private confirmChange(
    header: string,
    message: string,
    acceptLabel: string,
    accept: () => void,
    danger = false,
  ): void {
    this.confirmationService.confirm({
      header, message, icon: 'pi pi-exclamation-triangle', acceptLabel,
      acceptButtonStyleClass: danger ? 'p-button-danger' : undefined, accept,
    });
  }

  private today(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private oneYearFromToday(): Date {
    const date = this.today();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  }
}