import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { PastAppointment } from './past-appointment.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PastAppointmentService {
  private readonly API_URL = 'assets/data/past-appointment.json';

  constructor(private httpClient: HttpClient) {}

  /** CRUD METHODS */
  getAllPastAppointments(): Observable<PastAppointment[]> {
    return this.httpClient
      .get<PastAppointment[]>(this.API_URL)
      .pipe(catchError(this.handleError));
  }

  addPastAppointment(
    appointment: PastAppointment
  ): Observable<PastAppointment> {
    // Simulate adding the past appointment
    return of(appointment).pipe(
      map((response) => {
        return response; // Return the added appointment
      }),
      catchError(this.handleError)
    );

    // Uncomment the following for actual API call
    // return this.httpClient
    //   .post<PastAppointment>(this.API_URL, appointment)
    //   .pipe(catchError(this.handleError));
  }

  updatePastAppointment(
    appointment: PastAppointment
  ): Observable<PastAppointment> {
    // Simulate updating the past appointment
    return of(appointment).pipe(
      map((response) => {
        return response; // Return the updated appointment
      }),
      catchError(this.handleError)
    );

    // Uncomment the following for actual API call
    // return this.httpClient
    //   .put<PastAppointment>(`${this.API_URL}`, appointment)
    //   .pipe(catchError(this.handleError));
  }

  deletePastAppointment(id: number): Observable<void> {
    // Simulate deleting the past appointment
    return of(void 0).pipe(
      map(() => {
        return;
      }),
      catchError(this.handleError)
    );

    // Uncomment the following for actual API call
    // return this.httpClient
    //   .delete<void>(`${this.API_URL}`)
    //   .pipe(catchError(this.handleError));
  }

  /** Handle Http operation that failed */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error(`Error: ${error.message}`);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
