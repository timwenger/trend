import { Component, OnInit, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { Category, NewCategory } from '../category';
import { ConfirmationService } from 'primeng/api';
import { TransactionFilters } from '../transactionfilters';
import { Table } from 'primeng/table';
import { forkJoin } from 'rxjs';

interface ManagedCategory extends Category {
  dateLastUsed: Date | null;
}

@Component({
    selector: 'app-manage-categories',
    templateUrl: './manage-categories.component.html',
    styleUrls: ['./manage-categories.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ManageCategoriesComponent implements OnInit {
  addCategoryForm!: UntypedFormGroup;
  existingCategories: ManagedCategory[] = [];
  categoryEditBackups: { [id: string]: ManagedCategory; } = {};
  mobileEditVisible: boolean = false;
  mobileEditField: 'name' | 'type' | null = null;
  mobileEditTarget: ManagedCategory | null = null;
  mobileEditName: string = '';
  mobileEditIsIncome: boolean = false;
  mobileActionsVisible: boolean = false;
  mobileActionTarget: ManagedCategory | null = null;
  mobileActionField: 'name' | 'type' | null = null;
  categoryNamePreviewVisible: boolean = false;
  categoryNamePreview: string = '';
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private holdTriggered: boolean = false;
  private lastTapAt: number = 0;
  private lastTapKey: string = '';
  private categoryNameTapTimer: ReturnType<typeof setTimeout> | null = null;
  private dismissedOverlayPointerId: number | null = null;

  constructor(
    private apiService: ApiService,
    private confirmationService: ConfirmationService,
  ) { }

  ngOnInit(): void {
    this.createForm();

    forkJoin({
      categories: this.apiService.getCategories(),
      lastUsedDates: this.apiService.getCategoryLastUsedDates(),
    }).subscribe(({ categories, lastUsedDates }) => {
        this.existingCategories = categories.map(category => ({
          ...category,
          dateLastUsed: lastUsedDates[category.id]
            ? new Date(lastUsedDates[category.id])
            : null,
        }));
      });
  }

  createForm() {
    this.addCategoryForm = new UntypedFormGroup({
      categoryName: new UntypedFormControl('', Validators.required),
      isIncome: new UntypedFormControl('Expense'),
    });
  }


  onSubmit(f: FormGroupDirective) {
    this.addCategoryToDb(f.form);
    f.resetForm();
  }

  addCategoryToDb(f: UntypedFormGroup) {
    let isIncome = f.controls['isIncome'].value == 'Income';
    let name = (String)(f.controls['categoryName'].value).trim();
    let newCategory: NewCategory = {
      categoryName: name,
      isIncome: isIncome,
    }
    this.apiService.addCategory(newCategory)
      .subscribe((categoryReturned) => {
        // use the returned transaction to update the existing categories table
        // copy the array so that the transactions component sees the change
        this.existingCategories = [
          ...this.existingCategories,
          { ...categoryReturned, dateLastUsed: null },
        ];
      });
  }

  getIsIncomeText(isIncome: boolean):String {
    return isIncome? 'Income' : 'Expense';
  }

  get activeCategories(): ManagedCategory[] {
    return this.existingCategories.filter(category => !category.isInactive);
  }

  get inactiveCategories(): ManagedCategory[] {
    return this.existingCategories.filter(category => category.isInactive);
  }



  onRowEditInit(category: ManagedCategory) {
    // make a deep copy, not just a new ref to the same obj
    this.categoryEditBackups[category.id] = { ...category };
  }

  onRowEditSave(category: ManagedCategory) {
    delete this.categoryEditBackups[category.id];
    // edit the category in the database
    this.apiService.updateCategory(category)
      .subscribe(/* I'm not using the returned updated category */);
  }

  onRowEditCancel(category: ManagedCategory, rowIndex: number) {
    // revert the row to the saved copy before edits began
    const existingIndex = this.existingCategories.findIndex(item => item.id === category.id);
    this.existingCategories[existingIndex] = this.categoryEditBackups[category.id];
    // make a new array, so the table refreshes
    this.existingCategories = [...this.existingCategories];
    delete this.categoryEditBackups[category.id];
  }

  onRowEditKeyDown(
    event: KeyboardEvent,
    category: ManagedCategory,
    rowIndex: number,
    editing: boolean,
    categoryTable: Table
  ): void {
    if (!editing || this.isMobile()) {
      return;
    }

    const rowElement = event.currentTarget as HTMLTableRowElement;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      categoryTable.cancelRowEdit(category);
      this.onRowEditCancel(category, rowIndex);
      return;
    }

    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault();
      event.stopPropagation();
      categoryTable.saveRowEdit(category, rowElement);
      this.onRowEditSave(category);
    }
  }

  isMobile(): boolean {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  startMobileActionHold(category: ManagedCategory, field: 'name' | 'type' | null = null): void {
    if (!this.isMobile()) {
      return;
    }

    this.cancelMobileActionHold();
    this.holdTriggered = false;
    this.holdTimer = setTimeout(() => {
      this.holdTriggered = true;
      this.mobileActionTarget = category;
      this.mobileActionField = field;
      this.mobileActionsVisible = true;
    }, 450);
  }

  cancelMobileActionHold(): void {
    if (this.holdTimer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    }
  }

  finishMobileActionHold(): void {
    this.cancelMobileActionHold();
    this.holdTriggered = false;
  }

  onMobileFieldPointerUp(category: ManagedCategory, field: 'name' | 'type', event: Event): void {
    if (!this.isMobile()) {
      return;
    }

    if (this.consumeDismissedOverlayPointer(event)) {
      return;
    }

    this.cancelMobileActionHold();
    if (this.holdTriggered) {
      this.holdTriggered = false;
      return;
    }

    if ((event as PointerEvent).pointerType === 'mouse') {
      return;
    }

    const tapKey = `${category.id}:${field}`;
    const now = Date.now();
    if (this.lastTapKey === tapKey && now - this.lastTapAt <= 320) {
      this.cancelPendingCategoryNameTap();
      this.lastTapKey = '';
      this.lastTapAt = 0;
      event.preventDefault();
      event.stopPropagation();
      setTimeout(() => this.openMobileFieldEditor(category, field));
      return;
    }

    this.lastTapKey = tapKey;
    this.lastTapAt = now;

    if (field === 'name') {
      this.cancelPendingCategoryNameTap();
      this.categoryNameTapTimer = setTimeout(() => {
        this.categoryNamePreview = category.categoryName;
        this.categoryNamePreviewVisible = true;
        this.categoryNameTapTimer = null;
      }, 320);
    }
  }

  private cancelPendingCategoryNameTap(): void {
    if (this.categoryNameTapTimer) {
      clearTimeout(this.categoryNameTapTimer);
      this.categoryNameTapTimer = null;
    }
  }

  closeMobileEdit(): void {
    this.mobileEditVisible = false;
  }

  closeMobileActions(): void {
    this.mobileActionsVisible = false;
    this.mobileActionTarget = null;
    this.mobileActionField = null;
  }

  onMobileOverlayPointerDown(
    event: PointerEvent,
    overlay: 'edit' | 'actions' | 'preview'
  ): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.dismissedOverlayPointerId = event.pointerId;
    this.cancelPendingCategoryNameTap();

    switch (overlay) {
      case 'edit':
        this.closeMobileEdit();
        break;
      case 'actions':
        this.closeMobileActions();
        break;
      case 'preview':
        this.categoryNamePreviewVisible = false;
        break;
    }
  }

  private consumeDismissedOverlayPointer(event: Event): boolean {
    const pointerEvent = event as PointerEvent;
    if (pointerEvent.pointerId !== this.dismissedOverlayPointerId) {
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

  openMobileFieldEditor(category: ManagedCategory, field: 'name' | 'type'): void {
    this.mobileEditTarget = category;
    this.mobileEditField = field;
    this.mobileEditName = category.categoryName;
    this.mobileEditIsIncome = category.isIncome;
    this.mobileEditVisible = true;
  }

  saveMobileFieldEdit(): void {
    if (!this.mobileEditTarget || !this.mobileEditField) {
      return;
    }

    if (this.mobileEditField === 'name') {
      this.mobileEditTarget.categoryName = this.mobileEditName.trim();
    } else {
      this.mobileEditTarget.isIncome = this.mobileEditIsIncome;
    }

    this.apiService.updateCategory(this.mobileEditTarget).subscribe();
    this.existingCategories = [...this.existingCategories];
    this.closeMobileEdit();
  }

  editMobileActionField(): void {
    if (!this.mobileActionTarget || !this.mobileActionField) {
      return;
    }

    const category = this.mobileActionTarget;
    const field = this.mobileActionField;
    this.mobileActionsVisible = false;
    this.mobileActionTarget = null;
    this.mobileActionField = null;
    this.openMobileFieldEditor(category, field);
  }

  setMobileCategoryInactive(isInactive: boolean): void {
    if (!this.mobileActionTarget) {
      return;
    }

    const category = this.mobileActionTarget;
    this.mobileActionsVisible = false;
    this.mobileActionTarget = null;
    this.mobileActionField = null;
    this.setCategoryInactive(category, isInactive);
  }

  confirmMobileDelete(event: Event): void {
    if (!this.mobileActionTarget) {
      return;
    }

    const category = this.mobileActionTarget;
    this.mobileActionsVisible = false;
    this.mobileActionTarget = null;
    this.mobileActionField = null;
    this.confirmDelete(event, category);
  }

  setCategoryInactive(category: ManagedCategory, isInactive: boolean): void {
    this.apiService.setCategoryInactive(category, isInactive)
      .subscribe(() => {
        category.isInactive = isInactive;
        this.existingCategories = [...this.existingCategories];
      });
  }

  confirmDelete(event: Event, category: Category) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Delete?',
      icon: 'pi pi-trash',
      accept: () => {
        this.deleteCategory(category);
      },
      reject: () => {
        //do nothing
      }
    });
  }

  deleteCategory(category: Category) {
    // confirmation is checked first in confirmDelete(). Then:

    // first check that there are no transactions using that category
    let filter: TransactionFilters = {
      categoryFilter: true,
      selectedCategoryIds: [category.id],
      dateFilter: false,
      dateLatest: '2000/1/1', // dates are not used but must be valid for the filter
      dateOldest: '2000/1/1',
    };

    this.apiService.getTransactions(filter).
      subscribe(transactions => {
        if (transactions.length > 0) {
          // show a popup error, that you can't delete this category
          // because there are dependent transactions
          this.showDeleteCategoryErrorPopup(transactions.length);
        }
        else {
          // request a delete from database.
          this.apiService.deleteCategory(category)
            .subscribe(returnedCategory => this.onSuccessfulDelete(returnedCategory));
        }
      });

  }

  deleteCategoryErrorPopup = {
    visible: false,
    errorString: '',
  }

  showDeleteCategoryErrorPopup(numTrans: number) {
    if(numTrans == 1)
      this.deleteCategoryErrorPopup.errorString = 'There is 1 transaction that depends on this category.'
      else
      this.deleteCategoryErrorPopup.errorString = 'There are '+numTrans+' transactions that depend on this category.'
    this.deleteCategoryErrorPopup.visible = true;
  }

  onSuccessfulDelete(category: Category) {
    this.existingCategories = this.existingCategories.filter((curCategory) => curCategory.id !== category.id);
  }

}
