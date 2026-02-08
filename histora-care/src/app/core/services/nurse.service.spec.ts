import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { NurseApiService } from './nurse.service';
import { ApiService } from './api.service';
import { createMockApiService } from '../../../testing';
import { of } from 'rxjs';

describe('NurseApiService', () => {
  let service: NurseApiService;
  let mockApi: ReturnType<typeof createMockApiService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi = createMockApiService();

    TestBed.configureTestingModule({
      providers: [
        NurseApiService,
        { provide: ApiService, useValue: mockApi },
      ],
    });

    service = TestBed.inject(NurseApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= searchNearby =============

  it('searchNearby() should GET /nurses/search with coordinates and defaults', () => {
    mockApi.get.mockReturnValue(of([]));

    service.searchNearby({ latitude: -12.046, longitude: -77.042 } as any).subscribe();

    expect(mockApi.get).toHaveBeenCalledWith('/nurses/search', expect.objectContaining({
      lat: -12.046,
      lng: -77.042,
      radius: 10,
    }));
  });

  it('searchNearby() should include optional filters when provided', () => {
    mockApi.get.mockReturnValue(of([]));

    service.searchNearby({
      latitude: -12.046,
      longitude: -77.042,
      radiusKm: 5,
      category: 'inyecciones',
      minRating: 4,
      maxPrice: 100,
      availableNow: true,
    } as any).subscribe();

    expect(mockApi.get).toHaveBeenCalledWith('/nurses/search', {
      lat: -12.046,
      lng: -77.042,
      radius: 5,
      category: 'inyecciones',
      minRating: 4,
      maxPrice: 100,
      availableNow: true,
    });
  });

  // ============= getNurse =============

  it('getNurse() should GET /nurses/:id', () => {
    const mockNurse = { _id: 'nurse-1', firstName: 'Maria' };
    mockApi.get.mockReturnValue(of(mockNurse));

    service.getNurse('nurse-1').subscribe(result => {
      expect(result).toEqual(mockNurse);
    });

    expect(mockApi.get).toHaveBeenCalledWith('/nurses/nurse-1');
  });

  // ============= getMyProfile =============

  it('getMyProfile() should GET /nurses/me', () => {
    mockApi.get.mockReturnValue(of({ _id: 'me', firstName: 'Ana' }));

    service.getMyProfile().subscribe();

    expect(mockApi.get).toHaveBeenCalledWith('/nurses/me');
  });

  // ============= updateMyProfile =============

  it('updateMyProfile() should PATCH /nurses/me with profile data', () => {
    const data = { bio: 'Enfermera especializada en cuidados intensivos' };
    mockApi.patch.mockReturnValue(of({ _id: 'me', ...data }));

    service.updateMyProfile(data as any).subscribe();

    expect(mockApi.patch).toHaveBeenCalledWith('/nurses/me', data);
  });

  // ============= updateLocation =============

  it('updateLocation() should PATCH /nurses/me/location with GeoJSON format', () => {
    mockApi.patch.mockReturnValue(of({}));

    service.updateLocation(-12.046, -77.042).subscribe();

    expect(mockApi.patch).toHaveBeenCalledWith('/nurses/me/location', {
      location: {
        type: 'Point',
        coordinates: [-77.042, -12.046], // GeoJSON: [lng, lat]
      },
    });
  });

  // ============= setAvailability =============

  it('setAvailability() should PATCH /nurses/me/availability with isAvailable flag', () => {
    mockApi.patch.mockReturnValue(of({}));

    service.setAvailability(true).subscribe();

    expect(mockApi.patch).toHaveBeenCalledWith('/nurses/me/availability', { isAvailable: true });
  });

  it('setAvailability(false) should send isAvailable as false', () => {
    mockApi.patch.mockReturnValue(of({}));

    service.setAvailability(false).subscribe();

    expect(mockApi.patch).toHaveBeenCalledWith('/nurses/me/availability', { isAvailable: false });
  });

  // ============= Service Management =============

  it('addService() should POST /nurses/me/services with service data', () => {
    const newService = { name: 'Inyeccion intramuscular', price: 30, category: 'inyecciones' };
    mockApi.post.mockReturnValue(of({}));

    service.addService(newService as any).subscribe();

    expect(mockApi.post).toHaveBeenCalledWith('/nurses/me/services', newService);
  });

  it('updateService() should PATCH /nurses/me/services/:id with partial data', () => {
    mockApi.patch.mockReturnValue(of({}));

    service.updateService('svc-1', { price: 40 } as any).subscribe();

    expect(mockApi.patch).toHaveBeenCalledWith('/nurses/me/services/svc-1', { price: 40 });
  });

  it('removeService() should DELETE /nurses/me/services/:id', () => {
    mockApi.delete.mockReturnValue(of({}));

    service.removeService('svc-1').subscribe();

    expect(mockApi.delete).toHaveBeenCalledWith('/nurses/me/services/svc-1');
  });

  // ============= getEarnings =============

  it('getEarnings() should GET /nurses/me/earnings with date range', () => {
    const mockEarnings = { total: 500, commission: 50, net: 450, servicesCount: 10 };
    mockApi.get.mockReturnValue(of(mockEarnings));

    service.getEarnings('2026-01-01', '2026-01-31').subscribe(result => {
      expect(result).toEqual(mockEarnings);
    });

    expect(mockApi.get).toHaveBeenCalledWith('/nurses/me/earnings', {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
  });

  // ============= Reviews =============

  it('getNurseReviews() should GET /nurses/:id/reviews with pagination', () => {
    const mockResponse = { reviews: [], total: 0, page: 1, limit: 10 };
    mockApi.get.mockReturnValue(of(mockResponse));

    service.getNurseReviews('nurse-1', 2, 5).subscribe();

    expect(mockApi.get).toHaveBeenCalledWith('/nurses/nurse-1/reviews', { page: 2, limit: 5 });
  });

  it('getNurseReviews() should use default pagination values', () => {
    mockApi.get.mockReturnValue(of({ reviews: [], total: 0, page: 1, limit: 10 }));

    service.getNurseReviews('nurse-1').subscribe();

    expect(mockApi.get).toHaveBeenCalledWith('/nurses/nurse-1/reviews', { page: 1, limit: 10 });
  });

  it('submitReview() should POST /nurses/:id/reviews with review data', () => {
    const review = { rating: 5, comment: 'Excelente servicio', serviceRequestId: 'sr-1' };
    mockApi.post.mockReturnValue(of({ _id: 'rev-1', ...review }));

    service.submitReview('nurse-1', review).subscribe();

    expect(mockApi.post).toHaveBeenCalledWith('/nurses/nurse-1/reviews', review);
  });

  // ============= Verification =============

  it('preValidateCep() should POST /nurses/:id/verification/pre-validate-cep', () => {
    const data = { dniNumber: '44119536', cepNumber: '108887' };
    const mockResponse = {
      isValid: true,
      cepValidation: { nombre: 'CHAVEZ TORRES MARIA CLAUDIA', estado: 'HABIL' },
      message: 'Validacion exitosa',
    };
    mockApi.post.mockReturnValue(of(mockResponse));

    service.preValidateCep('nurse-1', data).subscribe(result => {
      expect(result.isValid).toBe(true);
    });

    expect(mockApi.post).toHaveBeenCalledWith('/nurses/nurse-1/verification/pre-validate-cep', data);
  });

  it('confirmCepIdentity() should POST /nurses/:id/verification/confirm-identity', () => {
    const data = {
      dniNumber: '44119536',
      cepNumber: '108887',
      fullName: 'CHAVEZ TORRES MARIA CLAUDIA',
      cepValidation: { nombre: 'CHAVEZ TORRES MARIA CLAUDIA', estado: 'HABIL' } as any,
      confirmed: true,
    };
    mockApi.post.mockReturnValue(of({}));

    service.confirmCepIdentity('nurse-1', data).subscribe();

    expect(mockApi.post).toHaveBeenCalledWith('/nurses/nurse-1/verification/confirm-identity', data);
  });

  it('submitVerification() should POST /nurses/:id/verification with documents', () => {
    const data = {
      dniNumber: '44119536',
      fullNameOnDni: 'CHAVEZ TORRES MARIA CLAUDIA',
      documents: [
        { imageData: 'base64data...', documentType: 'selfie' as any, mimeType: 'image/jpeg' },
      ],
    };
    mockApi.post.mockReturnValue(of({}));

    service.submitVerification('nurse-1', data).subscribe();

    expect(mockApi.post).toHaveBeenCalledWith('/nurses/nurse-1/verification', data);
  });

  it('getVerificationStatus() should GET /nurses/:id/verification/status with cache-busting param', () => {
    mockApi.get.mockReturnValue(of(null));

    service.getVerificationStatus('nurse-1').subscribe();

    expect(mockApi.get).toHaveBeenCalledWith(
      '/nurses/nurse-1/verification/status',
      expect.objectContaining({ _t: expect.any(Number) })
    );
  });

  it('getCepPhoto() should GET /nurses/:id/cep-photo', () => {
    const mockResponse = { photoUrl: 'https://cdn.cep.org.pe/photo.jpg', isVerified: true };
    mockApi.get.mockReturnValue(of(mockResponse));

    service.getCepPhoto('nurse-1').subscribe(result => {
      expect(result.photoUrl).toBeTruthy();
      expect(result.isVerified).toBe(true);
    });

    expect(mockApi.get).toHaveBeenCalledWith('/nurses/nurse-1/cep-photo');
  });
});
