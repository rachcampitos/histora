import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ServiceRequest,
  CreateServiceRequest,
  ServiceRequestStatus
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ServiceRequestService {
  private api = inject(ApiService);

  // Patient: Create a service request
  create(data: CreateServiceRequest): Observable<ServiceRequest> {
    return this.api.post<ServiceRequest>('/service-requests', data);
  }

  // Get a specific request
  getById(id: string): Observable<ServiceRequest> {
    return this.api.get<ServiceRequest>(`/service-requests/${id}`);
  }

  // Patient: Get my requests
  getMyRequests(status?: ServiceRequestStatus): Observable<ServiceRequest[]> {
    return this.api.get<ServiceRequest[]>('/service-requests/patient/me', {
      ...(status && { status })
    });
  }

  // Nurse: Get requests assigned to me
  getNurseRequests(status?: ServiceRequestStatus): Observable<ServiceRequest[]> {
    return this.api.get<ServiceRequest[]>('/service-requests/nurse/me', {
      ...(status && { status })
    });
  }

  // Nurse: Get pending requests nearby
  getPendingNearby(latitude: number, longitude: number, radiusKm: number): Observable<ServiceRequest[]> {
    return this.api.get<ServiceRequest[]>('/service-requests/pending/nearby', {
      lat: latitude,
      lng: longitude,
      radius: radiusKm
    });
  }

  // Nurse: Accept a request
  accept(id: string): Observable<ServiceRequest> {
    return this.api.patch<ServiceRequest>(`/service-requests/${id}/accept`, {});
  }

  // Nurse: Reject a request
  reject(id: string, reason?: string): Observable<ServiceRequest> {
    return this.api.patch<ServiceRequest>(`/service-requests/${id}/reject`, { reason });
  }

  // Nurse: Update status
  updateStatus(id: string, status: ServiceRequestStatus, note?: string): Observable<ServiceRequest> {
    return this.api.patch<ServiceRequest>(`/service-requests/${id}/status`, { status, note });
  }

  // Patient: Cancel a request
  cancel(id: string, reason?: string): Observable<ServiceRequest> {
    return this.api.patch<ServiceRequest>(`/service-requests/${id}/cancel`, { reason });
  }

  // Nurse: Verify security code
  verifySecurityCode(id: string, code: string): Observable<ServiceRequest> {
    return this.api.patch<ServiceRequest>(`/service-requests/${id}/verify-code`, { code });
  }

  // Patient: Rate and review
  rate(id: string, rating: number, review?: string): Observable<ServiceRequest> {
    return this.api.patch<ServiceRequest>(`/service-requests/${id}/rate`, { rating, review });
  }
}
