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

  @Input() transactions: Transaction[] = [];
  totalAmount: number = 0;

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
  }


  ngOnChanges(changes: SimpleChanges) {
    this.updateSummary(changes['transactions'].currentValue);
  }

  updateSummary(transactions: Transaction[]): void {
      this.getTotalAmount();
  }

  getTotalAmount(){
    this.totalAmount = 0;
    for(let transaction of this.transactions)
      this.totalAmount += transaction.amount;
  }
}
