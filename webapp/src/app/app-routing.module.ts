import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddTransactionComponent } from './add-transaction/add-transaction.component';
import { TransactionsFilterComponent } from './transactions-filter/transactions-filter.component';
import { AuthGuard } from '@auth0/auth0-angular'
import { ManageCategoriesComponent } from './manage-categories/manage-categories.component';

const routes: Routes = [
  { path: 'transactions', component: TransactionsFilterComponent, canActivate: [AuthGuard] },
  { path: 'add-transaction', component: AddTransactionComponent, canActivate: [AuthGuard] },
  { path: 'manage-categories', component: ManageCategoriesComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }