import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { Category, NewCategory } from '../category';
import { ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { TransactionFilters } from '../transactionfilters';
import { Transaction } from '../transaction';


@Component({
  selector: 'app-manage-categories',
  templateUrl: './manage-categories.component.html',
  styleUrls: ['./manage-categories.component.css']
})
export class ManageCategoriesComponent implements OnInit {
  addCategoryForm!: UntypedFormGroup;
  existingCategories: Category[] = [];
  categoryEditBackups: { [id: number]: Category; } = {};

  deleteCategoryPopupError = {
    visible: false,
    numDependentTransactions: 0
  }

  constructor(
    private apiService: ApiService,
    private confirmationService: ConfirmationService,
  ) { }

  ngOnInit(): void {
    this.createForm();

    this.apiService.getCategories()
      .subscribe(categoriesReturned => {
        this.existingCategories = categoriesReturned;

      });
  }

  createForm() {
    this.addCategoryForm = new UntypedFormGroup({
      categoryName: new UntypedFormControl('', Validators.required),
    });
  }


  onSubmit(f: FormGroupDirective) {
    this.addCategoryToDb(f.form);
    f.resetForm();
  }

  addCategoryToDb(f: UntypedFormGroup) {

    let newCategory: NewCategory = {
      categoryName: f.controls['categoryName'].value,
    }

    this.apiService.addCategory(newCategory)
      .subscribe((categoryReturned) => {
        // use the returned transaction to updated the existing categories table
        // copy the array so that the transactions component sees the change
        this.existingCategories = [...this.existingCategories, categoryReturned];
      });
  }





  onRowEditInit(category: Category) {
    // make a deep copy, not just a new ref to the same obj
    this.categoryEditBackups[category.id] = { ...category };
  }

  onRowEditSave(category: Category) {
    delete this.categoryEditBackups[category.id];
    // edit the category in the database
    this.apiService.updateCategory(category)
      .subscribe(/* I'm not using the returned updated category */);
  }

  onRowEditCancel(category: Category, rowIndex: number) {
    // revert the row to the saved copy before edits began
    this.existingCategories[rowIndex] = this.categoryEditBackups[category.id];
    // make a new array, so the table refreshes
    this.existingCategories = [...this.existingCategories];
    delete this.categoryEditBackups[category.id];
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
          this.deleteCategoryPopupError.numDependentTransactions = transactions.length;
          this.deleteCategoryPopupError.visible = true;
        }
        else {
          // request a delete from database. 
          this.apiService.deleteCategory(category)
            .subscribe(returnedCategory => this.onSuccessfulDelete(returnedCategory));
        }
      });

  }

  onSuccessfulDelete(category: Category) {
    this.existingCategories = this.existingCategories.filter((curCategory) => curCategory.id !== category.id);
  }

}
