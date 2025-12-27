import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PaymentsService } from './payments.service';
import { Payment, PaymentMethod, PaymentStatus, PaymentType, Currency } from './schema/payment.schema';
import { CulqiProvider } from './providers/culqi.provider';
import { Types } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockClinicId = new Types.ObjectId().toString();
  const mockUserId = new Types.ObjectId().toString();

  const createMockPayment = (overrides = {}) => ({
    _id: new Types.ObjectId(),
    clinicId: new Types.ObjectId(mockClinicId),
    userId: new Types.ObjectId(mockUserId),
    type: PaymentType.CONSULTATION,
    method: PaymentMethod.YAPE,
    status: PaymentStatus.PENDING,
    currency: Currency.PEN,
    amount: 5000, // S/ 50.00
    reference: 'PAY-ABC123-XYZ',
    isDeleted: false,
    save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }),
    ...overrides,
  });

  let mockPayment: ReturnType<typeof createMockPayment>;

  const mockPaymentModel = {
    create: jest.fn().mockResolvedValue(mockPayment),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockPayment]),
          }),
        }),
      }),
    }),
    findOne: jest.fn().mockResolvedValue(mockPayment),
    countDocuments: jest.fn().mockResolvedValue(1),
    aggregate: jest.fn().mockResolvedValue([{ total: 50000, count: 10 }]),
  };

  const mockCulqiProvider = {
    createCharge: jest.fn().mockResolvedValue({ success: true, chargeId: 'chr_123' }),
    createYapeCharge: jest.fn().mockResolvedValue({
      success: true,
      chargeId: 'yape_123',
      data: { qrCode: 'https://example.com/qr.png' }
    }),
    verifyYapePayment: jest.fn().mockResolvedValue({ success: true }),
    refund: jest.fn().mockResolvedValue({ success: true, reference: 'ref_123' }),
    getPublicKey: jest.fn().mockReturnValue('pk_test_123'),
  };

  beforeEach(async () => {
    mockPayment = createMockPayment();
    mockPaymentModel.create.mockResolvedValue(mockPayment);
    mockPaymentModel.findOne.mockResolvedValue(mockPayment);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getModelToken(Payment.name),
          useValue: mockPaymentModel,
        },
        {
          provide: CulqiProvider,
          useValue: mockCulqiProvider,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPayment', () => {
    it('should create a payment', async () => {
      const dto = {
        type: PaymentType.CONSULTATION,
        method: PaymentMethod.CASH,
        amount: 5000,
        description: 'Consulta médica',
      };

      const result = await service.createPayment(dto, mockClinicId, mockUserId);

      expect(result).toBeDefined();
      expect(mockPaymentModel.create).toHaveBeenCalled();
    });

    it('should create Yape payment with QR code', async () => {
      const dto = {
        type: PaymentType.CONSULTATION,
        method: PaymentMethod.YAPE,
        amount: 5000,
        customerPhone: '+51999999999',
        customerEmail: 'test@example.com',
      };

      await service.createPayment(dto, mockClinicId, mockUserId);

      expect(mockCulqiProvider.createYapeCharge).toHaveBeenCalled();
    });
  });

  describe('processYapePayment', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should process Yape payment with operation number', async () => {
      const yapePayment = createMockPayment({ method: PaymentMethod.YAPE });
      mockPaymentModel.findOne.mockResolvedValue(yapePayment);

      const dto = {
        paymentId: yapePayment._id.toString(),
        operationNumber: '123456789',
        yapeNumber: '+51999999999',
      };

      const result = await service.processYapePayment(dto, mockClinicId);

      expect(result).toBeDefined();
      expect(yapePayment.save).toHaveBeenCalled();
    });

    it('should throw error for non-Yape payment', async () => {
      const cardPayment = createMockPayment({ method: PaymentMethod.CARD });
      mockPaymentModel.findOne.mockResolvedValue(cardPayment);

      const dto = {
        paymentId: cardPayment._id.toString(),
        operationNumber: '123456789',
      };

      await expect(service.processYapePayment(dto, mockClinicId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('processCardPayment', () => {
    it('should process card payment with Culqi token', async () => {
      const cardPayment = createMockPayment({ method: PaymentMethod.CARD });
      mockPaymentModel.findOne.mockResolvedValue(cardPayment);

      const dto = {
        paymentId: cardPayment._id.toString(),
        cardToken: 'tok_123',
        email: 'test@example.com',
      };

      await service.processCardPayment(dto, mockClinicId);

      expect(mockCulqiProvider.createCharge).toHaveBeenCalled();
    });
  });

  describe('confirmPlinPayment', () => {
    it('should confirm Plin payment', async () => {
      const plinPayment = createMockPayment({ method: PaymentMethod.PLIN });
      mockPaymentModel.findOne.mockResolvedValue(plinPayment);

      const dto = {
        paymentId: plinPayment._id.toString(),
        operationNumber: '123456789',
        bank: 'BCP',
      };

      const result = await service.confirmPlinPayment(dto, mockClinicId);

      expect(result).toBeDefined();
    });
  });

  describe('completePayment', () => {
    it('should complete a pending payment', async () => {
      const pendingPayment = createMockPayment({ status: PaymentStatus.PENDING });
      mockPaymentModel.findOne.mockResolvedValue(pendingPayment);

      const result = await service.completePayment(pendingPayment._id.toString(), mockClinicId);

      expect(result).toBeDefined();
      expect(pendingPayment.save).toHaveBeenCalled();
    });

    it('should return payment if already completed', async () => {
      const completedPayment = createMockPayment({ status: PaymentStatus.COMPLETED });
      mockPaymentModel.findOne.mockResolvedValue(completedPayment);

      const result = await service.completePayment(completedPayment._id.toString(), mockClinicId);

      expect(result.status).toBe(PaymentStatus.COMPLETED);
    });
  });

  describe('cancelPayment', () => {
    it('should cancel a pending payment', async () => {
      const pendingPayment = createMockPayment({ status: PaymentStatus.PENDING });
      mockPaymentModel.findOne.mockResolvedValue(pendingPayment);

      const result = await service.cancelPayment(pendingPayment._id.toString(), mockClinicId);

      expect(result).toBeDefined();
      expect(pendingPayment.save).toHaveBeenCalled();
    });

    it('should throw error for non-pending payment', async () => {
      const completedPayment = createMockPayment({ status: PaymentStatus.COMPLETED });
      mockPaymentModel.findOne.mockResolvedValue(completedPayment);

      await expect(service.cancelPayment(completedPayment._id.toString(), mockClinicId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('refundPayment', () => {
    it('should refund a completed payment', async () => {
      const completedCardPayment = createMockPayment({
        status: PaymentStatus.COMPLETED,
        method: PaymentMethod.CARD,
        externalId: 'chr_123',
      });
      mockPaymentModel.findOne.mockResolvedValue(completedCardPayment);

      const dto = {
        paymentId: completedCardPayment._id.toString(),
        reason: 'Customer request',
      };

      await service.refundPayment(dto, mockClinicId);

      expect(mockCulqiProvider.refund).toHaveBeenCalled();
    });

    it('should throw error for non-completed payment', async () => {
      const pendingPayment = createMockPayment({ status: PaymentStatus.PENDING });
      mockPaymentModel.findOne.mockResolvedValue(pendingPayment);

      const dto = {
        paymentId: pendingPayment._id.toString(),
        reason: 'Customer request',
      };

      await expect(service.refundPayment(dto, mockClinicId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('findPayment', () => {
    it('should find payment by ID', async () => {
      const payment = createMockPayment();
      mockPaymentModel.findOne.mockResolvedValue(payment);

      const result = await service.findPayment(payment._id.toString(), mockClinicId);

      expect(result).toBeDefined();
      expect(mockPaymentModel.findOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPaymentModel.findOne.mockResolvedValue(null);
      const paymentId = new Types.ObjectId().toString();

      await expect(service.findPayment(paymentId, mockClinicId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getPayments', () => {
    it('should return paginated payments', async () => {
      const result = await service.getPayments(mockClinicId);

      expect(result.data).toBeDefined();
      expect(result.total).toBe(1);
    });

    it('should filter by status', async () => {
      await service.getPayments(mockClinicId, { status: PaymentStatus.COMPLETED });

      expect(mockPaymentModel.find).toHaveBeenCalled();
    });
  });

  describe('getPaymentsSummary', () => {
    it('should return payments summary', async () => {
      const result = await service.getPaymentsSummary(mockClinicId);

      expect(result.totalRevenue).toBeDefined();
      expect(result.totalTransactions).toBeDefined();
      expect(result.byMethod).toBeDefined();
      expect(result.byStatus).toBeDefined();
    });
  });

  describe('getYapeInfo', () => {
    it('should return Yape payment info', () => {
      const result = service.getYapeInfo();

      expect(result.yapeNumber).toBeDefined();
      expect(result.yapeName).toBeDefined();
      expect(result.instructions).toBeInstanceOf(Array);
    });
  });

  describe('getPlinInfo', () => {
    it('should return Plin payment info', () => {
      const result = service.getPlinInfo();

      expect(result.banks).toBeInstanceOf(Array);
      expect(result.instructions).toBeInstanceOf(Array);
    });
  });

  describe('getCulqiPublicKey', () => {
    it('should return Culqi public key', () => {
      const result = service.getCulqiPublicKey();

      expect(result).toBe('pk_test_123');
    });
  });
});
