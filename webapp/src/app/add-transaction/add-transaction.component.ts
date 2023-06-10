import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators, NgForm, FormGroupDirective } from '@angular/forms';
import { ApiService } from '../api.service';
import { Category } from '../category';
import { NewTransaction, Transaction } from '../transaction';
import { UtilityService } from '../utility.service';

@Component({
  selector: 'app-add-edit',
  templateUrl: './add-transaction.component.html',
  styleUrls: ['./add-transaction.component.css']
})
export class AddTransactionComponent implements OnInit {
  addTransactionForm!: UntypedFormGroup;
  transactionsAddedSoFar: Transaction[] = [];
  allCategories: Category[] = [];
  noCategories: boolean = false;

  constructor(
    private apiService: ApiService,
    private utilityService: UtilityService,
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
      dateOfTransaction: new UntypedFormControl({ value: new Date(new Date().toDateString()), disabled: false }, Validators.required,),
      categoryDropdown: new UntypedFormControl('', Validators.required),
      amountInput: new UntypedFormControl('', Validators.required),
      descriptionInput: new UntypedFormControl(''),
    });
  }

  onSubmit(f: FormGroupDirective) {
    this.addTransactionToDb(f.form);
    let calendar = f.form.controls['dateOfTransaction'];
    let selectedDate = calendar.value as Date;
    let category = f.form.controls['categoryDropdown'];
    let selectedCategory = category.value;
    f.resetForm();
    // keep selected date and category for next entry
    calendar.setValue(selectedDate);
    category.setValue(selectedCategory);
    // description field isn't required, so set it to an empty string so it isn't null
    f.form.controls['descriptionInput'].setValue('');
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
    let selectedCategory = f.controls['categoryDropdown'].value;

    let newTransaction: NewTransaction = {
      dateTimeWhenRecorded: dateTimeNow,
      dateOfTransaction: transDate,
      categories: [
        selectedCategory
      ],
      amount: f.controls['amountInput'].value,
      transactionDescription: f.controls['descriptionInput'].value,
    }


    this.apiService.addTransaction(newTransaction)
      .subscribe({
        // use the returned transaction to updated the "added so far" transactions table
        next: transactionReturned => {
          // set the category to be the selected category, which otherwise gets returned as null
          transactionReturned['category'] = selectedCategory;
          // copy the array so that the transactions component sees the change
          this.transactionsAddedSoFar = [...this.transactionsAddedSoFar, transactionReturned];
        }
      });
  }
}
