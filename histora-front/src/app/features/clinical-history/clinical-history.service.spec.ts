import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ClinicalHistoryService, ClinicalHistory, Allergy, ChronicCondition, Surgery, FamilyHistory, CurrentMedication, Vaccination, CreateClinicalHistoryDto } from './clinical-history.service';

describe('ClinicalHistoryService', () => {
  let service: ClinicalHistoryService;
  let httpMock: HttpTestingController;

  const mockHistory: ClinicalHistory = {
    _id: 'history-1',
    clinicId: 'clinic-1',
    patientId: 'patient-1',
    doctorId: 'doctor-1',
    date: '2024-01-15T10:00:00Z',
    reasonForVisit: 'Consulta general',
    allergies: [],
    chronicConditions: [],
    surgicalHistory: [],
    familyHistory: [],
    currentMedications: [],
    vaccinations: [],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ClinicalHistoryService,
      ],
    });

    service = TestBed.inject(ClinicalHistoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getClinicalHistories', () => {
    it('should get clinical histories', () => {
      const mockResponse = { data: [mockHistory], total: 1, limit: 20, offset: 0 };

      service.getClinicalHistories({ patientId: 'patient-1' }).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne((r) => r.url === '/api/clinical-history');
      req.flush(mockResponse);
    });

    it('should return empty response on error', () => {
      service.getClinicalHistories().subscribe((response) => {
        expect(response).toEqual({ data: [], total: 0, limit: 20, offset: 0 });
      });

      const req = httpMock.expectOne('/api/clinical-history');
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getClinicalHistory', () => {
    it('should get clinical history by id', () => {
      service.getClinicalHistory('history-1').subscribe((result) => {
        expect(result).toEqual(mockHistory);
      });

      const req = httpMock.expectOne('/api/clinical-history/history-1');
      expect(req.request.method).toBe('GET');
      req.flush(mockHistory);
    });
  });

  describe('getPatientHistory', () => {
    it('should get patient history', () => {
      service.getPatientHistory('patient-1').subscribe((result) => {
        expect(result).toEqual([mockHistory]);
      });

      const req = httpMock.expectOne('/api/clinical-history/patient/patient-1');
      req.flush([mockHistory]);
    });
  });

  describe('getLatestHistory', () => {
    it('should get latest history for a patient', () => {
      service.getLatestHistory('patient-1').subscribe((result) => {
        expect(result).toEqual(mockHistory);
      });

      const req = httpMock.expectOne('/api/clinical-history/patient/patient-1/latest');
      req.flush(mockHistory);
    });

    it('should return null on error', () => {
      service.getLatestHistory('patient-1').subscribe((result) => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne('/api/clinical-history/patient/patient-1/latest');
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('createClinicalHistory', () => {
    it('should create clinical history', () => {
      const dto: CreateClinicalHistoryDto = {
        patientId: 'patient-1',
        date: '2024-01-15T10:00:00Z',
        reasonForVisit: 'Consulta general',
      };

      service.createClinicalHistory(dto).subscribe((result) => {
        expect(result).toEqual(mockHistory);
      });

      const req = httpMock.expectOne('/api/clinical-history');
      expect(req.request.method).toBe('POST');
      req.flush(mockHistory);
    });
  });

  describe('updateClinicalHistory', () => {
    it('should update clinical history', () => {
      service.updateClinicalHistory('history-1', { diagnosis: 'Updated diagnosis' }).subscribe((result) => {
        expect(result).toEqual(mockHistory);
      });

      const req = httpMock.expectOne('/api/clinical-history/history-1');
      expect(req.request.method).toBe('PATCH');
      req.flush(mockHistory);
    });
  });

  describe('deleteClinicalHistory', () => {
    it('should delete clinical history', () => {
      service.deleteClinicalHistory('history-1').subscribe();

      const req = httpMock.expectOne('/api/clinical-history/history-1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('addAllergy', () => {
    it('should add allergy', () => {
      const allergy: Allergy = {
        allergen: 'Penicilina',
        severity: 'severe',
      };

      service.addAllergy('history-1', allergy).subscribe((result) => {
        expect(result).toEqual(mockHistory);
      });

      const req = httpMock.expectOne('/api/clinical-history/history-1/allergies');
      expect(req.request.method).toBe('POST');
      req.flush(mockHistory);
    });
  });

  describe('removeAllergy', () => {
    it('should remove allergy', () => {
      service.removeAllergy('history-1', 'Penicilina').subscribe((result) => {
        expect(result).toEqual(mockHistory);
      });

      const req = httpMock.expectOne('/api/clinical-history/history-1/allergies/Penicilina');
      expect(req.request.method).toBe('DELETE');
      req.flush(mockHistory);
    });
  });

  describe('addChronicCondition', () => {
    it('should add chronic condition', () => {
      const condition: ChronicCondition = {
        condition: 'Diabetes tipo 2',
        status: 'controlled',
      };

      service.addChronicCondition('history-1', condition).subscribe((result) => {
        expect(result).toEqual(mockHistory);
      });

      const req = httpMock.expectOne('/api/clinical-history/history-1/conditions');
      expect(req.request.method).toBe('POST');
      req.flush(mockHistory);
    });
  });

  describe('addSurgery', () => {
    it('should add surgery', () => {
      const surgery: Surgery = {
        procedure: 'Apendicectomía',
        date: '2020-05-15',
      };

      service.addSurgery('history-1', surgery).subscribe((result) => {
        expect(result).toEqual(mockHistory);
      });

      const req = httpMock.expectOne('/api/clinical-history/history-1/surgeries');
      expect(req.request.method).toBe('POST');
      req.flush(mockHistory);
    });
  });

  describe('addFamilyHistory', () => {
    it('should add family history', () => {
      const familyHistory: FamilyHistory = {
        relationship: 'Padre',
        condition: 'Hipertensión',
      };

      service.addFamilyHistory('history-1', familyHistory).subscribe((result) => {
        expect(result).toEqual(mockHistory);
      });

      const req = httpMock.expectOne('/api/clinical-history/history-1/family-history');
      expect(req.request.method).toBe('POST');
      req.flush(mockHistory);
    });
  });

  describe('addMedication', () => {
    it('should add medication', () => {
      const medication: CurrentMedication = {
        medication: 'Metformina',
        dosage: '500mg',
        frequency: 'Dos veces al día',
      };

      service.addMedication('history-1', medication).subscribe((result) => {
        expect(result).toEqual(mockHistory);
      });

      const req = httpMock.expectOne('/api/clinical-history/history-1/medications');
      expect(req.request.method).toBe('POST');
      req.flush(mockHistory);
    });
  });

  describe('addVaccination', () => {
    it('should add vaccination', () => {
      const vaccination: Vaccination = {
        vaccine: 'COVID-19',
        date: '2023-01-15',
        doseNumber: 3,
      };

      service.addVaccination('history-1', vaccination).subscribe((result) => {
        expect(result).toEqual(mockHistory);
      });

      const req = httpMock.expectOne('/api/clinical-history/history-1/vaccinations');
      expect(req.request.method).toBe('POST');
      req.flush(mockHistory);
    });
  });

  describe('getPatientMedicalSummary', () => {
    it('should get patient medical summary', () => {
      const summary = {
        allergies: [],
        chronicConditions: [],
        currentMedications: [],
        recentVisits: [],
      };

      service.getPatientMedicalSummary('patient-1').subscribe((result) => {
        expect(result).toEqual(summary);
      });

      const req = httpMock.expectOne('/api/clinical-history/patient/patient-1/summary');
      expect(req.request.method).toBe('GET');
      req.flush(summary);
    });
  });
});
