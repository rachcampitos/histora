import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'environments/environment';

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface AvailableSlotsResponse {
  availableSlots: TimeSlot[];
}

export interface DaySchedule {
  day: string;
  isWorking: boolean;
  slots: { start: string; end: string }[];
  breaks: { start: string; end: string }[];
}

export interface CreateAppointmentDto {
  patientId?: string;
  doctorId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  reasonForVisit?: string;
  notes?: string;
}

export interface Appointment {
  _id: string;
  patient: any;
  doctor: any;
  clinic: any;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  reasonForVisit?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/appointments`;

  /**
   * Get available time slots for a doctor on a specific date
   * @param doctorId - The doctor's ID
   * @param date - The date in YYYY-MM-DD format
   * @returns Observable of available time slots
   */
  getAvailableSlots(doctorId: string, date: string): Observable<TimeSlot[]> {
    const params = new HttpParams()
      .set('doctorId', doctorId)
      .set('date', date);

    return this.http.get<TimeSlot[]>(`${this.apiUrl}/available-slots`, { params });
  }

  /**
   * Create a new appointment
   * @param appointment - The appointment data
   * @returns Observable of created appointment
   */
  createAppointment(appointment: CreateAppointmentDto): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, appointment);
  }

  /**
   * Get all appointments (for doctors)
   * @returns Observable of appointments array
   */
  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl);
  }

  /**
   * Get appointment by ID
   * @param id - Appointment ID
   * @returns Observable of appointment
   */
  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update appointment status
   * @param id - Appointment ID
   * @param status - New status
   * @returns Observable of updated appointment
   */
  updateAppointmentStatus(id: string, status: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/status`, { status });
  }

  /**
   * Cancel an appointment
   * @param id - Appointment ID
   * @param reason - Cancellation reason
   * @returns Observable of cancelled appointment
   */
  cancelAppointment(id: string, reason?: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/cancel`, { reason });
  }

  /**
   * Delete an appointment
   * @param id - Appointment ID
   * @returns Observable of void
   */
  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
