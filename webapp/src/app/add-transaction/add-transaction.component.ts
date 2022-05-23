import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, NgForm, FormGroupDirective } from '@angular/forms';
import { ApiService } from '../api.service';
import { Category } from '../category';
import { NewTransaction } from '../transaction';
import { UtilityService } from '../utility.service';

@Component({
  selector: 'app-add-edit',
  templateUrl: './add-transaction.component.html',
  styleUrls: ['./add-transaction.component.css']
})
export class AddTransactionComponent implements OnInit {
  addTransactionForm!: FormGroup;

  allCategories: Category[] = [];
  
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
    });
  }

  createForm() {
    this.addTransactionForm = new FormGroup({
      dateOfTransaction: new FormControl({value: new Date(), disabled: false}, Validators.required, ),
      categoryDropdown: new FormControl('', Validators.required),
      amountInput: new FormControl('', Validators.required),
      descriptionInput: new FormControl(''),
    });
  }

  onSubmit(f : FormGroupDirective){
    this.addTransactionToDb(f.form);
    f.resetForm();
    f.form.controls['dateOfTransaction'].setValue(new Date); // doesnt reset without this. Maybe there are better ways?
    f.form.controls['categoryDropdown'].markAsPristine(); // doesnt reset without this. Maybe there are better ways?
  }

  addTransactionToDb(f: FormGroup){
    let dateTimeNow = this.utilityService.getLocalIsoDateTime(new Date());
    let transDate = this.utilityService.getLocalIsoDateTime(f.controls['dateOfTransaction'].value);
    let selectedCategory = f.controls['categoryDropdown'].value;

    let newTransaction: NewTransaction = {
      dateTimeWhenRecorded: dateTimeNow,
      dateOfTransaction: transDate,
      categoryId: selectedCategory['id'],
      amount: f.controls['amountInput'].value,
      transactionDescription: f.controls['descriptionInput'].value,
    }


    this.apiService.addTransaction(newTransaction)
    .subscribe(/*not using the returned transaction*/);
  }
}
