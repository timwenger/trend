import { Component, OnInit, ChangeDetectionStrategy, EventEmitter, Output } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators, FormGroupDirective, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Category, categorySelectionValidator } from '../category';
import { NewTransaction, Transaction } from '../transaction';
import { Bind } from 'primeng/bind';
import { DatePicker } from 'primeng/datepicker';
import { Ripple } from 'primeng/ripple';
import { ButtonDirective, ButtonIcon, Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { CategoryMultiselectComponent } from '../category-multiselect/category-multiselect.component';
import { NoCategoriesComponent } from '../no-categories/no-categories.component';
import { TouchFocusDirective } from '../touch-focus.directive';
import { DatePickerTouchDismissDirective } from '../datepicker-touch-dismiss.directive';

@Component({
    selector: 'app-add-edit',
    templateUrl: './add-transaction.component.html',
    styleUrls: ['./add-transaction.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FormsModule, ReactiveFormsModule, Bind, DatePicker, Ripple, ButtonDirective, ButtonIcon, InputText, CategoryMultiselectComponent, Button, NoCategoriesComponent, TouchFocusDirective, DatePickerTouchDismissDirective]
})
export class AddTransactionComponent implements OnInit {
  addTransactionForm!: UntypedFormGroup;
  allCategories: Category[] = [];
  noCategories: boolean = false;
  @Output() transactionAdded = new EventEmitter<Transaction>();

  constructor(
    private apiService: ApiService,
  ) { }


  ngOnInit(): void {
    this.apiService.getCategories()
      .subscribe(categoriesReturned => {
        this.allCategories = categoriesReturned;
        // only create the form after the categories have been fetched.
        this.createForm();
        if(categoriesReturned.length ==0)
          this.noCategories = true;
      });
  }

  createForm() {
    // new Date().toDateString() just keeps the date, so hours and minutes are removed
    this.addTransactionForm = new UntypedFormGroup({
      dateOfTransaction: new FormControl<Date>({ value: new Date(new Date().toDateString()), disabled: false }, Validators.required,),
      categoriesDropdown: new FormControl<Category[] | null>(
        null,
        [Validators.required, categorySelectionValidator()]
      ),
      amountInput: new FormControl<number | null>(null, Validators.required),
      descriptionInput: new FormControl<string>(''),
    });
  }

  onSubmit(f: FormGroupDirective) {
    this.addTransactionToDb(f.form);
    let calendar = f.form.controls['dateOfTransaction'];
    let selectedDate = calendar.value as Date;
    let categories = f.form.controls['categoriesDropdown'];
    let selectedCategories = categories.value;
    f.resetForm();
    // keep selected date and categories for next entry
    calendar.setValue(selectedDate);
    categories.setValue(selectedCategories);
    // description field isn't required, so set it to an empty string so it isn't null
    f.form.controls['descriptionInput'].setValue('');
  }

  onFormKeyDown(event: KeyboardEvent, formDirective: FormGroupDirective): void {
    if (!event.ctrlKey || event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.onCategoryShortcut(formDirective);
  }

  onCategoryShortcut(formDirective: FormGroupDirective): void {
    if (formDirective.form.valid) {
      this.onSubmit(formDirective);
    }
  }

  onClickPrevDate(f: FormGroupDirective){
    let calendar = f.form.controls['dateOfTransaction'];
    let date = calendar.value as Date;
    date.setDate(date.getDate()-1);
    calendar.setValue(date);
  }

  onClickNextDate(f: FormGroupDirective){
    let calendar = f.form.controls['dateOfTransaction'];
    let date = calendar.value as Date;
    date.setDate(date.getDate()+1);
    calendar.setValue(date);
  }

  addTransactionToDb(f: UntypedFormGroup) {
    let dateTimeNow = new Date();
    let transDate = f.controls['dateOfTransaction'].value;
    let selectedCategories = f.controls['categoriesDropdown'].value;

    let newTransaction: NewTransaction = {
      dateTimeWhenRecorded: dateTimeNow,
      dateOfTransaction: transDate,
      categories: selectedCategories,
      amount: f.controls['amountInput'].value,
      transactionDescription: f.controls['descriptionInput'].value,
    }


    this.apiService.addTransaction(newTransaction)
      .subscribe({
        next: transactionReturned => {
          this.transactionAdded.emit(transactionReturned);
        }
      });
  }
}
