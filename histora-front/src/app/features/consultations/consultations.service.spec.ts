import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ConsultationsService, CreateConsultationDto, UpdateConsultationDto } from './consultations.service';
import { Consultation, Diagnosis, Prescription, OrderedExam, ConsultationStatus } from '../../core/models';

describe('ConsultationsService', () => {
  let service: ConsultationsService;
  let httpMock: HttpTestingController;

  const mockConsultation: Consultation = {
    _id: 'cons-1',
    patientId: 'patient-1',
    doctorId: 'doctor-1',
    date: new Date('2024-01-15T10:00:00Z'),
    chiefComplaint: 'Dolor de cabeza',
    status: ConsultationStatus.IN_PROGRESS,
    clinicId: 'clinic-1',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ConsultationsService,
      ],
    });

    service = TestBed.inject(ConsultationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getConsultations', () => {
    it('should get consultations without params', () => {
      const mockResponse = { data: [mockConsultation], total: 1, limit: 20, offset: 0 };

      service.getConsultations().subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/consultations');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get consultations with params', () => {
      const params = { patientId: 'patient-1', status: 'in_progress' };

      service.getConsultations(params).subscribe();

      const req = httpMock.expectOne((r) => r.url === '/api/consultations');
      expect(req.request.params.get('patientId')).toBe('patient-1');
      expect(req.request.params.get('status')).toBe('in_progress');
      req.flush({ data: [], total: 0, limit: 20, offset: 0 });
    });

    it('should return empty response on error', () => {
      service.getConsultations().subscribe((response) => {
        expect(response).toEqual({ data: [], total: 0, limit: 20, offset: 0 });
      });

      const req = httpMock.expectOne('/api/consultations');
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getConsultation', () => {
    it('should get consultation by id', () => {
      service.getConsultation('cons-1').subscribe((result) => {
        expect(result).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne('/api/consultations/cons-1');
      expect(req.request.method).toBe('GET');
      req.flush(mockConsultation);
    });
  });

  describe('getConsultationsByPatient', () => {
    it('should get consultations by patient id', () => {
      service.getConsultationsByPatient('patient-1').subscribe((result) => {
        expect(result).toEqual([mockConsultation]);
      });

      const req = httpMock.expectOne('/api/consultations/patient/patient-1');
      expect(req.request.method).toBe('GET');
      req.flush([mockConsultation]);
    });
  });

  describe('createConsultation', () => {
    it('should create a consultation', () => {
      const dto: CreateConsultationDto = {
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        date: '2024-01-15T10:00:00Z',
        chiefComplaint: 'Dolor de cabeza',
      };

      service.createConsultation(dto).subscribe((result) => {
        expect(result).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne('/api/consultations');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockConsultation);
    });
  });

  describe('createFromAppointment', () => {
    it('should create consultation from appointment', () => {
      service.createFromAppointment('apt-1').subscribe((result) => {
        expect(result).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne('/api/consultations/from-appointment/apt-1');
      expect(req.request.method).toBe('POST');
      req.flush(mockConsultation);
    });
  });

  describe('updateConsultation', () => {
    it('should update a consultation', () => {
      const dto: UpdateConsultationDto = {
        chiefComplaint: 'Dolor de cabeza severo',
      };

      service.updateConsultation('cons-1', dto).subscribe((result) => {
        expect(result).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne('/api/consultations/cons-1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush(mockConsultation);
    });
  });

  describe('completeConsultation', () => {
    it('should complete a consultation', () => {
      service.completeConsultation('cons-1').subscribe((result) => {
        expect(result).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne('/api/consultations/cons-1/complete');
      expect(req.request.method).toBe('PATCH');
      req.flush(mockConsultation);
    });
  });

  describe('cancelConsultation', () => {
    it('should cancel a consultation', () => {
      service.cancelConsultation('cons-1', 'Patient no-show').subscribe((result) => {
        expect(result).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne('/api/consultations/cons-1/cancel');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ reason: 'Patient no-show' });
      req.flush(mockConsultation);
    });
  });

  describe('deleteConsultation', () => {
    it('should delete a consultation', () => {
      service.deleteConsultation('cons-1').subscribe();

      const req = httpMock.expectOne('/api/consultations/cons-1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('addDiagnosis', () => {
    it('should add a diagnosis to a consultation', () => {
      const diagnosis: Diagnosis = {
        type: 'primary',
        code: 'J06.9',
        description: 'Infección respiratoria aguda',
      };

      service.addDiagnosis('cons-1', diagnosis).subscribe((result) => {
        expect(result).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne('/api/consultations/cons-1/diagnoses');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(diagnosis);
      req.flush(mockConsultation);
    });
  });

  describe('addPrescription', () => {
    it('should add a prescription to a consultation', () => {
      const prescription: Prescription = {
        medication: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Cada 8 horas',
        duration: '5 días',
      };

      service.addPrescription('cons-1', prescription).subscribe((result) => {
        expect(result).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne('/api/consultations/cons-1/prescriptions');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(prescription);
      req.flush(mockConsultation);
    });
  });

  describe('addOrderedExam', () => {
    it('should add an ordered exam to a consultation', () => {
      const exam: OrderedExam = {
        name: 'Hemograma completo',
        type: 'laboratory',
        priority: 'routine',
      };

      service.addOrderedExam('cons-1', exam).subscribe((result) => {
        expect(result).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne('/api/consultations/cons-1/exams');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(exam);
      req.flush(mockConsultation);
    });
  });
});
