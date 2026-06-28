import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ApiService } from '../api.service';
import { Category } from '../category';
import { Transaction } from '../transaction';
import { TransactionFilters } from '../transactionfilters';
import { UtilityService } from '../utility.service';
import { MessageService as PrimeMessageService } from 'primeng/api';

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
  transactionsFromFilter: Transaction[] = [];
  totalExpensesAmount: number = 0;
  totalIncomeAmount: number = 0;
  noCategories: boolean = false;

  constructor(
    private apiService: ApiService,
    private utilityService: UtilityService,
    private toastService: PrimeMessageService,
  ) { }

  ngOnInit(): void {
    this.apiService.getCategories()
      .subscribe(categoriesReturned => {
        this.allCategories = categoriesReturned;
        this.refreshTransactions();
        if(categoriesReturned.length == 0)
          this.noCategories = true;
      });
    this.createForm();

  }

  createForm() {
    let oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    this.filterForm = new UntypedFormGroup({
      dateOfOldestTransaction: new UntypedFormControl(oneMonthAgo),
      dateOfLatestTransaction: new UntypedFormControl(new Date()),
      multiSelectDropdown: new UntypedFormControl(),
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

  onTransactionAdded(newTransaction: Transaction): void {
    this.refreshTransactions(newTransaction);
  }

  private refreshTransactions(addedTransaction?: Transaction): void {
    if (!this.filterForm || !this.filterForm.valid) {
      return;
    }

    let filter = this.buildFilter(this.filterForm);
    this.getTransactions(filter, addedTransaction);
  }

  buildFilter(form: UntypedFormGroup): TransactionFilters {
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
    }
  }

  getTransactions(filter: TransactionFilters, addedTransaction?: Transaction): void {
    // don't get transactions without a valid filter. (gets ALL transactions)
    if (filter == null)
      return;
    this.apiService.getTransactions(filter)
      .subscribe({
        next: transactionsReturned => {
          this.transactionsFromFilter = transactionsReturned;
          this.updateTotals(transactionsReturned);

          if (addedTransaction && !transactionsReturned.some((transaction) => transaction.id === addedTransaction.id)) {
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

  private updateTotals(transactions: Transaction[]): void {
    this.totalExpensesAmount = 0;
    this.totalIncomeAmount = 0;

    for (const transaction of transactions) {
      let hasIncome = false;
      let hasExpense = false;

      for (const category of transaction.categories) {
        if (category.isIncome) {
          hasIncome = true;
        } else {
          hasExpense = true;
        }
      }

      if (hasIncome) {
        this.totalIncomeAmount += transaction.amount;
      }

      if (hasExpense) {
        this.totalExpensesAmount += transaction.amount;
      }
    }
  }

}