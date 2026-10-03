import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ApiService } from '../api.service';
import { Category, getCategoryTransactionType } from '../category';
import { Transaction } from '../transaction';
import { TransactionFilters } from '../transactionfilters';
import { UtilityService } from '../utility.service';
import { ConfirmationService, MessageService as PrimeMessageService } from 'primeng/api';
import { forkJoin, switchMap } from 'rxjs';

@Component({
    selector: 'app-transactions-filter',
    templateUrl: './transactions-filter.component.html',
    styleUrls: ['./transactions-filter.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TransactionsFilterComponent implements OnInit {
  filterForm!: UntypedFormGroup;
  configuredFilter!: TransactionFilters;

  allCategories: Category[] = [];
  pendingTransactions: Transaction[] = [];
  transactionsFromFilter: Transaction[] = [];
  pendingExpensesAmount: number = 0;
  pendingIncomeAmount: number = 0;
  postedExpensesAmount: number = 0;
  postedIncomeAmount: number = 0;
  noCategories: boolean = false;

  constructor(
    private apiService: ApiService,
    private utilityService: UtilityService,
    private confirmationService: ConfirmationService,
    private toastService: PrimeMessageService,
  ) { }

  ngOnInit(): void {
    this.createForm();
    this.apiService.generatePendingTransactions()
      .pipe(switchMap(() => this.apiService.getCategories()))
      .subscribe(categoriesReturned => {
        this.allCategories = categoriesReturned;
        this.refreshTransactions();
        if(categoriesReturned.length == 0)
          this.noCategories = true;
      });
  }

  createForm() {
    let oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    this.filterForm = new UntypedFormGroup({
      dateOfOldestTransaction: new UntypedFormControl(oneMonthAgo),
      dateOfLatestTransaction: new UntypedFormControl(new Date()),
      multiSelectDropdown: new UntypedFormControl(),
      searchText: new UntypedFormControl(''),
      match: new UntypedFormControl('All'),
    }, { validators: this.dateValidator('dateOfOldestTransaction', 'dateOfLatestTransaction') });
  }

  dateValidator(oldest: string, latest: string) {
    return (group: AbstractControl): object | null => {
      let fgroup = group as UntypedFormGroup
      let oldestDate = fgroup.controls[oldest].value;
      let latestDate = fgroup.controls[latest].value;
      if (oldestDate > latestDate) {
        return {
          datesError: { message: "Oldest date is more recent than latest date. Sorry kid : )" }
        };
      }
      return null;
    }
  }

  onSubmit() {
    this.refreshTransactions();
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
    if (this.hasValidDateRange()) {
      this.onSubmit();
    }
  }

  setMatch(match: 'All' | 'Any'): void {
    this.filterForm.controls['match'].setValue(match);
  }

  onTransactionAdded(newTransaction: Transaction): void {
    this.refreshTransactions(newTransaction);
  }

  private refreshTransactions(addedTransaction?: Transaction): void {
    if (!this.filterForm || !this.hasValidDateRange()) {
      return;
    }

    let filter = this.buildFilter(this.filterForm, 'Posted');
    this.getTransactions(filter, addedTransaction);
  }

  hasValidDateRange(): boolean {
    return !this.filterForm?.hasError('datesError');
  }

  buildFilter(form: UntypedFormGroup, recurringStatus: 'Posted' | 'Pending'): TransactionFilters {
    let ids: string[] = [];
    let categories: Category[] = form.controls['multiSelectDropdown'].value;
    if (categories != null) {
      for (let selectedCategory of categories)
        ids.push(selectedCategory.id);
    }

    // if no categories are selected, the turn off the filter
    let categoryFilterIsUsed = ids.length > 0;

    return {
      dateFilter: true,
      dateOldest: this.utilityService.getShortDate(this.filterForm.controls['dateOfOldestTransaction'].value),
      dateLatest: this.utilityService.getShortDate(this.filterForm.controls['dateOfLatestTransaction'].value),
      categoryFilter: categoryFilterIsUsed,
      selectedCategoryIds: ids,
      searchText: form.controls['searchText'].value.trim(),
      match: form.controls['match'].value,
      recurringStatus,
    }
  }

  getTransactions(filter: TransactionFilters, addedTransaction?: Transaction): void {
    // don't get transactions without a valid filter. (gets ALL transactions)
    if (filter == null)
      return;
    const pendingFilter = { ...filter, recurringStatus: 'Pending' as const };
    forkJoin({
      pending: this.apiService.getTransactions(pendingFilter),
      posted: this.apiService.getTransactions(filter),
    })
      .subscribe({
        next: ({ pending, posted }) => {
          this.pendingTransactions = this.normalizePendingTransactions(pending);
          this.transactionsFromFilter = posted;
          const pendingTotals = this.calculateTotals(pending);
          this.pendingExpensesAmount = pendingTotals.expenses;
          this.pendingIncomeAmount = pendingTotals.income;
          const postedTotals = this.calculateTotals(posted);
          this.postedExpensesAmount = postedTotals.expenses;
          this.postedIncomeAmount = postedTotals.income;

          if (addedTransaction && !posted.some((transaction) => transaction.id === addedTransaction.id)) {
            this.toastService.add({
              severity: 'info',
              summary: 'Added',
              detail: 'Transaction was added but is outside the current Find filter.',
              life: 3500,
            });
          }
        }
      });
  }

  savePending(transaction: Transaction): void {
    this.apiService.updateTransaction({ ...transaction, recurringStatus: 'Pending' }).subscribe();
  }

  acceptPending(transaction: Transaction): void {
    this.apiService.updateTransaction({ ...transaction, recurringStatus: 'Accepted' })
      .subscribe(() => this.refreshTransactions());
  }

  skipPending(transaction: Transaction): void {
    this.apiService.updateTransaction({ ...transaction, recurringStatus: 'Skipped' })
      .subscribe(() => this.refreshTransactions());
  }

  acceptAllPending(): void {
    if (this.pendingTransactions.length === 0) {
      return;
    }

    const pending = [...this.pendingTransactions];
    this.confirmationService.confirm({
      header: 'Accept all pending transactions?',
      message: `${pending.length} pending transactions will be posted.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Accept All',
      accept: () => {
        forkJoin(pending.map(transaction => this.apiService.updateTransaction({
          ...transaction,
          recurringStatus: 'Accepted',
        }))).subscribe(() => {
          this.refreshTransactions();
          this.toastService.add({
            severity: 'success',
            summary: 'Transactions accepted',
            detail: `${pending.length} transaction${pending.length === 1 ? '' : 's'} accepted.`,
          });
        });
      },
    });
  }

  private normalizePendingTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.map(transaction => ({
      ...transaction,
      dateOfTransaction: new Date(transaction.dateOfTransaction),
      scheduledOccurrenceDate: transaction.scheduledOccurrenceDate
        ? new Date(transaction.scheduledOccurrenceDate)
        : undefined,
    }));
  }

  private calculateTotals(transactions: Transaction[]): { expenses: number; income: number } {
    let expenses = 0;
    let income = 0;

    for (const transaction of transactions) {
      const transactionType = getCategoryTransactionType(transaction.categories);
      if (transactionType === true) {
        income += transaction.amount;
      } else if (transactionType === false) {
        expenses += transaction.amount;
      }
    }

    return { expenses, income };
  }

}