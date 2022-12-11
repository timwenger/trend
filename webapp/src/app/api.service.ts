import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap, catchError, map } from 'rxjs';
import { MessageService } from './message.service';
import { NewTransaction, Transaction } from './transaction';
import { Category, NewCategory, DbCategory, NewDbCategory } from './category';
import { TransactionFilters } from './transactionfilters';
import { apiBaseUrl } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})

export class ApiService {
  private apiBaseUrl = apiBaseUrl + 'api/';
  private transactionsApiUrl = 'transactions';
  private categoriesApiUrl = 'categories';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) { }


  getTransactions(filter: TransactionFilters): Observable<Transaction[]> {
    let url = this.apiBaseUrl + this.transactionsApiUrl;

    return this.http.get<Transaction[]>(url, { params: filter as any })
      .pipe(
        map(transactions => 
          // transactions come with their full category object, so we convert that from a dbCategory first
          transactions.map(transaction => {
            this.convertDbCategoryToCategory(transaction.category)
            return transaction;
          })),
        tap(_ => this.logMsg('fetched transactions using this filter:' + JSON.stringify(filter))),
        catchError(this.handleError<Transaction[]>('getTransactions', filter as any))
      );
  }

  addTransaction(newTransaction: NewTransaction): Observable<any> {
    let url = this.apiBaseUrl + this.transactionsApiUrl;
    return this.http.post<NewTransaction>(url, newTransaction)
      .pipe(
        // handling response
        tap(addedTransaction => this.logMsg('added this transaction:' + JSON.stringify(addedTransaction))),
        catchError(this.handleError<any>('addTransaction', newTransaction))
      );
  }

  updateTransaction(toBeUpdated: Transaction): Observable<Transaction> {
    let url = this.apiBaseUrl + this.transactionsApiUrl + '/' + toBeUpdated.id;
    return this.http.put<Transaction>(url, toBeUpdated)
      .pipe(
        //handling response (no object is passed back)
        tap(_ => this.logMsg('updated this transaction:' + JSON.stringify(toBeUpdated))),
        catchError(this.handleError<any>('updateTransaction', toBeUpdated))
      );
  }

  deleteTransaction(toBeDeleted: Transaction): Observable<Transaction> {
    let url = this.apiBaseUrl + this.transactionsApiUrl + '/' + toBeDeleted.id;
    return this.http.delete<Transaction>(url)
      .pipe(
        // handling response
        tap(_ => this.logMsg('deleted this transaction:' + JSON.stringify(toBeDeleted))),
        catchError(this.handleError<any>('deleteTransaction', toBeDeleted))
      );
  }

  getCategories(): Observable<Category[]> {
    // https://stackoverflow.com/questions/49916203/changing-return-type-of-an-observable-with-map
    return this.http.get<DbCategory[]>(this.apiBaseUrl + this.categoriesApiUrl)
      .pipe(
        map<DbCategory[],Category[]>(dbCategories => 
          dbCategories.map(dbCategory => this.convertDbCategoryToCategory(dbCategory))),
        // categories will come in order of their ID. 
        // sort them by their name instead
        map(categories => categories.sort(this.categoryCompareFn)),
        tap(_ => this.logMsg('fetched categories')),
        catchError(this.handleError<Category[]>('getCategories', []))
      );
  }

  categoryCompareFn = (c1: Category, c2: Category) => {
    return c1.categoryName.localeCompare(c2.categoryName);
  };

  addCategory(newCategory: NewCategory): Observable<any> {
    let url = this.apiBaseUrl + this.categoriesApiUrl;
    return this.http.post<NewDbCategory>(url, this.convertCategoryToDbCategory(newCategory))
      .pipe(
        //handling response
        map(dbCategory => this.convertDbCategoryToCategory(dbCategory)),
        catchError(this.handleError<any>('addCategory', newCategory))
      );
  }

  updateCategory(toBeUpdated: Category): Observable<Category> {
    let url = this.apiBaseUrl + this.categoriesApiUrl + '/' + toBeUpdated.id;
    return this.http.put<DbCategory>(url, this.convertCategoryToDbCategory(toBeUpdated))
      .pipe(
        //handling response (no object is passed back)
        tap(_ => this.logMsg('updated this category:' + JSON.stringify(toBeUpdated))),
        catchError(this.handleError<any>('updateCategory', toBeUpdated))
      );
  }

  // input and output args are not typed so that the object
  // does not need to be copied (just add a new property) and
  // can be used for NewCategories (without an id) as well
  convertDbCategoryToCategory(category: any):any{
    if(category.isIncome == true)
      category.expenseOrIncome = 'Income';
    else
      category.expenseOrIncome = 'Expense';
    return category;
  }

  convertCategoryToDbCategory(category: any):any{
    if(category.expenseOrIncome == 'Income')
      category.isIncome = true;
    else
      category.isIncome = false;
    return category;
  }

  deleteCategory(toBeDeleted: Category): Observable<Category> {
    let url = this.apiBaseUrl + this.categoriesApiUrl + '/' + toBeDeleted.id;
    // I'm not converting the category to a dbCategory here, 
    // because I'm just deleting it. Only the ID needs to be right
    return this.http.delete<Category>(url)
      .pipe(
        //handling response
        tap(deleted => this.logMsg('deleted this Category:' + JSON.stringify(deleted))),
        catchError(this.handleError<any>('deleteCategory', toBeDeleted))
      );
  }

  private logMsg(message: string) {
    this.messageService.add(`API Service: ${message}`);
  }

  /**
* Handle Http operation that failed.
* Let the app continue.
*
* @param operation - name of the operation that failed
* @param result - optional value to return as the observable result
*/
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.logMsg(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
