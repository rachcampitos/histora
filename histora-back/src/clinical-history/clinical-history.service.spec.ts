import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { ClinicalHistoryService } from './clinical-history.service';
import { ClinicalHistory } from './schema/clinical-history.schema';
import {
  createMockModel,
  configureMockFind,
  configureMockFindOne,
  configureMockFindOneAndUpdate,
  MockModel,
} from '../../test/mocks/mongoose-model.mock';

describe('ClinicalHistoryService', () => {
  let service: ClinicalHistoryService;
  let clinicalHistoryModel: MockModel;

  const mockClinicId = 'clinic-id-123';
  const mockPatientId = 'patient-id-456';
  const mockDoctorId = 'doctor-id-789';

  const mockClinicalHistory = {
    _id: 'history-id-123',
    clinicId: mockClinicId,
    patientId: mockPatientId,
    doctorId: mockDoctorId,
    date: new Date(),
    reasonForVisit: 'Dolor de cabeza persistente',
    diagnosis: 'Migraña tensional',
    treatment: 'Paracetamol 500mg cada 8 horas',
    allergies: [{ allergen: 'Penicilina', severity: 'severe' }],
    chronicConditions: [{ condition: 'Hipertensión', status: 'controlled' }],
    vaccinations: [{ vaccine: 'COVID-19', doseNumber: 2 }],
    isDeleted: false,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  const mockCreateDto = {
    patientId: mockPatientId,
    doctorId: mockDoctorId,
    reasonForVisit: 'Dolor de cabeza persistente',
    diagnosis: 'Migraña tensional',
    treatment: 'Paracetamol 500mg cada 8 horas',
  };

  beforeEach(async () => {
    clinicalHistoryModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalHistoryService,
        {
          provide: getModelToken(ClinicalHistory.name),
          useValue: clinicalHistoryModel,
        },
      ],
    }).compile();

    service = module.get<ClinicalHistoryService>(ClinicalHistoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a clinical history', async () => {
      const result = await service.create(mockClinicId, mockCreateDto);

      expect(result).toBeDefined();
      expect(result.clinicId).toBe(mockClinicId);
      expect(result.reasonForVisit).toBe(mockCreateDto.reasonForVisit);
    });

    it('should set date to now if not provided', async () => {
      const result = await service.create(mockClinicId, mockCreateDto);

      expect(result.date).toBeDefined();
    });
  });

  describe('createFromConsultation', () => {
    it('should create clinical history from consultation data', async () => {
      const consultationData = {
        consultationId: 'consultation-id-123',
        patientId: mockPatientId,
        doctorId: mockDoctorId,
        chiefComplaint: 'Control mensual',
        diagnoses: [{ code: 'G43.9', description: 'Migraña' }],
        treatmentPlan: 'Continuar medicación',
      };

      const result = await service.createFromConsultation(mockClinicId, consultationData);

      expect(result).toBeDefined();
      expect(result.clinicId).toBe(mockClinicId);
      expect(result.consultationId).toBe(consultationData.consultationId);
    });
  });

  describe('findAll', () => {
    it('should return all clinical histories for clinic', async () => {
      configureMockFind(clinicalHistoryModel, [mockClinicalHistory]);

      const result = await service.findAll(mockClinicId);

      expect(result).toHaveLength(1);
    });

    it('should filter by patientId', async () => {
      configureMockFind(clinicalHistoryModel, [mockClinicalHistory]);

      await service.findAll(mockClinicId, { patientId: mockPatientId });

      expect(clinicalHistoryModel.find).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      configureMockFind(clinicalHistoryModel, [mockClinicalHistory]);

      await service.findAll(mockClinicId, {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      });

      expect(clinicalHistoryModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return clinical history by id', async () => {
      configureMockFindOne(clinicalHistoryModel, mockClinicalHistory);

      const result = await service.findOne('history-id-123', mockClinicId);

      expect(result).toEqual(mockClinicalHistory);
    });

    it('should throw NotFoundException when not found', async () => {
      configureMockFindOne(clinicalHistoryModel, null);

      await expect(
        service.findOne('non-existent', mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPatient', () => {
    it('should return clinical histories for patient', async () => {
      configureMockFind(clinicalHistoryModel, [mockClinicalHistory]);

      const result = await service.findByPatient(mockClinicId, mockPatientId);

      expect(result).toHaveLength(1);
    });

    it('should limit results when specified', async () => {
      configureMockFind(clinicalHistoryModel, [mockClinicalHistory]);

      await service.findByPatient(mockClinicId, mockPatientId, 5);

      expect(clinicalHistoryModel.find).toHaveBeenCalled();
    });
  });

  describe('getPatientMedicalSummary', () => {
    it('should return aggregated medical summary', async () => {
      configureMockFind(clinicalHistoryModel, [mockClinicalHistory]);

      const result = await service.getPatientMedicalSummary(mockClinicId, mockPatientId);

      expect(result.allergies).toBeDefined();
      expect(result.chronicConditions).toBeDefined();
      expect(result.vaccinations).toBeDefined();
      expect(result.lastVisit).toBeDefined();
    });

    it('should return empty arrays when no history exists', async () => {
      configureMockFind(clinicalHistoryModel, []);

      const result = await service.getPatientMedicalSummary(mockClinicId, mockPatientId);

      expect(result.allergies).toHaveLength(0);
      expect(result.chronicConditions).toHaveLength(0);
      expect(result.lastVisit).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should update clinical history', async () => {
      const updatedHistory = { ...mockClinicalHistory, diagnosis: 'Migraña crónica' };
      configureMockFindOneAndUpdate(clinicalHistoryModel, updatedHistory);

      const result = await service.update('history-id-123', mockClinicId, {
        diagnosis: 'Migraña crónica',
      });

      expect(result?.diagnosis).toBe('Migraña crónica');
    });

    it('should throw NotFoundException when not found', async () => {
      configureMockFindOneAndUpdate(clinicalHistoryModel, null);

      await expect(
        service.update('non-existent', mockClinicId, { diagnosis: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addAllergy', () => {
    it('should add allergy to clinical history', async () => {
      const historyWithSave = {
        ...mockClinicalHistory,
        allergies: [...mockClinicalHistory.allergies],
        save: jest.fn().mockResolvedValue(mockClinicalHistory),
      };
      configureMockFindOne(clinicalHistoryModel, historyWithSave);

      const allergy = { allergen: 'Aspirina', severity: 'mild' };
      await service.addAllergy('history-id-123', mockClinicId, allergy);

      expect(historyWithSave.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      configureMockFindOne(clinicalHistoryModel, null);

      await expect(
        service.addAllergy('non-existent', mockClinicId, { allergen: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addChronicCondition', () => {
    it('should add chronic condition to clinical history', async () => {
      const historyWithSave = {
        ...mockClinicalHistory,
        chronicConditions: [...mockClinicalHistory.chronicConditions],
        save: jest.fn().mockResolvedValue(mockClinicalHistory),
      };
      configureMockFindOne(clinicalHistoryModel, historyWithSave);

      const condition = { condition: 'Diabetes', status: 'active' };
      await service.addChronicCondition('history-id-123', mockClinicId, condition);

      expect(historyWithSave.save).toHaveBeenCalled();
    });
  });

  describe('addVaccination', () => {
    it('should add vaccination to clinical history', async () => {
      const historyWithSave = {
        ...mockClinicalHistory,
        vaccinations: [...mockClinicalHistory.vaccinations],
        save: jest.fn().mockResolvedValue(mockClinicalHistory),
      };
      configureMockFindOne(clinicalHistoryModel, historyWithSave);

      const vaccination = { vaccine: 'Influenza', doseNumber: 1 };
      await service.addVaccination('history-id-123', mockClinicId, vaccination);

      expect(historyWithSave.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete clinical history', async () => {
      const deletedHistory = { ...mockClinicalHistory, isDeleted: true };
      configureMockFindOneAndUpdate(clinicalHistoryModel, deletedHistory);

      const result = await service.remove('history-id-123', mockClinicId);

      expect(result?.isDeleted).toBe(true);
    });

    it('should throw NotFoundException when not found', async () => {
      configureMockFindOneAndUpdate(clinicalHistoryModel, null);

      await expect(
        service.remove('non-existent', mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore clinical history', async () => {
      const restoredHistory = { ...mockClinicalHistory, isDeleted: false };
      configureMockFindOneAndUpdate(clinicalHistoryModel, restoredHistory);

      const result = await service.restore('history-id-123', mockClinicId);

      expect(result?.isDeleted).toBe(false);
    });
  });
});
