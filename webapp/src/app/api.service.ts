import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap, catchError, map } from 'rxjs';
import { MessageService } from './message.service';
import { NewTransaction, Transaction } from './transaction';
import { Category, NewCategory } from './category';
import { TransactionFilters } from './transactionfilters';
import { apiBaseUrl } from 'src/environments/environment';

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
    return this.http.get<Category[]>(this.apiBaseUrl + this.categoriesApiUrl)
      .pipe(
        // sort categories by their name
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
    return this.http.post<NewCategory>(url, newCategory)
      .pipe(
        //handling response
        catchError(this.handleError<any>('addCategory', newCategory))
      );
  }

  updateCategory(toBeUpdated: Category): Observable<Category> {
    let url = this.apiBaseUrl + this.categoriesApiUrl + '/' + toBeUpdated.id;
    return this.http.put<Category>(url, toBeUpdated)
      .pipe(
        //handling response (no object is passed back)
        tap(_ => this.logMsg('updated this category:' + JSON.stringify(toBeUpdated))),
        catchError(this.handleError<any>('updateCategory', toBeUpdated))
      );
  }

  deleteCategory(toBeDeleted: Category): Observable<Category> {
    let url = this.apiBaseUrl + this.categoriesApiUrl + '/' + toBeDeleted.id;
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
