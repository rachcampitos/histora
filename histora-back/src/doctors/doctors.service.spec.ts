import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { Doctor } from './schema/doctor.schema';
import {
  createMockModel,
  configureMockFind,
  configureMockFindOne,
  configureMockFindOneAndUpdate,
  configureMockCountDocuments,
  MockModel,
} from '../../test/mocks/mongoose-model.mock';

describe('DoctorsService', () => {
  let service: DoctorsService;
  let doctorModel: MockModel;

  const mockClinicId = 'clinic-id-123';
  const mockUserId = 'user-id-456';

  const mockDoctor = {
    _id: 'doctor-id-123',
    clinicId: mockClinicId,
    userId: mockUserId,
    firstName: 'María',
    lastName: 'García',
    email: 'maria.garcia@email.com',
    phone: '+51987654321',
    specialty: 'Medicina General',
    subspecialties: [],
    licenseNumber: 'CMP-12345',
    isPublicProfile: false,
    averageRating: 0,
    totalReviews: 0,
    isDeleted: false,
  };

  const mockCreateDto = {
    firstName: 'María',
    lastName: 'García',
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
    it('should create and return a new doctor with clinicId and userId', async () => {
      const result = await service.create(mockClinicId, mockUserId, mockCreateDto);

      expect(result).toBeDefined();
      expect(result.firstName).toBe(mockCreateDto.firstName);
      expect(result.lastName).toBe(mockCreateDto.lastName);
      expect(result.specialty).toBe(mockCreateDto.specialty);
      expect(result.clinicId).toBe(mockClinicId);
      expect(result.userId).toBe(mockUserId);
    });
  });

  describe('findAll', () => {
    it('should return an array of doctors for the clinic', async () => {
      const mockDoctors = [mockDoctor, { ...mockDoctor, _id: 'doctor-id-456' }];
      configureMockFind(doctorModel, mockDoctors);

      const result = await service.findAll(mockClinicId);

      expect(doctorModel.find).toHaveBeenCalledWith({
        clinicId: mockClinicId,
        isDeleted: false,
      });
      expect(result).toEqual(mockDoctors);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no doctors exist', async () => {
      configureMockFind(doctorModel, []);

      const result = await service.findAll(mockClinicId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a doctor by id and clinicId', async () => {
      configureMockFindOne(doctorModel, mockDoctor);

      const result = await service.findOne('doctor-id-123', mockClinicId);

      expect(doctorModel.findOne).toHaveBeenCalledWith({
        _id: 'doctor-id-123',
        clinicId: mockClinicId,
        isDeleted: false,
      });
      expect(result).toEqual(mockDoctor);
    });

    it('should throw NotFoundException when doctor does not exist', async () => {
      configureMockFindOne(doctorModel, null);

      await expect(service.findOne('non-existent-id', mockClinicId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id', mockClinicId)).rejects.toThrow(
        'Doctor with ID non-existent-id not found',
      );
    });

    it('should not find doctor from different clinic', async () => {
      configureMockFindOne(doctorModel, null);

      await expect(service.findOne('doctor-id-123', 'different-clinic')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUserId', () => {
    it('should return a doctor by userId', async () => {
      configureMockFindOne(doctorModel, mockDoctor);

      const result = await service.findByUserId(mockUserId);

      expect(doctorModel.findOne).toHaveBeenCalledWith({
        userId: mockUserId,
        isDeleted: false,
      });
      expect(result).toEqual(mockDoctor);
    });

    it('should return null when doctor with userId does not exist', async () => {
      configureMockFindOne(doctorModel, null);

      const result = await service.findByUserId('non-existent-user');

      expect(result).toBeNull();
    });
  });

  describe('findPublicDoctors', () => {
    it('should return public doctors', async () => {
      const publicDoctor = { ...mockDoctor, isPublicProfile: true };
      configureMockFind(doctorModel, [publicDoctor]);

      const result = await service.findPublicDoctors();

      expect(doctorModel.find).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should filter by specialty', async () => {
      configureMockFind(doctorModel, []);

      await service.findPublicDoctors({ specialty: 'Cardiología' });

      expect(doctorModel.find).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update and return the modified doctor', async () => {
      const updateDto = { firstName: 'Carlos', specialty: 'Cardiología' };
      const updatedDoctor = { ...mockDoctor, ...updateDto };
      configureMockFindOneAndUpdate(doctorModel, updatedDoctor);

      const result = await service.update('doctor-id-123', mockClinicId, updateDto);

      expect(doctorModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'doctor-id-123', clinicId: mockClinicId, isDeleted: false },
        updateDto,
        { new: true },
      );
      expect(result).toEqual(updatedDoctor);
      expect(result?.firstName).toBe('Carlos');
    });

    it('should throw NotFoundException when doctor to update does not exist', async () => {
      configureMockFindOneAndUpdate(doctorModel, null);

      await expect(
        service.update('non-existent-id', mockClinicId, { firstName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete and return the doctor', async () => {
      const deletedDoctor = { ...mockDoctor, isDeleted: true };
      configureMockFindOneAndUpdate(doctorModel, deletedDoctor);

      const result = await service.remove('doctor-id-123', mockClinicId);

      expect(doctorModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'doctor-id-123', clinicId: mockClinicId },
        { isDeleted: true },
        { new: true },
      );
      expect(result?.isDeleted).toBe(true);
    });

    it('should throw NotFoundException when doctor to delete does not exist', async () => {
      configureMockFindOneAndUpdate(doctorModel, null);

      await expect(service.remove('non-existent-id', mockClinicId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted doctor', async () => {
      const restoredDoctor = { ...mockDoctor, isDeleted: false };
      configureMockFindOneAndUpdate(doctorModel, restoredDoctor);

      const result = await service.restore('doctor-id-123', mockClinicId);

      expect(doctorModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'doctor-id-123', clinicId: mockClinicId },
        { isDeleted: false },
        { new: true },
      );
      expect(result?.isDeleted).toBe(false);
    });
  });

  describe('countByClinic', () => {
    it('should return count of active doctors in clinic', async () => {
      configureMockCountDocuments(doctorModel, 5);

      const result = await service.countByClinic(mockClinicId);

      expect(doctorModel.countDocuments).toHaveBeenCalledWith({
        clinicId: mockClinicId,
        isDeleted: false,
      });
      expect(result).toBe(5);
    });
  });
});
