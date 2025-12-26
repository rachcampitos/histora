import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export interface Appointment {
  _id: string;
  clinicId: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  reasonForVisit?: string;
  notes?: string;
  bookedBy: 'clinic' | 'patient';
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentsResponse {
  data: Appointment[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  reasonForVisit?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentsService {
  private api = inject(ApiService);

  getAppointments(params?: {
    date?: string;
    doctorId?: string;
    patientId?: string;
    status?: string;
    viewMode?: 'day' | 'week' | 'all';
    limit?: number;
    offset?: number;
  }): Observable<AppointmentsResponse> {
    return this.api.get<AppointmentsResponse>('/appointments', params).pipe(
      catchError(() => of({ data: [], total: 0, limit: 20, offset: 0 }))
    );
  }

  getAppointment(id: string): Observable<Appointment> {
    return this.api.get<Appointment>(`/appointments/${id}`);
  }

  createAppointment(data: CreateAppointmentDto): Observable<Appointment> {
    return this.api.post<Appointment>('/appointments', data);
  }

  updateAppointment(id: string, data: Partial<CreateAppointmentDto>): Observable<Appointment> {
    return this.api.patch<Appointment>(`/appointments/${id}`, data);
  }

  updateStatus(id: string, status: string): Observable<Appointment> {
    return this.api.patch<Appointment>(`/appointments/${id}/status`, { status });
  }

  cancelAppointment(id: string, reason?: string): Observable<void> {
    return this.api.post<void>(`/appointments/${id}/cancel`, { reason });
  }

  getAvailableSlots(doctorId: string, date: string): Observable<{ startTime: string; endTime: string }[]> {
    return this.api.get<{ startTime: string; endTime: string }[]>(
      `/appointments/available/${doctorId}`,
      { date }
    );
  }

  getAppointmentsByMonth(year: number, month: number): Observable<{ date: string; count: number }[]> {
    return this.api.get<{ date: string; count: number }[]>(
      '/appointments/calendar',
      { year, month }
    );
  }
}
