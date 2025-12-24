import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Patient } from './schemas/patients.schema';
import {
  createMockModel,
  configureMockFind,
  configureMockFindById,
  configureMockFindByIdAndUpdate,
  configureMockFindByIdAndDelete,
  MockModel,
} from '../../test/mocks/mongoose-model.mock';

describe('PatientsService', () => {
  let service: PatientsService;
  let patientModel: MockModel;

  const mockPatient = {
    _id: 'patient-id-123',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@email.com',
    phone: '+51987654321',
    birthDate: '1990-05-15',
    address: 'Av. Principal 123, Lima',
  };

  const mockCreateDto = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@email.com',
    phone: '+51987654321',
    birthDate: '1990-05-15',
    address: 'Av. Principal 123, Lima',
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
    it('should create and return a new patient', async () => {
      const result = await service.create(mockCreateDto);

      expect(result).toBeDefined();
      expect(result.firstName).toBe(mockCreateDto.firstName);
      expect(result.lastName).toBe(mockCreateDto.lastName);
      expect(result.email).toBe(mockCreateDto.email);
    });
  });

  describe('findAll', () => {
    it('should return an array of patients', async () => {
      const mockPatients = [mockPatient, { ...mockPatient, _id: 'patient-id-456' }];
      configureMockFind(patientModel, mockPatients);

      const result = await service.findAll();

      expect(patientModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockPatients);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no patients exist', async () => {
      configureMockFind(patientModel, []);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a patient by id', async () => {
      configureMockFindById(patientModel, mockPatient);

      const result = await service.findOne('patient-id-123');

      expect(patientModel.findById).toHaveBeenCalledWith('patient-id-123');
      expect(result).toEqual(mockPatient);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      configureMockFindById(patientModel, null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Patient with ID non-existent-id not found',
      );
    });
  });

  describe('update', () => {
    it('should update and return the modified patient', async () => {
      const updateDto = { firstName: 'Carlos', lastName: 'González' };
      const updatedPatient = { ...mockPatient, ...updateDto };
      configureMockFindByIdAndUpdate(patientModel, updatedPatient);

      const result = await service.update('patient-id-123', updateDto);

      expect(patientModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'patient-id-123',
        updateDto,
        { new: true },
      );
      expect(result).toEqual(updatedPatient);
      expect(result?.firstName).toBe('Carlos');
    });

    it('should return null when patient to update does not exist', async () => {
      configureMockFindByIdAndUpdate(patientModel, null);

      const result = await service.update('non-existent-id', { firstName: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete and return the removed patient', async () => {
      configureMockFindByIdAndDelete(patientModel, mockPatient);

      const result = await service.remove('patient-id-123');

      expect(patientModel.findByIdAndDelete).toHaveBeenCalledWith('patient-id-123');
      expect(result).toEqual(mockPatient);
    });

    it('should return null when patient to delete does not exist', async () => {
      configureMockFindByIdAndDelete(patientModel, null);

      const result = await service.remove('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
