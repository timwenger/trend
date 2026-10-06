import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy, ElementRef, HostListener, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { Transaction } from '../transaction';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { Table, SortableColumn, SortIcon, EditableRow, CellEditor, InitEditableRow, SaveEditableRow, CancelEditableRow } from 'primeng/table';
import { Category, getCategorySelectionError as getSelectionError } from '../category';
import { Bind } from 'primeng/bind';
import { DatePicker } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { CategoryMultiselectComponent } from '../category-multiselect/category-multiselect.component';
import { InputText } from 'primeng/inputtext';
import { ButtonDirective, ButtonIcon, ButtonLabel, Button } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { ConfirmPopup } from 'primeng/confirmpopup';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TouchFocusDirective } from '../touch-focus.directive';
import { DatePickerTouchDismissDirective } from '../datepicker-touch-dismiss.directive';


@Component({
    selector: 'app-transactions',
    templateUrl: './transactions.component.html',
    styleUrls: ['./transactions.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [Bind, Table, SortableColumn, SortIcon, EditableRow, CellEditor, DatePicker, FormsModule, CategoryMultiselectComponent, InputText, ButtonDirective, Ripple, InitEditableRow, ButtonIcon, SaveEditableRow, CancelEditableRow, ConfirmPopup, ButtonLabel, Button, CurrencyPipe, DatePipe, TouchFocusDirective, DatePickerTouchDismissDirective]
})
export class TransactionsComponent implements OnInit {
  @ViewChild('transactionTable') private transactionTable!: Table;
  @ViewChild('mobileAmountInput') private mobileAmountInput?: ElementRef<HTMLInputElement>;
  @ViewChild('mobileDescriptionInput') private mobileDescriptionInput?: ElementRef<HTMLTextAreaElement>;

  @Input() transactions!: Transaction[];
  @Input() categories: Category[] = [];
  @Input() pendingMode: boolean = false;
  @Input() sortOrder: number = -1;
  @Input() confirmationKey: string = 'transactions';
  @Output() pendingSave = new EventEmitter<Transaction>();
  @Output() pendingAccept = new EventEmitter<Transaction>();
  @Output() pendingSkip = new EventEmitter<Transaction>();

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
  categoryDialogVisible: boolean = false;
  categoryDialogNames: string[] = [];
  mobileActionsVisible: boolean = false;
  mobileActionTarget: Transaction | null = null;
  mobileActionField: 'date' | 'category' | 'amount' | 'description' | null = null;
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private holdTriggered: boolean = false;
  private mobilePointerId: number | null = null;
  private mobilePointerStartX = 0;
  private mobilePointerStartY = 0;
  private mobilePointerMoved = false;
  private lastTapAt: number = 0;
  private lastTapKey: string = '';
  private categoryTapTimer: ReturnType<typeof setTimeout> | null = null;
  private descriptionTapTimer: ReturnType<typeof setTimeout> | null = null;
  private lastDescriptionTapAt: number = 0;
  private lastDescriptionTapTransactionId: string = '';
  private dismissedOverlayPointerId: number | null = null;
  private dialogHistoryActive: boolean = false;
  private consumingDialogHistory: boolean = false;

  constructor(
    private apiService: ApiService,
    private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
  }


  confirmDelete(event: Event, transaction: Transaction) {
    this.confirmationService.confirm({
      key: this.confirmationKey,
      target: event.target as EventTarget,
      message: this.pendingMode ? 'Skip pending transaction?' : 'Delete?',
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
    if (this.pendingMode) {
      this.pendingSkip.emit(transaction);
      return;
    }

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
    if (this.getCategorySelectionError(transaction.categories)) {
      return;
    }

    delete this.transactionEditBackups[transaction.id];
    if (this.pendingMode) {
      this.pendingSave.emit(transaction);
      return;
    }

    this.apiService.updateTransaction(transaction)
      .subscribe(/* I'm not using the returned deleted transaction */);
  }

  acceptPendingTransaction(transaction: Transaction): void {
    this.pendingAccept.emit(transaction);
  }

  onRowEditCancel(transaction: Transaction, rowIndex: number) {
    // revert the row to the saved copy before edits began
    this.transactions[rowIndex] = this.transactionEditBackups[transaction.id];
    // make a new array, so the table refreshes
    this.transactions = [...this.transactions];
    delete this.transactionEditBackups[transaction.id];
  }

  onRowEditKeyDown(
    event: KeyboardEvent,
    transaction: Transaction,
    rowIndex: number,
    editing: boolean
  ): void {
    if (!editing || this.isMobile()) {
      return;
    }

    const rowElement = event.currentTarget as HTMLTableRowElement;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.transactionTable.cancelRowEdit(transaction);
      this.onRowEditCancel(transaction, rowIndex);
      return;
    }

    if (event.key === 'Enter' && event.ctrlKey) {
      if (this.getCategorySelectionError(transaction.categories)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      this.transactionTable.saveRowEdit(transaction, rowElement);
      this.onRowEditSave(transaction);
    }
  }

  startMobileEditHold(
    transaction: Transaction,
    field: 'date' | 'category' | 'amount' | 'description',
    event: PointerEvent,
  ) {
    if (!this.isMobile()) {
      return;
    }

    this.dismissedOverlayPointerId = null;
    this.cancelMobileEditHold();
    this.holdTriggered = false;
    this.mobilePointerId = event.pointerId;
    this.mobilePointerStartX = event.clientX;
    this.mobilePointerStartY = event.clientY;
    this.mobilePointerMoved = false;
    this.holdTimer = setTimeout(() => {
      if (this.mobilePointerMoved) {
        return;
      }
      this.holdTriggered = true;
      this.mobileActionTarget = transaction;
      this.mobileActionField = field;
      this.mobileActionsVisible = true;
      this.activateDialogHistory();
    }, 450);
  }

  startMobileEditTouchHold(
    transaction: Transaction,
    field: 'date' | 'category' | 'amount' | 'description',
    event: TouchEvent,
  ): void {
    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }

    this.startMobileEditHold(transaction, field, this.touchToPointerEvent(event, touch));
  }

  onMobileEditPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.mobilePointerId || this.mobilePointerMoved) {
      return;
    }

    const distance = Math.hypot(
      event.clientX - this.mobilePointerStartX,
      event.clientY - this.mobilePointerStartY,
    );
    if (distance > 10) {
      this.mobilePointerMoved = true;
      this.cancelMobileEditHold();
    }
  }

  onMobileEditTouchMove(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    if (touch) {
      this.onMobileEditPointerMove(this.touchToPointerEvent(event, touch));
    }
  }

  editMobileActionField(): void {
    if (!this.mobileActionTarget || !this.mobileActionField) {
      return;
    }

    const transaction = this.mobileActionTarget;
    const field = this.mobileActionField;
    this.mobileActionsVisible = false;
    this.mobileActionTarget = null;
    this.mobileActionField = null;
    this.openMobileFieldEditor(transaction, field);
  }

  confirmMobileDelete(event: Event): void {
    if (!this.mobileActionTarget) {
      return;
    }

    const transaction = this.mobileActionTarget;
    this.mobileActionsVisible = false;
    this.mobileActionTarget = null;
    this.mobileActionField = null;
    this.confirmDelete(event, transaction);
  }

  closeMobileActions(): void {
    this.mobileActionsVisible = false;
    this.mobileActionTarget = null;
    this.mobileActionField = null;
    if (!this.mobileEditDialogVisible && !this.descriptionDialogVisible && !this.categoryDialogVisible) {
      this.releaseDialogHistory();
    }
  }

  cancelMobileEditHold() {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }

  suppressMobileTriggerClick(event: Event): void {
    if (!this.isMobile()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  }

  onMobileEditPointerUp(
    transaction: Transaction,
    field: 'date' | 'category' | 'amount' | 'description',
    event: Event,
    fromTouchEvent = false,
  ): void {
    if (!this.isMobile()) {
      return;
    }

    const pointerEvent = event as PointerEvent;
    if (pointerEvent.pointerType === 'touch' && !fromTouchEvent) {
      return;
    }

    this.cancelMobileEditHold();

    if (this.mobilePointerMoved) {
      this.resetMobilePointer();
      return;
    }

    if (this.consumeDismissedOverlayPointer(event)) {
      this.resetMobilePointer();
      return;
    }

    if (this.holdTriggered) {
      this.holdTriggered = false;
      this.resetMobilePointer();
      return;
    }

    if (pointerEvent.pointerType === 'mouse') {
      this.resetMobilePointer();
      return;
    }

    const tapKey = `${transaction.id}:${field}`;
    const now = Date.now();

    if (this.lastTapKey === tapKey && now - this.lastTapAt <= 320) {
      this.cancelPendingCategoryTap();
      this.lastTapKey = '';
      this.lastTapAt = 0;
      event.preventDefault();
      event.stopPropagation();
      setTimeout(() => this.openMobileFieldEditor(transaction, field));
      this.resetMobilePointer();
      return;
    }

    this.lastTapKey = tapKey;
    this.lastTapAt = now;

    if (field === 'category') {
      this.cancelPendingCategoryTap();
      this.categoryTapTimer = setTimeout(() => {
        this.openCategoryDialog(transaction.categories);
        this.categoryTapTimer = null;
      }, 320);
    }
    this.resetMobilePointer();
  }

  onMobileEditTouchEnd(
    transaction: Transaction,
    field: 'date' | 'category' | 'amount' | 'description',
    event: TouchEvent,
  ): void {
    const touch = event.changedTouches[0];
    if (touch) {
      this.onMobileEditPointerUp(
        transaction,
        field,
        this.touchToPointerEvent(event, touch),
        true,
      );
    }
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
    this.activateDialogHistory();

    if (field === 'amount' || field === 'description') {
      setTimeout(() => {
        const input = field === 'amount'
          ? this.mobileAmountInput?.nativeElement
          : this.mobileDescriptionInput?.nativeElement;
        input?.focus({ preventScroll: true });
        input?.select();
      });
    }
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
      if (this.getCategorySelectionError(this.mobileEditCategories)) {
        return;
      }
      this.mobileEditTarget.categories = [...this.mobileEditCategories];
    }

    if (this.mobileEditField === 'amount' && this.mobileEditAmount != null) {
      this.mobileEditTarget.amount = this.mobileEditAmount;
    }

    if (this.mobileEditField === 'description') {
      this.mobileEditTarget.transactionDescription = this.mobileEditDescription;
    }

    if (this.pendingMode) {
      this.pendingSave.emit(this.mobileEditTarget);
    } else {
      this.apiService.updateTransaction(this.mobileEditTarget)
        .subscribe();
    }

    this.transactions = [...this.transactions];
    this.closeMobileEditDialog();
  }

  onMobileDateSelected(): void {
    if (this.mobileEditField !== 'date') {
      return;
    }

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
    this.saveMobileFieldEdit();
  }

  cancelMobileFieldEdit(): void {
    this.closeMobileEditDialog();
  }

  getCategorySelectionError(categories: Category[]): string | null {
    return getSelectionError(categories);
  }

  onMobileOverlayPointerDown(
    event: PointerEvent,
    overlay: 'actions' | 'edit' | 'description' | 'category'
  ): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    this.dismissMobileOverlay(event, overlay, event.pointerId);
  }

  onMobileOverlayTouchStart(
    event: TouchEvent,
    overlay: 'actions' | 'edit' | 'description' | 'category'
  ): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    const touch = event.changedTouches[0];
    if (touch) {
      this.dismissMobileOverlay(event, overlay, touch.identifier);
    }
  }

  private dismissMobileOverlay(
    event: Event,
    overlay: 'actions' | 'edit' | 'description' | 'category',
    pointerId: number,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    this.dismissedOverlayPointerId = pointerId;
    this.cancelPendingCategoryTap();
    this.cancelPendingDescriptionTap();

    switch (overlay) {
      case 'actions':
        this.closeMobileActions();
        break;
      case 'edit':
        this.cancelMobileFieldEdit();
        break;
      case 'description':
        this.closeDescriptionDialog();
        break;
      case 'category':
        this.closeCategoryDialog();
        break;
    }
  }

  openDescriptionDialog(event: Event, description: string | null | undefined): void {
    event.stopPropagation();
    this.descriptionDialogText = description ?? '';
    this.descriptionDialogVisible = true;
    this.activateDialogHistory();
  }

  openCategoryDialog(categories: Category[]): void {
    this.categoryDialogNames = categories.map(category => category.categoryName);
    this.categoryDialogVisible = true;
    this.activateDialogHistory();
  }

  closeCategoryDialog(): void {
    this.categoryDialogVisible = false;
    if (!this.mobileEditDialogVisible && !this.descriptionDialogVisible) {
      this.releaseDialogHistory();
    }
  }

  private cancelPendingCategoryTap(): void {
    if (this.categoryTapTimer) {
      clearTimeout(this.categoryTapTimer);
      this.categoryTapTimer = null;
    }
  }

  onDescriptionPointerUp(
    transaction: Transaction,
    event: Event,
    description: string | null | undefined,
    fromTouchEvent = false,
  ): void {
    if (!this.isMobile()) {
      return;
    }

    const pointerEvent = event as PointerEvent;
    if (pointerEvent.pointerType === 'touch' && !fromTouchEvent) {
      return;
    }

    this.cancelMobileEditHold();

    if (this.mobilePointerMoved) {
      this.resetMobilePointer();
      return;
    }

    if (this.consumeDismissedOverlayPointer(event)) {
      this.resetMobilePointer();
      return;
    }

    if (this.holdTriggered) {
      this.holdTriggered = false;
      event.preventDefault();
      this.resetMobilePointer();
      return;
    }

    if (pointerEvent.pointerType === 'mouse') {
      this.openDescriptionDialog(event, description);
      this.resetMobilePointer();
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
      event.preventDefault();
      event.stopPropagation();
      setTimeout(() => this.openMobileFieldEditor(transaction, 'description'));
      this.resetMobilePointer();
      return;
    }

    this.lastDescriptionTapTransactionId = transaction.id;
    this.lastDescriptionTapAt = now;
    this.cancelPendingDescriptionTap();
    this.descriptionTapTimer = setTimeout(() => {
      this.openDescriptionDialog(event, description);
      this.descriptionTapTimer = null;
    }, 320);
    this.resetMobilePointer();
  }

  onDescriptionTouchEnd(
    transaction: Transaction,
    event: TouchEvent,
    description: string | null | undefined,
  ): void {
    const touch = event.changedTouches[0];
    if (touch) {
      this.onDescriptionPointerUp(
        transaction,
        this.touchToPointerEvent(event, touch),
        description,
        true,
      );
    }
  }

  private resetMobilePointer(): void {
    this.mobilePointerId = null;
    this.mobilePointerMoved = false;
  }

  private touchToPointerEvent(event: TouchEvent, touch: Touch): PointerEvent {
    return {
      pointerId: touch.identifier,
      pointerType: 'touch',
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
    } as PointerEvent;
  }

  private cancelPendingDescriptionTap(): void {
    if (this.descriptionTapTimer) {
      clearTimeout(this.descriptionTapTimer);
      this.descriptionTapTimer = null;
    }
  }

  private consumeDismissedOverlayPointer(event: Event): boolean {
    const pointerEvent = event as PointerEvent;
    const dismissedExplicitOverlay = pointerEvent.pointerId === this.dismissedOverlayPointerId;
    if (!dismissedExplicitOverlay) {
      return false;
    }

    this.dismissedOverlayPointerId = null;
    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  @HostListener('document:pointerup', ['$event'])
  onDocumentPointerUp(event: PointerEvent): void {
    if (event.pointerId === this.dismissedOverlayPointerId) {
      this.dismissedOverlayPointerId = null;
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
      this.closeDescriptionDialog();
      return;
    }

    if (this.categoryDialogVisible) {
      event.preventDefault();
      this.closeCategoryDialog();
    }
  }

  @HostListener('window:popstate', ['$event'])
  onBrowserPopState(_event: PopStateEvent): void {
    if (this.consumingDialogHistory) {
      this.consumingDialogHistory = false;
      return;
    }

    if (this.mobileEditDialogVisible || this.descriptionDialogVisible || this.categoryDialogVisible || this.mobileActionsVisible) {
      this.mobileEditDialogVisible = false;
      this.descriptionDialogVisible = false;
      this.categoryDialogVisible = false;
      this.mobileActionsVisible = false;
      this.dialogHistoryActive = false;
    }
  }

  onAnyDialogHide(): void {
    if (this.mobileEditDialogVisible || this.descriptionDialogVisible || this.categoryDialogVisible || this.mobileActionsVisible) {
      return;
    }

    this.releaseDialogHistory();
  }

  private closeMobileEditDialog(): void {
    this.mobileEditDialogVisible = false;
    if (!this.descriptionDialogVisible && !this.categoryDialogVisible) {
      this.releaseDialogHistory();
    }
  }

  closeDescriptionDialog(): void {
    this.descriptionDialogVisible = false;
    if (!this.mobileEditDialogVisible && !this.categoryDialogVisible) {
      this.releaseDialogHistory();
    }
  }

  private activateDialogHistory(): void {
    if (!this.isMobile() || this.dialogHistoryActive) {
      return;
    }

    window.history.pushState({ dialog: true }, '', window.location.href);
    this.dialogHistoryActive = true;
  }

  private releaseDialogHistory(): void {
    if (!this.isMobile() || !this.dialogHistoryActive) {
      return;
    }

    this.dialogHistoryActive = false;
    this.consumingDialogHistory = true;
    window.history.back();
  }

  isMobile(): boolean {
    return window.matchMedia('(max-width: 768px)').matches;
  }
}
