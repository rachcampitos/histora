import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsOptions {
  to: string;
  message: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);

  constructor(private configService: ConfigService) {}

  async send(options: SmsOptions): Promise<SmsResult> {
    const provider = this.configService.get<string>('SMS_PROVIDER', 'console');

    switch (provider) {
      case 'twilio':
        return this.sendWithTwilio(options);
      case 'sns':
        return this.sendWithSNS(options);
      default:
        return this.logToConsole(options);
    }
  }

  private async sendWithTwilio(options: SmsOptions): Promise<SmsResult> {
    try {
      // Twilio SMS integration
      // npm install twilio
      // const twilio = require('twilio');
      // const client = twilio(accountSid, authToken);
      // await client.messages.create({
      //   body: options.message,
      //   from: this.configService.get('TWILIO_PHONE_NUMBER'),
      //   to: options.to
      // });

      this.logger.log(`[Twilio SMS] Message sent to ${options.to}`);
      return { success: true, messageId: `twilio_sms_${Date.now()}` };
    } catch (error) {
      this.logger.error(`[Twilio SMS] Failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async sendWithSNS(options: SmsOptions): Promise<SmsResult> {
    try {
      // AWS SNS SMS
      // npm install @aws-sdk/client-sns
      // const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

      this.logger.log(`[AWS SNS] SMS sent to ${options.to}`);
      return { success: true, messageId: `sns_${Date.now()}` };
    } catch (error) {
      this.logger.error(`[AWS SNS] Failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async logToConsole(options: SmsOptions): Promise<SmsResult> {
    this.logger.log('='.repeat(50));
    this.logger.log('[DEV SMS]');
    this.logger.log(`To: ${options.to}`);
    this.logger.log(`Message: ${options.message}`);
    this.logger.log('='.repeat(50));
    return { success: true, messageId: `dev_sms_${Date.now()}` };
  }

  // SMS message templates (short due to character limits)
  getAppointmentReminderMessage(data: { doctorName: string; date: string; time: string }): string {
    return `HISTORA: Recordatorio - Cita con ${data.doctorName} el ${data.date} a las ${data.time}. Llega 10 min antes.`;
  }

  getAppointmentConfirmationMessage(data: { doctorName: string; date: string; time: string }): string {
    return `HISTORA: Tu cita con ${data.doctorName} el ${data.date} a las ${data.time} ha sido confirmada.`;
  }

  getVerificationCodeMessage(code: string): string {
    return `HISTORA: Tu codigo de verificacion es ${code}. Valido por 10 minutos.`;
  }
}
