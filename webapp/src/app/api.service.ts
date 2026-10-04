import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap, catchError, map, throwError } from 'rxjs';
import { MessageService } from './message.service';
import { NewTransaction, Transaction } from './transaction';
import { Category, compareCategories, NewCategory } from './category';
import { TransactionFilters } from './transactionfilters';
import { apiBaseUrl } from 'src/environments/environment';
import { TransactionRule, TransactionRuleConfig } from './transaction-rule';

@Injectable({
  providedIn: 'root'
})

export class ApiService {
  private apiBaseUrl = apiBaseUrl + 'api/';
  private transactionsApiUrl = 'transactions';
  private categoriesApiUrl = 'categories';
  private transactionRulesApiUrl = 'transactionrules';

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
  ) { }


  getTransactions(filter: TransactionFilters): Observable<Transaction[]> {
    let url = this.apiBaseUrl + this.transactionsApiUrl;

    return this.http.get<Transaction[]>(url, { params: filter as any })
      .pipe(
        catchError(this.handleError<Transaction[]>('getTransactions', filter as any))
      );
  }

  addTransaction(newTransaction: NewTransaction): Observable<any> {
    let url = this.apiBaseUrl + this.transactionsApiUrl;
    return this.http.post<NewTransaction>(url, newTransaction)
      .pipe(
        catchError(this.handleError<any>('addTransaction', newTransaction))
      );
  }

  updateTransaction(toBeUpdated: Transaction): Observable<Transaction> {
    let url = this.apiBaseUrl + this.transactionsApiUrl + '/' + toBeUpdated.id;
    return this.http.put<Transaction>(url, toBeUpdated)
      .pipe(
        catchError(this.handleError<any>('updateTransaction', toBeUpdated))
      );
  }

  deleteTransaction(toBeDeleted: Transaction): Observable<Transaction> {
    let url = this.apiBaseUrl + this.transactionsApiUrl + '/' + toBeDeleted.id;
    return this.http.delete<Transaction>(url)
      .pipe(
        catchError(this.handleError<any>('deleteTransaction', toBeDeleted))
      );
  }

  getTransactionRules(): Observable<TransactionRule[]> {
    return this.http.get<TransactionRule[]>(this.apiBaseUrl + this.transactionRulesApiUrl)
      .pipe(catchError(this.handleError<TransactionRule[]>('getTransactionRules', [])));
  }

  generatePendingTransactions(): Observable<void> {
    return this.http.post<void>(
      this.apiBaseUrl + this.transactionRulesApiUrl + '/generate-pending',
      null
    ).pipe(catchError(this.handleError<void>('generatePendingTransactions')));
  }

  addTransactionRule(config: TransactionRuleConfig): Observable<TransactionRule> {
    return this.http.post<TransactionRule>(this.apiBaseUrl + this.transactionRulesApiUrl, config)
      .pipe(catchError(this.handleError<TransactionRule>('addTransactionRule')));
  }

  updateTransactionRule(rule: TransactionRule): Observable<void> {
    return this.http.put<void>(this.apiBaseUrl + this.transactionRulesApiUrl + '/' + rule.id, rule)
      .pipe(catchError(this.handleError<void>('updateTransactionRule')));
  }

  setTransactionRuleStatus(rule: TransactionRule, isInactive: boolean, catchUpMissed: boolean): Observable<void> {
    return this.http.post<void>(
      this.apiBaseUrl + this.transactionRulesApiUrl + '/' + rule.id + '/status',
      { isInactive, catchUpMissed }
    ).pipe(catchError(this.handleError<void>('setTransactionRuleStatus')));
  }

  deleteTransactionRule(rule: TransactionRule): Observable<void> {
    return this.http.delete<void>(this.apiBaseUrl + this.transactionRulesApiUrl + '/' + rule.id)
      .pipe(catchError(this.handleError<void>('deleteTransactionRule')));
  }

  getPendingTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiBaseUrl + this.transactionsApiUrl, {
      params: { recurringStatus: 'Pending' }
    })
      .pipe(catchError(this.handleError<Transaction[]>('getPendingTransactions', [])));
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiBaseUrl + this.categoriesApiUrl)
      .pipe(
        map(categories => categories.sort(compareCategories)),
        catchError(this.handleError<Category[]>('getCategories', []))
      );
  }

  getCategoryLastUsedDates(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(
      this.apiBaseUrl + this.categoriesApiUrl + '/last-used'
    ).pipe(
      catchError(this.handleError<Record<string, string>>('getCategoryLastUsedDates', {}))
    );
  }

  addCategory(newCategory: NewCategory): Observable<any> {
    let url = this.apiBaseUrl + this.categoriesApiUrl;
    return this.http.post<NewCategory>(url, newCategory)
      .pipe(
        catchError(this.handleError<any>('addCategory', newCategory))
      );
  }

  updateCategory(toBeUpdated: Category): Observable<Category> {
    let url = this.apiBaseUrl + this.categoriesApiUrl + '/' + toBeUpdated.id;
    return this.http.put<Category>(url, toBeUpdated)
      .pipe(
        catchError(this.handleError<any>('updateCategory', toBeUpdated))
      );
  }

  setCategoryInactive(category: Category, isInactive: boolean): Observable<Category> {
    const updatedCategory = { ...category, isInactive };
    const url = this.apiBaseUrl + this.categoriesApiUrl + '/' + category.id;
    return this.http.put<Category>(url, updatedCategory).pipe(
      catchError(error => {
        console.error(error);
        this.logMsg(`setCategoryInactive failed: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  setCategoryPinned(category: Category, isPinned: boolean): Observable<Category> {
    const updatedCategory = { ...category, isPinned };
    const url = this.apiBaseUrl + this.categoriesApiUrl + '/' + category.id;
    return this.http.put<Category>(url, updatedCategory).pipe(
      catchError(error => {
        console.error(error);
        this.logMsg(`setCategoryPinned failed: ${error.message}`);
        return throwError(() => error);
      })
    );
  }

  deleteCategory(toBeDeleted: Category): Observable<Category> {
    let url = this.apiBaseUrl + this.categoriesApiUrl + '/' + toBeDeleted.id;
    return this.http.delete<Category>(url);
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

      console.error(error);

      this.logMsg(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
