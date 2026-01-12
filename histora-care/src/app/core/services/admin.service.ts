import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { NurseVerification, VerificationStatus } from '../models';

export interface VerificationStats {
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface VerificationListResponse {
  verifications: NurseVerification[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private api = inject(ApiService);

  // Get verification statistics
  getVerificationStats(): Observable<VerificationStats> {
    return this.api.get('/nurses/admin/verifications/stats');
  }

  // Get list of verifications with filters
  getVerifications(params: {
    status?: VerificationStatus;
    page?: number;
    limit?: number;
  }): Observable<VerificationListResponse> {
    return this.api.get('/nurses/admin/verifications', params);
  }

  // Get verification details
  getVerificationDetail(verificationId: string): Observable<NurseVerification> {
    return this.api.get(`/nurses/admin/verifications/${verificationId}`);
  }

  // Mark verification as under review
  markUnderReview(verificationId: string): Observable<NurseVerification> {
    return this.api.patch(`/nurses/admin/verifications/${verificationId}/under-review`, {});
  }

  // Approve or reject verification
  reviewVerification(verificationId: string, data: {
    status: 'approved' | 'rejected';
    reviewNotes?: string;
    rejectionReason?: string;
  }): Observable<NurseVerification> {
    return this.api.patch(`/nurses/admin/verifications/${verificationId}/review`, data);
  }
}
