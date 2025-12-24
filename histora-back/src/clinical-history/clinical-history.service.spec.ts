import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { ClinicalHistoryService } from './clinical-history.service';
import { ClinicalHistory } from './schema/clinical-history.schema';
import { Patient } from '../patients/schemas/patients.schema';
import { Doctor } from '../doctors/schema/doctor.schema';
import {
  createMockModel,
  configureMockFindById,
  configureMockFind,
  configureMockFindByIdAndUpdate,
  MockModel,
} from '../../test/mocks/mongoose-model.mock';

describe('ClinicalHistoryService', () => {
  let service: ClinicalHistoryService;
  let clinicalHistoryModel: MockModel;
  let patientModel: MockModel;
  let doctorModel: MockModel;

  const mockPatient = {
    _id: 'patient-id-123',
    firstName: 'Juan',
    lastName: 'Pérez',
  };

  const mockDoctor = {
    _id: 'doctor-id-456',
    name: 'Dra. María García',
  };

  const mockClinicalHistory = {
    _id: 'history-id-789',
    patientId: 'patient-id-123',
    doctorId: 'doctor-id-456',
    date: '2025-01-15',
    reasonForVisit: 'Dolor de cabeza persistente',
    diagnosis: 'Migraña tensional',
    treatment: 'Paracetamol 500mg cada 8 horas',
    isDeleted: false,
  };

  const mockCreateDto = {
    patientId: 'patient-id-123',
    doctorId: 'doctor-id-456',
    date: '2025-01-15',
    reasonForVisit: 'Dolor de cabeza persistente',
    diagnosis: 'Migraña tensional',
    treatment: 'Paracetamol 500mg cada 8 horas',
  };

  beforeEach(async () => {
    clinicalHistoryModel = createMockModel();
    patientModel = createMockModel();
    doctorModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalHistoryService,
        {
          provide: getModelToken(ClinicalHistory.name),
          useValue: clinicalHistoryModel,
        },
        {
          provide: getModelToken(Patient.name),
          useValue: patientModel,
        },
        {
          provide: getModelToken(Doctor.name),
          useValue: doctorModel,
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
    it('should create a clinical history when patient and doctor exist', async () => {
      configureMockFindById(patientModel, mockPatient);
      configureMockFindById(doctorModel, mockDoctor);

      const result = await service.create(mockCreateDto);

      expect(patientModel.findById).toHaveBeenCalledWith(mockCreateDto.patientId);
      expect(doctorModel.findById).toHaveBeenCalledWith(mockCreateDto.doctorId);
      expect(result).toBeDefined();
      expect(result.patientId).toBe(mockCreateDto.patientId);
      expect(result.doctorId).toBe(mockCreateDto.doctorId);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      configureMockFindById(patientModel, null);
      configureMockFindById(doctorModel, mockDoctor);

      await expect(service.create(mockCreateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when doctor does not exist', async () => {
      configureMockFindById(patientModel, mockPatient);
      configureMockFindById(doctorModel, null);

      await expect(service.create(mockCreateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when both patient and doctor do not exist', async () => {
      configureMockFindById(patientModel, null);
      configureMockFindById(doctorModel, null);

      await expect(service.create(mockCreateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return an array of clinical histories excluding deleted ones', async () => {
      const mockHistories = [mockClinicalHistory];
      configureMockFind(clinicalHistoryModel, mockHistories);

      const result = await service.findAll();

      expect(clinicalHistoryModel.find).toHaveBeenCalledWith({ isDeleted: false });
      expect(result).toEqual(mockHistories);
    });

    it('should return empty array when no clinical histories exist', async () => {
      configureMockFind(clinicalHistoryModel, []);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a clinical history with populated patient and doctor', async () => {
      const populatedHistory = {
        ...mockClinicalHistory,
        patientId: mockPatient,
        doctorId: mockDoctor,
      };

      clinicalHistoryModel.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(populatedHistory),
          }),
        }),
      });

      const result = await service.findOne('history-id-789');

      expect(clinicalHistoryModel.findOne).toHaveBeenCalledWith({
        _id: 'history-id-789',
        isDeleted: false,
      });
      expect(result).toEqual(populatedHistory);
    });

    it('should throw error when clinical history is not found', async () => {
      clinicalHistoryModel.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Clinical history with ID non-existent-id not found',
      );
    });
  });

  describe('update', () => {
    it('should update and return the modified clinical history', async () => {
      const updateDto = { diagnosis: 'Migraña crónica' };
      const updatedHistory = { ...mockClinicalHistory, ...updateDto };
      configureMockFindByIdAndUpdate(clinicalHistoryModel, updatedHistory);

      const result = await service.update('history-id-789', updateDto);

      expect(clinicalHistoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'history-id-789',
        updateDto,
        { new: true },
      );
      expect(result).toEqual(updatedHistory);
    });

    it('should return null when clinical history to update is not found', async () => {
      configureMockFindByIdAndUpdate(clinicalHistoryModel, null);

      const result = await service.update('non-existent-id', { diagnosis: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('remove (soft delete)', () => {
    it('should soft delete by setting isDeleted to true', async () => {
      const deletedHistory = { ...mockClinicalHistory, isDeleted: true };
      configureMockFindByIdAndUpdate(clinicalHistoryModel, deletedHistory);

      const result = await service.remove('history-id-789');

      expect(clinicalHistoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'history-id-789',
        { isDeleted: true },
        { new: true },
      );
      expect(result?.isDeleted).toBe(true);
    });

    it('should return null when clinical history to delete is not found', async () => {
      configureMockFindByIdAndUpdate(clinicalHistoryModel, null);

      const result = await service.remove('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('restore', () => {
    it('should restore by setting isDeleted to false', async () => {
      const restoredHistory = { ...mockClinicalHistory, isDeleted: false };
      configureMockFindByIdAndUpdate(clinicalHistoryModel, restoredHistory);

      const result = await service.restore('history-id-789');

      expect(clinicalHistoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'history-id-789',
        { isDeleted: false },
        { new: true },
      );
      expect(result?.isDeleted).toBe(false);
    });

    it('should return null when clinical history to restore is not found', async () => {
      configureMockFindByIdAndUpdate(clinicalHistoryModel, null);

      const result = await service.restore('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
