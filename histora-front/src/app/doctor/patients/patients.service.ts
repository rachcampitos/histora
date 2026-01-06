import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Patient,
  PatientListResponse,
  CreatePatientDto,
  UpdatePatientDto,
} from './patients.model';

@Injectable({
  providedIn: 'root',
})
export class PatientsService {
  private readonly API_URL = `${environment.apiUrl}/patients`;

  constructor(private http: HttpClient) {}

  /**
   * Get all patients with pagination and search
   */
  getAll(
    search?: string,
    limit: number = 20,
    offset: number = 0
  ): Observable<PatientListResponse> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http
      .get<PatientListResponse>(this.API_URL, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Search patients
   */
  search(query: string): Observable<Patient[]> {
    const params = new HttpParams().set('q', query);
    return this.http
      .get<Patient[]>(`${this.API_URL}/search`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get patient count
   */
  count(): Observable<{ count: number }> {
    return this.http
      .get<{ count: number }>(`${this.API_URL}/count`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get single patient by ID
   */
  getById(id: string): Observable<Patient> {
    return this.http
      .get<Patient>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create new patient
   */
  create(patient: CreatePatientDto): Observable<Patient> {
    return this.http
      .post<Patient>(this.API_URL, patient)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update patient
   */
  update(id: string, patient: UpdatePatientDto): Observable<Patient> {
    return this.http
      .patch<Patient>(`${this.API_URL}/${id}`, patient)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete patient (soft delete)
   */
  delete(id: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Restore deleted patient
   */
  restore(id: string): Observable<Patient> {
    return this.http
      .patch<Patient>(`${this.API_URL}/${id}/restore`, {})
      .pipe(catchError(this.handleError));
  }

  private handleError(error: unknown): Observable<never> {
    console.error('PatientsService error:', error);
    return throwError(() => error);
  }
}
