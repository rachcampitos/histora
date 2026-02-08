import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { SafetyService, PanicAlertLevel, PanicAlertStatus, TriggerPanicDto } from './safety.service';
import { ApiService } from './api.service';
import { createMockApiService } from '../../../testing';
import { of } from 'rxjs';

describe('SafetyService', () => {
  let service: SafetyService;
  let mockApi: ReturnType<typeof createMockApiService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi = createMockApiService();

    TestBed.configureTestingModule({
      providers: [
        SafetyService,
        { provide: ApiService, useValue: mockApi },
      ],
    });

    service = TestBed.inject(SafetyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= triggerPanic =============

  it('triggerPanic() should POST /safety/panic with panic DTO', () => {
    const dto: TriggerPanicDto = {
      level: PanicAlertLevel.EMERGENCY,
      serviceRequestId: 'sr-1',
      patientId: 'pat-1',
      location: {
        latitude: -12.046,
        longitude: -77.042,
        accuracy: 10,
        address: 'Av. Javier Prado 1234, San Isidro',
      },
      message: 'Paciente agresivo',
      deviceInfo: {
        platform: 'ios',
        batteryLevel: 85,
      },
    };

    const mockResponse = {
      _id: 'panic-1',
      nurseId: 'nurse-1',
      ...dto,
      status: PanicAlertStatus.ACTIVE,
      createdAt: '2026-02-08T15:00:00Z',
    };
    mockApi.post.mockReturnValue(of(mockResponse));

    service.triggerPanic(dto).subscribe(result => {
      expect(result._id).toBe('panic-1');
      expect(result.status).toBe(PanicAlertStatus.ACTIVE);
    });

    expect(mockApi.post).toHaveBeenCalledWith('/safety/panic', dto);
  });

  it('triggerPanic() should work with minimal DTO (no optional fields)', () => {
    const dto: TriggerPanicDto = {
      level: PanicAlertLevel.HELP_NEEDED,
      location: {
        latitude: -12.100,
        longitude: -76.990,
      },
    };
    mockApi.post.mockReturnValue(of({ _id: 'panic-2', status: PanicAlertStatus.ACTIVE }));

    service.triggerPanic(dto).subscribe();

    expect(mockApi.post).toHaveBeenCalledWith('/safety/panic', dto);
  });

  // ============= getActivePanicAlert =============

  it('getActivePanicAlert() should GET /safety/panic/active', () => {
    const mockAlert = {
      _id: 'panic-1',
      nurseId: 'nurse-1',
      level: PanicAlertLevel.EMERGENCY,
      status: PanicAlertStatus.ACTIVE,
      location: { latitude: -12.046, longitude: -77.042 },
      createdAt: '2026-02-08T15:00:00Z',
    };
    mockApi.get.mockReturnValue(of(mockAlert));

    service.getActivePanicAlert().subscribe(result => {
      expect(result).toEqual(mockAlert);
    });

    expect(mockApi.get).toHaveBeenCalledWith('/safety/panic/active');
  });

  it('getActivePanicAlert() should return null when no active alert', () => {
    mockApi.get.mockReturnValue(of(null));

    service.getActivePanicAlert().subscribe(result => {
      expect(result).toBeNull();
    });

    expect(mockApi.get).toHaveBeenCalledWith('/safety/panic/active');
  });

  // ============= cancelPanicAlert =============

  it('cancelPanicAlert() should DELETE /safety/panic/:id', () => {
    const mockResponse = {
      _id: 'panic-1',
      status: PanicAlertStatus.FALSE_ALARM,
      resolvedAt: '2026-02-08T15:05:00Z',
    };
    mockApi.delete.mockReturnValue(of(mockResponse));

    service.cancelPanicAlert('panic-1').subscribe(result => {
      expect(result.status).toBe(PanicAlertStatus.FALSE_ALARM);
    });

    expect(mockApi.delete).toHaveBeenCalledWith('/safety/panic/panic-1');
  });

  // ============= getPanicHistory =============

  it('getPanicHistory() should GET /safety/panic/history', () => {
    const mockHistory = [
      {
        _id: 'panic-1',
        level: PanicAlertLevel.EMERGENCY,
        status: PanicAlertStatus.RESOLVED,
        location: { latitude: -12.046, longitude: -77.042 },
        createdAt: '2026-02-07T10:00:00Z',
        resolvedAt: '2026-02-07T10:15:00Z',
      },
      {
        _id: 'panic-2',
        level: PanicAlertLevel.HELP_NEEDED,
        status: PanicAlertStatus.FALSE_ALARM,
        location: { latitude: -12.100, longitude: -76.990 },
        createdAt: '2026-02-06T18:00:00Z',
        resolvedAt: '2026-02-06T18:02:00Z',
      },
    ];
    mockApi.get.mockReturnValue(of(mockHistory));

    service.getPanicHistory().subscribe(result => {
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(PanicAlertStatus.RESOLVED);
      expect(result[1].status).toBe(PanicAlertStatus.FALSE_ALARM);
    });

    expect(mockApi.get).toHaveBeenCalledWith('/safety/panic/history');
  });
});
