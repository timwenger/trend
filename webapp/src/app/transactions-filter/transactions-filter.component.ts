import { Component, OnInit } from '@angular/core';
import { FormControl} from '@angular/forms';
import { ApiService } from '../api.service';
import { Category } from '../category';

@Component({
  selector: 'app-transactions-filter',
  templateUrl: './transactions-filter.component.html',
  styleUrls: ['./transactions-filter.component.css']
})
export class TransactionsFilterComponent implements OnInit {
  
  dateOfOldest= new FormControl(new Date());
  dateOfLatest= new FormControl(new Date());

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

}