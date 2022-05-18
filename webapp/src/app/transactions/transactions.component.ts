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
  dateOfOldest!: Date;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.dateOfOldest = new Date();
    this.getTransactions();
  }

  getTransactions(): void {
    this.apiService.getTransactions()
    .subscribe(transactionsReturned => this.transactions = transactionsReturned);
  }

}
