import { Component, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, FormGroupDirective } from '@angular/forms';
import { ApiService } from '../api.service';
import { Category } from '../category';
import { Transaction } from '../transaction';
import { TransactionFilters } from '../transactionfilters';
import { UtilityService } from '../utility.service';

@Component({
  selector: 'app-transactions-filter',
  templateUrl: './transactions-filter.component.html',
  styleUrls: ['./transactions-filter.component.css']
})
export class TransactionsFilterComponent implements OnInit {
  filterForm!: UntypedFormGroup;
  configuredFilter!: TransactionFilters;

  allCategories: Category[] = [];
  transactionsFromFilter: Transaction[] = [];
  noCategories: boolean = false;

  constructor(
    private apiService: ApiService,
    private utilityService: UtilityService,
  ) { }

  ngOnInit(): void {
    this.apiService.getCategories()
      .subscribe(categoriesReturned => {
        this.allCategories = categoriesReturned
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

  onSubmit(f: FormGroupDirective) {
    let filter = this.buildFilter(f.form);
    this.getTransactions(filter);
  }

  buildFilter(form: UntypedFormGroup): TransactionFilters {
    let ids: number[] = [];
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

  getTransactions(filter: TransactionFilters): void {
    // don't get transactions without a valid filter. (gets ALL transactions)
    if (filter == null)
      return;
    this.apiService.getTransactions(filter)
      .subscribe({
        next: transactionsReturned => this.transactionsFromFilter = transactionsReturned
      });
  }
}