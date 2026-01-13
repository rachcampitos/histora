import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatRoomDocument = ChatRoom & Document;

export enum RoomType {
  SERVICE = 'service', // Chat tied to a service request
  SUPPORT = 'support', // Support chat
  GROUP = 'group', // Group chat (future)
}

export enum RoomStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  CLOSED = 'closed',
}

@Schema({ _id: false })
export class RoomParticipant {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  role: string; // 'patient', 'nurse', 'admin'

  @Prop()
  name: string;

  @Prop()
  avatar?: string;

  @Prop({ default: Date.now })
  joinedAt: Date;

  @Prop()
  leftAt?: Date;

  @Prop({ default: false })
  isTyping: boolean;

  @Prop()
  lastSeen?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: true })
  notificationsEnabled: boolean;
}

@Schema({ timestamps: true })
export class ChatRoom {
  @Prop({ required: true, enum: Object.values(RoomType), default: RoomType.SERVICE })
  type: RoomType;

  @Prop({ type: Types.ObjectId, ref: 'ServiceRequest' })
  serviceRequestId?: Types.ObjectId;

  @Prop({ type: [RoomParticipant], required: true })
  participants: RoomParticipant[];

  @Prop({ required: true, enum: Object.values(RoomStatus), default: RoomStatus.ACTIVE })
  status: RoomStatus;

  @Prop({ type: Types.ObjectId, ref: 'ChatMessage' })
  lastMessageId?: Types.ObjectId;

  @Prop()
  lastMessagePreview?: string;

  @Prop()
  lastMessageAt?: Date;

  @Prop({ type: Object, default: {} })
  unreadCount: Record<string, number>; // userId -> count

  @Prop()
  archivedAt?: Date;

  @Prop()
  closedAt?: Date;

  @Prop()
  closeReason?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);

// Indexes
ChatRoomSchema.index({ 'participants.userId': 1 });
ChatRoomSchema.index({ serviceRequestId: 1 });
ChatRoomSchema.index({ status: 1 });
ChatRoomSchema.index({ lastMessageAt: -1 });
ChatRoomSchema.index({ 'participants.userId': 1, status: 1, lastMessageAt: -1 });
