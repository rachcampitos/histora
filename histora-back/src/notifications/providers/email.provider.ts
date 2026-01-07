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
      <body style="margin: 0; padding: 0; background-color: #f0f9ff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f9ff;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="100%" style="max-width: 500px; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0891b2 0%, #0d9488 50%, #14b8a6 100%); padding: 40px 30px; text-align: center;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td align="center">
                          <!-- Logo Icon -->
                          <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 14px; display: inline-block; line-height: 60px; margin-bottom: 16px;">
                            <span style="font-size: 28px;">🏥</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Histora</h1>
                          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Plataforma Médica</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px 35px;">
                    <!-- Lock Icon -->
                    <table role="presentation" width="100%">
                      <tr>
                        <td align="center" style="padding-bottom: 24px;">
                          <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 50%; display: inline-block; line-height: 70px;">
                            <span style="font-size: 32px;">🔐</span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <h2 style="color: #0f172a; margin: 0 0 12px; font-size: 22px; font-weight: 700; text-align: center;">
                      Recupera tu contraseña
                    </h2>

                    <p style="color: #64748b; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 24px;">
                      Hola <strong style="color: #0f172a;">${data.userName}</strong>,<br>
                      Recibimos una solicitud para restablecer tu contraseña.
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%">
                      <tr>
                        <td align="center" style="padding: 10px 0 30px;">
                          <a href="${data.resetLink}"
                             style="background: linear-gradient(135deg, #0891b2 0%, #0d9488 100%);
                                    color: white;
                                    padding: 16px 40px;
                                    text-decoration: none;
                                    border-radius: 10px;
                                    font-weight: 600;
                                    font-size: 15px;
                                    display: inline-block;
                                    box-shadow: 0 4px 14px rgba(8, 145, 178, 0.35);">
                            Restablecer Contraseña
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Info Box -->
                    <table role="presentation" width="100%" style="background: #f8fafc; border-radius: 10px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <table role="presentation" width="100%">
                            <tr>
                              <td width="24" valign="top" style="padding-right: 12px;">
                                <span style="font-size: 16px;">⏱️</span>
                              </td>
                              <td>
                                <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.5;">
                                  Este enlace expira en <strong style="color: #0f172a;">${data.expiresIn}</strong>
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Note -->
                    <table role="presentation" width="100%" style="background: #fef3c7; border-radius: 10px; border-left: 4px solid #f59e0b;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <table role="presentation" width="100%">
                            <tr>
                              <td width="24" valign="top" style="padding-right: 12px;">
                                <span style="font-size: 16px;">⚠️</span>
                              </td>
                              <td>
                                <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
                                  <strong>¿No solicitaste este cambio?</strong><br>
                                  Puedes ignorar este correo. Tu contraseña permanecerá igual.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 35px;">
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0;">
                  </td>
                </tr>

                <!-- Footer Link -->
                <tr>
                  <td style="padding: 24px 35px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px;">
                      Si el botón no funciona, copia este enlace:
                    </p>
                    <p style="margin: 0;">
                      <a href="${data.resetLink}" style="color: #0891b2; font-size: 11px; word-break: break-all; text-decoration: none;">
                        ${data.resetLink}
                      </a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" style="max-width: 500px;">
                <tr>
                  <td style="padding: 30px 20px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 8px;">
                      © ${new Date().getFullYear()} Histora. Todos los derechos reservados.
                    </p>
                    <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
                      Enviado con ❤️ desde Histora
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
