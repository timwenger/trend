import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // <-- NgModel lives here
import { ReactiveFormsModule, } from '@angular/forms';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MessagesComponent } from './messages/messages.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TransactionsComponent } from './transactions/transactions.component';
import { TransactionsFilterComponent } from './transactions-filter/transactions-filter.component';
import { AddTransactionComponent } from './add-transaction/add-transaction.component';
import { EditTransactionComponent } from './edit-transaction/edit-transaction.component';
import { TopBarComponent } from './top-bar/top-bar.component';

import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { MenubarModule } from 'primeng/menubar';
import { RippleModule } from 'primeng/ripple';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';

import { AuthModule, AuthHttpInterceptor } from '@auth0/auth0-angular';
import { environment } from '../environments/environment';
import { ManageCategoriesComponent } from './manage-categories/manage-categories.component';
import { NoCategoriesComponent } from './no-categories/no-categories.component';

@NgModule({
  declarations: [
    AppComponent,
    MessagesComponent,
    TransactionsComponent,
    TransactionsFilterComponent,
    AddTransactionComponent,
    EditTransactionComponent,
    TopBarComponent,
    ManageCategoriesComponent,
    NoCategoriesComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,

    ButtonModule,
    CalendarModule,
    BrowserAnimationsModule,
    MultiSelectModule,
    DropdownModule,
    TableModule,
    CardModule,
    MenubarModule,
    RippleModule,
    ConfirmPopupModule,
    DialogModule,
    AuthModule.forRoot(environment.auth),
  ],

  providers: [
    ConfirmationService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
