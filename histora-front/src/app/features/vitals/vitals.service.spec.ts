import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { VitalsService } from './vitals.service';
import { Vitals, CreateVitalsDto } from '../../core/models';

describe('VitalsService', () => {
  let service: VitalsService;
  let httpMock: HttpTestingController;

  const mockVitals: Vitals = {
    _id: 'vitals-1',
    patientId: 'patient-1',
    clinicId: 'clinic-1',
    recordedAt: new Date('2024-01-15T10:00:00Z'),
    weight: 70,
    height: 175,
    heartRate: 72,
    systolicBP: 120,
    diastolicBP: 80,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        VitalsService,
      ],
    });

    service = TestBed.inject(VitalsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getVitals', () => {
    it('should get vitals with params', () => {
      const mockResponse = { data: [mockVitals], total: 1, limit: 20, offset: 0 };

      service.getVitals({ patientId: 'patient-1' }).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne((r) => r.url === '/api/vitals');
      expect(req.request.params.get('patientId')).toBe('patient-1');
      req.flush(mockResponse);
    });

    it('should return empty response on error', () => {
      service.getVitals().subscribe((response) => {
        expect(response).toEqual({ data: [], total: 0, limit: 20, offset: 0 });
      });

      const req = httpMock.expectOne('/api/vitals');
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getVitalsById', () => {
    it('should get vitals by id', () => {
      service.getVitalsById('vitals-1').subscribe((result) => {
        expect(result).toEqual(mockVitals);
      });

      const req = httpMock.expectOne('/api/vitals/vitals-1');
      expect(req.request.method).toBe('GET');
      req.flush(mockVitals);
    });
  });

  describe('getPatientVitals', () => {
    it('should get patient vitals', () => {
      service.getPatientVitals('patient-1').subscribe((result) => {
        expect(result).toEqual([mockVitals]);
      });

      const req = httpMock.expectOne('/api/vitals/patient/patient-1');
      expect(req.request.method).toBe('GET');
      req.flush([mockVitals]);
    });

    it('should get patient vitals with limit', () => {
      service.getPatientVitals('patient-1', 5).subscribe();

      const req = httpMock.expectOne((r) =>
        r.url === '/api/vitals/patient/patient-1' && r.params.get('limit') === '5'
      );
      req.flush([mockVitals]);
    });
  });

  describe('getLatestVitals', () => {
    it('should get latest vitals for a patient', () => {
      service.getLatestVitals('patient-1').subscribe((result) => {
        expect(result).toEqual(mockVitals);
      });

      const req = httpMock.expectOne('/api/vitals/patient/patient-1/latest');
      req.flush(mockVitals);
    });

    it('should return null on error', () => {
      service.getLatestVitals('patient-1').subscribe((result) => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne('/api/vitals/patient/patient-1/latest');
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getVitalsStats', () => {
    it('should get vitals stats', () => {
      const stats = { lastRecorded: mockVitals, averages: { heartRate: 72 } };

      service.getVitalsStats('patient-1').subscribe((result) => {
        expect(result).toEqual(stats);
      });

      const req = httpMock.expectOne('/api/vitals/patient/patient-1/stats');
      req.flush(stats);
    });

    it('should return empty object on error', () => {
      service.getVitalsStats('patient-1').subscribe((result) => {
        expect(result).toEqual({});
      });

      const req = httpMock.expectOne('/api/vitals/patient/patient-1/stats');
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('createVitals', () => {
    it('should create vitals', () => {
      const dto: CreateVitalsDto = {
        patientId: 'patient-1',
        weight: 70,
        height: 175,
        heartRate: 72,
        systolicBP: 120,
        diastolicBP: 80,
      };

      service.createVitals(dto).subscribe((result) => {
        expect(result).toEqual(mockVitals);
      });

      const req = httpMock.expectOne('/api/vitals');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockVitals);
    });
  });

  describe('updateVitals', () => {
    it('should update vitals', () => {
      service.updateVitals('vitals-1', { weight: 72 }).subscribe((result) => {
        expect(result).toEqual(mockVitals);
      });

      const req = httpMock.expectOne('/api/vitals/vitals-1');
      expect(req.request.method).toBe('PATCH');
      req.flush(mockVitals);
    });
  });

  describe('deleteVitals', () => {
    it('should delete vitals', () => {
      service.deleteVitals('vitals-1').subscribe();

      const req = httpMock.expectOne('/api/vitals/vitals-1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('calculateBMI', () => {
    it('should calculate BMI correctly', () => {
      expect(service.calculateBMI(70, 175)).toBe(22.9);
    });

    it('should return 0 for invalid values', () => {
      expect(service.calculateBMI(0, 175)).toBe(0);
      expect(service.calculateBMI(70, 0)).toBe(0);
    });
  });

  describe('getBMICategory', () => {
    it('should return bajo peso for BMI < 18.5', () => {
      expect(service.getBMICategory(17)).toEqual({ category: 'Bajo peso', color: 'warning' });
    });

    it('should return normal for BMI 18.5-24.9', () => {
      expect(service.getBMICategory(22)).toEqual({ category: 'Normal', color: 'success' });
    });

    it('should return sobrepeso for BMI 25-29.9', () => {
      expect(service.getBMICategory(27)).toEqual({ category: 'Sobrepeso', color: 'warning' });
    });

    it('should return obesidad for BMI >= 30', () => {
      expect(service.getBMICategory(32)).toEqual({ category: 'Obesidad', color: 'danger' });
    });
  });

  describe('getBloodPressureCategory', () => {
    it('should return normal for BP < 120/80', () => {
      expect(service.getBloodPressureCategory(110, 70)).toEqual({ category: 'Normal', color: 'success' });
    });

    it('should return elevada for systolic 120-129 and diastolic < 80', () => {
      expect(service.getBloodPressureCategory(125, 75)).toEqual({ category: 'Elevada', color: 'warning' });
    });

    it('should return hipertension etapa 1 for systolic 130-139 or diastolic 80-89', () => {
      expect(service.getBloodPressureCategory(135, 85)).toEqual({ category: 'Hipertensión Etapa 1', color: 'warning' });
    });

    it('should return hipertension etapa 2 for systolic >= 140 or diastolic >= 90', () => {
      expect(service.getBloodPressureCategory(145, 95)).toEqual({ category: 'Hipertensión Etapa 2', color: 'danger' });
    });
  });
});
