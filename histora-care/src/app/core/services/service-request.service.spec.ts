import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { ServiceRequestService } from './service-request.service';
import { ApiService } from './api.service';
import { createMockApiService } from '../../../testing';
import { of } from 'rxjs';

describe('ServiceRequestService', () => {
  let service: ServiceRequestService;
  let mockApi: ReturnType<typeof createMockApiService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi = createMockApiService();

    TestBed.configureTestingModule({
      providers: [
        ServiceRequestService,
        { provide: ApiService, useValue: mockApi },
      ],
    });

    service = TestBed.inject(ServiceRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= create =============

  it('create() should POST to /service-requests with request data', () => {
    const data = {
      serviceType: 'inyeccion_intramuscular',
      scheduledDate: '2026-02-10T10:00:00Z',
      address: 'Av. Arequipa 1234, Lima',
      location: { latitude: -12.046, longitude: -77.042 },
      notes: 'Paciente diabetico',
    } as any;

    const mockResponse = { _id: 'sr-1', ...data, status: 'pending' };
    mockApi.post.mockReturnValue(of(mockResponse));

    service.create(data).subscribe(result => {
      expect(result).toEqual(mockResponse);
    });

    expect(mockApi.post).toHaveBeenCalledWith('/service-requests', data);
  });

  // ============= getById =============

  it('getById() should GET /service-requests/:id', () => {
    const mockResponse = { _id: 'sr-1', status: 'accepted' };
    mockApi.get.mockReturnValue(of(mockResponse));

    service.getById('sr-1').subscribe(result => {
      expect(result).toEqual(mockResponse);
    });

    expect(mockApi.get).toHaveBeenCalledWith('/service-requests/sr-1');
  });

  // ============= getMyRequests =============

  it('getMyRequests() should GET /service-requests/patient/me without params', () => {
    mockApi.get.mockReturnValue(of([]));

    service.getMyRequests().subscribe();

    expect(mockApi.get).toHaveBeenCalledWith('/service-requests/patient/me', {});
  });

  it('getMyRequests() should pass status param when provided', () => {
    mockApi.get.mockReturnValue(of([]));

    service.getMyRequests('pending' as any).subscribe();

    expect(mockApi.get).toHaveBeenCalledWith('/service-requests/patient/me', { status: 'pending' });
  });

  // ============= getNurseRequests =============

  it('getNurseRequests() should GET /service-requests/nurse/me with optional status', () => {
    mockApi.get.mockReturnValue(of([]));

    service.getNurseRequests('in_progress' as any).subscribe();

    expect(mockApi.get).toHaveBeenCalledWith('/service-requests/nurse/me', { status: 'in_progress' });
  });

  // ============= getPendingNearby =============

  it('getPendingNearby() should GET /service-requests/pending/nearby with coordinates', () => {
    mockApi.get.mockReturnValue(of([]));

    service.getPendingNearby(-12.046, -77.042, 5).subscribe();

    expect(mockApi.get).toHaveBeenCalledWith('/service-requests/pending/nearby', {
      lat: -12.046,
      lng: -77.042,
      radius: 5,
    });
  });

  // ============= accept =============

  it('accept() should PATCH /service-requests/:id/accept with empty body', () => {
    const mockResponse = { _id: 'sr-1', status: 'accepted' };
    mockApi.patch.mockReturnValue(of(mockResponse));

    service.accept('sr-1').subscribe(result => {
      expect(result.status).toBe('accepted');
    });

    expect(mockApi.patch).toHaveBeenCalledWith('/service-requests/sr-1/accept', {});
  });

  // ============= reject =============

  it('reject() should PATCH /service-requests/:id/reject with reason', () => {
    mockApi.patch.mockReturnValue(of({}));

    service.reject('sr-1', 'No disponible').subscribe();

    expect(mockApi.patch).toHaveBeenCalledWith('/service-requests/sr-1/reject', {
      reason: 'No disponible',
    });
  });

  // ============= updateStatus =============

  it('updateStatus() should PATCH /service-requests/:id/status with status and optional note', () => {
    mockApi.patch.mockReturnValue(of({}));

    service.updateStatus('sr-1', 'completed' as any, 'Servicio finalizado sin novedad').subscribe();

    expect(mockApi.patch).toHaveBeenCalledWith('/service-requests/sr-1/status', {
      status: 'completed',
      note: 'Servicio finalizado sin novedad',
    });
  });

  // ============= cancel =============

  it('cancel() should PATCH /service-requests/:id/cancel with optional reason', () => {
    mockApi.patch.mockReturnValue(of({}));

    service.cancel('sr-1', 'Ya no necesito el servicio').subscribe();

    expect(mockApi.patch).toHaveBeenCalledWith('/service-requests/sr-1/cancel', {
      reason: 'Ya no necesito el servicio',
    });
  });

  // ============= verifySecurityCode =============

  it('verifySecurityCode() should PATCH /service-requests/:id/verify-code with code', () => {
    mockApi.patch.mockReturnValue(of({}));

    service.verifySecurityCode('sr-1', '483920').subscribe();

    expect(mockApi.patch).toHaveBeenCalledWith('/service-requests/sr-1/verify-code', {
      code: '483920',
    });
  });

  // ============= rate =============

  it('rate() should PATCH /service-requests/:id/rate with rating and optional review', () => {
    mockApi.patch.mockReturnValue(of({}));

    service.rate('sr-1', 5, 'Excelente atencion').subscribe();

    expect(mockApi.patch).toHaveBeenCalledWith('/service-requests/sr-1/rate', {
      rating: 5,
      review: 'Excelente atencion',
    });
  });

  it('rate() should work without review text', () => {
    mockApi.patch.mockReturnValue(of({}));

    service.rate('sr-1', 4).subscribe();

    expect(mockApi.patch).toHaveBeenCalledWith('/service-requests/sr-1/rate', {
      rating: 4,
      review: undefined,
    });
  });
});
