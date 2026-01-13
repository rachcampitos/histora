import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatMessage, ChatMessageDocument, MessageType, MessageStatus } from './schema/chat-message.schema';
import { ChatRoom, ChatRoomDocument, RoomType, RoomStatus } from './schema/chat-room.schema';

export interface CreateRoomDto {
  type: RoomType;
  serviceRequestId?: string;
  participants: {
    userId: string;
    role: string;
    name: string;
    avatar?: string;
  }[];
}

export interface SendMessageDto {
  content?: string;
  type?: MessageType;
  attachment?: {
    url: string;
    thumbnailUrl?: string;
    mimeType?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  };
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(ChatRoom.name)
    private roomModel: Model<ChatRoomDocument>,
    @InjectModel(ChatMessage.name)
    private messageModel: Model<ChatMessageDocument>,
  ) {}

  // ==================== Room Management ====================

  async createRoom(dto: CreateRoomDto): Promise<ChatRoom> {
    const room = new this.roomModel({
      type: dto.type,
      serviceRequestId: dto.serviceRequestId ? new Types.ObjectId(dto.serviceRequestId) : undefined,
      participants: dto.participants.map(p => ({
        userId: new Types.ObjectId(p.userId),
        role: p.role,
        name: p.name,
        avatar: p.avatar,
        joinedAt: new Date(),
        isActive: true,
      })),
      status: RoomStatus.ACTIVE,
      unreadCount: {},
    });

    return room.save();
  }

  async getRoomByServiceRequest(serviceRequestId: string): Promise<ChatRoom | null> {
    return this.roomModel.findOne({
      serviceRequestId: new Types.ObjectId(serviceRequestId),
      status: RoomStatus.ACTIVE,
    });
  }

  async getOrCreateServiceRoom(
    serviceRequestId: string,
    patientInfo: { userId: string; name: string; avatar?: string },
    nurseInfo: { userId: string; name: string; avatar?: string },
  ): Promise<ChatRoom> {
    let room = await this.getRoomByServiceRequest(serviceRequestId);

    if (!room) {
      room = await this.createRoom({
        type: RoomType.SERVICE,
        serviceRequestId,
        participants: [
          { userId: patientInfo.userId, role: 'patient', name: patientInfo.name, avatar: patientInfo.avatar },
          { userId: nurseInfo.userId, role: 'nurse', name: nurseInfo.name, avatar: nurseInfo.avatar },
        ],
      });

      this.logger.log(`Created chat room for service ${serviceRequestId}`);
    }

    return room;
  }

  async getUserRooms(userId: string, status?: RoomStatus): Promise<ChatRoom[]> {
    const query: any = {
      'participants.userId': new Types.ObjectId(userId),
      'participants.isActive': true,
    };

    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: RoomStatus.CLOSED };
    }

    return this.roomModel
      .find(query)
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .exec();
  }

  async getRoom(roomId: string, userId: string): Promise<ChatRoom> {
    const room = await this.roomModel.findById(roomId);

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    const isParticipant = room.participants.some(
      p => p.userId.toString() === userId && p.isActive,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this chat');
    }

    return room;
  }

  async archiveRoom(roomId: string, userId: string): Promise<ChatRoomDocument> {
    const room = await this.getRoom(roomId, userId);

    room.status = RoomStatus.ARCHIVED;
    room.archivedAt = new Date();

    return (room as ChatRoomDocument).save();
  }

  async closeRoom(roomId: string, reason?: string): Promise<ChatRoomDocument> {
    const room = await this.roomModel.findById(roomId);

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    room.status = RoomStatus.CLOSED;
    room.closedAt = new Date();
    room.closeReason = reason;

    return room.save();
  }

  // ==================== Message Management ====================

  async sendMessage(
    roomId: string,
    senderId: string,
    dto: SendMessageDto,
  ): Promise<ChatMessageDocument> {
    const room = await this.getRoom(roomId, senderId) as ChatRoomDocument;

    const message = new this.messageModel({
      roomId: new Types.ObjectId(roomId),
      senderId: new Types.ObjectId(senderId),
      type: dto.type || MessageType.TEXT,
      content: dto.content,
      attachment: dto.attachment,
      location: dto.location,
      status: MessageStatus.SENT,
      metadata: dto.metadata,
    });

    await message.save();

    // Update room with last message info
    const preview = dto.content?.substring(0, 100) ||
                    (dto.type === MessageType.IMAGE ? '📷 Imagen' :
                     dto.type === MessageType.VOICE ? '🎤 Audio' :
                     dto.type === MessageType.LOCATION ? '📍 Ubicación' : '');

    room.lastMessageId = message._id as Types.ObjectId;
    room.lastMessagePreview = preview;
    room.lastMessageAt = new Date();

    // Increment unread count for other participants
    room.participants.forEach(p => {
      if (p.userId.toString() !== senderId && p.isActive) {
        const key = p.userId.toString();
        room.unreadCount[key] = (room.unreadCount[key] || 0) + 1;
      }
    });

    await room.save();

    return message;
  }

  async getMessages(
    roomId: string,
    userId: string,
    limit = 50,
    before?: string,
  ): Promise<ChatMessage[]> {
    await this.getRoom(roomId, userId); // Verify access

    const query: any = {
      roomId: new Types.ObjectId(roomId),
      isDeleted: false,
    };

    if (before) {
      query._id = { $lt: new Types.ObjectId(before) };
    }

    return this.messageModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async markAsRead(roomId: string, userId: string, messageIds: string[]): Promise<void> {
    const room = await this.getRoom(roomId, userId) as ChatRoomDocument;

    // Update messages
    await this.messageModel.updateMany(
      {
        _id: { $in: messageIds.map(id => new Types.ObjectId(id)) },
        roomId: new Types.ObjectId(roomId),
      },
      {
        $set: { status: MessageStatus.READ, readAt: new Date() },
        $addToSet: { readBy: new Types.ObjectId(userId) },
      },
    );

    // Reset unread count for user
    room.unreadCount[userId] = 0;
    await room.save();
  }

  async markAllAsRead(roomId: string, userId: string): Promise<void> {
    const room = await this.getRoom(roomId, userId) as ChatRoomDocument;

    // Update all unread messages from other users
    await this.messageModel.updateMany(
      {
        roomId: new Types.ObjectId(roomId),
        senderId: { $ne: new Types.ObjectId(userId) },
        status: { $ne: MessageStatus.READ },
      },
      {
        $set: { status: MessageStatus.READ, readAt: new Date() },
        $addToSet: { readBy: new Types.ObjectId(userId) },
      },
    );

    room.unreadCount[userId] = 0;
    await room.save();
  }

  async deleteMessage(messageId: string, userId: string): Promise<ChatMessage> {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = undefined;
    message.attachment = undefined;

    return message.save();
  }

  // ==================== Typing Indicators ====================

  async setTyping(roomId: string, userId: string, isTyping: boolean): Promise<void> {
    await this.roomModel.updateOne(
      {
        _id: new Types.ObjectId(roomId),
        'participants.userId': new Types.ObjectId(userId),
      },
      {
        $set: { 'participants.$.isTyping': isTyping },
      },
    );
  }

  async updateLastSeen(roomId: string, userId: string): Promise<void> {
    await this.roomModel.updateOne(
      {
        _id: new Types.ObjectId(roomId),
        'participants.userId': new Types.ObjectId(userId),
      },
      {
        $set: { 'participants.$.lastSeen': new Date() },
      },
    );
  }

  // ==================== Statistics ====================

  async getUnreadCount(userId: string): Promise<number> {
    const rooms = await this.roomModel.find({
      'participants.userId': new Types.ObjectId(userId),
      'participants.isActive': true,
      status: RoomStatus.ACTIVE,
    });

    let total = 0;
    rooms.forEach(room => {
      total += room.unreadCount[userId] || 0;
    });

    return total;
  }
}
