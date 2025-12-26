import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientsService, PatientsResponse } from './patients.service';
import { ApiService } from '../../core/services/api.service';
import { Patient, CreatePatientDto, Gender, BloodType } from '../../core/models';

describe('PatientsService', () => {
  let service: PatientsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockPatient: Patient = {
    _id: 'patient-123',
    clinicId: 'clinic-123',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    phone: '+52 555 1234567',
    gender: Gender.MALE,
    dateOfBirth: new Date('1990-05-15'),
    allergies: ['Penicilina'],
    chronicConditions: ['Hipertensión'],
    bloodType: BloodType.O_POSITIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPatientsResponse: PatientsResponse = {
    data: [mockPatient],
    total: 1,
    limit: 20,
    offset: 0,
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'patch', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        PatientsService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(PatientsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPatients', () => {
    it('should get patients without params', () => {
      apiServiceSpy.get.and.returnValue(of(mockPatientsResponse));

      service.getPatients().subscribe((response) => {
        expect(response).toEqual(mockPatientsResponse);
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith('/patients', undefined);
    });

    it('should get patients with search params', () => {
      const params = { search: 'Juan', limit: 10, offset: 0 };
      apiServiceSpy.get.and.returnValue(of(mockPatientsResponse));

      service.getPatients(params).subscribe((response) => {
        expect(response).toEqual(mockPatientsResponse);
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith('/patients', params);
    });
  });

  describe('getPatient', () => {
    it('should get a single patient by id', () => {
      apiServiceSpy.get.and.returnValue(of(mockPatient));

      service.getPatient('patient-123').subscribe((patient) => {
        expect(patient).toEqual(mockPatient);
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith('/patients/patient-123');
    });
  });

  describe('createPatient', () => {
    it('should create a new patient', () => {
      const createDto: CreatePatientDto = {
        firstName: 'María',
        lastName: 'García',
        email: 'maria@example.com',
      };

      apiServiceSpy.post.and.returnValue(of({ ...mockPatient, ...createDto }));

      service.createPatient(createDto).subscribe((patient) => {
        expect(patient.firstName).toBe('María');
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith('/patients', createDto);
    });
  });

  describe('updatePatient', () => {
    it('should update an existing patient', () => {
      const updateData = { phone: '+52 555 9999999' };
      apiServiceSpy.patch.and.returnValue(of({ ...mockPatient, ...updateData }));

      service.updatePatient('patient-123', updateData).subscribe((patient) => {
        expect(patient.phone).toBe('+52 555 9999999');
      });

      expect(apiServiceSpy.patch).toHaveBeenCalledWith('/patients/patient-123', updateData);
    });
  });

  describe('deletePatient', () => {
    it('should delete a patient', () => {
      apiServiceSpy.delete.and.returnValue(of(undefined));

      service.deletePatient('patient-123').subscribe();

      expect(apiServiceSpy.delete).toHaveBeenCalledWith('/patients/patient-123');
    });
  });

  describe('searchPatients', () => {
    it('should search patients by query', () => {
      apiServiceSpy.get.and.returnValue(of([mockPatient]));

      service.searchPatients('Juan').subscribe((patients) => {
        expect(patients.length).toBe(1);
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith('/patients/search', { q: 'Juan' });
    });
  });
});
