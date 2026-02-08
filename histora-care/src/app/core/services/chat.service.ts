import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, Subject, BehaviorSubject, firstValueFrom } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface ChatRoom {
  _id: string;
  type: 'service' | 'support';
  serviceRequestId?: string;
  participants: ChatParticipant[];
  status: 'active' | 'archived' | 'closed';
  lastMessageId?: string;
  lastMessagePreview?: string;
  lastMessageAt?: Date;
  unreadCount: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatParticipant {
  userId: string;
  role: 'patient' | 'nurse';
  name: string;
  avatar?: string;
  joinedAt: Date;
  isActive: boolean;
  isTyping?: boolean;
  lastSeen?: Date;
}

export interface ChatMessage {
  _id: string;
  roomId: string;
  senderId: string;
  type: 'text' | 'image' | 'voice' | 'location' | 'system' | 'quick_reply';
  content?: string;
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
  };
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  readBy: string[];
  readAt?: Date;
  createdAt: Date;
  isDeleted?: boolean;
}

export interface SendMessageDto {
  content?: string;
  type?: 'text' | 'image' | 'voice' | 'location';
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
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  private socket: Socket | null = null;
  private currentRoomId: string | null = null;

  // State signals
  private _messages = signal<ChatMessage[]>([]);
  private _currentRoom = signal<ChatRoom | null>(null);
  private _isTyping = signal<{ userId: string; name: string } | null>(null);
  private _unreadCount = signal<number>(0);
  private _isConnected = signal<boolean>(false);

  // Computed values
  messages = computed(() => this._messages());
  currentRoom = computed(() => this._currentRoom());
  isTyping = computed(() => this._isTyping());
  unreadCount = computed(() => this._unreadCount());
  isConnected = computed(() => this._isConnected());

  // Subjects for events
  private newMessage$ = new Subject<ChatMessage>();
  private messageRead$ = new Subject<{ roomId: string; messageIds: string[]; readBy: string }>();
  private roomNotification$ = new Subject<{ roomId: string; type: string; preview: string; senderName: string; senderAvatar?: string }>();

  // Get observable for new messages
  onNewMessage(): Observable<ChatMessage> {
    return this.newMessage$.asObservable();
  }

  onMessageRead(): Observable<{ roomId: string; messageIds: string[]; readBy: string }> {
    return this.messageRead$.asObservable();
  }

  onRoomNotification(): Observable<{ roomId: string; type: string; preview: string; senderName: string; senderAvatar?: string }> {
    return this.roomNotification$.asObservable();
  }

  /**
   * Connect to chat WebSocket
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    const token = await this.authService.getToken();
    if (!token) {
      console.warn('Cannot connect to chat: No auth token');
      return;
    }

    // Use wsUrl from environment for WebSocket connection
    const wsUrl = environment.wsUrl || environment.apiUrl.replace('/api', '');

    console.log('[ChatService] Connecting to WebSocket:', wsUrl);

    this.socket = io(`${wsUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling'], // Allow polling fallback
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.setupSocketListeners();
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Chat connected');
      this._isConnected.set(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Chat disconnected');
      this._isConnected.set(false);
    });

    this.socket.on('connected', (data: { userId: string }) => {
      console.log('Chat authenticated as:', data.userId);
    });

    this.socket.on('new-message', (data: { roomId: string; message: ChatMessage }) => {
      if (data.roomId === this.currentRoomId) {
        this._messages.update(msgs => [...msgs, data.message]);
      }
      this.newMessage$.next(data.message);

      // Update unread count if message is from another user
      const currentUserId = this.authService.user()?.id;
      if (data.message.senderId !== currentUserId) {
        this._unreadCount.update(count => count + 1);
      }
    });

    this.socket.on('user-typing', (data: { userId: string; roomId: string; isTyping: boolean }) => {
      if (data.roomId === this.currentRoomId) {
        if (data.isTyping) {
          const room = this._currentRoom();
          const participant = room?.participants.find(p => p.userId === data.userId);
          this._isTyping.set({ userId: data.userId, name: participant?.name || '' });
        } else {
          this._isTyping.set(null);
        }
      }
    });

    this.socket.on('messages-read', (data: { roomId: string; readBy: string; messageIds: string[] }) => {
      if (data.roomId === this.currentRoomId) {
        this._messages.update(msgs =>
          msgs.map(msg =>
            data.messageIds.includes(msg._id)
              ? { ...msg, status: 'read' as const, readBy: [...msg.readBy, data.readBy] }
              : msg
          )
        );
      }
      this.messageRead$.next(data);
    });

    // Handle all-read event (when other user opens chat and reads all messages)
    this.socket.on('all-read', (data: { roomId: string; readBy: string }) => {
      if (data.roomId === this.currentRoomId) {
        this._messages.update(msgs =>
          msgs.map(msg =>
            msg.senderId !== data.readBy && msg.status !== 'read'
              ? { ...msg, status: 'read' as const, readBy: [...(msg.readBy || []), data.readBy] }
              : msg
          )
        );
      }
    });

    this.socket.on('room-notification', (data: { roomId: string; type: string; preview: string; senderName: string; senderAvatar?: string }) => {
      // Skip if user is currently viewing this room (they get new-message instead)
      if (this.currentRoomId === data.roomId) return;

      this._unreadCount.update(count => count + 1);
      this.roomNotification$.next(data);
    });
  }

  /**
   * Disconnect from chat WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._isConnected.set(false);
    this.currentRoomId = null;
  }

  /**
   * Join a chat room
   */
  async joinRoom(roomId: string): Promise<void> {
    if (!this.socket?.connected) {
      await this.connect();
    }

    this.currentRoomId = roomId;

    return new Promise((resolve, reject) => {
      this.socket?.emit('join-room', { roomId }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Leave the current chat room
   */
  leaveRoom(): void {
    if (this.socket && this.currentRoomId) {
      this.socket.emit('leave-room', { roomId: this.currentRoomId });
      this.currentRoomId = null;
      this._messages.set([]);
      this._currentRoom.set(null);
      this._isTyping.set(null);
    }
  }

  /**
   * Send a message
   */
  async sendMessage(message: SendMessageDto): Promise<ChatMessage> {
    if (!this.socket || !this.currentRoomId) {
      throw new Error('Not connected to a chat room');
    }

    return new Promise((resolve, reject) => {
      this.socket?.emit(
        'send-message',
        { roomId: this.currentRoomId, message },
        (response: { success: boolean; messageId?: string; error?: string }) => {
          if (response.success) {
            // Message will be added via the new-message event
            resolve({ _id: response.messageId } as ChatMessage);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });
  }

  /**
   * Emit typing status
   */
  emitTyping(isTyping: boolean = true): void {
    if (this.socket && this.currentRoomId) {
      this.socket.emit('typing', { roomId: this.currentRoomId, isTyping });
    }
  }

  /**
   * Mark messages as read
   */
  markAsRead(messageIds: string[]): void {
    if (this.socket && this.currentRoomId) {
      this.socket.emit('mark-read', { roomId: this.currentRoomId, messageIds });
    }
  }

  /**
   * Mark all messages as read
   */
  markAllAsRead(): void {
    if (this.socket && this.currentRoomId) {
      this.socket.emit('mark-all-read', { roomId: this.currentRoomId });
      this._unreadCount.set(0);
    }
  }

  // ==================== REST API Methods ====================

  /**
   * Get or create chat room for a service request
   */
  async getOrCreateServiceRoom(serviceRequestId: string): Promise<ChatRoom> {
    const room = await firstValueFrom(
      this.api.post<ChatRoom>(`/chat/service/${serviceRequestId}/room`, {})
    );
    this._currentRoom.set(room);
    return room;
  }

  /**
   * Get chat room by service request ID
   */
  async getRoomByServiceRequest(serviceRequestId: string): Promise<ChatRoom | null> {
    try {
      const room = await firstValueFrom(
        this.api.get<ChatRoom | null>(`/chat/service/${serviceRequestId}`)
      );
      return room;
    } catch {
      return null;
    }
  }

  /**
   * Get user's chat rooms
   */
  getRooms(status?: 'active' | 'archived'): Observable<ChatRoom[]> {
    const params: Record<string, string> = {};
    if (status) {
      params['status'] = status;
    }
    return this.api.get<ChatRoom[]>('/chat/rooms', params);
  }

  /**
   * Get room details
   */
  async getRoom(roomId: string): Promise<ChatRoom> {
    const room = await firstValueFrom(
      this.api.get<ChatRoom>(`/chat/rooms/${roomId}`)
    );
    this._currentRoom.set(room);
    return room;
  }

  /**
   * Get messages for a room (REST fallback)
   */
  async getMessages(roomId: string, limit = 50, before?: string): Promise<ChatMessage[]> {
    const params: any = { limit };
    if (before) params.before = before;

    const messages = await firstValueFrom(
      this.api.get<ChatMessage[]>(`/chat/rooms/${roomId}/messages`, params)
    );

    // Messages come in reverse order (newest first), so reverse for display
    const sorted = [...messages].reverse();
    this._messages.set(sorted);

    return sorted;
  }

  /**
   * Get total unread count
   */
  async fetchUnreadCount(): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.api.get<{ count: number }>('/chat/unread-count')
      );
      this._unreadCount.set(response.count);
      return response.count;
    } catch {
      return 0;
    }
  }

  /**
   * Send message via REST (fallback)
   */
  sendMessageRest(roomId: string, message: SendMessageDto): Observable<ChatMessage> {
    return this.api.post<ChatMessage>(`/chat/rooms/${roomId}/messages`, message);
  }

  /**
   * Archive a room
   */
  archiveRoom(roomId: string): Observable<ChatRoom> {
    return this.api.post<ChatRoom>(`/chat/rooms/${roomId}/archive`, {});
  }

  /**
   * Delete a message
   */
  deleteMessage(messageId: string): Observable<ChatMessage> {
    return this.api.delete<ChatMessage>(`/chat/messages/${messageId}`);
  }

  /**
   * Clear current room state
   */
  clearCurrentRoom(): void {
    this._messages.set([]);
    this._currentRoom.set(null);
    this._isTyping.set(null);
    this.currentRoomId = null;
  }
}
