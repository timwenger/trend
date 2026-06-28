import { NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // <-- NgModel lives here
import { ReactiveFormsModule, } from '@angular/forms';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MessagesComponent } from './messages/messages.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TransactionsComponent } from './transactions/transactions.component';
import { TransactionsFilterComponent } from './transactions-filter/transactions-filter.component';
import { AddTransactionComponent } from './add-transaction/add-transaction.component';
import { TopBarComponent } from './top-bar/top-bar.component';

import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InputText } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { MenubarModule } from 'primeng/menubar';
import { RippleModule } from 'primeng/ripple';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';

import { AuthModule, AuthHttpInterceptor } from '@auth0/auth0-angular';
import { environment } from '../environments/environment';
import { ManageCategoriesComponent } from './manage-categories/manage-categories.component';
import { NoCategoriesComponent } from './no-categories/no-categories.component';
import { TrendsComponent } from './trends/trends.component';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { CategoryMultiselectComponent } from './category-multiselect/category-multiselect.component';

@NgModule({
  declarations: [
    AppComponent,
    MessagesComponent,
    TransactionsComponent,
    TransactionsFilterComponent,
    AddTransactionComponent,
    TopBarComponent,
    ManageCategoriesComponent,
    NoCategoriesComponent,
    TrendsComponent,
    CategoryMultiselectComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,

    ButtonModule,
    DatePicker,
    InputText,
    BrowserAnimationsModule,
    MultiSelectModule,
    Select,
    TableModule,
    CardModule,
    MenubarModule,
    RippleModule,
    ConfirmPopupModule,
    DialogModule,
    RadioButtonModule,
    CheckboxModule,
    BaseChartDirective,
    AuthModule.forRoot({
      domain: environment.auth.domain,
      clientId: environment.auth.clientId,
      authorizationParams: {
        redirect_uri: environment.auth.redirectUri,
        audience: environment.auth.audience,
        scope: environment.auth.scope,
      },
      httpInterceptor: environment.auth.httpInterceptor,
    }),
  ],

  providers: [
    ConfirmationService,
    Title,
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
    provideCharts(withDefaultRegisterables()),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
