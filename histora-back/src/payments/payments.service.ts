import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Payment,
  PaymentDocument,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  Currency,
} from './schema/payment.schema';
import {
  CreatePaymentDto,
  ProcessYapePaymentDto,
  ProcessCardPaymentDto,
  ConfirmPlinPaymentDto,
  RefundPaymentDto,
} from './dto/create-payment.dto';
import { CulqiProvider } from './providers/culqi.provider';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private culqiProvider: CulqiProvider,
  ) {}

  // Generate unique reference
  private generateReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-${timestamp}-${random}`;
  }

  // Create a new payment intent
  async createPayment(dto: CreatePaymentDto, clinicId: string, userId?: string): Promise<Payment> {
    const reference = this.generateReference();

    const payment = await this.paymentModel.create({
      clinicId: new Types.ObjectId(clinicId),
      userId: userId ? new Types.ObjectId(userId) : undefined,
      patientId: dto.patientId ? new Types.ObjectId(dto.patientId) : undefined,
      subscriptionId: dto.subscriptionId ? new Types.ObjectId(dto.subscriptionId) : undefined,
      consultationId: dto.consultationId ? new Types.ObjectId(dto.consultationId) : undefined,
      appointmentId: dto.appointmentId ? new Types.ObjectId(dto.appointmentId) : undefined,
      type: dto.type,
      method: dto.method,
      status: PaymentStatus.PENDING,
      currency: dto.currency || Currency.PEN,
      amount: dto.amount,
      description: dto.description,
      reference,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      customerName: dto.customerName,
      metadata: dto.metadata,
    });

    // For Yape, generate QR code
    if (dto.method === PaymentMethod.YAPE && dto.customerPhone) {
      const yapeResult = await this.culqiProvider.createYapeCharge({
        amount: dto.amount,
        currencyCode: dto.currency || 'PEN',
        email: dto.customerEmail || '',
        phoneNumber: dto.customerPhone,
      });

      if (yapeResult.success) {
        payment.externalId = yapeResult.chargeId;
        payment.qrCodeUrl = yapeResult.data?.qrCode;
        payment.providerData = yapeResult.data;
        await payment.save();
      }
    }

    return payment;
  }

  // Process Yape payment (manual confirmation with operation number)
  async processYapePayment(dto: ProcessYapePaymentDto, clinicId: string): Promise<Payment> {
    const payment = await this.findPayment(dto.paymentId, clinicId);

    if (payment.method !== PaymentMethod.YAPE) {
      throw new BadRequestException('This payment is not a Yape payment');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(`Payment is already ${payment.status}`);
    }

    // In production, verify with Culqi API
    // For now, mark as processing pending manual verification
    payment.status = PaymentStatus.PROCESSING;
    payment.operationNumber = dto.operationNumber;
    payment.yapeNumber = dto.yapeNumber;
    payment.providerData = {
      ...payment.providerData,
      yapeOperationNumber: dto.operationNumber,
      confirmedAt: new Date().toISOString(),
    };

    await payment.save();

    // In production, you would verify with Culqi here
    // For demo, auto-complete after a short delay
    setTimeout(async () => {
      await this.completePayment(dto.paymentId, clinicId);
    }, 2000);

    return payment;
  }

  // Process card payment with Culqi token
  async processCardPayment(dto: ProcessCardPaymentDto, clinicId: string): Promise<Payment> {
    const payment = await this.findPayment(dto.paymentId, clinicId);

    if (payment.method !== PaymentMethod.CARD) {
      throw new BadRequestException('This payment is not a card payment');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(`Payment is already ${payment.status}`);
    }

    payment.status = PaymentStatus.PROCESSING;
    await payment.save();

    const result = await this.culqiProvider.createCharge({
      amount: payment.amount,
      currencyCode: payment.currency,
      email: dto.email || payment.customerEmail || '',
      sourceId: dto.cardToken,
      description: payment.description,
      metadata: {
        paymentId: (payment._id as Types.ObjectId).toString(),
        reference: payment.reference,
      },
    });

    if (result.success) {
      payment.status = PaymentStatus.COMPLETED;
      payment.externalId = result.chargeId;
      payment.externalReference = result.reference;
      payment.paidAt = new Date();
      payment.netAmount = payment.amount - payment.fee - payment.tax;
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.errorMessage = result.error;
      payment.failedAt = new Date();
    }

    await payment.save();
    return payment;
  }

  // Confirm Plin payment (manual bank transfer confirmation)
  async confirmPlinPayment(dto: ConfirmPlinPaymentDto, clinicId: string): Promise<Payment> {
    const payment = await this.findPayment(dto.paymentId, clinicId);

    if (payment.method !== PaymentMethod.PLIN) {
      throw new BadRequestException('This payment is not a Plin payment');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(`Payment is already ${payment.status}`);
    }

    // Plin is bank transfer - requires manual confirmation
    payment.status = PaymentStatus.COMPLETED;
    payment.operationNumber = dto.operationNumber;
    payment.paidAt = new Date();
    payment.providerData = {
      bank: dto.bank,
      operationNumber: dto.operationNumber,
      confirmedAt: new Date().toISOString(),
    };
    payment.netAmount = payment.amount; // No fee for Plin

    await payment.save();
    return payment;
  }

  // Complete a payment manually (for cash, Yape verification, etc.)
  async completePayment(paymentId: string, clinicId: string): Promise<Payment> {
    const payment = await this.findPayment(paymentId, clinicId);

    if (payment.status === PaymentStatus.COMPLETED) {
      return payment;
    }

    if (payment.status === PaymentStatus.REFUNDED || payment.status === PaymentStatus.CANCELLED) {
      throw new BadRequestException(`Cannot complete a ${payment.status} payment`);
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.paidAt = new Date();
    payment.netAmount = payment.amount - payment.fee - payment.tax;

    await payment.save();
    return payment;
  }

  // Cancel a pending payment
  async cancelPayment(paymentId: string, clinicId: string): Promise<Payment> {
    const payment = await this.findPayment(paymentId, clinicId);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(`Cannot cancel a ${payment.status} payment`);
    }

    payment.status = PaymentStatus.CANCELLED;
    await payment.save();
    return payment;
  }

  // Refund a completed payment
  async refundPayment(dto: RefundPaymentDto, clinicId: string): Promise<Payment> {
    const payment = await this.findPayment(dto.paymentId, clinicId);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    // For card payments, process through Culqi
    if (payment.method === PaymentMethod.CARD && payment.externalId) {
      const result = await this.culqiProvider.refund(
        payment.externalId,
        dto.amount,
        dto.reason
      );

      if (!result.success) {
        throw new BadRequestException(`Refund failed: ${result.error}`);
      }

      payment.providerData = {
        ...payment.providerData,
        refundId: result.reference,
        refundReason: dto.reason,
      };
    }

    payment.status = PaymentStatus.REFUNDED;
    payment.refundedAt = new Date();
    payment.metadata = {
      ...payment.metadata,
      refundReason: dto.reason,
      refundAmount: dto.amount || payment.amount,
    };

    await payment.save();
    return payment;
  }

  // Find payment
  async findPayment(paymentId: string, clinicId?: string): Promise<PaymentDocument> {
    const query: any = {
      _id: new Types.ObjectId(paymentId),
      isDeleted: false,
    };

    if (clinicId) {
      query.clinicId = new Types.ObjectId(clinicId);
    }

    const payment = await this.paymentModel.findOne(query);

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  // Get payments for clinic
  async getPayments(
    clinicId: string,
    options: {
      status?: PaymentStatus;
      method?: PaymentMethod;
      type?: PaymentType;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ data: Payment[]; total: number }> {
    const { status, method, type, startDate, endDate, limit = 20, offset = 0 } = options;

    const query: any = {
      clinicId: new Types.ObjectId(clinicId),
      isDeleted: false,
    };

    if (status) query.status = status;
    if (method) query.method = method;
    if (type) query.type = type;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    const [data, total] = await Promise.all([
      this.paymentModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.paymentModel.countDocuments(query),
    ]);

    return { data, total };
  }

  // Get payment by reference
  async getPaymentByReference(reference: string): Promise<Payment | null> {
    return this.paymentModel.findOne({ reference, isDeleted: false });
  }

  // Get payments summary (for dashboard)
  async getPaymentsSummary(clinicId: string, startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    byMethod: Record<string, { count: number; amount: number }>;
    byStatus: Record<string, number>;
  }> {
    const match: any = {
      clinicId: new Types.ObjectId(clinicId),
      isDeleted: false,
    };

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const [revenueResult, methodResult, statusResult] = await Promise.all([
      this.paymentModel.aggregate([
        { $match: { ...match, status: PaymentStatus.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      this.paymentModel.aggregate([
        { $match: { ...match, status: PaymentStatus.COMPLETED } },
        { $group: { _id: '$method', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      ]),
      this.paymentModel.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const byMethod: Record<string, { count: number; amount: number }> = {};
    methodResult.forEach((m) => {
      byMethod[m._id] = { count: m.count, amount: m.amount };
    });

    const byStatus: Record<string, number> = {};
    statusResult.forEach((s) => {
      byStatus[s._id] = s.count;
    });

    return {
      totalRevenue: revenueResult[0]?.total || 0,
      totalTransactions: revenueResult[0]?.count || 0,
      byMethod,
      byStatus,
    };
  }

  // Get Yape QR for display
  getYapeInfo(): {
    yapeNumber: string;
    yapeName: string;
    instructions: string[];
  } {
    return {
      yapeNumber: '+51 999 999 999', // Configure in env
      yapeName: 'Histora SAC',
      instructions: [
        'Abre tu app de Yape',
        'Selecciona "Yapear"',
        'Ingresa el número o escanea el QR',
        'Ingresa el monto exacto',
        'Confirma el pago',
        'Ingresa el número de operación aquí',
      ],
    };
  }

  // Get Plin info for display
  getPlinInfo(): {
    banks: { name: string; accountNumber: string; cci: string }[];
    instructions: string[];
  } {
    return {
      banks: [
        {
          name: 'BCP',
          accountNumber: '191-12345678-0-12',
          cci: '00219100123456780123',
        },
        // Add more banks as needed
      ],
      instructions: [
        'Abre tu app bancaria',
        'Selecciona "Transferir" o "Plin"',
        'Ingresa el número de cuenta o CCI',
        'Ingresa el monto exacto',
        'Confirma la transferencia',
        'Ingresa el número de operación aquí',
      ],
    };
  }

  // Get Culqi public key for frontend
  getCulqiPublicKey(): string {
    return this.culqiProvider.getPublicKey();
  }
}
