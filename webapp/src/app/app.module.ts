import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // <-- NgModel lives here
import { ReactiveFormsModule, } from '@angular/forms';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MessagesComponent } from './messages/messages.component';
import { HttpClientModule } from '@angular/common/http';
import { TransactionsComponent } from './transactions/transactions.component';
import { TransactionsFilterComponent } from './transactions-filter/transactions-filter.component';

import { ButtonModule} from 'primeng/button';
import {CalendarModule} from 'primeng/calendar';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MultiSelectModule} from 'primeng/multiselect';

@NgModule({
  declarations: [
    AppComponent,
    MessagesComponent,
    TransactionsComponent,
    TransactionsFilterComponent,
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
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
