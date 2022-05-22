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
  totalAmount: number = 0;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    // this.getTransactions();
  }


  ngOnChanges(changes: SimpleChanges) {
    this.updateTransactionsAndSummary(changes['filter'].currentValue);
  }

  updateTransactionsAndSummary(filter: TransactionFilters): void {
    // don't get transactions without a valid filter. (gets ALL transactions)
    if(filter == null)
      return;
    this.apiService.getTransactions(filter)
    .subscribe({
      next: transactionsReturned => {
        this.transactions = transactionsReturned;
        // now that the transactions are assigned, can calculate the total.
        this.getTotalAmount();
      }
    });
  }

  getTotalAmount(){
    this.totalAmount = 0;
    for(var i =0; i < this.transactions.length; i++){
      this.totalAmount += this.transactions[i].amount;
    }
  }
}
