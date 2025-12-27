import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { Consultation, Diagnosis, Prescription, OrderedExam } from '../../core/models';

export interface ConsultationsResponse {
  data: Consultation[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateConsultationDto {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  date: string;
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  physicalExamination?: Record<string, string>;
  diagnoses?: Diagnosis[];
  treatmentPlan?: string;
  prescriptions?: Prescription[];
  orderedExams?: OrderedExam[];
  followUpDate?: string;
  notes?: string;
}

export interface UpdateConsultationDto extends Partial<CreateConsultationDto> {
  status?: 'in_progress' | 'completed' | 'cancelled';
}

@Injectable({
  providedIn: 'root',
})
export class ConsultationsService {
  private api = inject(ApiService);

  getConsultations(params?: {
    patientId?: string;
    doctorId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Observable<ConsultationsResponse> {
    return this.api.get<ConsultationsResponse>('/consultations', params).pipe(
      catchError(() => of({ data: [], total: 0, limit: 20, offset: 0 }))
    );
  }

  getConsultation(id: string): Observable<Consultation> {
    return this.api.get<Consultation>(`/consultations/${id}`);
  }

  getConsultationsByPatient(patientId: string): Observable<Consultation[]> {
    return this.api.get<Consultation[]>(`/consultations/patient/${patientId}`);
  }

  createConsultation(data: CreateConsultationDto): Observable<Consultation> {
    return this.api.post<Consultation>('/consultations', data);
  }

  createFromAppointment(appointmentId: string): Observable<Consultation> {
    return this.api.post<Consultation>(`/consultations/from-appointment/${appointmentId}`, {});
  }

  updateConsultation(id: string, data: UpdateConsultationDto): Observable<Consultation> {
    return this.api.patch<Consultation>(`/consultations/${id}`, data);
  }

  completeConsultation(id: string): Observable<Consultation> {
    return this.api.patch<Consultation>(`/consultations/${id}/complete`, {});
  }

  cancelConsultation(id: string, reason?: string): Observable<Consultation> {
    return this.api.patch<Consultation>(`/consultations/${id}/cancel`, { reason });
  }

  deleteConsultation(id: string): Observable<void> {
    return this.api.delete<void>(`/consultations/${id}`);
  }

  addDiagnosis(id: string, diagnosis: Diagnosis): Observable<Consultation> {
    return this.api.post<Consultation>(`/consultations/${id}/diagnoses`, diagnosis);
  }

  addPrescription(id: string, prescription: Prescription): Observable<Consultation> {
    return this.api.post<Consultation>(`/consultations/${id}/prescriptions`, prescription);
  }

  addOrderedExam(id: string, exam: OrderedExam): Observable<Consultation> {
    return this.api.post<Consultation>(`/consultations/${id}/exams`, exam);
  }
}
