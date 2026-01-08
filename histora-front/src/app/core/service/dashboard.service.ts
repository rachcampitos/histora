import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'environments/environment';

export interface DashboardStats {
  patientsCount: number;
  appointmentsCount: number;
  consultationsCount: number;
  todayAppointments: number;
  completedConsultations: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get dashboard stats for the current doctor/clinic
   */
  getStats(): Observable<DashboardStats> {
    return forkJoin({
      patients: this.http.get<{ count: number }>(`${this.apiUrl}/patients/count`).pipe(
        catchError(() => of({ count: 0 }))
      ),
      appointments: this.http.get<{ count: number }>(`${this.apiUrl}/appointments/count`).pipe(
        catchError(() => of({ count: 0 }))
      ),
      todayAppointments: this.http.get<{ count: number }>(`${this.apiUrl}/appointments/count?status=scheduled`).pipe(
        catchError(() => of({ count: 0 }))
      ),
      consultations: this.http.get<{ count: number }>(`${this.apiUrl}/consultations/count`).pipe(
        catchError(() => of({ count: 0 }))
      ),
      completedConsultations: this.http.get<{ count: number }>(`${this.apiUrl}/consultations/count?status=completed`).pipe(
        catchError(() => of({ count: 0 }))
      ),
    }).pipe(
      map((results) => ({
        patientsCount: results.patients.count,
        appointmentsCount: results.appointments.count,
        todayAppointments: results.todayAppointments.count,
        consultationsCount: results.consultations.count,
        completedConsultations: results.completedConsultations.count,
      }))
    );
  }

  /**
   * Get patient count
   */
  getPatientsCount(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/patients/count`).pipe(
      map((res) => res.count),
      catchError(() => of(0))
    );
  }

  /**
   * Get appointments count by status
   */
  getAppointmentsCount(status?: string): Observable<number> {
    const url = status
      ? `${this.apiUrl}/appointments/count?status=${status}`
      : `${this.apiUrl}/appointments/count`;
    return this.http.get<{ count: number }>(url).pipe(
      map((res) => res.count),
      catchError(() => of(0))
    );
  }

  /**
   * Get consultations count by status
   */
  getConsultationsCount(status?: string): Observable<number> {
    const url = status
      ? `${this.apiUrl}/consultations/count?status=${status}`
      : `${this.apiUrl}/consultations/count`;
    return this.http.get<{ count: number }>(url).pipe(
      map((res) => res.count),
      catchError(() => of(0))
    );
  }
}
