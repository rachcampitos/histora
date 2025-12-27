import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { Vitals, CreateVitalsDto } from '../../core/models';

export interface VitalsResponse {
  data: Vitals[];
  total: number;
  limit: number;
  offset: number;
}

export interface VitalsStats {
  lastRecorded?: Vitals;
  averages?: {
    heartRate?: number;
    systolicBP?: number;
    diastolicBP?: number;
    weight?: number;
  };
  trends?: {
    weight: { date: string; value: number }[];
    bloodPressure: { date: string; systolic: number; diastolic: number }[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class VitalsService {
  private api = inject(ApiService);

  getVitals(params?: {
    patientId?: string;
    consultationId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Observable<VitalsResponse> {
    return this.api.get<VitalsResponse>('/vitals', params).pipe(
      catchError(() => of({ data: [], total: 0, limit: 20, offset: 0 }))
    );
  }

  getVitalsById(id: string): Observable<Vitals> {
    return this.api.get<Vitals>(`/vitals/${id}`);
  }

  getPatientVitals(patientId: string, limit?: number): Observable<Vitals[]> {
    return this.api.get<Vitals[]>(`/vitals/patient/${patientId}`, limit ? { limit } : undefined);
  }

  getLatestVitals(patientId: string): Observable<Vitals | null> {
    return this.api.get<Vitals | null>(`/vitals/patient/${patientId}/latest`).pipe(
      catchError(() => of(null))
    );
  }

  getVitalsStats(patientId: string): Observable<VitalsStats> {
    return this.api.get<VitalsStats>(`/vitals/patient/${patientId}/stats`).pipe(
      catchError(() => of({}))
    );
  }

  createVitals(data: CreateVitalsDto): Observable<Vitals> {
    return this.api.post<Vitals>('/vitals', data);
  }

  updateVitals(id: string, data: Partial<CreateVitalsDto>): Observable<Vitals> {
    return this.api.patch<Vitals>(`/vitals/${id}`, data);
  }

  deleteVitals(id: string): Observable<void> {
    return this.api.delete<void>(`/vitals/${id}`);
  }

  calculateBMI(weight: number, height: number): number {
    if (!weight || !height) return 0;
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  }

  getBMICategory(bmi: number): { category: string; color: string } {
    if (bmi < 18.5) return { category: 'Bajo peso', color: 'warning' };
    if (bmi < 25) return { category: 'Normal', color: 'success' };
    if (bmi < 30) return { category: 'Sobrepeso', color: 'warning' };
    return { category: 'Obesidad', color: 'danger' };
  }

  getBloodPressureCategory(systolic: number, diastolic: number): { category: string; color: string } {
    if (systolic < 120 && diastolic < 80) return { category: 'Normal', color: 'success' };
    if (systolic < 130 && diastolic < 80) return { category: 'Elevada', color: 'warning' };
    if (systolic < 140 || diastolic < 90) return { category: 'Hipertensión Etapa 1', color: 'warning' };
    if (systolic >= 140 || diastolic >= 90) return { category: 'Hipertensión Etapa 2', color: 'danger' };
    return { category: 'Crisis', color: 'danger' };
  }
}
