import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup} from '@angular/forms';
import { ApiService } from '../api.service';
import { Category } from '../category';
import { TransactionFilters } from '../transactionfilters';

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


  constructor(
    private apiService: ApiService,
    ) { }
  
  ngOnInit(): void {
    this.getCategories();
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




  getCategories(){
    this.apiService.getCategories()
    .subscribe(categoriesReturned => this.allCategories = categoriesReturned);
  }

  onSubmit(event:any){
    this.buildFilter();
  }

  buildFilter(){
    let ids :number[]=[];
    for(var i =0; i< this.selectedCategories.length; i++)
    {
      ids.push(this.selectedCategories[i].id);      
    }
    // if no categories are selected, the turn off the filter
    let categoryFilterIsUsed = ids.length > 0;

    this.configuredFilter = {
      dateFilter: true,
      dateOldest: this.getShortDate(this.filterForm.controls['dateOfOldestTransaction'].value),
      dateLatest: this.getShortDate(this.filterForm.controls['dateOfLatestTransaction'].value),
      categoryFilter: categoryFilterIsUsed,
      selectedCategoryIds: ids,
    }
  }

  getShortDate(dateStr:string){
    let d = new Date(Date.parse(dateStr));
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
  }
}