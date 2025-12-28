import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DoctorsService } from './doctors.service';
import { Doctor } from '../../core/models';

describe('DoctorsService', () => {
  let service: DoctorsService;
  let httpMock: HttpTestingController;

  const mockDoctor: Doctor = {
    _id: 'doctor-1',
    userId: 'user-1',
    clinicId: 'clinic-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    specialty: 'Medicina General',
    licenseNumber: 'CMP-12345',
    email: 'juan.perez@clinic.com',
    phone: '+51999888777',
    isPublicProfile: true,
    averageRating: 4.5,
    totalReviews: 10,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DoctorsService,
      ],
    });

    service = TestBed.inject(DoctorsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDoctors', () => {
    it('should get doctors without params', () => {
      const mockResponse = { data: [mockDoctor], total: 1, limit: 20, offset: 0 };

      service.getDoctors().subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/doctors');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get doctors with search params', () => {
      service.getDoctors({ search: 'Juan', specialty: 'Cardiología' }).subscribe();

      const req = httpMock.expectOne((r) => r.url === 'http://localhost:3000/doctors');
      expect(req.request.params.get('search')).toBe('Juan');
      expect(req.request.params.get('specialty')).toBe('Cardiología');
      req.flush({ data: [], total: 0, limit: 20, offset: 0 });
    });

    it('should return empty response on error', () => {
      service.getDoctors().subscribe((response) => {
        expect(response).toEqual({ data: [], total: 0, limit: 20, offset: 0 });
      });

      const req = httpMock.expectOne('http://localhost:3000/doctors');
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getDoctor', () => {
    it('should get doctor by id', () => {
      service.getDoctor('doctor-1').subscribe((result) => {
        expect(result).toEqual(mockDoctor);
      });

      const req = httpMock.expectOne('http://localhost:3000/doctors/doctor-1');
      expect(req.request.method).toBe('GET');
      req.flush(mockDoctor);
    });
  });

  describe('getClinicDoctors', () => {
    it('should get clinic doctors', () => {
      service.getClinicDoctors().subscribe((result) => {
        expect(result).toEqual([mockDoctor]);
      });

      const req = httpMock.expectOne('http://localhost:3000/doctors/clinic');
      expect(req.request.method).toBe('GET');
      req.flush([mockDoctor]);
    });

    it('should return empty array on error', () => {
      service.getClinicDoctors().subscribe((result) => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne('http://localhost:3000/doctors/clinic');
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('searchDoctors', () => {
    it('should search doctors by query', () => {
      service.searchDoctors('cardio').subscribe((result) => {
        expect(result).toEqual([mockDoctor]);
      });

      const req = httpMock.expectOne((r) =>
        r.url === 'http://localhost:3000/doctors/search' && r.params.get('q') === 'cardio'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockDoctor]);
    });

    it('should return empty array on error', () => {
      service.searchDoctors('query').subscribe((result) => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne((r) => r.url === 'http://localhost:3000/doctors/search');
      req.error(new ErrorEvent('Network error'));
    });
  });
});
