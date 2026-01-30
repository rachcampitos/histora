import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
class MessageEntry {
  @Prop({ required: true, enum: ['inbound', 'outbound'] })
  direction: 'inbound' | 'outbound';

  @Prop({ required: true })
  text: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop()
  waMessageId?: string;
}

const MessageEntrySchema = SchemaFactory.createForClass(MessageEntry);

@Schema({ _id: false })
class CapturedData {
  @Prop()
  name?: string;

  @Prop()
  district?: string;

  @Prop()
  serviceInterest?: string;

  @Prop()
  urgency?: string;

  @Prop({ min: 0, max: 100 })
  leadScore?: number;
}

const CapturedDataSchema = SchemaFactory.createForClass(CapturedData);

@Schema({ timestamps: true, collection: 'whatsapp_conversations' })
export class WhatsAppConversation {
  @Prop({ required: true, index: true })
  waId: string; // Numero de WhatsApp (ej: 51987654321)

  @Prop()
  contactName?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ default: 'unknown', enum: ['patient', 'nurse', 'unknown'] })
  userType: 'patient' | 'nurse' | 'unknown';

  @Prop({ type: CapturedDataSchema, default: {} })
  capturedData: CapturedData;

  @Prop({ type: [MessageEntrySchema], default: [] })
  messages: MessageEntry[];

  @Prop({ default: 0 })
  messageCount: number;

  @Prop()
  lastMessageAt?: Date;

  @Prop({ default: 'active', enum: ['active', 'completed', 'escalated'] })
  status: 'active' | 'completed' | 'escalated';

  @Prop()
  escalatedTo?: string;

  @Prop()
  escalationReason?: string;

  // Timestamps added by Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const WhatsAppConversationSchema =
  SchemaFactory.createForClass(WhatsAppConversation);

export type WhatsAppConversationDocument = WhatsAppConversation & Document;

// Indices for efficient queries
WhatsAppConversationSchema.index({ waId: 1 });
WhatsAppConversationSchema.index({ userId: 1 });
WhatsAppConversationSchema.index({ status: 1 });
WhatsAppConversationSchema.index({ lastMessageAt: -1 });
WhatsAppConversationSchema.index({ createdAt: -1 });
