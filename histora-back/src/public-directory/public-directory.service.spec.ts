import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { PublicDirectoryService } from './public-directory.service';
import { Doctor } from '../doctors/schema/doctor.schema';
import { Clinic } from '../clinics/schema/clinic.schema';
import { Review } from '../reviews/schema/review.schema';
import { Appointment } from '../appointments/schema/appointment.schema';
import {
  createMockModel,
  configureMockFind,
  configureMockFindOne,
  MockModel,
} from '../../test/mocks/mongoose-model.mock';

describe('PublicDirectoryService', () => {
  let service: PublicDirectoryService;
  let doctorModel: MockModel;
  let clinicModel: MockModel;
  let reviewModel: MockModel;
  let appointmentModel: MockModel;

  const mockDoctorId = 'doctor-id-123';
  const mockClinicId = 'clinic-id-456';

  const mockDoctor = {
    _id: mockDoctorId,
    firstName: 'María',
    lastName: 'García',
    specialty: 'Medicina General',
    subspecialties: ['Geriatría'],
    bio: 'Médico con 10 años de experiencia',
    averageRating: 4.8,
    totalReviews: 50,
    clinicId: mockClinicId,
    isDeleted: false,
    isPublicProfile: true,
    toObject: function () { return this; },
  };

  const mockClinic = {
    _id: mockClinicId,
    name: 'Clínica Salud',
    slug: 'clinica-salud',
    address: { city: 'Ciudad de México', street: 'Calle 1' },
    phone: '555-1234',
    isDeleted: false,
    isActive: true,
    toObject: function () { return this; },
  };

  beforeEach(async () => {
    doctorModel = createMockModel();
    clinicModel = createMockModel();
    reviewModel = createMockModel();
    appointmentModel = createMockModel();

    // Mock additional methods
    doctorModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });
    doctorModel.distinct = jest.fn().mockResolvedValue([]);
    clinicModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });
    reviewModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });
    reviewModel.aggregate = jest.fn().mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicDirectoryService,
        { provide: getModelToken(Doctor.name), useValue: doctorModel },
        { provide: getModelToken(Clinic.name), useValue: clinicModel },
        { provide: getModelToken(Review.name), useValue: reviewModel },
        { provide: getModelToken(Appointment.name), useValue: appointmentModel },
      ],
    }).compile();

    service = module.get<PublicDirectoryService>(PublicDirectoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchDoctors', () => {
    it('should search doctors', async () => {
      configureMockFind(doctorModel, [mockDoctor]);
      doctorModel.countDocuments = jest.fn().mockResolvedValue(1);

      const result = await service.searchDoctors({
        limit: 20,
        offset: 0,
      });

      expect(result.doctors).toBeDefined();
      expect(result.total).toBeDefined();
    });

    it('should filter by specialty', async () => {
      configureMockFind(doctorModel, [mockDoctor]);
      doctorModel.countDocuments = jest.fn().mockResolvedValue(1);

      await service.searchDoctors({
        specialty: 'General',
        limit: 20,
        offset: 0,
      });

      expect(doctorModel.find).toHaveBeenCalled();
    });
  });

  describe('getDoctorProfile', () => {
    it('should return doctor profile with reviews', async () => {
      configureMockFindOne(doctorModel, mockDoctor);
      configureMockFind(reviewModel, []);
      reviewModel.aggregate = jest.fn().mockResolvedValue([]);

      const result = await service.getDoctorProfile(mockDoctorId);

      expect(result.firstName).toBe('María');
      expect(result.recentReviews).toBeDefined();
    });

    it('should throw NotFoundException when doctor not found', async () => {
      configureMockFindOne(doctorModel, null);

      await expect(service.getDoctorProfile('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDoctorReviews', () => {
    it('should return paginated reviews', async () => {
      const mockReview = {
        rating: 5,
        comment: 'Excelente',
        isAnonymous: false,
        toObject: function () { return this; },
      };
      configureMockFind(reviewModel, [mockReview]);
      reviewModel.countDocuments = jest.fn().mockResolvedValue(1);

      const result = await service.getDoctorReviews(mockDoctorId, {
        limit: 10,
        offset: 0,
      });

      expect(result.reviews).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getDoctorAvailability', () => {
    it('should return available slots', async () => {
      configureMockFindOne(doctorModel, mockDoctor);
      configureMockFind(appointmentModel, []);

      const result = await service.getDoctorAvailability(
        mockDoctorId,
        new Date('2025-12-30'),
      );

      expect(result.availableSlots).toBeDefined();
      expect(Array.isArray(result.availableSlots)).toBe(true);
    });

    it('should throw NotFoundException when doctor not found', async () => {
      configureMockFindOne(doctorModel, null);

      await expect(
        service.getDoctorAvailability('non-existent', new Date()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSpecialties', () => {
    it('should return list of specialties', async () => {
      doctorModel.distinct = jest
        .fn()
        .mockResolvedValueOnce(['Medicina General', 'Pediatría'])
        .mockResolvedValueOnce(['Geriatría']);

      const result = await service.getSpecialties();

      expect(result.specialties).toBeDefined();
      expect(Array.isArray(result.specialties)).toBe(true);
    });
  });

  describe('searchClinics', () => {
    it('should search clinics', async () => {
      configureMockFind(clinicModel, [mockClinic]);
      clinicModel.countDocuments = jest.fn().mockResolvedValue(1);

      const result = await service.searchClinics({
        limit: 20,
        offset: 0,
      });

      expect(result.clinics).toHaveLength(1);
    });

    it('should filter by city', async () => {
      configureMockFind(clinicModel, [mockClinic]);
      clinicModel.countDocuments = jest.fn().mockResolvedValue(1);

      await service.searchClinics({
        city: 'México',
        limit: 20,
        offset: 0,
      });

      expect(clinicModel.find).toHaveBeenCalled();
    });
  });

  describe('getClinicBySlug', () => {
    it('should return clinic by slug', async () => {
      configureMockFindOne(clinicModel, mockClinic);
      doctorModel.countDocuments = jest.fn().mockResolvedValue(5);

      const result = await service.getClinicBySlug('clinica-salud');

      expect(result.name).toBe('Clínica Salud');
      expect(result.doctorsCount).toBe(5);
    });

    it('should throw NotFoundException when clinic not found', async () => {
      configureMockFindOne(clinicModel, null);

      await expect(service.getClinicBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getClinicDoctors', () => {
    it('should return doctors for clinic', async () => {
      configureMockFind(doctorModel, [mockDoctor]);

      const result = await service.getClinicDoctors(mockClinicId);

      expect(result.doctors).toHaveLength(1);
    });
  });
});
