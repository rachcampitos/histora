import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import {
  Consultation,
  CreateConsultationDto,
  UpdateConsultationDto,
  CompleteConsultationDto,
  ConsultationFilters,
  ConsultationStatus,
} from './consultations.model';

@Injectable({
  providedIn: 'root',
})
export class ConsultationsService {
  private readonly apiUrl = `${environment.apiUrl}/consultations`;

  constructor(private http: HttpClient) {}

  getAll(filters?: ConsultationFilters): Observable<Consultation[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.patientId) params = params.set('patientId', filters.patientId);
      if (filters.doctorId) params = params.set('doctorId', filters.doctorId);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.startDate) params = params.set('startDate', filters.startDate);
      if (filters.endDate) params = params.set('endDate', filters.endDate);
    }
    return this.http.get<Consultation[]>(this.apiUrl, { params });
  }

  getById(id: string): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.apiUrl}/${id}`);
  }

  getByPatient(patientId: string, limit?: number): Observable<Consultation[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    return this.http.get<Consultation[]>(`${this.apiUrl}/patient/${patientId}`, { params });
  }

  getByDoctor(doctorId: string, status?: ConsultationStatus, limit?: number): Observable<Consultation[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (limit) params = params.set('limit', limit.toString());
    return this.http.get<Consultation[]>(`${this.apiUrl}/doctor/${doctorId}`, { params });
  }

  getByAppointment(appointmentId: string): Observable<Consultation | null> {
    return this.http.get<Consultation | null>(`${this.apiUrl}/appointment/${appointmentId}`);
  }

  getPatientSummary(patientId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/patient/${patientId}/summary`);
  }

  getCount(status?: ConsultationStatus): Observable<{ count: number }> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<{ count: number }>(`${this.apiUrl}/count`, { params });
  }

  create(dto: CreateConsultationDto): Observable<Consultation> {
    return this.http.post<Consultation>(this.apiUrl, dto);
  }

  createFromAppointment(
    appointmentId: string,
    data: { patientId: string; doctorId: string; reasonForVisit?: string }
  ): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.apiUrl}/from-appointment/${appointmentId}`, data);
  }

  update(id: string, dto: UpdateConsultationDto): Observable<Consultation> {
    return this.http.patch<Consultation>(`${this.apiUrl}/${id}`, dto);
  }

  updateStatus(id: string, status: ConsultationStatus): Observable<Consultation> {
    return this.http.patch<Consultation>(`${this.apiUrl}/${id}/status`, { status });
  }

  complete(id: string, dto: CompleteConsultationDto): Observable<Consultation> {
    return this.http.patch<Consultation>(`${this.apiUrl}/${id}/complete`, dto);
  }

  addExamResults(id: string, examIndex: number, results: string): Observable<Consultation> {
    return this.http.patch<Consultation>(`${this.apiUrl}/${id}/exam-results`, { examIndex, results });
  }

  linkVitals(id: string, vitalsId: string): Observable<Consultation> {
    return this.http.patch<Consultation>(`${this.apiUrl}/${id}/link-vitals/${vitalsId}`, {});
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // Helper to get today's consultations for a doctor
  getTodayConsultations(doctorId: string): Observable<Consultation[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    return this.getAll({
      doctorId,
      startDate: startOfDay,
      endDate: endOfDay,
    });
  }
}
