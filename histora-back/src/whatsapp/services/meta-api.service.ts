import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  SendTextMessageDto,
  SendButtonsMessageDto,
  SendListMessageDto,
} from '../dto/message.dto';

@Injectable()
export class MetaApiService {
  private readonly logger = new Logger(MetaApiService.name);
  private readonly apiUrl = 'https://graph.facebook.com/v21.0';
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.phoneNumberId = this.configService.get<string>('WA_PHONE_NUMBER_ID') || '';
    this.accessToken = this.configService.get<string>('WA_ACCESS_TOKEN') || '';
  }

  /**
   * Send a simple text message
   */
  async sendTextMessage(dto: SendTextMessageDto): Promise<any> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: dto.to,
      type: 'text',
      text: { body: dto.text },
    };

    return this.sendRequest(payload);
  }

  /**
   * Send a message with interactive buttons (max 3)
   */
  async sendButtonsMessage(dto: SendButtonsMessageDto): Promise<any> {
    const buttons = dto.buttons.slice(0, 3).map((title, index) => ({
      type: 'reply',
      reply: {
        id: `btn_${index}_${Date.now()}`,
        title: title.slice(0, 20), // Max 20 chars
      },
    }));

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: dto.to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: dto.text },
        action: { buttons },
      },
    };

    return this.sendRequest(payload);
  }

  /**
   * Send a message with a list of options
   */
  async sendListMessage(dto: SendListMessageDto): Promise<any> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: dto.to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: dto.headerText ? { type: 'text', text: dto.headerText } : undefined,
        body: { text: dto.bodyText },
        footer: dto.footerText ? { text: dto.footerText } : undefined,
        action: {
          button: dto.buttonText,
          sections: dto.sections,
        },
      },
    };

    return this.sendRequest(payload);
  }

  /**
   * Send a message - automatically chooses text or buttons based on content
   */
  async sendMessage(to: string, text: string, buttons?: string[]): Promise<any> {
    if (buttons && buttons.length > 0) {
      return this.sendButtonsMessage({ to, text, buttons });
    }
    return this.sendTextMessage({ to, text });
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<any> {
    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };

    return this.sendRequest(payload);
  }

  /**
   * Internal method to send requests to Meta API
   */
  private async sendRequest(payload: any): Promise<any> {
    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.debug(`Message sent to ${payload.to}: ${response.data?.messages?.[0]?.id}`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || error.message;
      this.logger.error(`Failed to send message to ${payload.to}:`, errorData);
      throw error;
    }
  }

  /**
   * Verify webhook signature (for security)
   */
  verifyWebhookSignature(signature: string, body: string): boolean {
    const crypto = require('crypto');
    const appSecret = this.configService.get<string>('WA_APP_SECRET');

    if (!appSecret) {
      this.logger.warn('WA_APP_SECRET not configured, skipping signature verification');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(body)
      .digest('hex');

    return `sha256=${expectedSignature}` === signature;
  }
}
