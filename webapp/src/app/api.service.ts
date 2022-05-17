import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap, catchError } from 'rxjs';
import { MessageService } from './message.service';
import { Transaction } from './transaction';


@Injectable({
  providedIn: 'root'
})

export class ApiService {
  private transactionsApiUrl = 'https://localhost:7247/api/Transactions' // 'api/transactions';  // URL to web api
  httpOptions = {
    headers: new HttpHeaders({ 
      'Content-Type': 'application/json',
      //'Access-Control-Allow-Origin': 'http://localhost:4200'
    }),
  };
  
  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    ) { }

  
  

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.transactionsApiUrl)
    .pipe(
      tap(_ => this.logMsg('fetched transactions')),
      catchError(this.handleError<Transaction[]>('getTransactions', []))
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
