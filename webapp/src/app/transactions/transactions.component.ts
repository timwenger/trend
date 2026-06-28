import { Component, Input, OnInit, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { ApiService } from '../api.service';
import { Transaction } from '../transaction';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { Category } from '../category';


@Component({
    selector: 'app-transactions',
    templateUrl: './transactions.component.html',
    styleUrls: ['./transactions.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class TransactionsComponent implements OnInit {

  @Input() transactions!: Transaction[];
  @Input() categories: Category[] = [];

  transactionEditBackups: { [id: string]: Transaction; } = {};
  mobileEditDialogVisible: boolean = false;
  mobileEditField: 'date' | 'category' | 'amount' | 'description' | null = null;
  mobileEditTarget: Transaction | null = null;
  mobileEditDate: Date = new Date();
  mobileEditCategories: Category[] = [];
  mobileEditAmount: number | null = null;
  mobileEditDescription: string = '';
  descriptionDialogVisible: boolean = false;
  descriptionDialogText: string = '';
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private holdTriggered: boolean = false;
  private lastTapAt: number = 0;
  private lastTapKey: string = '';
  private descriptionTapTimer: ReturnType<typeof setTimeout> | null = null;
  private lastDescriptionTapAt: number = 0;
  private lastDescriptionTapTransactionId: string = '';

  constructor(
    private apiService: ApiService,
    private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
  }


  confirmDelete(event: Event, transaction: Transaction) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Delete?',
      icon: 'pi pi-trash',
      accept: () => {
        this.deleteTransaction(transaction);
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
    // editing calendar doesn't read the date for some reason unless it's a new date :/
    transaction.dateOfTransaction = new Date(transaction.dateOfTransaction);
  }

  onRowEditSave(transaction: Transaction) {
    delete this.transactionEditBackups[transaction.id];
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

  startMobileEditHold(transaction: Transaction, field: 'date' | 'category' | 'amount' | 'description') {
    if (!this.isMobile()) {
      return;
    }

    this.cancelMobileEditHold();
    this.holdTriggered = false;
    this.holdTimer = setTimeout(() => {
      this.holdTriggered = true;
      this.openMobileFieldEditor(transaction, field);
    }, 450);
  }

  cancelMobileEditHold() {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }

  onMobileEditPointerUp(
    transaction: Transaction,
    field: 'date' | 'category' | 'amount' | 'description',
    event: Event
  ): void {
    if (!this.isMobile()) {
      return;
    }

    this.cancelMobileEditHold();

    if (this.holdTriggered) {
      this.holdTriggered = false;
      return;
    }

    const pointerEvent = event as PointerEvent;
    if (pointerEvent.pointerType === 'mouse') {
      return;
    }

    const tapKey = `${transaction.id}:${field}`;
    const now = Date.now();

    if (this.lastTapKey === tapKey && now - this.lastTapAt <= 320) {
      this.lastTapKey = '';
      this.lastTapAt = 0;
      this.openMobileFieldEditor(transaction, field, event);
      return;
    }

    this.lastTapKey = tapKey;
    this.lastTapAt = now;
  }

  openMobileFieldEditor(
    transaction: Transaction,
    field: 'date' | 'category' | 'amount' | 'description',
    event?: Event
  ) {
    if (!this.isMobile()) {
      return;
    }

    event?.preventDefault();
    this.cancelMobileEditHold();

    this.mobileEditTarget = transaction;
    this.mobileEditField = field;
    this.mobileEditDate = new Date(transaction.dateOfTransaction);
    this.mobileEditCategories = [...transaction.categories];
    this.mobileEditAmount = transaction.amount;
    this.mobileEditDescription = transaction.transactionDescription ?? '';
    this.mobileEditDialogVisible = true;
  }

  get mobileEditDialogTitle(): string {
    switch (this.mobileEditField) {
      case 'date':
        return 'Edit Date';
      case 'category':
        return 'Edit Categories';
      case 'amount':
        return 'Edit Amount';
      case 'description':
        return 'Edit Description';
      default:
        return 'Edit';
    }
  }

  saveMobileFieldEdit(): void {
    if (!this.mobileEditTarget || !this.mobileEditField) {
      return;
    }

    if (this.mobileEditField === 'date') {
      this.mobileEditTarget.dateOfTransaction = new Date(this.mobileEditDate);
    }

    if (this.mobileEditField === 'category') {
      this.mobileEditTarget.categories = [...this.mobileEditCategories];
    }

    if (this.mobileEditField === 'amount' && this.mobileEditAmount != null) {
      this.mobileEditTarget.amount = this.mobileEditAmount;
    }

    if (this.mobileEditField === 'description') {
      this.mobileEditTarget.transactionDescription = this.mobileEditDescription;
    }

    this.apiService.updateTransaction(this.mobileEditTarget)
      .subscribe();

    this.transactions = [...this.transactions];
    this.mobileEditDialogVisible = false;
  }

  cancelMobileFieldEdit(): void {
    this.mobileEditDialogVisible = false;
  }

  openDescriptionDialog(event: Event, description: string | null | undefined): void {
    event.stopPropagation();
    this.descriptionDialogText = description ?? '';
    this.descriptionDialogVisible = true;
  }

  onDescriptionPointerUp(
    transaction: Transaction,
    event: Event,
    description: string | null | undefined
  ): void {
    if (!this.isMobile()) {
      return;
    }

    this.cancelMobileEditHold();

    if (this.holdTriggered) {
      this.holdTriggered = false;
      event.preventDefault();
      return;
    }

    const pointerEvent = event as PointerEvent;
    if (pointerEvent.pointerType === 'mouse') {
      this.openDescriptionDialog(event, description);
      return;
    }

    const now = Date.now();
    const isDoubleTap =
      this.lastDescriptionTapTransactionId === transaction.id &&
      now - this.lastDescriptionTapAt <= 320;

    if (isDoubleTap) {
      this.cancelPendingDescriptionTap();
      this.lastDescriptionTapTransactionId = '';
      this.lastDescriptionTapAt = 0;
      this.openMobileFieldEditor(transaction, 'description', event);
      return;
    }

    this.lastDescriptionTapTransactionId = transaction.id;
    this.lastDescriptionTapAt = now;
    this.cancelPendingDescriptionTap();
    this.descriptionTapTimer = setTimeout(() => {
      this.openDescriptionDialog(event, description);
      this.descriptionTapTimer = null;
    }, 320);
  }

  private cancelPendingDescriptionTap(): void {
    if (this.descriptionTapTimer) {
      clearTimeout(this.descriptionTapTimer);
      this.descriptionTapTimer = null;
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePressed(event: Event): void {
    if (this.mobileEditDialogVisible) {
      event.preventDefault();
      this.cancelMobileFieldEdit();
      return;
    }

    if (this.descriptionDialogVisible) {
      event.preventDefault();
      this.descriptionDialogVisible = false;
    }
  }

  private isMobile(): boolean {
    return window.matchMedia('(max-width: 768px)').matches;
  }
}
