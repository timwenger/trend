import { Component, OnInit } from '@angular/core';
import { FormControl} from '@angular/forms';
import { ApiService } from '../api.service';
import { Category } from '../category';
import { TransactionFilters } from '../transactionfilters';

@Component({
  selector: 'app-transactions-filter',
  templateUrl: './transactions-filter.component.html',
  styleUrls: ['./transactions-filter.component.css']
})
export class TransactionsFilterComponent implements OnInit {
  configuredFilter!: TransactionFilters;  
  dateOfOldestTransaction= new FormControl(new Date());
  dateOfLatestTransaction= new FormControl(new Date());

  allCategories: Category[] = [];
  selectedCategories: Category[] = [];


  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.getCategories();
  }

  getCategories(){
    this.apiService.getCategories()
    .subscribe(categoriesReturned => this.allCategories = categoriesReturned);
  }

  buttonClicked(event:any){
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
      dateOldest: this.getShortDate(this.dateOfOldestTransaction.value), // "2021/12/01"
      dateLatest: this.getShortDate(this.dateOfLatestTransaction.value),
      categoryFilter: categoryFilterIsUsed,
      selectedCategoryIds: ids,
    }
  }

  getShortDate(dateStr:string){
    let d = new Date(Date.parse(dateStr));
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
  }
}