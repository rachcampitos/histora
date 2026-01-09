import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Nurse,
  NurseService,
  NurseSearchParams,
  NurseSearchResult
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
}
