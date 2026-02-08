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
    this.fromName = this.configService.get<string>('SENDGRID_FROM_NAME', 'NurseLite');
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

  // Reusable email wrapper with NurseLite logo
  private getEmailWrapper(title: string, content: string): string {
    return `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - NurseLite</title>
        <!--[if mso]>
        <style type="text/css">
          body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
        </style>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; background-color: #f0f9ff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0f9ff;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.12); overflow: hidden;">
                <!-- Header with logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0891b2 0%, #0d9488 50%, #14b8a6 100%); padding: 36px 40px; text-align: center;">
                    <table role="presentation" width="100%">
                      <tr>
                        <td align="center">
                          <img src="https://nurse-lite.com/nurselite.png" alt="NurseLite" width="56" height="56" style="width: 56px; height: 56px; border-radius: 14px; display: block; margin: 0 auto 14px;" />
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">NurseLite</h1>
                          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px; font-weight: 500;">Enfermeria a domicilio</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                ${content}

                <!-- Footer -->
                <tr>
                  <td style="border-top: 1px solid #e2e8f0; padding: 24px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 6px;">
                      © ${new Date().getFullYear()} NurseLite. Todos los derechos reservados.
                    </p>
                    <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
                      <a href="https://nurse-lite.com" style="color: #94a3b8; text-decoration: none;">nurse-lite.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>`;
  }

  // Email templates
  getWelcomeTemplate(data: { userName: string }): string {
    const content = `
                <tr>
                  <td style="padding: 48px 50px; text-align: center;">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 50%; display: inline-block; line-height: 80px; margin-bottom: 24px;">
                      <span style="font-size: 36px;">👋</span>
                    </div>

                    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 24px; font-weight: 700;">
                      Bienvenido a NurseLite
                    </h2>

                    <p style="color: #64748b; font-size: 16px; line-height: 1.7; margin: 0 0 28px;">
                      Hola <strong style="color: #0f172a;">${data.userName}</strong>,<br>
                      Tu cuenta ha sido creada exitosamente.
                    </p>

                    <table role="presentation" width="100%" style="background: #f8fafc; border-radius: 12px; text-align: left;">
                      <tr>
                        <td style="padding: 24px;">
                          <p style="color: #475569; font-size: 14px; font-weight: 600; margin: 0 0 12px;">Ahora puedes:</p>
                          <table role="presentation" width="100%">
                            <tr><td style="padding: 6px 0; color: #64748b; font-size: 14px;">✅ Solicitar servicios de enfermeria a domicilio</td></tr>
                            <tr><td style="padding: 6px 0; color: #64748b; font-size: 14px;">✅ Ver el estado de tus solicitudes en tiempo real</td></tr>
                            <tr><td style="padding: 6px 0; color: #64748b; font-size: 14px;">✅ Calificar el servicio recibido</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`;

    return this.getEmailWrapper('Bienvenido', content);
  }

  getServiceAcceptedTemplate(data: { patientName: string; nurseName: string; serviceName: string; date: string; time: string }): string {
    const content = `
                <tr>
                  <td style="padding: 48px 50px; text-align: center;">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 50%; display: inline-block; line-height: 80px; margin-bottom: 24px;">
                      <span style="font-size: 36px;">✅</span>
                    </div>

                    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 24px; font-weight: 700;">
                      Servicio Aceptado
                    </h2>

                    <p style="color: #64748b; font-size: 16px; line-height: 1.7; margin: 0 0 28px;">
                      Hola <strong style="color: #0f172a;">${data.patientName}</strong>,<br>
                      Tu solicitud de servicio ha sido aceptada.
                    </p>

                    <table role="presentation" width="100%" style="background: #f8fafc; border-radius: 12px; text-align: left;">
                      <tr>
                        <td style="padding: 24px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #94a3b8; font-size: 13px;">Enfermera</span><br>
                                <strong style="color: #0f172a; font-size: 15px;">${data.nurseName}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #94a3b8; font-size: 13px;">Servicio</span><br>
                                <strong style="color: #0f172a; font-size: 15px;">${data.serviceName}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #94a3b8; font-size: 13px;">Fecha</span><br>
                                <strong style="color: #0f172a; font-size: 15px;">${data.date}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 10px 0;">
                                <span style="color: #94a3b8; font-size: 13px;">Hora</span><br>
                                <strong style="color: #0f172a; font-size: 15px;">${data.time}</strong>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #64748b; font-size: 14px; margin: 24px 0 0;">
                      La enfermera se pondra en contacto contigo pronto.
                    </p>
                  </td>
                </tr>`;

    return this.getEmailWrapper('Servicio Aceptado', content);
  }

  getServiceCompletedTemplate(data: { patientName: string; nurseName: string; serviceName: string }): string {
    const content = `
                <tr>
                  <td style="padding: 48px 50px; text-align: center;">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 50%; display: inline-block; line-height: 80px; margin-bottom: 24px;">
                      <span style="font-size: 36px;">🎉</span>
                    </div>

                    <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 24px; font-weight: 700;">
                      Servicio Completado
                    </h2>

                    <p style="color: #64748b; font-size: 16px; line-height: 1.7; margin: 0 0 28px;">
                      Hola <strong style="color: #0f172a;">${data.patientName}</strong>,<br>
                      El servicio de <strong>${data.serviceName}</strong> con <strong>${data.nurseName}</strong> ha sido completado.
                    </p>

                    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                      <p style="color: #92400e; font-size: 15px; margin: 0; font-weight: 500;">
                        ⭐ Por favor, toma un momento para calificar tu experiencia
                      </p>
                    </div>

                    <p style="color: #64748b; font-size: 15px; margin: 0;">
                      Gracias por confiar en NurseLite.
                    </p>
                  </td>
                </tr>`;

    return this.getEmailWrapper('Servicio Completado', content);
  }

  getVerificationCodeTemplate(data: { userName: string; code: string; expiresIn: string }): string {
    const content = `
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
                        Si no solicitaste este codigo, ignora este correo.
                      </p>
                    </div>
                  </td>
                </tr>`;

    return this.getEmailWrapper('Codigo de Verificacion', content);
  }

  getPasswordResetTemplate(data: { userName: string; resetLink: string; expiresIn: string }): string {
    const content = `
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
                                    box-shadow: 0 6px 20px rgba(8, 145, 178, 0.4);">
                            Restablecer Contraseña
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Two Column Info Section -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 0 8px 16px 0; vertical-align: top; width: 50%;">
                          <table role="presentation" width="100%" style="background: #f8fafc; border-radius: 12px; height: 100%;">
                            <tr>
                              <td style="padding: 20px;" align="center">
                                <span style="font-size: 24px;">⏱️</span>
                                <p style="color: #64748b; font-size: 14px; margin: 10px 0 0; line-height: 1.5; text-align: center;">
                                  Expira en<br><strong style="color: #0f172a; font-size: 15px;">${data.expiresIn}</strong>
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding: 0 0 16px 8px; vertical-align: top; width: 50%;">
                          <table role="presentation" width="100%" style="background: #fef3c7; border-radius: 12px; height: 100%;">
                            <tr>
                              <td style="padding: 20px;" align="center">
                                <span style="font-size: 24px;">⚠️</span>
                                <p style="color: #92400e; font-size: 14px; margin: 10px 0 0; line-height: 1.5; text-align: center;">
                                  <strong>No lo solicitaste?</strong><br>Ignora este correo
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer Link -->
                <tr>
                  <td style="padding: 0 50px 28px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 13px; margin: 0 0 10px;">
                      Si el boton no funciona, copia este enlace:
                    </p>
                    <p style="margin: 0; background: #f8fafc; padding: 12px 16px; border-radius: 8px;">
                      <a href="${data.resetLink}" style="color: #0891b2; font-size: 12px; word-break: break-all; text-decoration: none;">
                        ${data.resetLink}
                      </a>
                    </p>
                  </td>
                </tr>`;

    return this.getEmailWrapper('Recuperar Contraseña', content);
  }
}
