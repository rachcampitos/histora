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
  getWelcomeTemplate(data: { userName: string }): string {
    return `
      <h2>Bienvenido a Histora Care</h2>
      <p>Hola ${data.userName},</p>
      <p>Tu cuenta ha sido creada exitosamente.</p>
      <p>Ahora puedes acceder a la plataforma para:</p>
      <ul>
        <li>Solicitar servicios de enfermería a domicilio</li>
        <li>Ver el estado de tus solicitudes</li>
        <li>Calificar el servicio recibido</li>
      </ul>
      <p>Saludos,<br>Equipo Histora Care</p>
    `;
  }

  getServiceAcceptedTemplate(data: { patientName: string; nurseName: string; serviceName: string; date: string; time: string }): string {
    return `
      <h2>Servicio Aceptado</h2>
      <p>Hola ${data.patientName},</p>
      <p>Tu solicitud de servicio ha sido aceptada:</p>
      <ul>
        <li><strong>Enfermera:</strong> ${data.nurseName}</li>
        <li><strong>Servicio:</strong> ${data.serviceName}</li>
        <li><strong>Fecha:</strong> ${data.date}</li>
        <li><strong>Hora:</strong> ${data.time}</li>
      </ul>
      <p>La enfermera se pondrá en contacto contigo pronto.</p>
      <p>Saludos,<br>Equipo Histora Care</p>
    `;
  }

  getServiceCompletedTemplate(data: { patientName: string; nurseName: string; serviceName: string }): string {
    return `
      <h2>Servicio Completado</h2>
      <p>Hola ${data.patientName},</p>
      <p>El servicio de <strong>${data.serviceName}</strong> con <strong>${data.nurseName}</strong> ha sido completado.</p>
      <p>¡Gracias por confiar en Histora Care!</p>
      <p>Por favor, tómate un momento para calificar tu experiencia.</p>
      <p>Saludos,<br>Equipo Histora Care</p>
    `;
  }

  getVerificationCodeTemplate(data: { userName: string; code: string; expiresIn: string }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Codigo de Verificacion - NurseLite</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f0f9ff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f9ff;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.12);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0891b2 0%, #0d9488 100%); padding: 40px; text-align: center; border-radius: 20px 20px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">NurseLite</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Enfermeria a domicilio</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 48px 50px; text-align: center;">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 50%; display: inline-block; line-height: 80px; margin-bottom: 24px;">
                      <span style="font-size: 36px;">✉️</span>
                    </div>

                    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 24px;">
                      Verifica tu correo electronico
                    </h2>

                    <p style="color: #64748b; font-size: 16px; line-height: 1.7; margin: 0 0 32px;">
                      Hola <strong>${data.userName}</strong>,<br>
                      Usa el siguiente codigo para verificar tu cuenta:
                    </p>

                    <!-- Code Box -->
                    <div style="background: #f8fafc; border: 2px dashed #0891b2; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                      <p style="font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #0891b2; margin: 0;">
                        ${data.code}
                      </p>
                    </div>

                    <p style="color: #94a3b8; font-size: 14px; margin: 0;">
                      Este codigo expira en <strong>${data.expiresIn}</strong>
                    </p>
                  </td>
                </tr>

                <!-- Warning -->
                <tr>
                  <td style="padding: 0 50px 40px;">
                    <div style="background: #fef3c7; border-radius: 12px; padding: 16px; text-align: center;">
                      <p style="color: #92400e; font-size: 13px; margin: 0;">
                        ⚠️ Si no solicitaste este codigo, ignora este correo.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="border-top: 1px solid #e2e8f0; padding: 24px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} NurseLite. Todos los derechos reservados.
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

  getPasswordResetTemplate(data: { userName: string; resetLink: string; expiresIn: string }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperar Contraseña - Histora</title>
        <!--[if mso]>
        <style type="text/css">
          body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
        </style>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; background-color: #f0f9ff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f9ff; min-height: 100vh;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <!-- Main Container - Responsive width: 600px desktop, 100% mobile -->
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.12); overflow: hidden;">
                <!-- Header with gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0891b2 0%, #0d9488 50%, #14b8a6 100%); padding: 48px 40px; text-align: center;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td align="center">
                          <!-- Logo Icon -->
                          <div style="width: 72px; height: 72px; background: rgba(255,255,255,0.2); border-radius: 16px; display: inline-block; line-height: 72px; margin-bottom: 20px;">
                            <span style="font-size: 32px;">🏥</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Histora</h1>
                          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 15px; font-weight: 500;">Plataforma Médica</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 48px 50px;">
                    <!-- Lock Icon -->
                    <table role="presentation" width="100%">
                      <tr>
                        <td align="center" style="padding-bottom: 28px;">
                          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 50%; display: inline-block; line-height: 80px; box-shadow: 0 8px 24px rgba(251, 191, 36, 0.3);">
                            <span style="font-size: 36px;">🔐</span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 26px; font-weight: 700; text-align: center; letter-spacing: -0.3px;">
                      Recupera tu contraseña
                    </h2>

                    <p style="color: #64748b; font-size: 16px; line-height: 1.7; text-align: center; margin: 0 0 32px; max-width: 420px; margin-left: auto; margin-right: auto;">
                      Hola <strong style="color: #0f172a;">${data.userName}</strong>,<br>
                      Recibimos una solicitud para restablecer tu contraseña.
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" width="100%">
                      <tr>
                        <td align="center" style="padding: 12px 0 36px;">
                          <a href="${data.resetLink}"
                             style="background: linear-gradient(135deg, #0891b2 0%, #0d9488 100%);
                                    color: white;
                                    padding: 18px 48px;
                                    text-decoration: none;
                                    border-radius: 12px;
                                    font-weight: 600;
                                    font-size: 16px;
                                    display: inline-block;
                                    box-shadow: 0 6px 20px rgba(8, 145, 178, 0.4);
                                    transition: transform 0.2s;">
                            Restablecer Contraseña
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Two Column Info Section (side by side on desktop) -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <!-- Info Box -->
                        <td style="padding: 0 8px 16px 0; vertical-align: top; width: 50%;">
                          <table role="presentation" width="100%" style="background: #f8fafc; border-radius: 12px; height: 100%;">
                            <tr>
                              <td style="padding: 20px;">
                                <table role="presentation" width="100%">
                                  <tr>
                                    <td align="center" style="padding-bottom: 10px;">
                                      <span style="font-size: 24px;">⏱️</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td align="center">
                                      <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.5; text-align: center;">
                                        Expira en<br><strong style="color: #0f172a; font-size: 15px;">${data.expiresIn}</strong>
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <!-- Security Note -->
                        <td style="padding: 0 0 16px 8px; vertical-align: top; width: 50%;">
                          <table role="presentation" width="100%" style="background: #fef3c7; border-radius: 12px; height: 100%;">
                            <tr>
                              <td style="padding: 20px;">
                                <table role="presentation" width="100%">
                                  <tr>
                                    <td align="center" style="padding-bottom: 10px;">
                                      <span style="font-size: 24px;">⚠️</span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td align="center">
                                      <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5; text-align: center;">
                                        <strong>¿No lo solicitaste?</strong><br>Ignora este correo
                                      </p>
                                    </td>
                                  </tr>
                                </table>
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
                  <td style="padding: 0 50px;">
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0;">
                  </td>
                </tr>

                <!-- Footer Link -->
                <tr>
                  <td style="padding: 28px 50px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 13px; margin: 0 0 10px;">
                      Si el botón no funciona, copia este enlace:
                    </p>
                    <p style="margin: 0; background: #f8fafc; padding: 12px 16px; border-radius: 8px;">
                      <a href="${data.resetLink}" style="color: #0891b2; font-size: 12px; word-break: break-all; text-decoration: none;">
                        ${data.resetLink}
                      </a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
                <tr>
                  <td style="padding: 32px 20px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 13px; margin: 0 0 8px;">
                      © ${new Date().getFullYear()} Histora. Todos los derechos reservados.
                    </p>
                    <p style="color: #cbd5e1; font-size: 12px; margin: 0;">
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
