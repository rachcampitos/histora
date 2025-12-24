import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { Doctor } from './schema/doctor.schema';
import {
  createMockModel,
  configureMockFind,
  configureMockFindById,
  configureMockFindByIdAndUpdate,
  configureMockFindByIdAndDelete,
  MockModel,
} from '../../test/mocks/mongoose-model.mock';

describe('DoctorsService', () => {
  let service: DoctorsService;
  let doctorModel: MockModel;

  const mockDoctor = {
    _id: 'doctor-id-123',
    name: 'Dra. María García',
    email: 'maria.garcia@email.com',
    phone: '+51987654321',
    specialty: 'Medicina General',
    licenseNumber: 'CMP-12345',
  };

  const mockCreateDto = {
    name: 'Dra. María García',
    email: 'maria.garcia@email.com',
    phone: '+51987654321',
    specialty: 'Medicina General',
    licenseNumber: 'CMP-12345',
  };

  beforeEach(async () => {
    doctorModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        {
          provide: getModelToken(Doctor.name),
          useValue: doctorModel,
        },
      ],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new doctor', async () => {
      const result = await service.create(mockCreateDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(mockCreateDto.name);
      expect(result.email).toBe(mockCreateDto.email);
      expect(result.specialty).toBe(mockCreateDto.specialty);
    });
  });

  describe('findAll', () => {
    it('should return an array of doctors', async () => {
      const mockDoctors = [mockDoctor, { ...mockDoctor, _id: 'doctor-id-456' }];
      configureMockFind(doctorModel, mockDoctors);

      const result = await service.findAll();

      expect(doctorModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockDoctors);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no doctors exist', async () => {
      configureMockFind(doctorModel, []);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a doctor by id', async () => {
      configureMockFindById(doctorModel, mockDoctor);

      const result = await service.findOne('doctor-id-123');

      expect(doctorModel.findById).toHaveBeenCalledWith('doctor-id-123');
      expect(result).toEqual(mockDoctor);
    });

    it('should throw NotFoundException when doctor does not exist', async () => {
      configureMockFindById(doctorModel, null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Doctor with ID non-existent-id not found',
      );
    });
  });

  describe('update', () => {
    it('should update and return the modified doctor', async () => {
      const updateDto = { name: 'Dr. Carlos López', specialty: 'Cardiología' };
      const updatedDoctor = { ...mockDoctor, ...updateDto };
      configureMockFindByIdAndUpdate(doctorModel, updatedDoctor);

      const result = await service.update('doctor-id-123', updateDto);

      expect(doctorModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'doctor-id-123',
        updateDto,
        { new: true },
      );
      expect(result).toEqual(updatedDoctor);
      expect(result?.name).toBe('Dr. Carlos López');
      expect(result?.specialty).toBe('Cardiología');
    });

    it('should return null when doctor to update does not exist', async () => {
      configureMockFindByIdAndUpdate(doctorModel, null);

      const result = await service.update('non-existent-id', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete and return the removed doctor', async () => {
      configureMockFindByIdAndDelete(doctorModel, mockDoctor);

      const result = await service.remove('doctor-id-123');

      expect(doctorModel.findByIdAndDelete).toHaveBeenCalledWith('doctor-id-123');
      expect(result).toEqual(mockDoctor);
    });

    it('should return null when doctor to delete does not exist', async () => {
      configureMockFindByIdAndDelete(doctorModel, null);

      const result = await service.remove('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
