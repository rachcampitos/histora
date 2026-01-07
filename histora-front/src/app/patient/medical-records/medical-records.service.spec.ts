import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MedicalRecordsService, Consultation, PatientMedicalSummary } from './medical-records.service';
import { environment } from 'environments/environment';

describe('MedicalRecordsService', () => {
  let service: MedicalRecordsService;
  let httpMock: HttpTestingController;
  const clinicalHistoryUrl = `${environment.apiUrl}/clinical-history`;
  const consultationsUrl = `${environment.apiUrl}/consultations`;

  const mockConsultation: Consultation = {
    _id: '123',
    patientId: 'patient1',
    doctorId: 'doctor1',
    clinicId: 'clinic1',
    date: new Date(),
    status: 'completed',
    chiefComplaint: 'Dolor de cabeza',
    diagnoses: [
      {
        code: 'R51',
        description: 'Cefalea',
        type: 'principal',
      },
    ],
    prescriptions: [
      {
        medication: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Cada 8 horas',
        duration: '5 días',
      },
    ],
    createdAt: new Date(),
    doctor: {
      _id: 'doctor1',
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      specialty: 'Medicina General',
    },
  };

  const mockMedicalSummary: PatientMedicalSummary = {
    allergies: [
      { allergen: 'Penicilina', reaction: 'Urticaria', severity: 'Moderada' },
    ],
    chronicConditions: [
      { condition: 'Hipertensión', icdCode: 'I10', status: 'Controlada' },
    ],
    currentMedications: [
      { medication: 'Losartán', dosage: '50mg', frequency: 'Diario' },
    ],
    surgicalHistory: [
      { procedure: 'Apendicectomía', date: new Date('2015-03-20') },
    ],
    familyHistory: [
      { relationship: 'Padre', condition: 'Diabetes tipo 2' },
    ],
    vaccinations: [
      { vaccine: 'COVID-19', date: new Date('2023-01-15'), doseNumber: 3 },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MedicalRecordsService],
    });
    service = TestBed.inject(MedicalRecordsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getClinicalHistory', () => {
    it('should return clinical history entries', () => {
      service.getClinicalHistory('patient1').subscribe((entries) => {
        expect(entries).toBeTruthy();
        expect(entries.length).toBe(1);
      });

      const req = httpMock.expectOne(`${clinicalHistoryUrl}/patient/patient1`);
      expect(req.request.method).toBe('GET');
      req.flush([{ _id: '1', patientId: 'patient1' }]);
    });

    it('should include limit parameter when provided', () => {
      service.getClinicalHistory('patient1', 10).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${clinicalHistoryUrl}/patient/patient1` &&
          request.params.get('limit') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getMedicalSummary', () => {
    it('should return patient medical summary', () => {
      service.getMedicalSummary('patient1').subscribe((summary) => {
        expect(summary).toEqual(mockMedicalSummary);
        expect(summary.allergies.length).toBe(1);
        expect(summary.chronicConditions.length).toBe(1);
        expect(summary.currentMedications.length).toBe(1);
      });

      const req = httpMock.expectOne(`${clinicalHistoryUrl}/patient/patient1/summary`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMedicalSummary);
    });
  });

  describe('getConsultations', () => {
    it('should return patient consultations', () => {
      service.getConsultations('patient1').subscribe((consultations) => {
        expect(consultations).toEqual([mockConsultation]);
        expect(consultations.length).toBe(1);
      });

      const req = httpMock.expectOne(`${consultationsUrl}/patient/patient1`);
      expect(req.request.method).toBe('GET');
      req.flush([mockConsultation]);
    });

    it('should include limit parameter when provided', () => {
      service.getConsultations('patient1', 20).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${consultationsUrl}/patient/patient1` &&
          request.params.get('limit') === '20'
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getConsultationSummary', () => {
    it('should return consultation summary', () => {
      const summary = { totalConsultations: 5, lastVisit: new Date() };

      service.getConsultationSummary('patient1').subscribe((result) => {
        expect(result).toEqual(summary);
      });

      const req = httpMock.expectOne(`${consultationsUrl}/patient/patient1/summary`);
      expect(req.request.method).toBe('GET');
      req.flush(summary);
    });
  });

  describe('Interfaces', () => {
    it('should have correct Consultation structure', () => {
      const consultation: Consultation = {
        _id: '1',
        patientId: 'p1',
        doctorId: 'd1',
        clinicId: 'c1',
        date: new Date(),
        status: 'completed',
        chiefComplaint: 'Test',
        diagnoses: [],
        prescriptions: [],
        createdAt: new Date(),
      };

      expect(consultation._id).toBe('1');
      expect(consultation.status).toBe('completed');
    });

    it('should have correct PatientMedicalSummary structure', () => {
      const summary: PatientMedicalSummary = {
        allergies: [],
        chronicConditions: [],
        currentMedications: [],
        surgicalHistory: [],
        familyHistory: [],
        vaccinations: [],
      };

      expect(summary.allergies).toEqual([]);
      expect(summary.chronicConditions).toEqual([]);
      expect(summary.vaccinations).toEqual([]);
    });

    it('should allow optional fields in Allergy', () => {
      const allergy = { allergen: 'Dust' };
      expect(allergy.allergen).toBe('Dust');
    });

    it('should allow optional fields in ChronicCondition', () => {
      const condition = { condition: 'Diabetes' };
      expect(condition.condition).toBe('Diabetes');
    });

    it('should allow optional fields in Surgery', () => {
      const surgery = { procedure: 'Appendectomy' };
      expect(surgery.procedure).toBe('Appendectomy');
    });

    it('should allow optional fields in FamilyHistory', () => {
      const history = { relationship: 'Mother', condition: 'Hypertension' };
      expect(history.relationship).toBe('Mother');
      expect(history.condition).toBe('Hypertension');
    });

    it('should allow optional fields in Medication', () => {
      const medication = { medication: 'Aspirin' };
      expect(medication.medication).toBe('Aspirin');
    });

    it('should allow optional fields in Vaccination', () => {
      const vaccination = { vaccine: 'Flu shot' };
      expect(vaccination.vaccine).toBe('Flu shot');
    });
  });
});
