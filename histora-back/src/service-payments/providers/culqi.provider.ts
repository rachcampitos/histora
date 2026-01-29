import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CulqiChargeRequest {
  amount: number; // in cents
  currencyCode: string;
  email: string;
  sourceId: string; // card token
  description?: string;
  metadata?: Record<string, any>;
}

export interface CulqiChargeResult {
  success: boolean;
  chargeId?: string;
  error?: string;
  errorCode?: string;
  data?: any;
}

export interface CulqiRefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

@Injectable()
export class CulqiProvider implements OnModuleInit {
  private readonly logger = new Logger(CulqiProvider.name);
  private culqiApiKey: string;
  private isConfigured = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.culqiApiKey = this.configService.get<string>('CULQI_API_KEY', '');
    if (this.culqiApiKey) {
      this.isConfigured = true;
      this.logger.log('Culqi payment provider configured');
    } else {
      this.logger.warn('Culqi API key not configured - payments will fail');
    }
  }

  async createCharge(request: CulqiChargeRequest): Promise<CulqiChargeResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Culqi not configured',
        errorCode: 'provider_not_configured',
      };
    }

    try {
      const response = await fetch('https://api.culqi.com/v2/charges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.culqiApiKey}`,
        },
        body: JSON.stringify({
          amount: request.amount,
          currency_code: request.currencyCode,
          email: request.email,
          source_id: request.sourceId,
          description: request.description,
          metadata: request.metadata,
        }),
      });

      const data = await response.json();

      if (response.ok && data.object === 'charge') {
        return {
          success: true,
          chargeId: data.id,
          data,
        };
      } else {
        return {
          success: false,
          error: data.user_message || data.merchant_message || 'Charge failed',
          errorCode: data.type || 'unknown_error',
          data,
        };
      }
    } catch (error) {
      this.logger.error('Culqi charge error', error);
      return {
        success: false,
        error: error.message,
        errorCode: 'network_error',
      };
    }
  }

  async refund(
    chargeId: string,
    amount: number,
    reason?: string,
  ): Promise<CulqiRefundResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Culqi not configured',
      };
    }

    try {
      const response = await fetch('https://api.culqi.com/v2/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.culqiApiKey}`,
        },
        body: JSON.stringify({
          charge_id: chargeId,
          amount,
          reason: reason || 'solicitud del cliente',
        }),
      });

      const data = await response.json();

      if (response.ok && data.object === 'refund') {
        return {
          success: true,
          refundId: data.id,
        };
      } else {
        return {
          success: false,
          error: data.user_message || data.merchant_message || 'Refund failed',
        };
      }
    } catch (error) {
      this.logger.error('Culqi refund error', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
