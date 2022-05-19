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

    this.configuredFilter = {
      dateFilter: true,
      dateOldest: "2021/12/01",//this.dateOfLatestTransaction.value,
      dateLatest: "2022/05/01",//this.dateOfLatestTransaction.value,
      categoryFilter: true,
      selectedCategoryIds: ids,
    }
  }
}