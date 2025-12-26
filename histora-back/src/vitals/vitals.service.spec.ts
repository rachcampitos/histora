import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { Vitals } from './schema/vitals.schema';
import {
  createMockModel,
  configureMockFind,
  configureMockFindOne,
  configureMockFindOneAndUpdate,
  MockModel,
} from '../../test/mocks/mongoose-model.mock';

describe('VitalsService', () => {
  let service: VitalsService;
  let vitalsModel: MockModel;

  const mockClinicId = 'clinic-id-123';
  const mockPatientId = 'patient-id-456';

  const mockVitals = {
    _id: 'vitals-id-123',
    clinicId: mockClinicId,
    patientId: mockPatientId,
    recordedAt: new Date(),
    temperature: 36.5,
    heartRate: 72,
    respiratoryRate: 16,
    systolicBP: 120,
    diastolicBP: 80,
    oxygenSaturation: 98,
    weight: 70,
    height: 175,
    bmi: 22.9,
    isDeleted: false,
  };

  const mockCreateDto = {
    patientId: mockPatientId,
    temperature: 36.5,
    heartRate: 72,
    systolicBP: 120,
    diastolicBP: 80,
    weight: 70,
    height: 175,
  };

  beforeEach(async () => {
    vitalsModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VitalsService,
        {
          provide: getModelToken(Vitals.name),
          useValue: vitalsModel,
        },
      ],
    }).compile();

    service = module.get<VitalsService>(VitalsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create vitals record', async () => {
      const result = await service.create(mockClinicId, mockCreateDto, 'user-123');

      expect(result).toBeDefined();
      expect(result.clinicId).toBe(mockClinicId);
      expect(result.temperature).toBe(mockCreateDto.temperature);
    });
  });

  describe('findAll', () => {
    it('should return all vitals for clinic', async () => {
      configureMockFind(vitalsModel, [mockVitals]);

      const result = await service.findAll(mockClinicId);

      expect(result).toHaveLength(1);
    });

    it('should filter by patientId', async () => {
      configureMockFind(vitalsModel, [mockVitals]);

      await service.findAll(mockClinicId, { patientId: mockPatientId });

      expect(vitalsModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return vitals by id', async () => {
      configureMockFindOne(vitalsModel, mockVitals);

      const result = await service.findOne('vitals-id-123', mockClinicId);

      expect(result).toEqual(mockVitals);
    });

    it('should throw NotFoundException when not found', async () => {
      configureMockFindOne(vitalsModel, null);

      await expect(
        service.findOne('non-existent', mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPatient', () => {
    it('should return vitals history for patient', async () => {
      configureMockFind(vitalsModel, [mockVitals]);

      const result = await service.findByPatient(mockClinicId, mockPatientId);

      expect(result).toHaveLength(1);
    });

    it('should limit results when specified', async () => {
      configureMockFind(vitalsModel, [mockVitals]);

      await service.findByPatient(mockClinicId, mockPatientId, 5);

      expect(vitalsModel.find).toHaveBeenCalled();
    });
  });

  describe('getLatestByPatient', () => {
    it('should return latest vitals for patient', async () => {
      configureMockFindOne(vitalsModel, mockVitals);

      const result = await service.getLatestByPatient(mockClinicId, mockPatientId);

      expect(result).toEqual(mockVitals);
    });

    it('should return null if no vitals exist', async () => {
      configureMockFindOne(vitalsModel, null);

      const result = await service.getLatestByPatient(mockClinicId, mockPatientId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update vitals record', async () => {
      const updatedVitals = { ...mockVitals, temperature: 37.0 };
      configureMockFindOneAndUpdate(vitalsModel, updatedVitals);

      const result = await service.update('vitals-id-123', mockClinicId, {
        temperature: 37.0,
      });

      expect(result?.temperature).toBe(37.0);
    });

    it('should throw NotFoundException when not found', async () => {
      configureMockFindOneAndUpdate(vitalsModel, null);

      await expect(
        service.update('non-existent', mockClinicId, { temperature: 37.0 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete vitals record', async () => {
      const deletedVitals = { ...mockVitals, isDeleted: true };
      configureMockFindOneAndUpdate(vitalsModel, deletedVitals);

      const result = await service.remove('vitals-id-123', mockClinicId);

      expect(result?.isDeleted).toBe(true);
    });
  });

  describe('getPatientVitalsHistory', () => {
    it('should return weight history', async () => {
      configureMockFind(vitalsModel, [mockVitals]);

      const result = await service.getPatientVitalsHistory(
        mockClinicId,
        mockPatientId,
        'weight',
      );

      expect(result).toBeDefined();
      expect(result[0].value).toBe(70);
      expect(result[0].bmi).toBe(22.9);
    });

    it('should return blood pressure history', async () => {
      configureMockFind(vitalsModel, [mockVitals]);

      const result = await service.getPatientVitalsHistory(
        mockClinicId,
        mockPatientId,
        'bloodPressure',
      );

      expect(result[0].systolic).toBe(120);
      expect(result[0].diastolic).toBe(80);
    });
  });
});
