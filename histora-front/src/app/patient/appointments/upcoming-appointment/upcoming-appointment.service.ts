import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { UpcomingAppointment } from './upcoming-appointment.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UpcomingAppointmentService {
  private readonly API_URL = 'assets/data/upcoming-appointment.json';
  private dataChange: BehaviorSubject<UpcomingAppointment[]> =
    new BehaviorSubject<UpcomingAppointment[]>([]);

  constructor(private httpClient: HttpClient) {}

  /** CRUD METHODS */
  getAllUpcomingAppointments(): Observable<UpcomingAppointment[]> {
    return this.httpClient
      .get<UpcomingAppointment[]>(this.API_URL)
      .pipe(catchError(this.handleError));
  }

  addUpcomingAppointment(
    appointment: UpcomingAppointment
  ): Observable<UpcomingAppointment> {
    // Simulate adding the upcoming appointment
    return of(appointment).pipe(
      map(() => {
        return appointment; // Return the newly added appointment
      }),
      catchError(this.handleError)
    );

    // Uncomment the following for real API call
    // return this.httpClient
    //   .post<UpcomingAppointment>(this.API_URL, appointment)
    //   .pipe(
    //     map(() => {
    //       return appointment; // Return the added appointment
    //     }),
    //     catchError(this.handleError)
    //   );
  }

  updateUpcomingAppointment(
    appointment: UpcomingAppointment
  ): Observable<UpcomingAppointment> {
    // Simulate updating the upcoming appointment
    return of(appointment).pipe(
      map(() => {
        return appointment; // Return the updated appointment
      }),
      catchError(this.handleError)
    );

    // Uncomment the following for real API call
    // return this.httpClient
    //   .put<UpcomingAppointment>(`${this.API_URL}`, appointment)
    //   .pipe(
    //     map(() => {
    //       return appointment; // Return the updated appointment
    //     }),
    //     catchError(this.handleError)
    //   );
  }

  deleteUpcomingAppointment(id: number): Observable<number> {
    // Simulate deleting the upcoming appointment
    return of(id).pipe(
      map(() => {
        return id; // Return the ID of the deleted appointment
      }),
      catchError(this.handleError)
    );

    // Uncomment the following for real API call
    // return this.httpClient
    //   .delete<void>(`${this.API_URL}`)
    //   .pipe(
    //     map(() => {
    //       return id; // Return the ID of the deleted appointment
    //     }),
    //     catchError(this.handleError)
    //   );
  }

  /** Handle Http operation that failed */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error(`Error: ${error.message}`);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
