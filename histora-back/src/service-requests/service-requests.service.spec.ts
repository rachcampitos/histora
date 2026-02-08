import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequest } from './schema/service-request.schema';
import { Nurse } from '../nurses/schema/nurse.schema';
import { User } from '../users/schema/user.schema';
import { NursesService } from '../nurses/nurses.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { Types } from 'mongoose';

describe('ServiceRequestsService', () => {
  let service: ServiceRequestsService;

  const mockPatientId = new Types.ObjectId().toString();
  const mockNurseId = new Types.ObjectId().toString();
  const mockRequestId = new Types.ObjectId().toString();
  const mockServiceId = new Types.ObjectId().toString();

  const mockNurse = {
    _id: new Types.ObjectId(mockNurseId),
    userId: new Types.ObjectId(),
    cepNumber: '108887',
    services: [
      {
        _id: new Types.ObjectId(mockServiceId),
        name: 'Injection',
        category: 'injection',
        price: 50,
        currency: 'PEN',
        durationMinutes: 30,
        isActive: true,
      },
    ],
    isActive: true,
  };

  const mockServiceRequest = {
    _id: new Types.ObjectId(mockRequestId),
    patientId: new Types.ObjectId(mockPatientId),
    nurseId: new Types.ObjectId(mockNurseId),
    service: {
      name: 'Injection',
      category: 'injection',
      price: 50,
      currency: 'PEN',
      durationMinutes: 30,
    },
    location: {
      type: 'Point',
      coordinates: [-77.0428, -12.0464],
      address: '123 Main St',
      district: 'Miraflores',
      city: 'Lima',
    },
    requestedDate: new Date(),
    requestedTimeSlot: 'morning',
    status: 'pending',
    statusHistory: [
      { status: 'pending', changedAt: new Date(), changedBy: mockPatientId },
    ],
    save: jest.fn().mockResolvedValue(this),
  };

  const mockServiceRequestModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    new: jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ ...mockServiceRequest, ...dto }),
    })),
  };

  const mockNurseModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockUserModel = {
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: mockPatientId, firstName: 'Juan', lastName: 'Perez' }),
    }),
  };

  const mockNursesService = {
    updateStats: jest.fn().mockResolvedValue(undefined),
  };

  const mockNotificationsService = {
    sendServiceRequestNotification: jest.fn().mockResolvedValue(undefined),
    notifyNurseNewRequest: jest.fn().mockResolvedValue(undefined),
    notifyPatientServiceAccepted: jest.fn().mockResolvedValue(undefined),
    notifyPatientServiceRejected: jest.fn().mockResolvedValue(undefined),
    notifyPatientNurseOnTheWay: jest.fn().mockResolvedValue(undefined),
    notifyPatientNurseArrived: jest.fn().mockResolvedValue(undefined),
    notifyPatientServiceCompleted: jest.fn().mockResolvedValue(undefined),
    notifyNurseNewReview: jest.fn().mockResolvedValue(undefined),
  };

  const mockTrackingGateway = {
    notifyNurseNewRequest: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const MockServiceRequestModelFactory = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({ ...mockServiceRequest, ...dto }),
    }));
    Object.assign(MockServiceRequestModelFactory, mockServiceRequestModel);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceRequestsService,
        {
          provide: getModelToken(ServiceRequest.name),
          useValue: MockServiceRequestModelFactory,
        },
        {
          provide: getModelToken(Nurse.name),
          useValue: mockNurseModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: NursesService,
          useValue: mockNursesService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: TrackingGateway,
          useValue: mockTrackingGateway,
        },
      ],
    }).compile();

    service = module.get<ServiceRequestsService>(ServiceRequestsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      nurseId: mockNurseId,
      serviceId: mockServiceId,
      location: {
        coordinates: [-77.0428, -12.0464],
        address: '123 Main St',
        district: 'Miraflores',
        city: 'Lima',
      },
      requestedDate: new Date().toISOString(),
      requestedTimeSlot: 'morning' as const,
      patientNotes: 'Please call before arriving',
    };

    it('should create a service request', async () => {
      mockNurseModel.findById.mockResolvedValue(mockNurse);

      const result = await service.create(mockPatientId, createDto);

      expect(result).toBeDefined();
      expect(result.status).toBe('pending');
    });

    it('should throw NotFoundException if nurse not found', async () => {
      mockNurseModel.findById.mockResolvedValue(null);

      await expect(service.create(mockPatientId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if service not found', async () => {
      mockNurseModel.findById.mockResolvedValue({
        ...mockNurse,
        services: [],
      });

      await expect(service.create(mockPatientId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if service is not active', async () => {
      mockNurseModel.findById.mockResolvedValue({
        ...mockNurse,
        services: [
          { ...mockNurse.services[0], isActive: false },
        ],
      });

      await expect(service.create(mockPatientId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findById', () => {
    it('should return a service request by id', async () => {
      mockServiceRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue({
                ...mockServiceRequest,
                patientId: {
                  _id: mockPatientId,
                  firstName: 'Juan',
                  lastName: 'Perez',
                },
                nurseId: {
                  _id: mockNurseId,
                  userId: {
                    firstName: 'Maria',
                    lastName: 'Chavez',
                  },
                },
              }),
            }),
          }),
        }),
      });

      const result = await service.findById(mockRequestId);

      expect(result).toBeDefined();
      expect(mockServiceRequestModel.findById).toHaveBeenCalledWith(mockRequestId);
    });

    it('should throw NotFoundException if request not found', async () => {
      mockServiceRequestModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(null),
            }),
          }),
        }),
      });

      await expect(service.findById(mockRequestId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByPatient', () => {
    it('should return all requests for a patient', async () => {
      mockServiceRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockServiceRequest]),
            }),
          }),
        }),
      });

      const result = await service.findByPatient(mockPatientId);

      expect(result).toHaveLength(1);
    });
  });

  describe('findByNurse', () => {
    it('should return all requests for a nurse', async () => {
      mockServiceRequestModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockServiceRequest]),
            }),
          }),
        }),
      });

      const result = await service.findByNurse(mockNurseId);

      expect(result).toHaveLength(1);
    });
  });

  describe('updateStatus', () => {
    const mockAcceptedRequest = {
      ...mockServiceRequest,
      patientId: new Types.ObjectId(mockPatientId),
      nurseId: new Types.ObjectId(mockNurseId),
      status: 'accepted',
      statusHistory: [],
      save: jest.fn().mockResolvedValue({
        ...mockServiceRequest,
        status: 'on_the_way',
      }),
    };

    it('should update status from accepted to on_the_way', async () => {
      mockServiceRequestModel.findById.mockResolvedValue(mockAcceptedRequest);
      mockNurseModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockNurse,
          userId: { firstName: 'Maria', lastName: 'Chavez' },
        }),
      });

      const result = await service.updateStatus(
        mockRequestId,
        mockNurseId,
        'on_the_way',
      );

      expect(mockAcceptedRequest.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if request not found', async () => {
      mockServiceRequestModel.findById.mockResolvedValue(null);

      await expect(
        service.updateStatus(mockRequestId, mockNurseId, 'on_the_way'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const pendingRequest = {
        ...mockServiceRequest,
        status: 'pending',
        statusHistory: [],
      };
      mockServiceRequestModel.findById.mockResolvedValue(pendingRequest);

      await expect(
        service.updateStatus(mockRequestId, mockNurseId, 'completed'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rate', () => {
    const rateDto = {
      rating: 5,
      review: 'Excellent service!',
    };

    it('should rate a completed service request', async () => {
      const completedRequest = {
        ...mockServiceRequest,
        status: 'completed',
        patientId: { toString: () => mockPatientId },
        nurseId: new Types.ObjectId(mockNurseId),
        rating: undefined,
        save: jest.fn().mockResolvedValue({
          ...mockServiceRequest,
          rating: 5,
          review: 'Excellent service!',
        }),
      };

      mockServiceRequestModel.findById.mockResolvedValue(completedRequest);
      mockNurseModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockNurse,
          userId: { _id: new Types.ObjectId() },
        }),
      });

      const result = await service.rate(
        mockRequestId,
        mockPatientId,
        rateDto.rating,
        rateDto.review,
      );

      expect(completedRequest.save).toHaveBeenCalled();
      expect(mockNotificationsService.notifyNurseNewReview).toHaveBeenCalled();
    });

    it('should throw BadRequestException if request is not completed', async () => {
      const pendingRequest = {
        ...mockServiceRequest,
        status: 'pending',
        patientId: { toString: () => mockPatientId },
      };

      mockServiceRequestModel.findById.mockResolvedValue(pendingRequest);

      await expect(
        service.rate(mockRequestId, mockPatientId, rateDto.rating, rateDto.review),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not the patient', async () => {
      const completedRequest = {
        ...mockServiceRequest,
        status: 'completed',
        patientId: { toString: () => 'different-user-id' },
      };

      mockServiceRequestModel.findById.mockResolvedValue(completedRequest);

      await expect(
        service.rate(mockRequestId, mockPatientId, rateDto.rating, rateDto.review),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
