import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransactionsFilterComponent } from './transactions-filter/transactions-filter.component';
import { AuthGuard } from '@auth0/auth0-angular'
import { ManageCategoriesComponent } from './manage-categories/manage-categories.component';
import { TrendsComponent } from './trends/trends.component';

const routes: Routes = [
  { path: '', redirectTo: 'trends', pathMatch: 'full' },
  { path: 'trends', component: TrendsComponent, canActivate: [AuthGuard] },
  { path: 'transactions', component: TransactionsFilterComponent, canActivate: [AuthGuard] },
  { path: 'add-transaction', redirectTo: 'transactions', pathMatch: 'full' },
  { path: 'manage-categories', component: ManageCategoriesComponent, canActivate: [AuthGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }