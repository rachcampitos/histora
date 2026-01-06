import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentStatus,
} from './appointments.model';

export interface AppointmentFilters {
  doctorId?: string;
  patientId?: string;
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
}

export interface CancelAppointmentDto {
  cancellationReason: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentsApiService {
  private readonly API_URL = `${environment.apiUrl}/appointments`;

  constructor(private http: HttpClient) {}

  /**
   * Get all appointments with optional filters
   */
  getAll(filters?: AppointmentFilters): Observable<Appointment[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.doctorId) params = params.set('doctorId', filters.doctorId);
      if (filters.patientId) params = params.set('patientId', filters.patientId);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
    }

    return this.http
      .get<Appointment[]>(this.API_URL, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get today's appointments
   */
  getToday(doctorId?: string): Observable<Appointment[]> {
    let params = new HttpParams();
    if (doctorId) params = params.set('doctorId', doctorId);

    return this.http
      .get<Appointment[]>(`${this.API_URL}/today`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get a single appointment by ID
   */
  getById(id: string): Observable<Appointment> {
    return this.http
      .get<Appointment>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a new appointment
   */
  create(appointment: CreateAppointmentDto): Observable<Appointment> {
    return this.http
      .post<Appointment>(this.API_URL, appointment)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update an existing appointment
   */
  update(id: string, appointment: UpdateAppointmentDto): Observable<Appointment> {
    return this.http
      .patch<Appointment>(`${this.API_URL}/${id}`, appointment)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update appointment status only
   */
  updateStatus(id: string, status: AppointmentStatus): Observable<Appointment> {
    return this.http
      .patch<Appointment>(`${this.API_URL}/${id}/status`, { status })
      .pipe(catchError(this.handleError));
  }

  /**
   * Cancel an appointment with a reason
   */
  cancel(id: string, cancellationReason: string): Observable<Appointment> {
    return this.http
      .patch<Appointment>(`${this.API_URL}/${id}/cancel`, { cancellationReason })
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete an appointment
   */
  delete(id: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get appointment count
   */
  count(status?: AppointmentStatus): Observable<{ count: number }> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);

    return this.http
      .get<{ count: number }>(`${this.API_URL}/count`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get appointments by doctor
   */
  getByDoctor(doctorId: string, date?: string): Observable<Appointment[]> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);

    return this.http
      .get<Appointment[]>(`${this.API_URL}/doctor/${doctorId}`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get appointments by patient
   */
  getByPatient(patientId: string): Observable<Appointment[]> {
    return this.http
      .get<Appointment[]>(`${this.API_URL}/patient/${patientId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get available time slots for a doctor on a specific date
   */
  getAvailableSlots(
    doctorId: string,
    date: string
  ): Observable<{ startTime: string; endTime: string }[]> {
    const params = new HttpParams().set('date', date);

    return this.http
      .get<{ startTime: string; endTime: string }[]>(
        `${this.API_URL}/available/${doctorId}`,
        { params }
      )
      .pipe(catchError(this.handleError));
  }

  private handleError(error: unknown): Observable<never> {
    console.error('AppointmentsApiService error:', error);
    return throwError(() => error);
  }
}
