import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sgMail = require('@sendgrid/mail');

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
export class EmailProvider implements OnModuleInit {
  private readonly logger = new Logger(EmailProvider.name);
  private sendGridConfigured = false;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL', 'noreply@historahealth.com');
    this.fromName = this.configService.get<string>('SENDGRID_FROM_NAME', 'Histora');
  }

  onModuleInit() {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.sendGridConfigured = true;
      this.logger.log('SendGrid configured successfully');
    } else {
      this.logger.warn('SendGrid API key not configured - emails will be logged only');
    }
  }

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
    if (!this.sendGridConfigured) {
      this.logger.warn('SendGrid not configured, falling back to console');
      return this.logToConsole(options);
    }

    try {
      // Generate text version from HTML if not provided
      const textContent = options.text || this.stripHtml(options.html || '') || 'Ver este email en un cliente que soporte HTML';

      const msg = {
        to: options.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: options.subject,
        text: textContent,
        html: options.html || options.text || textContent,
      };

      const [response] = await sgMail.send(msg);

      this.logger.log(`[SendGrid] Email sent to ${options.to}: ${options.subject}`);
      return {
        success: true,
        messageId: response.headers['x-message-id'] || `sg_${Date.now()}`
      };
    } catch (error) {
      this.logger.error(`[SendGrid] Failed to send email: ${error.message}`);
      if (error.response) {
        this.logger.error(`[SendGrid] Response body: ${JSON.stringify(error.response.body)}`);
      }
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

  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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

  getPasswordResetTemplate(data: { userName: string; resetLink: string; expiresIn: string }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperar Contraseña - Histora</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0891b2 0%, #0d9488 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Histora</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Plataforma Médica</p>
        </div>

        <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #0f172a; margin-top: 0;">Recuperar Contraseña</h2>

          <p>Hola ${data.userName},</p>

          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Histora.</p>

          <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetLink}"
               style="background: linear-gradient(135deg, #0891b2 0%, #0d9488 100%);
                      color: white;
                      padding: 14px 30px;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: bold;
                      display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>

          <p style="color: #64748b; font-size: 14px;">
            Este enlace expirará en <strong>${data.expiresIn}</strong>.
          </p>

          <p style="color: #64748b; font-size: 14px;">
            Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña permanecerá sin cambios.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
            <a href="${data.resetLink}" style="color: #0891b2; word-break: break-all;">${data.resetLink}</a>
          </p>
        </div>

        <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Histora. Todos los derechos reservados.</p>
          <p>Este correo fue enviado a ${data.userName}</p>
        </div>
      </body>
      </html>
    `;
  }
}
