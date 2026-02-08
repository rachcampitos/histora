import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService, SendMessageDto } from '../chat.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: [
      'https://app.nurse-lite.com',
      'https://nurse-lite.com',
      ...(process.env.NODE_ENV !== 'production'
        ? ['http://localhost:8100', 'http://localhost:4200']
        : []),
    ],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> socketIds
  private messageTimestamps: Map<string, number[]> = new Map(); // userId -> timestamps

  private isRateLimited(userId: string, maxMessages = 5, windowMs = 10000): boolean {
    const now = Date.now();
    const timestamps = this.messageTimestamps.get(userId) || [];
    const recent = timestamps.filter(t => now - t < windowMs);
    if (recent.length >= maxMessages) return true;
    recent.push(now);
    this.messageTimestamps.set(userId, recent);
    return false;
  }

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token ||
                    client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Connection rejected: No token provided');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub || payload.userId;
      client.userRole = payload.role;

      // Add to connected users
      const userId = client.userId!;
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)?.add(client.id);

      // Join user's personal room for direct notifications
      client.join(`user:${client.userId}`);

      this.logger.log(`User ${client.userId} connected (socket: ${client.id})`);

      // Send connection confirmation
      client.emit('connected', { userId: client.userId });

    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.connectedUsers.get(client.userId);
      userSockets?.delete(client.id);

      if (userSockets?.size === 0) {
        this.connectedUsers.delete(client.userId);
        this.messageTimestamps.delete(client.userId);
      }

      this.logger.log(`User ${client.userId} disconnected (socket: ${client.id})`);
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      // Verify user has access to the room
      await this.chatService.getRoom(data.roomId, client.userId!);

      client.join(`room:${data.roomId}`);
      await this.chatService.updateLastSeen(data.roomId, client.userId!);

      this.logger.log(`User ${client.userId} joined room ${data.roomId}`);

      // Notify others in the room
      client.to(`room:${data.roomId}`).emit('user-joined', {
        userId: client.userId,
        roomId: data.roomId,
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Join room error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(`room:${data.roomId}`);
    await this.chatService.setTyping(data.roomId, client.userId!, false);

    client.to(`room:${data.roomId}`).emit('user-left', {
      userId: client.userId,
      roomId: data.roomId,
    });

    return { success: true };
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; message: SendMessageDto },
  ) {
    try {
      if (this.isRateLimited(client.userId!)) {
        return { success: false, error: 'Demasiados mensajes. Espera unos segundos.' };
      }

      const message = await this.chatService.sendMessage(
        data.roomId,
        client.userId!,
        data.message,
      );

      // Broadcast to all in the room (including sender for confirmation)
      this.server.to(`room:${data.roomId}`).emit('new-message', {
        roomId: data.roomId,
        message: {
          _id: (message as any)._id,
          senderId: message.senderId,
          type: message.type,
          content: message.content,
          attachment: message.attachment,
          location: message.location,
          status: message.status,
          createdAt: (message as any).createdAt,
        },
      });

      // Also notify users not in the room via their personal channel
      const room = await this.chatService.getRoom(data.roomId, client.userId!);
      const senderParticipant = room.participants.find(
        pp => pp.userId.toString() === client.userId,
      );
      room.participants.forEach(p => {
        if (p.userId.toString() !== client.userId && p.isActive) {
          this.server.to(`user:${p.userId}`).emit('room-notification', {
            roomId: data.roomId,
            type: 'new_message',
            preview: data.message.content?.substring(0, 50) || 'Nueva mensaje',
            senderName: senderParticipant?.name,
            senderAvatar: senderParticipant?.avatar,
          });
        }
      });

      // Clear typing indicator
      await this.chatService.setTyping(data.roomId, client.userId!, false);

      return { success: true, messageId: (message as any)._id };
    } catch (error) {
      this.logger.error('Send message error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; isTyping: boolean },
  ) {
    await this.chatService.setTyping(data.roomId, client.userId!, data.isTyping);

    client.to(`room:${data.roomId}`).emit('user-typing', {
      userId: client.userId,
      roomId: data.roomId,
      isTyping: data.isTyping,
    });

    return { success: true };
  }

  @SubscribeMessage('mark-read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; messageIds: string[] },
  ) {
    try {
      await this.chatService.markAsRead(data.roomId, client.userId!, data.messageIds);

      // Notify sender that messages were read
      this.server.to(`room:${data.roomId}`).emit('messages-read', {
        roomId: data.roomId,
        readBy: client.userId,
        messageIds: data.messageIds,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('mark-all-read')
  async handleMarkAllRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      await this.chatService.markAllAsRead(data.roomId, client.userId!);

      this.server.to(`room:${data.roomId}`).emit('all-read', {
        roomId: data.roomId,
        readBy: client.userId,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ==================== Utility Methods ====================

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  async notifyUser(userId: string, event: string, data: any): Promise<void> {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  async notifyRoom(roomId: string, event: string, data: any): Promise<void> {
    this.server.to(`room:${roomId}`).emit(event, data);
  }
}
