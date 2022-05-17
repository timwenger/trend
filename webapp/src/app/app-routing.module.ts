import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransactionsComponent } from './transactions/transactions.component';

const routes: Routes = [
  { path: 'transactions', component: TransactionsComponent },
  { path: '', redirectTo: '/transactions', pathMatch: 'full' },
  //{ path: 'detail/:id', component: HeroDetailComponent }, // make into transaction details component
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }