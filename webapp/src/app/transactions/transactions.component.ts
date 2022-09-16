import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService } from '../api.service';
import { Transaction } from '../transaction';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { Category } from '../category';


@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit, OnChanges {

  @Input() transactions!: Transaction[];
  @Input() categories: Category[] = [];
  totalAmount: number = 0;

  transactionEditBackups: { [id: number]: Transaction; } = {};

  constructor(
    private apiService: ApiService,
    private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
  }


  ngOnChanges(changes: SimpleChanges) {
    if (this.transactions && changes['transactions']) {
      this.updateSummary(changes['transactions'].currentValue);
    }
  }

  updateSummary(transactions: Transaction[]): void {
    this.getTotalAmount();
  }

  getTotalAmount() {
    this.totalAmount = 0;
    for (let transaction of this.transactions)
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

  deleteTransaction(transaction: Transaction) {
    // confirmation is checked first in confirmDelete(). Then:
    // update the internal transactions list, assuming the dB is successful.
    // this way we don't have to wait for the transaction to complete.
    this.transactions = this.transactions.filter((curTransaction) => curTransaction.id !== transaction.id);

    // request a delete from database. 
    this.apiService.deleteTransaction(transaction)
      .subscribe(/* I'm not using the returned deleted transaction */);
  }



  onRowEditInit(transaction: Transaction) {
    // make a deep copy, not just a new ref to the same obj
    this.transactionEditBackups[transaction.id] = { ...transaction };
  }

  onRowEditSave(transaction: Transaction) {
    delete this.transactionEditBackups[transaction.id];
    // update the category id based on the category, as this is how the category is saved in the db
    transaction.categoryId = transaction.category.id;
    // edit trans in db
    this.apiService.updateTransaction(transaction)
      .subscribe(/* I'm not using the returned deleted transaction */);
  }

  onRowEditCancel(transaction: Transaction, rowIndex: number) {
    // revert the row to the saved copy before edits began
    this.transactions[rowIndex] = this.transactionEditBackups[transaction.id];
    // make a new array, so the table refreshes
    this.transactions = [...this.transactions];
    delete this.transactionEditBackups[transaction.id];
  }
}
