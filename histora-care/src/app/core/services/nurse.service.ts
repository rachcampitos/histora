import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Nurse,
  NurseService,
  NurseSearchParams,
  NurseSearchResult,
  NurseReview,
  NurseVerification,
  VerificationStatus,
  VerificationDocumentType
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class NurseApiService {
  private api = inject(ApiService);

  // Search nurses by location
  searchNearby(params: NurseSearchParams): Observable<NurseSearchResult[]> {
    return this.api.get<NurseSearchResult[]>('/nurses/search', {
      lat: params.latitude,
      lng: params.longitude,
      radius: params.radiusKm || 10,
      ...(params.category && { category: params.category }),
      ...(params.minRating && { minRating: params.minRating }),
      ...(params.maxPrice && { maxPrice: params.maxPrice }),
      ...(params.availableNow && { availableNow: params.availableNow })
    });
  }

  // Get nurse profile
  getNurse(id: string): Observable<Nurse> {
    return this.api.get<Nurse>(`/nurses/${id}`);
  }

  // Get my nurse profile (for nurses)
  getMyProfile(): Observable<Nurse> {
    return this.api.get<Nurse>('/nurses/me');
  }

  // Update my nurse profile
  updateMyProfile(data: Partial<Nurse>): Observable<Nurse> {
    return this.api.patch<Nurse>('/nurses/me', data);
  }

  // Update location
  updateLocation(latitude: number, longitude: number): Observable<Nurse> {
    return this.api.patch<Nurse>('/nurses/me/location', {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude] // GeoJSON format: [lng, lat]
      }
    });
  }

  // Toggle availability
  setAvailability(isAvailable: boolean): Observable<Nurse> {
    return this.api.patch<Nurse>('/nurses/me/availability', { isAvailable });
  }

  // Services management
  addService(service: Omit<NurseService, '_id'>): Observable<Nurse> {
    return this.api.post<Nurse>('/nurses/me/services', service);
  }

  updateService(serviceId: string, service: Partial<NurseService>): Observable<Nurse> {
    return this.api.patch<Nurse>(`/nurses/me/services/${serviceId}`, service);
  }

  removeService(serviceId: string): Observable<Nurse> {
    return this.api.delete<Nurse>(`/nurses/me/services/${serviceId}`);
  }

  // Get earnings
  getEarnings(startDate: string, endDate: string): Observable<{
    total: number;
    commission: number;
    net: number;
    servicesCount: number;
  }> {
    return this.api.get('/nurses/me/earnings', { startDate, endDate });
  }

  // Get reviews for a nurse
  getNurseReviews(nurseId: string, page = 1, limit = 10): Observable<{
    reviews: NurseReview[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.api.get(`/nurses/${nurseId}/reviews`, { page, limit });
  }

  // Submit a review (for patients)
  submitReview(nurseId: string, review: {
    rating: number;
    comment: string;
    serviceRequestId?: string;
  }): Observable<NurseReview> {
    return this.api.post(`/nurses/${nurseId}/reviews`, review);
  }

  // ============= Verification Methods =============

  // Submit verification documents
  submitVerification(nurseId: string, data: {
    dniNumber: string;
    fullNameOnDni: string;
    documents: {
      imageData: string;
      documentType: VerificationDocumentType;
      mimeType?: string;
    }[];
  }): Observable<NurseVerification> {
    return this.api.post(`/nurses/${nurseId}/verification`, data);
  }

  // Get verification status
  getVerificationStatus(nurseId: string): Observable<NurseVerification | null> {
    return this.api.get(`/nurses/${nurseId}/verification/status`);
  }
}
