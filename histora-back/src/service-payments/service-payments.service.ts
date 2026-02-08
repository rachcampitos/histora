import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  ServicePayment,
  ServicePaymentDocument,
  ServicePaymentMethod,
  ServicePaymentStatus,
} from './schema/service-payment.schema';
import {
  CreateServicePaymentDto,
  VerifyYapePaymentDto,
  PaymentSummaryResponse,
  PaymentResponse,
} from './dto/service-payment.dto';
import { CulqiProvider } from './providers/culqi.provider';
import { ServiceRequest, ServiceRequestDocument } from '../service-requests/schema/service-request.schema';

// Commission rates
// Modelo de suscripcion: enfermera recibe 100% del pago, paga suscripcion mensual
const COMMISSION_RATE = 0; // 0% platform commission - enfermera recibe 100%
const CULQI_RATE = 0.0399; // 3.99% + IGV for cards (solo aplica si paga con tarjeta)
const MIN_CULQI_FEE = 350; // S/. 3.50 minimum fee in cents

@Injectable()
export class ServicePaymentsService {
  private readonly logger = new Logger(ServicePaymentsService.name);

  constructor(
    @InjectModel(ServicePayment.name) private paymentModel: Model<ServicePaymentDocument>,
    @InjectModel(ServiceRequest.name) private serviceRequestModel: Model<ServiceRequestDocument>,
    private culqiProvider: CulqiProvider,
    private configService: ConfigService,
  ) {}

  // Generate unique reference
  private generateReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PAY-${timestamp}-${random}`;
  }

  // Calculate payment breakdown
  // Modelo de suscripcion: enfermera recibe 100% del pago del servicio
  private calculatePaymentBreakdown(servicePrice: number, method?: string): {
    amount: number;
    serviceFee: number;
    culqiFee: number;
    nurseEarnings: number;
  } {
    // Service price is already in cents
    const amount = servicePrice;

    // Sin comision de plataforma - modelo de suscripcion
    const serviceFee = 0;

    // Culqi fee solo aplica para pagos con tarjeta
    // En modelo de suscripcion, este fee es absorbido por la plataforma
    // o se agrega al monto del paciente (implementar en futuro)
    let culqiFee = 0;
    if (method === 'card') {
      culqiFee = Math.round(amount * CULQI_RATE * 1.18); // Include IGV
      culqiFee = Math.max(culqiFee, MIN_CULQI_FEE);
    }

    // Enfermera recibe 100% del monto del servicio
    const nurseEarnings = amount;

    return {
      amount,
      serviceFee,
      culqiFee,
      nurseEarnings,
    };
  }

  // Get payment summary for a service request
  async getPaymentSummary(serviceRequestId: string): Promise<PaymentSummaryResponse> {
    const serviceRequest = await this.serviceRequestModel.findById(serviceRequestId);
    if (!serviceRequest) {
      throw new NotFoundException('Service request not found');
    }

    // Convert price to cents (assume price is in soles)
    const subtotal = Math.round(serviceRequest.service.price * 100);
    const serviceFee = Math.round(subtotal * COMMISSION_RATE);
    const discount = 0; // TODO: Implement discount logic

    return {
      subtotal,
      serviceFee,
      discount,
      total: subtotal + serviceFee - discount,
      currency: 'PEN',
    };
  }

  // Create payment
  async createPayment(
    dto: CreateServicePaymentDto,
    patientId: string,
  ): Promise<PaymentResponse> {
    try {
      // Get service request
      const serviceRequest = await this.serviceRequestModel.findById(dto.serviceRequestId);
      if (!serviceRequest) {
        throw new NotFoundException('Service request not found');
      }

      // Check if payment already exists
      const existingPayment = await this.paymentModel.findOne({
        serviceRequestId: new Types.ObjectId(dto.serviceRequestId),
        status: { $in: [ServicePaymentStatus.COMPLETED, ServicePaymentStatus.PROCESSING] },
      });

      if (existingPayment) {
        return {
          success: false,
          error: {
            code: 'payment_exists',
            message: 'Payment already exists for this service request',
            userMessage: 'Ya existe un pago para esta solicitud',
          },
        };
      }

      // Calculate amounts
      const servicePrice = Math.round(serviceRequest.service.price * 100); // Convert to cents
      const breakdown = this.calculatePaymentBreakdown(servicePrice, dto.method);

      // Create payment record
      const payment = await this.paymentModel.create({
        serviceRequestId: new Types.ObjectId(dto.serviceRequestId),
        patientId: new Types.ObjectId(patientId),
        nurseId: serviceRequest.nurseId,
        ...breakdown,
        currency: 'PEN',
        status: ServicePaymentStatus.PENDING,
        method: dto.method,
        reference: this.generateReference(),
        description: `Pago por servicio: ${serviceRequest.service.name}`,
        customerEmail: dto.customerEmail,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        yapeNumber: dto.yapeNumber,
        plinNumber: dto.plinNumber,
      });

      // Process based on method
      if (dto.method === ServicePaymentMethod.CARD && dto.cardToken) {
        return this.processCardPayment(payment, dto.cardToken, dto.customerEmail);
      } else if (dto.method === ServicePaymentMethod.YAPE) {
        return this.processYapePayment(payment, dto.yapeNumber);
      } else if (dto.method === ServicePaymentMethod.PLIN) {
        return this.processPlinPayment(payment, dto.plinNumber);
      } else if (dto.method === ServicePaymentMethod.CASH) {
        return this.processCashPayment(payment);
      }

      return {
        success: true,
        payment: payment.toObject(),
      };
    } catch (error) {
      this.logger.error('Error creating payment', error);
      return {
        success: false,
        error: {
          code: 'processing_error',
          message: error.message,
          userMessage: 'Error al procesar el pago. Por favor intenta nuevamente.',
        },
      };
    }
  }

  // Process card payment with Culqi
  private async processCardPayment(
    payment: ServicePaymentDocument,
    cardToken: string,
    email: string,
  ): Promise<PaymentResponse> {
    payment.status = ServicePaymentStatus.PROCESSING;
    payment.culqiToken = cardToken;
    await payment.save();

    try {
      const result = await this.culqiProvider.createCharge({
        amount: payment.amount,
        currencyCode: payment.currency,
        email: email,
        sourceId: cardToken,
        description: payment.description,
        metadata: {
          paymentId: (payment._id as any).toString(),
          reference: payment.reference,
          serviceRequestId: payment.serviceRequestId.toString(),
        },
      });

      if (result.success) {
        payment.status = ServicePaymentStatus.COMPLETED;
        payment.culqiChargeId = result.chargeId;
        payment.paidAt = new Date();

        // Extract card info if available
        if (result.data?.source) {
          payment.cardBrand = result.data.source.iin?.card_brand;
          payment.cardLast4 = result.data.source.last_four;
        }

        await payment.save();

        // Update service request payment status
        await this.serviceRequestModel.findByIdAndUpdate(payment.serviceRequestId, {
          paymentStatus: 'paid',
          paymentMethod: 'card',
          paymentId: payment._id,
        });

        return {
          success: true,
          payment: payment.toObject(),
        };
      } else {
        payment.status = ServicePaymentStatus.FAILED;
        payment.errorCode = result.errorCode || 'card_declined';
        payment.errorMessage = result.error;
        payment.failedAt = new Date();
        await payment.save();

        return {
          success: false,
          error: {
            code: result.errorCode || 'card_declined',
            message: result.error || 'Card payment failed',
            userMessage: this.getSpanishErrorMessage(result.errorCode),
          },
        };
      }
    } catch (error) {
      payment.status = ServicePaymentStatus.FAILED;
      payment.errorMessage = error.message;
      payment.failedAt = new Date();
      await payment.save();

      return {
        success: false,
        error: {
          code: 'processing_error',
          message: error.message,
          userMessage: 'Error al procesar la tarjeta. Por favor intenta nuevamente.',
        },
      };
    }
  }

  // Process Yape payment
  private async processYapePayment(
    payment: ServicePaymentDocument,
    yapeNumber?: string,
  ): Promise<PaymentResponse> {
    // For Yape, payment starts as pending and will be completed
    // when the nurse confirms receipt or when verified via Culqi
    payment.status = ServicePaymentStatus.PENDING;
    payment.yapeNumber = yapeNumber;
    await payment.save();

    // Update service request
    await this.serviceRequestModel.findByIdAndUpdate(payment.serviceRequestId, {
      paymentStatus: 'pending',
      paymentMethod: 'yape',
      paymentId: payment._id,
    });

    return {
      success: true,
      payment: payment.toObject(),
    };
  }

  // Process Plin payment
  private async processPlinPayment(
    payment: ServicePaymentDocument,
    plinNumber?: string,
  ): Promise<PaymentResponse> {
    payment.status = ServicePaymentStatus.PENDING;
    payment.plinNumber = plinNumber;
    await payment.save();

    await this.serviceRequestModel.findByIdAndUpdate(payment.serviceRequestId, {
      paymentStatus: 'pending',
      paymentMethod: 'plin',
      paymentId: payment._id,
    });

    return {
      success: true,
      payment: payment.toObject(),
    };
  }

  // Process cash payment
  private async processCashPayment(payment: ServicePaymentDocument): Promise<PaymentResponse> {
    // Cash payment is marked as pending until nurse confirms
    payment.status = ServicePaymentStatus.PENDING;
    await payment.save();

    // Update service request
    await this.serviceRequestModel.findByIdAndUpdate(payment.serviceRequestId, {
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      paymentId: payment._id,
    });

    return {
      success: true,
      payment: payment.toObject(),
    };
  }

  // Verify Yape payment
  async verifyYapePayment(
    paymentId: string,
    dto: VerifyYapePaymentDto,
    userId: string,
  ): Promise<PaymentResponse> {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.method !== ServicePaymentMethod.YAPE) {
      throw new BadRequestException('This is not a Yape payment');
    }

    if (payment.status !== ServicePaymentStatus.PENDING) {
      throw new BadRequestException(`Payment is already ${payment.status}`);
    }

    // Store operation number
    payment.yapeOperationNumber = dto.operationNumber;
    payment.status = ServicePaymentStatus.COMPLETED;
    payment.paidAt = new Date();
    await payment.save();

    // Update service request
    await this.serviceRequestModel.findByIdAndUpdate(payment.serviceRequestId, {
      paymentStatus: 'paid',
    });

    return {
      success: true,
      payment: payment.toObject(),
    };
  }

  // Get payment by service request
  async getPaymentByServiceRequest(serviceRequestId: string): Promise<ServicePayment | null> {
    return this.paymentModel.findOne({
      serviceRequestId: new Types.ObjectId(serviceRequestId),
      isDeleted: false,
    });
  }

  // Get payment history for patient
  async getPatientPaymentHistory(patientId: string): Promise<ServicePayment[]> {
    return this.paymentModel
      .find({
        patientId: new Types.ObjectId(patientId),
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  // Get nurse earnings
  async getNurseEarnings(nurseId: string): Promise<{
    totalEarnings: number;
    pendingBalance: number;
    availableBalance: number;
    recentPayments: ServicePayment[];
  }> {
    const payments = await this.paymentModel
      .find({
        nurseId: new Types.ObjectId(nurseId),
        status: ServicePaymentStatus.COMPLETED,
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .limit(20);

    const totalEarnings = payments.reduce((sum, p) => sum + (p.nurseEarnings || 0), 0);
    const pendingBalance = payments
      .filter((p) => !p.releasedAt)
      .reduce((sum, p) => sum + (p.nurseEarnings || 0), 0);
    const availableBalance = totalEarnings - pendingBalance;

    return {
      totalEarnings,
      pendingBalance,
      availableBalance,
      recentPayments: payments,
    };
  }

  // Request refund
  async requestRefund(
    paymentId: string,
    reason: string,
    userId: string,
  ): Promise<PaymentResponse> {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== ServicePaymentStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    // For card payments, process refund through Culqi
    if (payment.method === ServicePaymentMethod.CARD && payment.culqiChargeId) {
      const result = await this.culqiProvider.refund(
        payment.culqiChargeId,
        payment.amount,
        reason,
      );

      if (!result.success) {
        return {
          success: false,
          error: {
            code: 'refund_failed',
            message: result.error || 'Refund failed',
            userMessage: 'No se pudo procesar el reembolso. Contacta soporte.',
          },
        };
      }
    }

    payment.status = ServicePaymentStatus.REFUNDED;
    payment.refundedAt = new Date();
    payment.metadata = {
      ...payment.metadata,
      refundReason: reason,
      refundedBy: userId,
    };
    await payment.save();

    // Update service request
    await this.serviceRequestModel.findByIdAndUpdate(payment.serviceRequestId, {
      paymentStatus: 'refunded',
    });

    return {
      success: true,
      payment: payment.toObject(),
    };
  }

  // Get Spanish error message
  private getSpanishErrorMessage(errorCode?: string): string {
    const messages: Record<string, string> = {
      card_declined: 'Tu banco rechazó el pago. Verifica con tu banco o intenta con otra tarjeta.',
      insufficient_funds: 'Tu tarjeta no tiene fondos suficientes.',
      invalid_card: 'Los datos de la tarjeta son incorrectos. Verifica e intenta nuevamente.',
      expired_card: 'Tu tarjeta está vencida. Usa otra tarjeta.',
      invalid_cvv: 'El código CVV es incorrecto. Verifica los 3 dígitos al reverso de tu tarjeta.',
      processing_error: 'Error al procesar el pago. Por favor intenta nuevamente.',
      network_error: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
    };

    return messages[errorCode || ''] || 'Ocurrió un error inesperado. Por favor intenta nuevamente.';
  }
}
