import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
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
  addTransactionForm!: FormGroup;

  allCategories: Category[] = [];
  objReturned: any;
  
  constructor(
    private apiService: ApiService,
    private utilityService: UtilityService,
    ) { }


  ngOnInit(): void {
    this.apiService.getCategories()
    .subscribe(categoriesReturned => this.allCategories = categoriesReturned);
    this.createForm();
  }

  createForm() {
    this.addTransactionForm = new FormGroup({
      dateOfTransaction: new FormControl(new Date(), Validators.required, ),
      categoryDropdown: new FormControl('', Validators.required),
      amountInput: new FormControl('', Validators.required),
      descriptionInput: new FormControl(''),
    });
  }

  onSubmit(event:any){
    this.addTransactionToDb();
  }

  addTransactionToDb(){
    let dateTimeNow = this.utilityService.getLocalIsoDateTime(new Date());
    let transDate = this.utilityService.getLocalIsoDateTime(this.addTransactionForm.controls['dateOfTransaction'].value);
    let selectedCategory = this.addTransactionForm.controls['categoryDropdown'].value;

    let newTransaction: NewTransaction = {
      dateTimeWhenRecorded: dateTimeNow,
      dateOfTransaction: transDate,
      categoryId: selectedCategory['id'],
      amount: this.addTransactionForm.controls['amountInput'].value,
      transactionDescription: this.addTransactionForm.controls['descriptionInput'].value,
    }


    this.apiService.addTransaction(newTransaction)
    .subscribe({
      next: objectReturned => {
        this.objReturned = objectReturned;
      }
    });
  }
}
