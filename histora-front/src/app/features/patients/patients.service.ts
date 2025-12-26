import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Patient, CreatePatientDto } from '../../core/models';

export interface PatientsResponse {
  data: Patient[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable({
  providedIn: 'root',
})
export class PatientsService {
  private api = inject(ApiService);

  getPatients(params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Observable<PatientsResponse> {
    return this.api.get<PatientsResponse>('/patients', params);
  }

  getPatient(id: string): Observable<Patient> {
    return this.api.get<Patient>(`/patients/${id}`);
  }

  createPatient(data: CreatePatientDto): Observable<Patient> {
    return this.api.post<Patient>('/patients', data);
  }

  updatePatient(id: string, data: Partial<CreatePatientDto>): Observable<Patient> {
    return this.api.patch<Patient>(`/patients/${id}`, data);
  }

  deletePatient(id: string): Observable<void> {
    return this.api.delete<void>(`/patients/${id}`);
  }

  searchPatients(query: string): Observable<Patient[]> {
    return this.api.get<Patient[]>('/patients/search', { q: query });
  }
}
