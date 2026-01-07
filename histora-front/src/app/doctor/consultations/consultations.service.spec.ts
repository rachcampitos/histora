import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsultationsService } from './consultations.service';
import { Consultation, ConsultationStatus, DiagnosisType } from './consultations.model';
import { environment } from 'environments/environment';

describe('ConsultationsService', () => {
  let service: ConsultationsService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/consultations`;

  const mockConsultation: Consultation = {
    _id: '123',
    patientId: 'patient1',
    doctorId: 'doctor1',
    clinicId: 'clinic1',
    date: new Date(),
    status: ConsultationStatus.SCHEDULED,
    chiefComplaint: 'Dolor de cabeza',
    diagnoses: [
      {
        code: 'R51',
        description: 'Cefalea',
        type: DiagnosisType.PRINCIPAL,
      },
    ],
    prescriptions: [],
    orderedExams: [],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConsultationsService],
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

  describe('getAll', () => {
    it('should return consultations without filters', () => {
      service.getAll().subscribe((consultations) => {
        expect(consultations).toEqual([mockConsultation]);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush([mockConsultation]);
    });

    it('should return consultations with filters', () => {
      const filters = {
        doctorId: 'doctor1',
        status: ConsultationStatus.SCHEDULED,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      service.getAll(filters).subscribe((consultations) => {
        expect(consultations).toEqual([mockConsultation]);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === apiUrl &&
          request.params.get('doctorId') === 'doctor1' &&
          request.params.get('status') === ConsultationStatus.SCHEDULED
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockConsultation]);
    });
  });

  describe('getById', () => {
    it('should return a consultation by ID', () => {
      service.getById('123').subscribe((consultation) => {
        expect(consultation).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne(`${apiUrl}/123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockConsultation);
    });
  });

  describe('getByPatient', () => {
    it('should return consultations for a patient', () => {
      service.getByPatient('patient1').subscribe((consultations) => {
        expect(consultations).toEqual([mockConsultation]);
      });

      const req = httpMock.expectOne(`${apiUrl}/patient/patient1`);
      expect(req.request.method).toBe('GET');
      req.flush([mockConsultation]);
    });

    it('should return consultations with limit', () => {
      service.getByPatient('patient1', 10).subscribe((consultations) => {
        expect(consultations).toEqual([mockConsultation]);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${apiUrl}/patient/patient1` &&
          request.params.get('limit') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockConsultation]);
    });
  });

  describe('getByDoctor', () => {
    it('should return consultations for a doctor', () => {
      service.getByDoctor('doctor1').subscribe((consultations) => {
        expect(consultations).toEqual([mockConsultation]);
      });

      const req = httpMock.expectOne(`${apiUrl}/doctor/doctor1`);
      expect(req.request.method).toBe('GET');
      req.flush([mockConsultation]);
    });

    it('should return consultations with status and limit', () => {
      service
        .getByDoctor('doctor1', ConsultationStatus.SCHEDULED, 5)
        .subscribe((consultations) => {
          expect(consultations).toEqual([mockConsultation]);
        });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${apiUrl}/doctor/doctor1` &&
          request.params.get('status') === ConsultationStatus.SCHEDULED &&
          request.params.get('limit') === '5'
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockConsultation]);
    });
  });

  describe('getByAppointment', () => {
    it('should return consultation for an appointment', () => {
      service.getByAppointment('appointment1').subscribe((consultation) => {
        expect(consultation).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne(`${apiUrl}/appointment/appointment1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockConsultation);
    });
  });

  describe('getPatientSummary', () => {
    it('should return patient summary', () => {
      const summary = { totalConsultations: 5, lastVisit: new Date() };
      service.getPatientSummary('patient1').subscribe((result) => {
        expect(result).toEqual(summary);
      });

      const req = httpMock.expectOne(`${apiUrl}/patient/patient1/summary`);
      expect(req.request.method).toBe('GET');
      req.flush(summary);
    });
  });

  describe('getCount', () => {
    it('should return consultation count', () => {
      service.getCount().subscribe((result) => {
        expect(result.count).toBe(10);
      });

      const req = httpMock.expectOne(`${apiUrl}/count`);
      expect(req.request.method).toBe('GET');
      req.flush({ count: 10 });
    });

    it('should return consultation count with status filter', () => {
      service.getCount(ConsultationStatus.COMPLETED).subscribe((result) => {
        expect(result.count).toBe(5);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${apiUrl}/count` &&
          request.params.get('status') === ConsultationStatus.COMPLETED
      );
      expect(req.request.method).toBe('GET');
      req.flush({ count: 5 });
    });
  });

  describe('create', () => {
    it('should create a new consultation', () => {
      const dto = {
        patientId: 'patient1',
        doctorId: 'doctor1',
        date: new Date(),
        chiefComplaint: 'Dolor de cabeza',
      };

      service.create(dto).subscribe((consultation) => {
        expect(consultation).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      req.flush(mockConsultation);
    });
  });

  describe('createFromAppointment', () => {
    it('should create consultation from appointment', () => {
      const data = {
        patientId: 'patient1',
        doctorId: 'doctor1',
        reasonForVisit: 'Chequeo',
      };

      service.createFromAppointment('appointment1', data).subscribe((consultation) => {
        expect(consultation).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne(`${apiUrl}/from-appointment/appointment1`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush(mockConsultation);
    });
  });

  describe('update', () => {
    it('should update a consultation', () => {
      const dto = { chiefComplaint: 'Dolor de cabeza actualizado' };

      service.update('123', dto).subscribe((consultation) => {
        expect(consultation).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne(`${apiUrl}/123`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush(mockConsultation);
    });
  });

  describe('updateStatus', () => {
    it('should update consultation status', () => {
      service
        .updateStatus('123', ConsultationStatus.IN_PROGRESS)
        .subscribe((consultation) => {
          expect(consultation).toEqual(mockConsultation);
        });

      const req = httpMock.expectOne(`${apiUrl}/123/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: ConsultationStatus.IN_PROGRESS });
      req.flush(mockConsultation);
    });
  });

  describe('complete', () => {
    it('should complete a consultation', () => {
      const dto = {
        treatmentPlan: 'Reposo y medicación',
        clinicalNotes: 'Paciente estable',
      };

      service.complete('123', dto).subscribe((consultation) => {
        expect(consultation).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne(`${apiUrl}/123/complete`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush(mockConsultation);
    });
  });

  describe('addExamResults', () => {
    it('should add exam results', () => {
      service.addExamResults('123', 0, 'Normal').subscribe((consultation) => {
        expect(consultation).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne(`${apiUrl}/123/exam-results`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ examIndex: 0, results: 'Normal' });
      req.flush(mockConsultation);
    });
  });

  describe('linkVitals', () => {
    it('should link vitals to consultation', () => {
      service.linkVitals('123', 'vitals1').subscribe((consultation) => {
        expect(consultation).toEqual(mockConsultation);
      });

      const req = httpMock.expectOne(`${apiUrl}/123/link-vitals/vitals1`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockConsultation);
    });
  });

  describe('delete', () => {
    it('should delete a consultation', () => {
      service.delete('123').subscribe((result) => {
        expect(result.message).toBe('Deleted');
      });

      const req = httpMock.expectOne(`${apiUrl}/123`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Deleted' });
    });
  });

  describe('getTodayConsultations', () => {
    it('should return today consultations for a doctor', () => {
      service.getTodayConsultations('doctor1').subscribe((consultations) => {
        expect(consultations).toEqual([mockConsultation]);
      });

      const req = httpMock.expectOne((request) => {
        return (
          request.url === apiUrl &&
          request.params.get('doctorId') === 'doctor1' &&
          request.params.has('startDate') &&
          request.params.has('endDate')
        );
      });
      expect(req.request.method).toBe('GET');
      req.flush([mockConsultation]);
    });
  });
});
