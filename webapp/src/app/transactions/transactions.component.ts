import { Component, Input, OnInit, OnChanges, SimpleChanges} from '@angular/core';
import { ApiService } from '../api.service';
import { Transaction } from '../transaction';
import { TransactionFilters } from '../transactionfilters';


@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit, OnChanges {

  @Input() filter! : TransactionFilters;
  transactions: Transaction[] = [];


  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    // this.getTransactions();
  }


  ngOnChanges(changes: SimpleChanges) {
    this.getTransactions(changes['filter'].currentValue);
  }

  getTransactions(filter: TransactionFilters): void {
    this.apiService.getTransactions(filter)
    .subscribe(transactionsReturned => this.transactions = transactionsReturned);
  }

}
