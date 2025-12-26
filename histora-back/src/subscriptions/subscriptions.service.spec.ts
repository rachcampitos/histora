import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription, SubscriptionStatus } from './schema/subscription.schema';
import { Plan, PlanName, BillingCycle } from './schema/plan.schema';
import { Doctor } from '../doctors/schema/doctor.schema';
import { Patient } from '../patients/schemas/patients.schema';
import {
  createMockModel,
  configureMockFind,
  configureMockFindOne,
  MockModel,
} from '../../test/mocks/mongoose-model.mock';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subscriptionModel: MockModel;
  let planModel: MockModel;
  let doctorModel: MockModel;
  let patientModel: MockModel;

  const mockPlan = {
    _id: 'plan-id-123',
    name: PlanName.PROFESSIONAL,
    displayName: 'Plan Profesional',
    priceMonthly: 5900,
    maxDoctors: 3,
    maxPatients: 500,
    isActive: true,
  };

  const mockSubscription = {
    _id: 'sub-id-123',
    clinicId: 'clinic-id-123',
    plan: PlanName.PROFESSIONAL,
    billingCycle: BillingCycle.MONTHLY,
    status: SubscriptionStatus.TRIAL,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  };

  beforeEach(async () => {
    subscriptionModel = createMockModel();
    planModel = createMockModel();
    doctorModel = createMockModel();
    patientModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getModelToken(Subscription.name),
          useValue: subscriptionModel,
        },
        {
          provide: getModelToken(Plan.name),
          useValue: planModel,
        },
        {
          provide: getModelToken(Doctor.name),
          useValue: doctorModel,
        },
        {
          provide: getModelToken(Patient.name),
          useValue: patientModel,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTrialSubscription', () => {
    it('should create a trial subscription for a new clinic', async () => {
      configureMockFindOne(subscriptionModel, null);

      const result = await service.createTrialSubscription('clinic-id-123');

      expect(result).toBeDefined();
      expect(result.clinicId).toBe('clinic-id-123');
      expect(result.status).toBe(SubscriptionStatus.TRIAL);
    });

    it('should throw BadRequestException if clinic already has subscription', async () => {
      configureMockFindOne(subscriptionModel, mockSubscription);

      await expect(
        service.createTrialSubscription('clinic-id-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getActiveSubscription', () => {
    it('should return active subscription', async () => {
      subscriptionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubscription),
      });

      const result = await service.getActiveSubscription('clinic-id-123');

      expect(result).toEqual(mockSubscription);
    });

    it('should throw NotFoundException if no active subscription', async () => {
      subscriptionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.getActiveSubscription('clinic-id-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should cancel subscription', async () => {
      const cancelledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      };

      subscriptionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubscription),
      });
      subscriptionModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(cancelledSubscription),
      });

      const result = await service.cancel('clinic-id-123', 'Too expensive');

      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
    });
  });

  describe('isSubscriptionActive', () => {
    it('should return true for active subscription', async () => {
      subscriptionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubscription),
      });

      const result = await service.isSubscriptionActive('clinic-id-123');

      expect(result).toBe(true);
    });

    it('should return false when no active subscription', async () => {
      subscriptionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.isSubscriptionActive('clinic-id-123');

      expect(result).toBe(false);
    });
  });

  describe('getAllPlans', () => {
    it('should return all active plans sorted', async () => {
      const mockPlans = [mockPlan];
      planModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPlans),
        }),
      });

      const result = await service.getAllPlans();

      expect(result).toEqual(mockPlans);
      expect(planModel.find).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe('checkSubscriptionLimits', () => {
    it('should return correct limits when under plan limits', async () => {
      subscriptionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubscription),
      });
      configureMockFindOne(planModel, mockPlan);
      doctorModel.countDocuments = jest.fn().mockResolvedValue(1);
      patientModel.countDocuments = jest.fn().mockResolvedValue(50);

      const result = await service.checkSubscriptionLimits('clinic-id-123');

      expect(result.canAddDoctor).toBe(true);
      expect(result.canAddPatient).toBe(true);
      expect(result.currentDoctors).toBe(1);
      expect(result.currentPatients).toBe(50);
      expect(result.maxDoctors).toBe(3);
      expect(result.maxPatients).toBe(500);
    });

    it('should return canAddDoctor false when at limit', async () => {
      subscriptionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubscription),
      });
      configureMockFindOne(planModel, mockPlan);
      doctorModel.countDocuments = jest.fn().mockResolvedValue(3);
      patientModel.countDocuments = jest.fn().mockResolvedValue(10);

      const result = await service.checkSubscriptionLimits('clinic-id-123');

      expect(result.canAddDoctor).toBe(false);
      expect(result.canAddPatient).toBe(true);
    });

    it('should allow unlimited patients when maxPatients is -1', async () => {
      const unlimitedPlan = { ...mockPlan, maxPatients: -1 };
      subscriptionModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSubscription),
      });
      configureMockFindOne(planModel, unlimitedPlan);
      doctorModel.countDocuments = jest.fn().mockResolvedValue(1);
      patientModel.countDocuments = jest.fn().mockResolvedValue(10000);

      const result = await service.checkSubscriptionLimits('clinic-id-123');

      expect(result.canAddPatient).toBe(true);
    });
  });
});
