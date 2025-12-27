import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { Doctor } from '../../core/models';

export interface DoctorsResponse {
  data: Doctor[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable({
  providedIn: 'root',
})
export class DoctorsService {
  private api = inject(ApiService);

  getDoctors(params?: {
    search?: string;
    specialty?: string;
    limit?: number;
    offset?: number;
  }): Observable<DoctorsResponse> {
    return this.api.get<DoctorsResponse>('/doctors', params).pipe(
      catchError(() => of({ data: [], total: 0, limit: 20, offset: 0 }))
    );
  }

  getDoctor(id: string): Observable<Doctor> {
    return this.api.get<Doctor>(`/doctors/${id}`);
  }

  getClinicDoctors(): Observable<Doctor[]> {
    return this.api.get<Doctor[]>('/doctors/clinic').pipe(
      catchError(() => of([]))
    );
  }

  searchDoctors(query: string): Observable<Doctor[]> {
    return this.api.get<Doctor[]>('/doctors/search', { q: query }).pipe(
      catchError(() => of([]))
    );
  }
}
