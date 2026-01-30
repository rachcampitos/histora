import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  WhatsAppConversation,
  WhatsAppConversationDocument,
} from '../entities/conversation.entity';
import { MetaApiService } from './meta-api.service';
import { AIChatService } from './ai-chat.service';
import { SessionService } from './session.service';
import {
  WebhookPayload,
  WebhookMessage,
  WebhookValue,
} from '../dto/webhook.dto';
import { ParsedIncomingMessage } from '../dto/message.dto';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    @InjectModel(WhatsAppConversation.name)
    private readonly conversationModel: Model<WhatsAppConversationDocument>,
    private readonly metaApiService: MetaApiService,
    private readonly aiChatService: AIChatService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Process incoming webhook from Meta
   */
  async processWebhook(payload: WebhookPayload): Promise<void> {
    if (payload.object !== 'whatsapp_business_account') {
      this.logger.warn('Received non-WhatsApp webhook');
      return;
    }

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          await this.handleMessagesChange(change.value);
        }
      }
    }
  }

  /**
   * Handle messages from webhook
   */
  private async handleMessagesChange(value: WebhookValue): Promise<void> {
    const messages = value.messages || [];
    const contacts = value.contacts || [];

    for (const message of messages) {
      const contact = contacts.find((c) => c.wa_id === message.from);
      const contactName = contact?.profile?.name;

      await this.processIncomingMessage(message, contactName);
    }

    // Handle status updates if needed
    const statuses = value.statuses || [];
    for (const status of statuses) {
      this.logger.debug(`Message ${status.id} status: ${status.status}`);
    }
  }

  /**
   * Process a single incoming message
   */
  async processIncomingMessage(
    message: WebhookMessage,
    contactName?: string,
  ): Promise<void> {
    const parsed = this.parseIncomingMessage(message, contactName);

    if (!parsed.text) {
      this.logger.debug(`Ignoring non-text message from ${parsed.from}`);
      // Send a helpful message for unsupported content
      await this.metaApiService.sendTextMessage({
        to: parsed.from,
        text: 'Por ahora solo puedo procesar mensajes de texto. ¿En qué puedo ayudarte?',
      });
      return;
    }

    this.logger.log(`Incoming message from ${parsed.from}: ${parsed.text}`);

    try {
      // Mark message as read
      await this.metaApiService.markAsRead(parsed.waMessageId);

      // Get or create session
      const session = await this.sessionService.getOrCreate(parsed.from);

      // Get or create conversation in database
      const conversation = await this.getOrCreateConversation(
        parsed.from,
        contactName,
      );

      // Add incoming message to conversation
      conversation.messages.push({
        direction: 'inbound',
        text: parsed.text,
        waMessageId: parsed.waMessageId,
        timestamp: parsed.timestamp,
      });

      // Get recent message history for AI context
      const history = conversation.messages.slice(-10).map((m: { direction: 'inbound' | 'outbound'; text: string }) => ({
        direction: m.direction,
        text: m.text,
      }));

      // Generate AI response
      const aiResponse = await this.aiChatService.chat(parsed.text, history, {
        capturedData: session.capturedData,
        userType: session.userType,
      });

      // Update session with captured data
      if (aiResponse.capturedData) {
        this.sessionService.update(parsed.from, aiResponse.capturedData);
        conversation.capturedData = {
          ...conversation.capturedData,
          ...aiResponse.capturedData,
        };
      }

      // Handle escalation
      if (aiResponse.shouldEscalate) {
        this.logger.warn(
          `Escalation requested for ${parsed.from}: ${aiResponse.escalationReason}`,
        );
        conversation.status = 'escalated';
        // TODO: Implement notification to human operator
      }

      // Send response
      const sentMessage = await this.metaApiService.sendMessage(
        parsed.from,
        aiResponse.text,
        aiResponse.buttons,
      );

      // Add outbound message to conversation
      conversation.messages.push({
        direction: 'outbound',
        text: aiResponse.text,
        waMessageId: sentMessage?.messages?.[0]?.id,
        timestamp: new Date(),
      });

      // Update conversation metadata
      conversation.lastMessageAt = new Date();
      await conversation.save();

      this.logger.log(`Response sent to ${parsed.from}`);
    } catch (error) {
      this.logger.error(`Error processing message from ${parsed.from}:`, error);

      // Send fallback message
      try {
        await this.metaApiService.sendTextMessage({
          to: parsed.from,
          text: 'Disculpa, tuve un problema. Por favor intenta de nuevo en un momento.',
        });
      } catch (sendError) {
        this.logger.error('Failed to send error message:', sendError);
      }
    }
  }

  /**
   * Parse incoming webhook message into our format
   */
  private parseIncomingMessage(
    message: WebhookMessage,
    contactName?: string,
  ): ParsedIncomingMessage {
    let text = '';
    let type: ParsedIncomingMessage['type'] = 'other';

    switch (message.type) {
      case 'text':
        text = message.text?.body || '';
        type = 'text';
        break;

      case 'interactive':
        if (message.interactive?.type === 'button_reply') {
          text = message.interactive.button_reply?.title || '';
          type = 'interactive';
        } else if (message.interactive?.type === 'list_reply') {
          text = message.interactive.list_reply?.title || '';
          type = 'interactive';
        }
        break;

      case 'button':
        text = message.button?.text || '';
        type = 'button';
        break;

      default:
        type = 'other';
    }

    return {
      from: message.from,
      waMessageId: message.id,
      type,
      text,
      contactName,
      timestamp: new Date(parseInt(message.timestamp) * 1000),
    };
  }

  /**
   * Get or create a conversation document
   */
  private async getOrCreateConversation(
    waId: string,
    contactName?: string,
  ): Promise<WhatsAppConversationDocument> {
    let conversation = await this.conversationModel.findOne({
      waId,
      status: { $ne: 'closed' },
    });

    if (!conversation) {
      conversation = new this.conversationModel({
        waId,
        contactName,
        status: 'active',
        capturedData: {},
        messages: [],
      });
      this.logger.debug(`Created new conversation for ${waId}`);
    } else if (contactName && !conversation.contactName) {
      conversation.contactName = contactName;
    }

    return conversation;
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(
    waId: string,
  ): Promise<WhatsAppConversationDocument | null> {
    return this.conversationModel.findOne({ waId }).sort({ updatedAt: -1 });
  }

  /**
   * Close a conversation
   */
  async closeConversation(waId: string): Promise<void> {
    await this.conversationModel.updateMany(
      { waId, status: { $ne: 'closed' } },
      { status: 'closed' },
    );
    this.sessionService.delete(waId);
  }
}
