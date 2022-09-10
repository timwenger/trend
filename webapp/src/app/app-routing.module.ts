import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddTransactionComponent } from './add-transaction/add-transaction.component';
import { EditTransactionComponent } from './edit-transaction/edit-transaction.component';
import { TransactionsFilterComponent } from './transactions-filter/transactions-filter.component';
import { AuthGuard } from '@auth0/auth0-angular'

const routes: Routes = [
  { path: 'transactions', component: TransactionsFilterComponent, canActivate: [AuthGuard] },
  { path: 'add-transaction', component: AddTransactionComponent, canActivate: [AuthGuard] },
  { path: 'edit/:id', component: EditTransactionComponent, canActivate: [AuthGuard] }, 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }