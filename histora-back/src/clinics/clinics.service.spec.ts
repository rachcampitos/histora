import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { Clinic } from './schema/clinic.schema';
import {
  createMockModel,
  configureMockFind,
  configureMockFindById,
  MockModel,
} from '../../test/mocks/mongoose-model.mock';

describe('ClinicsService', () => {
  let service: ClinicsService;
  let clinicModel: MockModel;

  const mockClinic = {
    _id: 'clinic-id-123',
    name: 'Test Clinic',
    slug: 'test-clinic-abc123',
    ownerId: { toString: () => 'owner-id-123' },
    address: {
      street: 'Main St 123',
      city: 'Lima',
      country: 'Peru',
    },
    phone: '+51987654321',
    email: 'clinic@test.com',
    specialties: ['General Medicine', 'Cardiology'],
    isActive: true,
    isDeleted: false,
  };

  const mockCreateDto = {
    name: 'Test Clinic',
    address: {
      street: 'Main St 123',
      city: 'Lima',
      country: 'Peru',
    },
    phone: '+51987654321',
    email: 'clinic@test.com',
    specialties: ['General Medicine', 'Cardiology'],
  };

  beforeEach(async () => {
    clinicModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicsService,
        {
          provide: getModelToken(Clinic.name),
          useValue: clinicModel,
        },
      ],
    }).compile();

    service = module.get<ClinicsService>(ClinicsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new clinic with generated slug', async () => {
      const result = await service.create(mockCreateDto, 'owner-id-123');

      expect(result).toBeDefined();
      expect(result.name).toBe(mockCreateDto.name);
    });
  });

  describe('findAll', () => {
    it('should return array of clinics', async () => {
      const mockClinics = [mockClinic];
      configureMockFind(clinicModel, mockClinics);

      const result = await service.findAll();

      expect(clinicModel.find).toHaveBeenCalledWith({ isDeleted: false });
      expect(result).toEqual(mockClinics);
    });

    it('should return empty array when no clinics exist', async () => {
      configureMockFind(clinicModel, []);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a clinic by id', async () => {
      clinicModel.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockClinic),
        }),
      });

      const result = await service.findOne('clinic-id-123');

      expect(result).toEqual(mockClinic);
    });

    it('should throw NotFoundException when clinic not found', async () => {
      clinicModel.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the modified clinic', async () => {
      const updateDto = { name: 'Updated Clinic Name' };
      const updatedClinic = { ...mockClinic, ...updateDto };

      configureMockFindById(clinicModel, mockClinic);
      clinicModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedClinic),
      });

      const result = await service.update('clinic-id-123', updateDto, 'owner-id-123');

      expect(result).toEqual(updatedClinic);
    });

    it('should throw NotFoundException when clinic not found', async () => {
      configureMockFindById(clinicModel, null);

      await expect(
        service.update('non-existent-id', { name: 'Test' }, 'owner-id-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      configureMockFindById(clinicModel, mockClinic);

      await expect(
        service.update('clinic-id-123', { name: 'Test' }, 'other-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove (soft delete)', () => {
    it('should soft delete clinic', async () => {
      const deletedClinic = { ...mockClinic, isDeleted: true };

      configureMockFindById(clinicModel, mockClinic);
      clinicModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(deletedClinic),
      });

      const result = await service.remove('clinic-id-123', 'owner-id-123');

      expect(result?.isDeleted).toBe(true);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      configureMockFindById(clinicModel, mockClinic);

      await expect(
        service.remove('clinic-id-123', 'other-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
