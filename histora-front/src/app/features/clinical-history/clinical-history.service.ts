import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export interface Allergy {
  allergen: string;
  reaction?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  diagnosedDate?: string;
}

export interface ChronicCondition {
  condition: string;
  icdCode?: string;
  diagnosedDate?: string;
  status?: 'active' | 'controlled' | 'resolved';
  notes?: string;
}

export interface Surgery {
  procedure: string;
  date?: string;
  hospital?: string;
  surgeon?: string;
  complications?: string;
  notes?: string;
}

export interface FamilyHistory {
  relationship: string;
  condition: string;
  ageAtOnset?: number;
  notes?: string;
}

export interface CurrentMedication {
  medication: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  prescribedBy?: string;
  reason?: string;
}

export interface Vaccination {
  vaccine: string;
  date?: string;
  doseNumber?: number;
  lot?: string;
  administeredBy?: string;
  nextDoseDate?: string;
}

export interface ClinicalHistory {
  _id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  consultationId?: string;
  date: string;
  reasonForVisit: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;

  // Medical background
  allergies: Allergy[];
  chronicConditions: ChronicCondition[];
  surgicalHistory: Surgery[];
  familyHistory: FamilyHistory[];
  currentMedications: CurrentMedication[];
  vaccinations: Vaccination[];

  // Lifestyle
  smokingStatus?: 'never' | 'former' | 'current';
  alcoholUse?: 'none' | 'occasional' | 'moderate' | 'heavy';
  exerciseFrequency?: 'sedentary' | 'light' | 'moderate' | 'active';
  diet?: string;
  occupation?: string;

  // Gynecological (if applicable)
  pregnancies?: number;
  liveChildren?: number;
  lastMenstrualPeriod?: string;
  contraceptiveMethod?: string;

  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalHistoryResponse {
  data: ClinicalHistory[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateClinicalHistoryDto {
  patientId: string;
  consultationId?: string;
  date: string;
  reasonForVisit: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  allergies?: Allergy[];
  chronicConditions?: ChronicCondition[];
  surgicalHistory?: Surgery[];
  familyHistory?: FamilyHistory[];
  currentMedications?: CurrentMedication[];
  vaccinations?: Vaccination[];
  smokingStatus?: 'never' | 'former' | 'current';
  alcoholUse?: 'none' | 'occasional' | 'moderate' | 'heavy';
  exerciseFrequency?: 'sedentary' | 'light' | 'moderate' | 'active';
  diet?: string;
  occupation?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClinicalHistoryService {
  private api = inject(ApiService);

  getClinicalHistories(params?: {
    patientId?: string;
    doctorId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Observable<ClinicalHistoryResponse> {
    return this.api.get<ClinicalHistoryResponse>('/clinical-history', params).pipe(
      catchError(() => of({ data: [], total: 0, limit: 20, offset: 0 }))
    );
  }

  getClinicalHistory(id: string): Observable<ClinicalHistory> {
    return this.api.get<ClinicalHistory>(`/clinical-history/${id}`);
  }

  getPatientHistory(patientId: string): Observable<ClinicalHistory[]> {
    return this.api.get<ClinicalHistory[]>(`/clinical-history/patient/${patientId}`);
  }

  getLatestHistory(patientId: string): Observable<ClinicalHistory | null> {
    return this.api.get<ClinicalHistory | null>(`/clinical-history/patient/${patientId}/latest`).pipe(
      catchError(() => of(null))
    );
  }

  createClinicalHistory(data: CreateClinicalHistoryDto): Observable<ClinicalHistory> {
    return this.api.post<ClinicalHistory>('/clinical-history', data);
  }

  updateClinicalHistory(id: string, data: Partial<CreateClinicalHistoryDto>): Observable<ClinicalHistory> {
    return this.api.patch<ClinicalHistory>(`/clinical-history/${id}`, data);
  }

  deleteClinicalHistory(id: string): Observable<void> {
    return this.api.delete<void>(`/clinical-history/${id}`);
  }

  // Medical background management
  addAllergy(id: string, allergy: Allergy): Observable<ClinicalHistory> {
    return this.api.post<ClinicalHistory>(`/clinical-history/${id}/allergies`, allergy);
  }

  removeAllergy(id: string, allergen: string): Observable<ClinicalHistory> {
    return this.api.delete<ClinicalHistory>(`/clinical-history/${id}/allergies/${encodeURIComponent(allergen)}`);
  }

  addChronicCondition(id: string, condition: ChronicCondition): Observable<ClinicalHistory> {
    return this.api.post<ClinicalHistory>(`/clinical-history/${id}/conditions`, condition);
  }

  addSurgery(id: string, surgery: Surgery): Observable<ClinicalHistory> {
    return this.api.post<ClinicalHistory>(`/clinical-history/${id}/surgeries`, surgery);
  }

  addFamilyHistory(id: string, familyHistory: FamilyHistory): Observable<ClinicalHistory> {
    return this.api.post<ClinicalHistory>(`/clinical-history/${id}/family-history`, familyHistory);
  }

  addMedication(id: string, medication: CurrentMedication): Observable<ClinicalHistory> {
    return this.api.post<ClinicalHistory>(`/clinical-history/${id}/medications`, medication);
  }

  addVaccination(id: string, vaccination: Vaccination): Observable<ClinicalHistory> {
    return this.api.post<ClinicalHistory>(`/clinical-history/${id}/vaccinations`, vaccination);
  }

  // Summary for patient profile
  getPatientMedicalSummary(patientId: string): Observable<{
    allergies: Allergy[];
    chronicConditions: ChronicCondition[];
    currentMedications: CurrentMedication[];
    recentVisits: ClinicalHistory[];
  }> {
    return this.api.get(`/clinical-history/patient/${patientId}/summary`);
  }
}
