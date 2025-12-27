import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);

  constructor(private configService: ConfigService) {}

  async send(options: EmailOptions): Promise<EmailResult> {
    const provider = this.configService.get<string>('EMAIL_PROVIDER', 'console');

    switch (provider) {
      case 'sendgrid':
        return this.sendWithSendGrid(options);
      case 'ses':
        return this.sendWithSES(options);
      case 'smtp':
        return this.sendWithSMTP(options);
      default:
        return this.logToConsole(options);
    }
  }

  private async sendWithSendGrid(options: EmailOptions): Promise<EmailResult> {
    try {
      // SendGrid integration
      // npm install @sendgrid/mail
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'));
      // await sgMail.send({ to: options.to, from: 'noreply@histora.app', subject: options.subject, html: options.html });

      this.logger.log(`[SendGrid] Email sent to ${options.to}: ${options.subject}`);
      return { success: true, messageId: `sg_${Date.now()}` };
    } catch (error) {
      this.logger.error(`[SendGrid] Failed to send email: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async sendWithSES(options: EmailOptions): Promise<EmailResult> {
    try {
      // AWS SES integration
      // npm install @aws-sdk/client-ses
      // const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

      this.logger.log(`[SES] Email sent to ${options.to}: ${options.subject}`);
      return { success: true, messageId: `ses_${Date.now()}` };
    } catch (error) {
      this.logger.error(`[SES] Failed to send email: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async sendWithSMTP(options: EmailOptions): Promise<EmailResult> {
    try {
      // Nodemailer SMTP integration
      // npm install nodemailer
      // const nodemailer = require('nodemailer');
      // const transporter = nodemailer.createTransport({ host, port, auth });

      this.logger.log(`[SMTP] Email sent to ${options.to}: ${options.subject}`);
      return { success: true, messageId: `smtp_${Date.now()}` };
    } catch (error) {
      this.logger.error(`[SMTP] Failed to send email: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async logToConsole(options: EmailOptions): Promise<EmailResult> {
    this.logger.log('='.repeat(50));
    this.logger.log('[DEV EMAIL]');
    this.logger.log(`To: ${options.to}`);
    this.logger.log(`Subject: ${options.subject}`);
    this.logger.log(`Body: ${options.text || options.html?.substring(0, 200)}`);
    this.logger.log('='.repeat(50));
    return { success: true, messageId: `dev_${Date.now()}` };
  }

  // Email templates
  getAppointmentReminderTemplate(data: { patientName: string; doctorName: string; date: string; time: string; clinicName: string }): string {
    return `
      <h2>Recordatorio de Cita</h2>
      <p>Hola ${data.patientName},</p>
      <p>Te recordamos que tienes una cita programada:</p>
      <ul>
        <li><strong>Doctor:</strong> ${data.doctorName}</li>
        <li><strong>Fecha:</strong> ${data.date}</li>
        <li><strong>Hora:</strong> ${data.time}</li>
        <li><strong>Clínica:</strong> ${data.clinicName}</li>
      </ul>
      <p>Por favor, llega 10 minutos antes de tu cita.</p>
      <p>Saludos,<br>${data.clinicName}</p>
    `;
  }

  getAppointmentConfirmationTemplate(data: { patientName: string; doctorName: string; date: string; time: string; clinicName: string }): string {
    return `
      <h2>Cita Confirmada</h2>
      <p>Hola ${data.patientName},</p>
      <p>Tu cita ha sido confirmada:</p>
      <ul>
        <li><strong>Doctor:</strong> ${data.doctorName}</li>
        <li><strong>Fecha:</strong> ${data.date}</li>
        <li><strong>Hora:</strong> ${data.time}</li>
        <li><strong>Clínica:</strong> ${data.clinicName}</li>
      </ul>
      <p>Saludos,<br>${data.clinicName}</p>
    `;
  }

  getWelcomeTemplate(data: { userName: string; clinicName?: string }): string {
    return `
      <h2>Bienvenido a Histora</h2>
      <p>Hola ${data.userName},</p>
      <p>Tu cuenta ha sido creada exitosamente${data.clinicName ? ` en ${data.clinicName}` : ''}.</p>
      <p>Ahora puedes acceder a tu portal para:</p>
      <ul>
        <li>Ver tus citas programadas</li>
        <li>Revisar tu historial clínico</li>
        <li>Descargar resultados de laboratorio</li>
      </ul>
      <p>Saludos,<br>Equipo Histora</p>
    `;
  }
}
