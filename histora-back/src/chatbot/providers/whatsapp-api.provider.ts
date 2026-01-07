import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface WhatsAppButton {
  id: string;
  title: string;
}

interface WhatsAppListRow {
  id: string;
  title: string;
  description?: string;
}

interface WhatsAppListSection {
  title: string;
  rows: WhatsAppListRow[];
}

@Injectable()
export class WhatsAppApiProvider {
  private readonly logger = new Logger(WhatsAppApiProvider.name);
  private readonly apiUrl: string;
  private readonly phoneNumberId: string;
  private readonly accessToken: string;
  private readonly isConfigured: boolean;

  constructor(private configService: ConfigService) {
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || '';
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN') || '';
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;

    this.isConfigured = !!(this.phoneNumberId && this.accessToken);

    if (!this.isConfigured) {
      this.logger.warn('WhatsApp API not configured - messages will be logged only');
    }
  }

  /**
   * Format phone number to WhatsApp format (remove + and spaces)
   */
  private formatPhoneNumber(phone: string): string {
    let formatted = phone.replace(/[\s\-\(\)]/g, '');

    // Remove leading +
    if (formatted.startsWith('+')) {
      formatted = formatted.substring(1);
    }

    // Add Peru country code if not present
    if (formatted.startsWith('9') && formatted.length === 9) {
      formatted = '51' + formatted;
    }

    return formatted;
  }

  /**
   * Send a text message
   */
  async sendTextMessage(to: string, message: string): Promise<boolean> {
    const phoneNumber = this.formatPhoneNumber(to);

    if (!this.isConfigured) {
      this.logger.log(`[MOCK] Sending to ${phoneNumber}: ${message}`);
      return true;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Failed to send WhatsApp message:', error);
        return false;
      }

      this.logger.log(`Message sent to ${phoneNumber}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Send interactive button message
   */
  async sendButtonMessage(
    to: string,
    bodyText: string,
    buttons: WhatsAppButton[],
    headerText?: string,
    footerText?: string,
  ): Promise<boolean> {
    const phoneNumber = this.formatPhoneNumber(to);

    if (!this.isConfigured) {
      this.logger.log(`[MOCK] Sending buttons to ${phoneNumber}:`, { bodyText, buttons });
      return true;
    }

    const buttonObjects = buttons.slice(0, 3).map((btn) => ({
      type: 'reply',
      reply: {
        id: btn.id,
        title: btn.title.substring(0, 20), // Max 20 chars
      },
    }));

    const interactive: any = {
      type: 'button',
      body: { text: bodyText },
      action: { buttons: buttonObjects },
    };

    if (headerText) {
      interactive.header = { type: 'text', text: headerText };
    }

    if (footerText) {
      interactive.footer = { text: footerText };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'interactive',
          interactive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Failed to send button message:', error);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error sending button message:', error);
      return false;
    }
  }

  /**
   * Send interactive list message
   */
  async sendListMessage(
    to: string,
    headerText: string,
    bodyText: string,
    buttonText: string,
    sections: WhatsAppListSection[],
    footerText?: string,
  ): Promise<boolean> {
    const phoneNumber = this.formatPhoneNumber(to);

    if (!this.isConfigured) {
      this.logger.log(`[MOCK] Sending list to ${phoneNumber}:`, { headerText, sections });
      return true;
    }

    const interactive: any = {
      type: 'list',
      header: { type: 'text', text: headerText },
      body: { text: bodyText },
      action: {
        button: buttonText,
        sections: sections.map((section) => ({
          title: section.title,
          rows: section.rows.map((row) => ({
            id: row.id,
            title: row.title.substring(0, 24), // Max 24 chars
            description: row.description?.substring(0, 72), // Max 72 chars
          })),
        })),
      },
    };

    if (footerText) {
      interactive.footer = { text: footerText };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber,
          type: 'interactive',
          interactive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Failed to send list message:', error);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Error sending list message:', error);
      return false;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.log(`[MOCK] Marking message ${messageId} as read`);
      return true;
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      });

      return response.ok;
    } catch (error) {
      this.logger.error('Error marking message as read:', error);
      return false;
    }
  }
}
