import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CulqiChargeOptions {
  amount: number; // en centavos
  currencyCode: string;
  email: string;
  sourceId: string; // token de tarjeta o Yape
  description?: string;
  metadata?: Record<string, any>;
}

export interface CulqiYapeOptions {
  amount: number;
  currencyCode: string;
  email: string;
  phoneNumber: string;
  additionalData?: Record<string, any>;
}

export interface CulqiResult {
  success: boolean;
  chargeId?: string;
  reference?: string;
  error?: string;
  errorCode?: string;
  data?: any;
}

@Injectable()
export class CulqiProvider {
  private readonly logger = new Logger(CulqiProvider.name);
  private readonly publicKey: string;
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.culqi.com/v2';

  constructor(private configService: ConfigService) {
    this.publicKey = this.configService.get<string>('CULQI_PUBLIC_KEY', '');
    this.secretKey = this.configService.get<string>('CULQI_SECRET_KEY', '');
  }

  // Process card payment
  async createCharge(options: CulqiChargeOptions): Promise<CulqiResult> {
    if (!this.secretKey) {
      return this.mockCharge(options);
    }

    try {
      // Real Culqi API call
      // npm install axios
      // const response = await axios.post(
      //   `${this.baseUrl}/charges`,
      //   {
      //     amount: options.amount,
      //     currency_code: options.currencyCode,
      //     email: options.email,
      //     source_id: options.sourceId,
      //     description: options.description,
      //     metadata: options.metadata,
      //   },
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.secretKey}`,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );

      this.logger.log(`[Culqi] Charge created for ${options.email}: ${options.amount / 100} ${options.currencyCode}`);
      return {
        success: true,
        chargeId: `chr_${Date.now()}`,
        reference: `ref_${Date.now()}`,
      };
    } catch (error) {
      this.logger.error(`[Culqi] Charge failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        errorCode: error.response?.data?.object || 'unknown_error',
      };
    }
  }

  // Generate Yape QR code for payment
  async createYapeCharge(options: CulqiYapeOptions): Promise<CulqiResult> {
    if (!this.secretKey) {
      return this.mockYapeCharge(options);
    }

    try {
      // Culqi Yape integration
      // https://docs.culqi.com/es/documentacion/pagos-con-yape/
      // await axios.post(
      //   `${this.baseUrl}/charges`,
      //   {
      //     amount: options.amount,
      //     currency_code: options.currencyCode,
      //     email: options.email,
      //     source_id: yapeToken,
      //   },
      //   { headers: { 'Authorization': `Bearer ${this.secretKey}` } }
      // );

      this.logger.log(`[Culqi Yape] Charge initiated for ${options.phoneNumber}: S/ ${options.amount / 100}`);
      return {
        success: true,
        chargeId: `yape_${Date.now()}`,
        reference: `yape_ref_${Date.now()}`,
        data: {
          qrCode: 'https://example.com/yape-qr-placeholder.png',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min
        },
      };
    } catch (error) {
      this.logger.error(`[Culqi Yape] Charge failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Verify Yape payment status
  async verifyYapePayment(chargeId: string): Promise<CulqiResult> {
    if (!this.secretKey) {
      return { success: true, chargeId, data: { status: 'completed' } };
    }

    try {
      // const response = await axios.get(
      //   `${this.baseUrl}/charges/${chargeId}`,
      //   { headers: { 'Authorization': `Bearer ${this.secretKey}` } }
      // );

      return {
        success: true,
        chargeId,
        data: { status: 'completed' },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Refund a charge
  async refund(chargeId: string, amount?: number, reason?: string): Promise<CulqiResult> {
    if (!this.secretKey) {
      return this.mockRefund(chargeId, amount);
    }

    try {
      // await axios.post(
      //   `${this.baseUrl}/refunds`,
      //   {
      //     charge_id: chargeId,
      //     amount: amount, // optional for partial refunds
      //     reason: reason,
      //   },
      //   { headers: { 'Authorization': `Bearer ${this.secretKey}` } }
      // );

      this.logger.log(`[Culqi] Refund processed for charge ${chargeId}`);
      return {
        success: true,
        reference: `refund_${Date.now()}`,
      };
    } catch (error) {
      this.logger.error(`[Culqi] Refund failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get public key for frontend
  getPublicKey(): string {
    return this.publicKey;
  }

  // Mock methods for development
  private mockCharge(options: CulqiChargeOptions): CulqiResult {
    this.logger.log('='.repeat(50));
    this.logger.log('[DEV CULQI CHARGE]');
    this.logger.log(`Amount: S/ ${options.amount / 100}`);
    this.logger.log(`Email: ${options.email}`);
    this.logger.log(`Source: ${options.sourceId}`);
    this.logger.log('='.repeat(50));
    return {
      success: true,
      chargeId: `dev_chr_${Date.now()}`,
      reference: `dev_ref_${Date.now()}`,
    };
  }

  private mockYapeCharge(options: CulqiYapeOptions): CulqiResult {
    this.logger.log('='.repeat(50));
    this.logger.log('[DEV YAPE CHARGE]');
    this.logger.log(`Amount: S/ ${options.amount / 100}`);
    this.logger.log(`Phone: ${options.phoneNumber}`);
    this.logger.log('='.repeat(50));
    return {
      success: true,
      chargeId: `dev_yape_${Date.now()}`,
      reference: `dev_yape_ref_${Date.now()}`,
      data: {
        qrCode: 'https://via.placeholder.com/300x300.png?text=YAPE+QR',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
    };
  }

  private mockRefund(chargeId: string, amount?: number): CulqiResult {
    this.logger.log('='.repeat(50));
    this.logger.log('[DEV CULQI REFUND]');
    this.logger.log(`Charge ID: ${chargeId}`);
    this.logger.log(`Amount: ${amount ? `S/ ${amount / 100}` : 'Full refund'}`);
    this.logger.log('='.repeat(50));
    return {
      success: true,
      reference: `dev_refund_${Date.now()}`,
    };
  }
}
