import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Patient } from './schemas/patients.schema';
import {
  createMockModel,
  configureMockFind,
  configureMockFindOne,
  configureMockFindOneAndUpdate,
  configureMockCountDocuments,
  MockModel,
} from '../../test/mocks/mongoose-model.mock';

describe('PatientsService', () => {
  let service: PatientsService;
  let patientModel: MockModel;

  const mockClinicId = 'clinic-id-123';

  const mockPatient = {
    _id: 'patient-id-123',
    clinicId: mockClinicId,
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@email.com',
    phone: '+51987654321',
    birthDate: new Date('1990-05-15'),
    gender: 'male',
    isDeleted: false,
  };

  const mockCreateDto = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@email.com',
    phone: '+51987654321',
    birthDate: '1990-05-15',
    gender: 'male',
  };

  beforeEach(async () => {
    patientModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: getModelToken(Patient.name),
          useValue: patientModel,
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new patient with clinicId', async () => {
      const result = await service.create(mockClinicId, mockCreateDto);

      expect(result).toBeDefined();
      expect(result.firstName).toBe(mockCreateDto.firstName);
      expect(result.lastName).toBe(mockCreateDto.lastName);
      expect(result.clinicId).toBe(mockClinicId);
    });
  });

  describe('findAll', () => {
    it('should return an array of patients for the clinic', async () => {
      const mockPatients = [mockPatient, { ...mockPatient, _id: 'patient-id-456' }];
      configureMockFind(patientModel, mockPatients);

      const result = await service.findAll(mockClinicId);

      expect(patientModel.find).toHaveBeenCalledWith({
        clinicId: mockClinicId,
        isDeleted: false,
      });
      expect(result).toEqual(mockPatients);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no patients exist', async () => {
      configureMockFind(patientModel, []);

      const result = await service.findAll(mockClinicId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a patient by id and clinicId', async () => {
      configureMockFindOne(patientModel, mockPatient);

      const result = await service.findOne('patient-id-123', mockClinicId);

      expect(patientModel.findOne).toHaveBeenCalledWith({
        _id: 'patient-id-123',
        clinicId: mockClinicId,
        isDeleted: false,
      });
      expect(result).toEqual(mockPatient);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      configureMockFindOne(patientModel, null);

      await expect(service.findOne('non-existent-id', mockClinicId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id', mockClinicId)).rejects.toThrow(
        'Patient with ID non-existent-id not found',
      );
    });

    it('should not find patient from different clinic', async () => {
      configureMockFindOne(patientModel, null);

      await expect(service.findOne('patient-id-123', 'different-clinic')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('search', () => {
    it('should search patients by query in clinic', async () => {
      const mockPatients = [mockPatient];
      configureMockFind(patientModel, mockPatients);

      const result = await service.search(mockClinicId, 'Juan');

      expect(patientModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockPatients);
    });

    it('should return empty array when no matches found', async () => {
      configureMockFind(patientModel, []);

      const result = await service.search(mockClinicId, 'NoExiste');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update and return the modified patient', async () => {
      const updateDto = { firstName: 'Carlos', lastName: 'González' };
      const updatedPatient = { ...mockPatient, ...updateDto };
      configureMockFindOneAndUpdate(patientModel, updatedPatient);

      const result = await service.update('patient-id-123', mockClinicId, updateDto);

      expect(patientModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'patient-id-123', clinicId: mockClinicId, isDeleted: false },
        updateDto,
        { new: true },
      );
      expect(result).toEqual(updatedPatient);
      expect(result?.firstName).toBe('Carlos');
    });

    it('should throw NotFoundException when patient to update does not exist', async () => {
      configureMockFindOneAndUpdate(patientModel, null);

      await expect(
        service.update('non-existent-id', mockClinicId, { firstName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete and return the patient', async () => {
      const deletedPatient = { ...mockPatient, isDeleted: true };
      configureMockFindOneAndUpdate(patientModel, deletedPatient);

      const result = await service.remove('patient-id-123', mockClinicId);

      expect(patientModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'patient-id-123', clinicId: mockClinicId },
        { isDeleted: true },
        { new: true },
      );
      expect(result?.isDeleted).toBe(true);
    });

    it('should throw NotFoundException when patient to delete does not exist', async () => {
      configureMockFindOneAndUpdate(patientModel, null);

      await expect(service.remove('non-existent-id', mockClinicId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted patient', async () => {
      const restoredPatient = { ...mockPatient, isDeleted: false };
      configureMockFindOneAndUpdate(patientModel, restoredPatient);

      const result = await service.restore('patient-id-123', mockClinicId);

      expect(patientModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'patient-id-123', clinicId: mockClinicId },
        { isDeleted: false },
        { new: true },
      );
      expect(result?.isDeleted).toBe(false);
    });
  });

  describe('countByClinic', () => {
    it('should return count of active patients in clinic', async () => {
      configureMockCountDocuments(patientModel, 42);

      const result = await service.countByClinic(mockClinicId);

      expect(patientModel.countDocuments).toHaveBeenCalledWith({
        clinicId: mockClinicId,
        isDeleted: false,
      });
      expect(result).toBe(42);
    });

    it('should return 0 when no patients exist', async () => {
      configureMockCountDocuments(patientModel, 0);

      const result = await service.countByClinic(mockClinicId);

      expect(result).toBe(0);
    });
  });
});
