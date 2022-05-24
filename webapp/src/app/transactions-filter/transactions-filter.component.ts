import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup} from '@angular/forms';
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
  filterForm!: FormGroup;
  formIsValid: boolean = false;
  configuredFilter!: TransactionFilters;  

  allCategories: Category[] = [];
  selectedCategories: Category[] = [];
  transactionsFromFilter: Transaction[] = [];

  constructor(
    private apiService: ApiService,
    private utilityService: UtilityService,
    ) { }
  
  ngOnInit(): void {
    this.apiService.getCategories()
    .subscribe(categoriesReturned => this.allCategories = categoriesReturned);
    this.createForm();
    
  }

  createForm() {
    let oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() -30);
    this.filterForm = new FormGroup({
      dateOfOldestTransaction: new FormControl(oneMonthAgo),
      dateOfLatestTransaction: new FormControl(new Date()),
    }, {validators: this.dateValidator('dateOfOldestTransaction', 'dateOfLatestTransaction')});
  }
  
  dateValidator(oldest: string, latest: string) {
    return (group: AbstractControl): object | null => {
      let fgroup = group as FormGroup
      let oldestDate = fgroup.controls[oldest].value;
      let latestDate = fgroup.controls[latest].value;
      if (oldestDate > latestDate) {
        this.formIsValid = false;
        return {
          datesError: {message: "Oldest date is more recent than latest date. Sorry kid : )"}
        };
      }
      this.formIsValid = true;
      return null;
    }
  }

  onSubmit(event:any){
    let filter = this.buildFilter();
    this.getTransactions(filter);
  }

  buildFilter(): TransactionFilters{
    let ids :number[]=[];
    for(let selectedCategory of this.selectedCategories)  
      ids.push(selectedCategory.id);      
  
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
    if(filter == null)
      return;
    this.apiService.getTransactions(filter)
    .subscribe({
      next: transactionsReturned => this.transactionsFromFilter = transactionsReturned
    });
  }
}