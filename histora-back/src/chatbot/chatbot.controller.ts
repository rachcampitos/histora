import { Controller, Post, Get, Body, Query, Logger, HttpCode } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { ChatbotService } from './chatbot.service';
import { WhatsAppWebhookDto } from './dto/whatsapp-webhook.dto';

@Controller('webhook/whatsapp')
@SkipThrottle() // Webhooks from Meta should not be rate limited
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);
  private readonly verifyToken: string;

  constructor(
    private chatbotService: ChatbotService,
    private configService: ConfigService,
  ) {
    this.verifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN') || 'histora_verify_token';
  }

  /**
   * Webhook verification (GET request from Meta)
   * Meta sends this to verify your webhook URL
   */
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string | number {
    this.logger.log(`Webhook verification: mode=${mode}, token=${token}`);

    if (mode === 'subscribe' && token === this.verifyToken) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    }

    this.logger.warn('Webhook verification failed');
    return 'Forbidden';
  }

  /**
   * Receive incoming messages (POST request from Meta)
   */
  @Post()
  @HttpCode(200)
  async handleWebhook(@Body() body: WhatsAppWebhookDto): Promise<string> {
    this.logger.log('Received webhook:', JSON.stringify(body, null, 2));

    // Meta expects a 200 OK response immediately
    // Process messages asynchronously
    setImmediate(async () => {
      try {
        await this.processWebhookPayload(body);
      } catch (error) {
        this.logger.error('Error processing webhook:', error);
      }
    });

    return 'OK';
  }

  /**
   * Process the webhook payload
   */
  private async processWebhookPayload(payload: WhatsAppWebhookDto): Promise<void> {
    if (payload.object !== 'whatsapp_business_account') {
      this.logger.warn('Received non-WhatsApp webhook');
      return;
    }

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') {
          continue;
        }

        const value = change.value;
        const messages = value.messages || [];
        const contacts = value.contacts || [];

        for (const message of messages) {
          const phoneNumber = message.from;
          const contact = contacts.find((c) => c.wa_id === phoneNumber);
          const contactName = contact?.profile?.name || 'Usuario';

          if (message.type === 'text' && message.text) {
            // Handle text message
            await this.chatbotService.processMessage(
              phoneNumber,
              message.text.body,
              message.id,
              contactName,
            );
          } else if (message.type === 'interactive' && message.interactive) {
            // Handle button/list reply
            const interactive = message.interactive;
            let replyId = '';

            if (interactive.type === 'button_reply' && interactive.button_reply) {
              replyId = interactive.button_reply.id;
            } else if (interactive.type === 'list_reply' && interactive.list_reply) {
              replyId = interactive.list_reply.id;
            }

            if (replyId) {
              await this.chatbotService.processInteractiveReply(
                phoneNumber,
                replyId,
                message.id,
              );
            }
          }
        }
      }
    }
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
