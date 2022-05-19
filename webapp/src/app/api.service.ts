import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap, catchError } from 'rxjs';
import { MessageService } from './message.service';
import { Transaction } from './transaction';
import { Category } from './category';
import { TransactionFilters } from './transactionfilters';


@Injectable({
  providedIn: 'root'
})

export class ApiService {
  private baseUrl = 'https://localhost:7247/api'; 
  private transactionsApiUrl = '/Transactions';
  private categoriesApiUrl = '/Categories';
  httpOptions = {
    headers: new HttpHeaders({ 
      'Content-Type': 'application/json',
    }),
  };

  filter  = {
    dateFilter: true,
    dateOldest: "2022/02/09",
    dateLatest: "2022/04/03",
    categoryFilter: true,
    selectedCategoryIds: [1,2,3,4,5]
  }
  
  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    ) { }

   
  

  getTransactions(filter: TransactionFilters): Observable<Transaction[]> {
    let url = this.baseUrl + this.transactionsApiUrl;
    this.filter = filter;
    return this.http.get<Transaction[]>(url, {params:this.filter})
    .pipe(
      tap(_ => this.logMsg('fetched transactions')),
      catchError(this.handleError<Transaction[]>('getTransactions', []))
    );
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.baseUrl + this.categoriesApiUrl)
    .pipe(
      tap(_ => this.logMsg('fetched transactions')),
      catchError(this.handleError<Category[]>('getCategories', []))
    );
  }

  /** Log a HeroService message with the MessageService */
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
