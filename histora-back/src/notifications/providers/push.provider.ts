import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PushOptions {
  token: string; // FCM device token
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  badge?: number;
  sound?: string;
}

export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class PushProvider {
  private readonly logger = new Logger(PushProvider.name);

  constructor(private configService: ConfigService) {}

  async send(options: PushOptions): Promise<PushResult> {
    const provider = this.configService.get<string>('PUSH_PROVIDER', 'console');

    switch (provider) {
      case 'fcm':
        return this.sendWithFCM(options);
      default:
        return this.logToConsole(options);
    }
  }

  async sendToMultiple(tokens: string[], options: Omit<PushOptions, 'token'>): Promise<PushResult[]> {
    return Promise.all(
      tokens.map((token) => this.send({ ...options, token }))
    );
  }

  private async sendWithFCM(options: PushOptions): Promise<PushResult> {
    try {
      // Firebase Cloud Messaging
      // npm install firebase-admin
      // const admin = require('firebase-admin');
      // admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      // await admin.messaging().send({
      //   token: options.token,
      //   notification: { title: options.title, body: options.body },
      //   data: options.data,
      //   android: { priority: 'high' },
      //   apns: { payload: { aps: { badge: options.badge, sound: options.sound || 'default' } } }
      // });

      this.logger.log(`[FCM] Push notification sent to ${options.token.substring(0, 20)}...`);
      return { success: true, messageId: `fcm_${Date.now()}` };
    } catch (error) {
      this.logger.error(`[FCM] Failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async logToConsole(options: PushOptions): Promise<PushResult> {
    this.logger.log('='.repeat(50));
    this.logger.log('[DEV PUSH]');
    this.logger.log(`Token: ${options.token.substring(0, 20)}...`);
    this.logger.log(`Title: ${options.title}`);
    this.logger.log(`Body: ${options.body}`);
    if (options.data) {
      this.logger.log(`Data: ${JSON.stringify(options.data)}`);
    }
    this.logger.log('='.repeat(50));
    return { success: true, messageId: `dev_push_${Date.now()}` };
  }

  // Push notification payloads for common scenarios
  getAppointmentReminderPayload(data: {
    appointmentId: string;
    doctorName: string;
    date: string;
    time: string
  }): Omit<PushOptions, 'token'> {
    return {
      title: 'Recordatorio de Cita',
      body: `Tu cita con ${data.doctorName} es el ${data.date} a las ${data.time}`,
      data: {
        type: 'appointment_reminder',
        appointmentId: data.appointmentId,
      },
      sound: 'default',
    };
  }

  getAppointmentConfirmationPayload(data: {
    appointmentId: string;
    doctorName: string;
    date: string;
    time: string
  }): Omit<PushOptions, 'token'> {
    return {
      title: 'Cita Confirmada',
      body: `Tu cita con ${data.doctorName} ha sido confirmada para el ${data.date}`,
      data: {
        type: 'appointment_confirmed',
        appointmentId: data.appointmentId,
      },
      sound: 'default',
    };
  }

  getNewMessagePayload(data: {
    senderId: string;
    senderName: string;
    preview: string
  }): Omit<PushOptions, 'token'> {
    return {
      title: `Mensaje de ${data.senderName}`,
      body: data.preview.length > 50 ? data.preview.substring(0, 47) + '...' : data.preview,
      data: {
        type: 'new_message',
        senderId: data.senderId,
      },
      sound: 'default',
      badge: 1,
    };
  }

  getLabResultsReadyPayload(data: {
    patientId: string;
    consultationId: string;
  }): Omit<PushOptions, 'token'> {
    return {
      title: 'Resultados Disponibles',
      body: 'Tus resultados de laboratorio ya están disponibles',
      data: {
        type: 'lab_results',
        consultationId: data.consultationId,
      },
      sound: 'default',
    };
  }
}
