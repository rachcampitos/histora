import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CreateComplaintRequest {
  type: 'reclamo' | 'queja';
  fullName: string;
  dni: string;
  email: string;
  phone: string;
  description: string;
  relatedServiceId?: string;
}

export interface ComplaintResponse {
  _id: string;
  type: 'reclamo' | 'queja';
  claimNumber: string;
  userId: string;
  userRole: string;
  fullName: string;
  dni: string;
  email: string;
  phone: string;
  description: string;
  relatedServiceId?: string;
  status: 'pending' | 'in_review' | 'resolved';
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ComplaintsApiService {
  private api = inject(ApiService);

  create(data: CreateComplaintRequest): Observable<ComplaintResponse> {
    return this.api.post<ComplaintResponse>('/complaints', data);
  }

  getMyComplaints(): Observable<ComplaintResponse[]> {
    return this.api.get<ComplaintResponse[]>('/complaints/mine');
  }
}
