import { Component, Input, OnInit, OnChanges, SimpleChanges} from '@angular/core';
import { ApiService } from '../api.service';
import { Transaction } from '../transaction';
import {ConfirmationService} from 'primeng/api';


@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit, OnChanges {

  @Input() transactions: Transaction[] = [];
  totalAmount: number = 0;

  constructor(
    private apiService: ApiService,
    private confirmationService: ConfirmationService) { }

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

  confirmDelete(event: Event, transaction: Transaction) {
    this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: 'Delete?',
        icon: 'pi pi-trash',
        accept: () => {
            this.deleteTransaction(transaction);
            this.updateSummary(this.transactions);
        },
        reject: () => {
            //do nothing
        }
    });
  }

  deleteTransaction(transaction: Transaction){
    // need to get confirmation first. Then:

    // try do delete from database. 
    this.apiService.deleteTransaction(transaction)
    .subscribe(/* I'm not using the returned deleted transaction */);

    // if successful, update the internal transactions list
    this.transactions= this.transactions.filter((curTransaction) =>  curTransaction.id !== transaction.id);


  }
}
