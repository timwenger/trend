import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { Transaction } from '../transaction';


@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit {
  transactions: Transaction[] = [];


  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.getTransactions();
  }

  getTransactions(): void {
    this.apiService.getTransactions()
    .subscribe(transactionsReturned => this.transactions = transactionsReturned);
  }

}
