import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Review } from './schema/review.schema';
import { Doctor } from '../doctors/schema/doctor.schema';
import { Consultation } from '../consultations/schema/consultation.schema';
import {
  createMockModel,
  configureMockFind,
  configureMockFindOne,
  MockModel,
} from '../../test/mocks/mongoose-model.mock';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewModel: MockModel;
  let doctorModel: MockModel;
  let consultationModel: MockModel;

  const mockPatientId = 'patient-id-123';
  const mockDoctorId = 'doctor-id-456';
  const mockClinicId = 'clinic-id-789';

  const mockReview = {
    _id: 'review-id-123',
    patientId: mockPatientId,
    doctorId: mockDoctorId,
    clinicId: mockClinicId,
    rating: 5,
    title: 'Excelente atención',
    comment: 'Muy profesional y amable',
    isAnonymous: false,
    isVerified: true,
    isApproved: true,
    isDeleted: false,
    toObject: function () { return this; },
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  const mockCreateDto = {
    doctorId: mockDoctorId,
    clinicId: mockClinicId,
    rating: 5,
    title: 'Excelente atención',
    comment: 'Muy profesional y amable',
  };

  beforeEach(async () => {
    reviewModel = createMockModel();
    doctorModel = createMockModel();
    consultationModel = createMockModel();

    // Mock aggregate method
    reviewModel.aggregate = jest.fn().mockResolvedValue([]);
    reviewModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getModelToken(Review.name), useValue: reviewModel },
        { provide: getModelToken(Doctor.name), useValue: doctorModel },
        { provide: getModelToken(Consultation.name), useValue: consultationModel },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a review', async () => {
      configureMockFindOne(reviewModel, null); // No existing review
      configureMockFindOne(consultationModel, { status: 'completed' }); // Has consultation
      doctorModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const result = await service.create(mockPatientId, mockCreateDto);

      expect(result).toBeDefined();
      expect(result.rating).toBe(mockCreateDto.rating);
    });

    it('should throw ConflictException if already reviewed', async () => {
      configureMockFindOne(reviewModel, mockReview);

      await expect(service.create(mockPatientId, mockCreateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findByDoctor', () => {
    it('should return reviews for doctor', async () => {
      configureMockFind(reviewModel, [mockReview]);
      reviewModel.countDocuments = jest.fn().mockResolvedValue(1);
      reviewModel.aggregate = jest.fn().mockResolvedValue([{ avgRating: 5 }]);

      const result = await service.findByDoctor(mockDoctorId);

      expect(result.reviews).toBeDefined();
      expect(result.total).toBe(1);
    });

    it('should hide patient info for anonymous reviews', async () => {
      const anonymousReview = { ...mockReview, isAnonymous: true };
      configureMockFind(reviewModel, [anonymousReview]);
      reviewModel.countDocuments = jest.fn().mockResolvedValue(1);
      reviewModel.aggregate = jest.fn().mockResolvedValue([{ avgRating: 5 }]);

      const result = await service.findByDoctor(mockDoctorId);

      expect(result.reviews[0].patientId.firstName).toBe('Paciente');
      expect(result.reviews[0].patientId.lastName).toBe('Anónimo');
    });
  });

  describe('findOne', () => {
    it('should return a review by id', async () => {
      configureMockFindOne(reviewModel, mockReview);

      const result = await service.findOne('review-id-123');

      expect(result).toEqual(mockReview);
    });

    it('should throw NotFoundException when review not found', async () => {
      configureMockFindOne(reviewModel, null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByPatient', () => {
    it('should return reviews by patient', async () => {
      configureMockFind(reviewModel, [mockReview]);

      const result = await service.findByPatient(mockPatientId);

      expect(result).toHaveLength(1);
    });
  });

  describe('respondToReview', () => {
    it('should add response to review', async () => {
      const reviewWithoutResponse = { ...mockReview, response: undefined };
      configureMockFindOne(reviewModel, reviewWithoutResponse);

      await service.respondToReview('review-id-123', mockDoctorId, {
        content: 'Gracias por su reseña',
      });

      expect(reviewWithoutResponse.save).toHaveBeenCalled();
    });

    it('should throw error if review already has response', async () => {
      const reviewWithResponse = {
        ...mockReview,
        response: { content: 'Existing response', respondedAt: new Date() },
      };
      configureMockFindOne(reviewModel, reviewWithResponse);

      await expect(
        service.respondToReview('review-id-123', mockDoctorId, {
          content: 'New response',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('flagReview', () => {
    it('should flag a review', async () => {
      configureMockFindOne(reviewModel, mockReview);

      await service.flagReview('review-id-123', { reason: 'Inappropriate content' });

      expect(mockReview.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete review', async () => {
      configureMockFindOne(reviewModel, mockReview);
      doctorModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      await service.remove('review-id-123', mockPatientId);

      expect(mockReview.save).toHaveBeenCalled();
    });

    it('should throw error if not owner', async () => {
      configureMockFindOne(reviewModel, null);

      await expect(
        service.remove('review-id-123', 'different-patient'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDoctorRatingStats', () => {
    it('should return rating statistics', async () => {
      reviewModel.aggregate = jest
        .fn()
        .mockResolvedValueOnce([{ avgRating: 4.5, total: 10 }])
        .mockResolvedValueOnce([
          { _id: 5, count: 5 },
          { _id: 4, count: 3 },
          { _id: 3, count: 2 },
        ]);

      const result = await service.getDoctorRatingStats(mockDoctorId);

      expect(result.averageRating).toBe(4.5);
      expect(result.totalReviews).toBe(10);
      expect(result.ratingDistribution).toHaveLength(5);
    });
  });
});
