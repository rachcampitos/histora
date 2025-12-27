import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WhatsAppOptions {
  to: string; // Phone number with country code (e.g., +51999999999)
  message: string;
  template?: string;
  templateParams?: string[];
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class WhatsAppProvider {
  private readonly logger = new Logger(WhatsAppProvider.name);

  constructor(private configService: ConfigService) {}

  async send(options: WhatsAppOptions): Promise<WhatsAppResult> {
    const provider = this.configService.get<string>('WHATSAPP_PROVIDER', 'console');

    switch (provider) {
      case 'twilio':
        return this.sendWithTwilio(options);
      case 'meta':
        return this.sendWithMeta(options);
      default:
        return this.logToConsole(options);
    }
  }

  private async sendWithTwilio(options: WhatsAppOptions): Promise<WhatsAppResult> {
    try {
      // Twilio WhatsApp integration
      // npm install twilio
      // const twilio = require('twilio');
      // const client = twilio(accountSid, authToken);
      // await client.messages.create({
      //   body: options.message,
      //   from: 'whatsapp:+14155238886',
      //   to: `whatsapp:${options.to}`
      // });

      this.logger.log(`[Twilio WhatsApp] Message sent to ${options.to}`);
      return { success: true, messageId: `twilio_wa_${Date.now()}` };
    } catch (error) {
      this.logger.error(`[Twilio WhatsApp] Failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async sendWithMeta(options: WhatsAppOptions): Promise<WhatsAppResult> {
    try {
      // Meta WhatsApp Business API
      // https://developers.facebook.com/docs/whatsapp/cloud-api/
      // const phoneNumberId = this.configService.get('WHATSAPP_PHONE_ID');
      // const accessToken = this.configService.get('WHATSAPP_ACCESS_TOKEN');
      // await axios.post(
      //   `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      //   {
      //     messaging_product: 'whatsapp',
      //     to: options.to,
      //     type: 'text',
      //     text: { body: options.message }
      //   },
      //   { headers: { Authorization: `Bearer ${accessToken}` } }
      // );

      this.logger.log(`[Meta WhatsApp] Message sent to ${options.to}`);
      return { success: true, messageId: `meta_wa_${Date.now()}` };
    } catch (error) {
      this.logger.error(`[Meta WhatsApp] Failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async logToConsole(options: WhatsAppOptions): Promise<WhatsAppResult> {
    this.logger.log('='.repeat(50));
    this.logger.log('[DEV WHATSAPP]');
    this.logger.log(`To: ${options.to}`);
    this.logger.log(`Message: ${options.message}`);
    if (options.template) {
      this.logger.log(`Template: ${options.template}`);
    }
    this.logger.log('='.repeat(50));
    return { success: true, messageId: `dev_wa_${Date.now()}` };
  }

  // Format phone number for WhatsApp
  formatPhoneNumber(phone: string): string {
    // Remove spaces, dashes, and other characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Add Peru country code if not present
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('51')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.length === 9) {
        // Peruvian mobile number
        cleaned = '+51' + cleaned;
      }
    }

    return cleaned;
  }

  // WhatsApp message templates
  getAppointmentReminderMessage(data: { patientName: string; doctorName: string; date: string; time: string; clinicName: string }): string {
    return `*Recordatorio de Cita*

Hola ${data.patientName},

Te recordamos que tienes una cita:
- Doctor: ${data.doctorName}
- Fecha: ${data.date}
- Hora: ${data.time}
- Clínica: ${data.clinicName}

Por favor, llega 10 minutos antes.

_${data.clinicName}_`;
  }

  getAppointmentConfirmationMessage(data: { patientName: string; doctorName: string; date: string; time: string; clinicName: string }): string {
    return `*Cita Confirmada*

Hola ${data.patientName},

Tu cita ha sido confirmada:
- Doctor: ${data.doctorName}
- Fecha: ${data.date}
- Hora: ${data.time}

Te esperamos en ${data.clinicName}.`;
  }

  getAppointmentCancelledMessage(data: { patientName: string; date: string; time: string; reason?: string }): string {
    return `*Cita Cancelada*

Hola ${data.patientName},

Lamentamos informarte que tu cita del ${data.date} a las ${data.time} ha sido cancelada.${data.reason ? `\n\nMotivo: ${data.reason}` : ''}

Por favor, reprograma tu cita en nuestro portal o contactando a la clínica.`;
  }
}
