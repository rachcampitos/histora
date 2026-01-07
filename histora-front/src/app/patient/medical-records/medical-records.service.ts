import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface ClinicalHistoryEntry {
  _id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  consultationId?: string;
  date: Date;
  reasonForVisit: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  allergies?: Allergy[];
  chronicConditions?: ChronicCondition[];
  surgicalHistory?: Surgery[];
  familyHistory?: FamilyHistory[];
  currentMedications?: Medication[];
  vaccinations?: Vaccination[];
  createdAt: Date;
  updatedAt: Date;
  // Populated
  doctor?: {
    _id: string;
    firstName: string;
    lastName: string;
    specialty?: string;
  };
  clinic?: {
    _id: string;
    name: string;
  };
}

export interface Allergy {
  allergen: string;
  reaction?: string;
  severity?: string;
  diagnosedDate?: Date;
}

export interface ChronicCondition {
  condition: string;
  icdCode?: string;
  status?: string;
  notes?: string;
}

export interface Surgery {
  procedure: string;
  date?: Date;
  hospital?: string;
  surgeon?: string;
  complications?: string;
}

export interface FamilyHistory {
  relationship: string;
  condition: string;
  ageAtOnset?: number;
}

export interface Medication {
  medication: string;
  dosage?: string;
  frequency?: string;
  prescribedBy?: string;
  reason?: string;
}

export interface Vaccination {
  vaccine: string;
  date?: Date;
  doseNumber?: number;
  lotNumber?: string;
  nextDoseDate?: Date;
}

export interface PatientMedicalSummary {
  allergies: Allergy[];
  chronicConditions: ChronicCondition[];
  currentMedications: Medication[];
  surgicalHistory: Surgery[];
  familyHistory: FamilyHistory[];
  vaccinations: Vaccination[];
}

export interface Consultation {
  _id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  appointmentId?: string;
  date: Date;
  status: string;
  chiefComplaint: string;
  diagnoses: {
    code: string;
    description: string;
    type: string;
    notes?: string;
  }[];
  prescriptions: {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    route?: string;
    instructions?: string;
  }[];
  treatmentPlan?: string;
  followUpDate?: Date;
  createdAt: Date;
  // Populated
  doctor?: {
    _id: string;
    firstName: string;
    lastName: string;
    specialty?: string;
  };
  clinic?: {
    _id: string;
    name: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class MedicalRecordsService {
  private readonly clinicalHistoryUrl = `${environment.apiUrl}/clinical-history`;
  private readonly consultationsUrl = `${environment.apiUrl}/consultations`;

  constructor(private http: HttpClient) {}

  // Get clinical history entries for patient
  getClinicalHistory(patientId: string, limit?: number): Observable<ClinicalHistoryEntry[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    return this.http.get<ClinicalHistoryEntry[]>(`${this.clinicalHistoryUrl}/patient/${patientId}`, { params });
  }

  // Get aggregated medical summary for patient
  getMedicalSummary(patientId: string): Observable<PatientMedicalSummary> {
    return this.http.get<PatientMedicalSummary>(`${this.clinicalHistoryUrl}/patient/${patientId}/summary`);
  }

  // Get patient consultations
  getConsultations(patientId: string, limit?: number): Observable<Consultation[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    return this.http.get<Consultation[]>(`${this.consultationsUrl}/patient/${patientId}`, { params });
  }

  // Get consultation summary for patient
  getConsultationSummary(patientId: string): Observable<any> {
    return this.http.get(`${this.consultationsUrl}/patient/${patientId}/summary`);
  }
}
