import { Routes } from '@angular/router';
import { TransactionsFilterComponent } from './transactions-filter/transactions-filter.component';
import { authGuardFn } from '@auth0/auth0-angular';
import { ManageCategoriesComponent } from './manage-categories/manage-categories.component';
import { TrendsComponent } from './trends/trends.component';
import { RecurringTransactionsComponent } from './recurring-transactions/recurring-transactions.component';

export const routes: Routes = [
  { path: '', redirectTo: 'trends', pathMatch: 'full' },
  { path: 'trends', component: TrendsComponent, canActivate: [authGuardFn] },
  { path: 'transactions', component: TransactionsFilterComponent, canActivate: [authGuardFn] },
  { path: 'recurring-transactions', component: RecurringTransactionsComponent, canActivate: [authGuardFn] },
  { path: 'add-transaction', redirectTo: 'transactions', pathMatch: 'full' },
  { path: 'manage-categories', component: ManageCategoriesComponent, canActivate: [authGuardFn] },
];