import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { LocalStorageService } from '../../shared/services/storage.service';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  type: 'text' | 'image' | 'voice' | 'location' | 'system';
  content?: string;
  attachment?: {
    url: string;
    thumbnailUrl?: string;
    mimeType?: string;
    fileName?: string;
    duration?: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: Date;
}

export interface ChatRoom {
  _id: string;
  type: 'service' | 'support';
  serviceRequestId?: string;
  participants: {
    userId: string;
    role: string;
    name: string;
    avatar?: string;
    isTyping?: boolean;
    lastSeen?: Date;
    isActive: boolean;
  }[];
  status: 'active' | 'archived' | 'closed';
  lastMessagePreview?: string;
  lastMessageAt?: Date;
  unreadCount: Record<string, number>;
}

export interface TypingEvent {
  userId: string;
  roomId: string;
  isTyping: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private storage = inject(LocalStorageService);
  private apiUrl = `${environment.apiUrl}/chat`;
  private socket: Socket | null = null;

  private roomsSubject = new BehaviorSubject<ChatRoom[]>([]);
  private currentRoomSubject = new BehaviorSubject<ChatRoom | null>(null);
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  rooms$ = this.roomsSubject.asObservable();
  currentRoom$ = this.currentRoomSubject.asObservable();
  messages$ = this.messagesSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();

  // Events
  onNewMessage = new Subject<ChatMessage>();
  onTyping = new Subject<TypingEvent>();
  onUserJoined = new Subject<{ userId: string; roomId: string }>();
  onUserLeft = new Subject<{ userId: string; roomId: string }>();
  onMessagesRead = new Subject<{ roomId: string; readBy: string; messageIds: string[] }>();

  private isConnected = false;

  connect(): void {
    if (this.isConnected || this.socket) return;

    const authData = this.storage.get('auth');
    const token = authData?.access_token;
    if (!token) return;

    this.socket = io(`${environment.apiUrl.replace('/api', '')}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Chat connected');
      this.loadRooms();
      this.loadUnreadCount();
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Chat disconnected');
    });

    this.socket.on('new-message', (data: { roomId: string; message: ChatMessage }) => {
      this.handleNewMessage(data.roomId, data.message);
    });

    this.socket.on('user-typing', (data: TypingEvent) => {
      this.onTyping.next(data);
      this.updateParticipantTyping(data.roomId, data.userId, data.isTyping);
    });

    this.socket.on('user-joined', (data: { userId: string; roomId: string }) => {
      this.onUserJoined.next(data);
    });

    this.socket.on('user-left', (data: { userId: string; roomId: string }) => {
      this.onUserLeft.next(data);
    });

    this.socket.on('messages-read', (data: { roomId: string; readBy: string; messageIds: string[] }) => {
      this.onMessagesRead.next(data);
      this.updateMessageStatus(data.messageIds, 'read');
    });

    this.socket.on('room-notification', (data: any) => {
      // Handle notification for rooms not currently active
      this.loadUnreadCount();
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  async loadRooms(): Promise<void> {
    try {
      const rooms = await this.http.get<ChatRoom[]>(`${this.apiUrl}/rooms`).toPromise();
      this.roomsSubject.next(rooms || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  }

  async loadUnreadCount(): Promise<void> {
    try {
      const result = await this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`).toPromise();
      this.unreadCountSubject.next(result?.count || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }

  async joinRoom(roomId: string): Promise<void> {
    if (!this.socket) return;

    return new Promise((resolve, reject) => {
      this.socket!.emit('join-room', { roomId }, async (response: any) => {
        if (response.success) {
          try {
            const room = await this.http.get<ChatRoom>(`${this.apiUrl}/rooms/${roomId}`).toPromise();
            this.currentRoomSubject.next(room || null);
            await this.loadMessages(roomId);
            resolve();
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  leaveRoom(roomId: string): void {
    if (!this.socket) return;

    this.socket.emit('leave-room', { roomId });
    this.currentRoomSubject.next(null);
    this.messagesSubject.next([]);
  }

  async loadMessages(roomId: string, before?: string): Promise<void> {
    try {
      const params: any = { limit: 50 };
      if (before) params.before = before;

      const messages = await this.http.get<ChatMessage[]>(
        `${this.apiUrl}/rooms/${roomId}/messages`,
        { params }
      ).toPromise();

      if (before) {
        // Prepend older messages
        this.messagesSubject.next([...(messages || []).reverse(), ...this.messagesSubject.value]);
      } else {
        this.messagesSubject.next((messages || []).reverse());
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  sendMessage(roomId: string, content: string, type: 'text' | 'image' | 'voice' | 'location' = 'text'): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      const message: any = { type };
      if (type === 'text') {
        message.content = content;
      }

      this.socket.emit('send-message', { roomId, message }, (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  sendImage(roomId: string, imageUrl: string, thumbnailUrl?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('send-message', {
        roomId,
        message: {
          type: 'image',
          attachment: { url: imageUrl, thumbnailUrl }
        }
      }, (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  sendLocation(roomId: string, latitude: number, longitude: number, address?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('send-message', {
        roomId,
        message: {
          type: 'location',
          location: { latitude, longitude, address }
        }
      }, (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  setTyping(roomId: string, isTyping: boolean): void {
    if (!this.socket) return;
    this.socket.emit('typing', { roomId, isTyping });
  }

  markAsRead(roomId: string, messageIds: string[]): void {
    if (!this.socket) return;
    this.socket.emit('mark-read', { roomId, messageIds });
  }

  markAllAsRead(roomId: string): void {
    if (!this.socket) return;
    this.socket.emit('mark-all-read', { roomId });
  }

  async getRoomByServiceRequest(serviceRequestId: string): Promise<ChatRoom | null> {
    try {
      return await this.http.get<ChatRoom | null>(
        `${this.apiUrl}/service/${serviceRequestId}`
      ).toPromise() || null;
    } catch (error) {
      return null;
    }
  }

  private handleNewMessage(roomId: string, message: ChatMessage): void {
    const currentRoom = this.currentRoomSubject.value;

    if (currentRoom && currentRoom._id === roomId) {
      const messages = [...this.messagesSubject.value, message];
      this.messagesSubject.next(messages);
    }

    this.onNewMessage.next(message);
    this.loadUnreadCount();
    this.loadRooms(); // Refresh room list for last message preview
  }

  private updateParticipantTyping(roomId: string, oderId: string, isTyping: boolean): void {
    const currentRoom = this.currentRoomSubject.value;
    if (currentRoom && currentRoom._id === roomId) {
      const updatedParticipants = currentRoom.participants.map(p =>
        p.userId === oderId ? { ...p, isTyping } : p
      );
      this.currentRoomSubject.next({ ...currentRoom, participants: updatedParticipants });
    }
  }

  private updateMessageStatus(messageIds: string[], status: 'delivered' | 'read'): void {
    const messages = this.messagesSubject.value.map(m =>
      messageIds.includes(m.id) ? { ...m, status } : m
    );
    this.messagesSubject.next(messages);
  }

  getCurrentUserId(): string {
    const authData = this.storage.get('auth');
    return authData?.user?.id || '';
  }
}
