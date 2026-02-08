import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@stencil/core/internal/client', () => ({
  registerInstance: vi.fn(),
  getElement: vi.fn(),
  Host: vi.fn(),
  h: vi.fn(),
  proxyCustomElement: vi.fn((Cstr: any) => Cstr),
  HTMLElement: typeof HTMLElement !== 'undefined' ? HTMLElement : class {},
  defineCustomElement: vi.fn(),
  attachShadow: vi.fn(),
  createEvent: vi.fn(),
  setPlatformHelpers: vi.fn(),
  Build: { isBrowser: true, isDev: true },
}));

vi.mock('@ionic/core/components', () => ({
  isPlatform: vi.fn().mockReturnValue(false),
  getPlatforms: vi.fn().mockReturnValue(['desktop']),
  LIFECYCLE_WILL_ENTER: 'ionViewWillEnter',
  LIFECYCLE_DID_ENTER: 'ionViewDidEnter',
  LIFECYCLE_WILL_LEAVE: 'ionViewWillLeave',
  LIFECYCLE_DID_LEAVE: 'ionViewDidLeave',
  LIFECYCLE_WILL_UNLOAD: 'ionViewWillUnload',
  componentOnReady: vi.fn().mockResolvedValue(undefined),
  initialize: vi.fn(),
}));

vi.mock('@ionic/core/loader', () => ({
  defineCustomElements: vi.fn().mockResolvedValue(undefined),
  setNonce: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn().mockReturnValue(false),
    getPlatform: vi.fn().mockReturnValue('web'),
    isPluginAvailable: vi.fn().mockReturnValue(false),
    convertFileSrc: vi.fn((src: string) => src),
  },
  registerPlugin: vi.fn(),
  WebPlugin: class WebPlugin {},
}));

vi.mock('socket.io-client', () => ({
  io: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
    id: 'mock-socket-id',
  }),
}));

import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { ChatService } from './chat.service';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { createMockApiService, createMockAuthService } from '../../../testing';
import { of, firstValueFrom } from 'rxjs';
import { io } from 'socket.io-client';

describe('ChatService', () => {
  let service: ChatService;
  let mockApi: ReturnType<typeof createMockApiService>;
  let mockAuth: ReturnType<typeof createMockAuthService>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockApi = createMockApiService();
    mockAuth = createMockAuthService();

    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: ApiService, useValue: mockApi },
        { provide: AuthService, useValue: mockAuth },
      ],
    });

    service = TestBed.inject(ChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ======= Initial State =======

  it('should have empty messages initially', () => {
    expect(service.messages()).toEqual([]);
  });

  it('should have null currentRoom initially', () => {
    expect(service.currentRoom()).toBeNull();
  });

  it('should have isConnected false initially', () => {
    expect(service.isConnected()).toBe(false);
  });

  it('should have unreadCount 0 initially', () => {
    expect(service.unreadCount()).toBe(0);
  });

  it('should have isTyping null initially', () => {
    expect(service.isTyping()).toBeNull();
  });

  // ======= connect() =======

  it('should not connect without auth token', async () => {
    mockAuth.getToken.mockResolvedValue(null);
    await service.connect();
    expect(io as any).not.toHaveBeenCalled();
  });

  it('should connect with auth token', async () => {
    mockAuth.getToken.mockResolvedValue('test-token');
    await service.connect();
    expect(io as any).toHaveBeenCalledWith(
      expect.stringContaining('/chat'),
      expect.objectContaining({
        auth: { token: 'test-token' },
        transports: ['websocket', 'polling'],
      })
    );
  });

  it('should not reconnect if already connected', async () => {
    mockAuth.getToken.mockResolvedValue('test-token');

    // First connect
    const mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      connected: true,
      id: 'mock-id',
      removeAllListeners: vi.fn(),
    };
    (io as any).mockReturnValueOnce(mockSocket as any);

    await service.connect();
    // Attempt second connect
    await service.connect();

    // io should only be called once
    expect(io as any).toHaveBeenCalledTimes(1);
  });

  // ======= disconnect() =======

  it('should disconnect and clean up', async () => {
    mockAuth.getToken.mockResolvedValue('test-token');
    const mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      connected: false,
      id: 'mock-id',
      removeAllListeners: vi.fn(),
    };
    (io as any).mockReturnValueOnce(mockSocket as any);

    await service.connect();
    service.disconnect();

    expect(mockSocket.removeAllListeners).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(service.isConnected()).toBe(false);
  });

  it('should handle disconnect when not connected', () => {
    // Should not throw
    expect(() => service.disconnect()).not.toThrow();
  });

  // ======= Socket Events =======

  describe('socket event listeners', () => {
    let mockSocket: any;
    let eventHandlers: Record<string, Function>;

    beforeEach(async () => {
      eventHandlers = {};
      mockSocket = {
        on: vi.fn((event: string, handler: Function) => {
          eventHandlers[event] = handler;
        }),
        off: vi.fn(),
        emit: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        connected: false,
        id: 'mock-id',
        removeAllListeners: vi.fn(),
      };

      mockAuth.getToken.mockResolvedValue('test-token');
      (io as any).mockReturnValueOnce(mockSocket as any);
      await service.connect();
    });

    it('should set isConnected true on connect event', () => {
      eventHandlers['connect']();
      expect(service.isConnected()).toBe(true);
    });

    it('should set isConnected false on disconnect event', () => {
      eventHandlers['connect']();
      expect(service.isConnected()).toBe(true);
      eventHandlers['disconnect']();
      expect(service.isConnected()).toBe(false);
    });

    it('should handle new-message for current room', () => {
      // Set current room by joining
      (service as any).currentRoomId = 'room1';
      mockAuth._setUser({ id: 'user1' });

      const message = { _id: 'msg1', roomId: 'room1', senderId: 'user2', readBy: [] };
      eventHandlers['new-message']({ roomId: 'room1', message });

      expect(service.messages()).toHaveLength(1);
      expect(service.messages()[0]._id).toBe('msg1');
    });

    it('should increment unread count for messages from other users', () => {
      (service as any).currentRoomId = 'room1';
      mockAuth._setUser({ id: 'user1' });

      eventHandlers['new-message']({
        roomId: 'room1',
        message: { _id: 'msg1', senderId: 'user2', readBy: [] },
      });

      expect(service.unreadCount()).toBe(1);
    });

    it('should not increment unread for own messages', () => {
      (service as any).currentRoomId = 'room1';
      mockAuth._setUser({ id: 'user1' });

      eventHandlers['new-message']({
        roomId: 'room1',
        message: { _id: 'msg1', senderId: 'user1', readBy: [] },
      });

      expect(service.unreadCount()).toBe(0);
    });

    it('should not add message if from different room', () => {
      (service as any).currentRoomId = 'room1';
      mockAuth._setUser({ id: 'user1' });

      eventHandlers['new-message']({
        roomId: 'room2',
        message: { _id: 'msg1', senderId: 'user2', readBy: [] },
      });

      expect(service.messages()).toHaveLength(0);
    });

    it('should handle user-typing event', () => {
      (service as any).currentRoomId = 'room1';
      (service as any)._currentRoom.set({
        _id: 'room1',
        participants: [{ userId: 'nurse1', name: 'Maria' }],
      });

      eventHandlers['user-typing']({ userId: 'nurse1', roomId: 'room1', isTyping: true });
      expect(service.isTyping()).toEqual({ userId: 'nurse1', name: 'Maria' });
    });

    it('should clear typing when isTyping is false', () => {
      (service as any).currentRoomId = 'room1';

      eventHandlers['user-typing']({ userId: 'nurse1', roomId: 'room1', isTyping: false });
      expect(service.isTyping()).toBeNull();
    });

    it('should handle messages-read event', () => {
      (service as any).currentRoomId = 'room1';
      (service as any)._messages.set([
        { _id: 'msg1', status: 'sent', readBy: [] },
        { _id: 'msg2', status: 'sent', readBy: [] },
      ]);

      eventHandlers['messages-read']({
        roomId: 'room1',
        readBy: 'user2',
        messageIds: ['msg1'],
      });

      expect(service.messages()[0].status).toBe('read');
      expect(service.messages()[0].readBy).toContain('user2');
      expect(service.messages()[1].status).toBe('sent');
    });

    it('should handle all-read event', () => {
      (service as any).currentRoomId = 'room1';
      (service as any)._messages.set([
        { _id: 'msg1', senderId: 'user1', status: 'sent', readBy: [] },
        { _id: 'msg2', senderId: 'user2', status: 'sent', readBy: [] },
      ]);

      eventHandlers['all-read']({ roomId: 'room1', readBy: 'user2' });

      // Only messages not sent by user2 should be marked as read
      expect(service.messages()[0].status).toBe('read');
      expect(service.messages()[1].status).toBe('sent'); // user2's own message
    });

    it('should handle room-notification for non-current room', () => {
      (service as any).currentRoomId = 'room1';

      eventHandlers['room-notification']({
        roomId: 'room2',
        type: 'message',
        preview: 'Hello',
        senderName: 'Maria',
      });

      expect(service.unreadCount()).toBe(1);
    });

    it('should skip room-notification for current room', () => {
      (service as any).currentRoomId = 'room1';

      eventHandlers['room-notification']({
        roomId: 'room1',
        type: 'message',
        preview: 'Hello',
        senderName: 'Maria',
      });

      expect(service.unreadCount()).toBe(0);
    });
  });

  // ======= joinRoom() =======

  it('should join room and set currentRoomId', async () => {
    mockAuth.getToken.mockResolvedValue('test-token');
    const mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn((_event: string, _data: any, cb: Function) => {
        cb({ success: true });
      }),
      connect: vi.fn(),
      disconnect: vi.fn(),
      connected: true,
      id: 'mock-id',
      removeAllListeners: vi.fn(),
    };
    (io as any).mockReturnValueOnce(mockSocket as any);

    await service.connect();
    await service.joinRoom('room1');

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'join-room',
      { roomId: 'room1' },
      expect.any(Function)
    );
  });

  it('should reject if join-room fails', async () => {
    mockAuth.getToken.mockResolvedValue('test-token');
    const mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn((_event: string, _data: any, cb: Function) => {
        cb({ success: false, error: 'Room not found' });
      }),
      connect: vi.fn(),
      disconnect: vi.fn(),
      connected: true,
      id: 'mock-id',
      removeAllListeners: vi.fn(),
    };
    (io as any).mockReturnValueOnce(mockSocket as any);

    await service.connect();
    await expect(service.joinRoom('invalid-room')).rejects.toThrow('Room not found');
  });

  // ======= leaveRoom() =======

  it('should leave room and clear state', async () => {
    mockAuth.getToken.mockResolvedValue('test-token');
    const mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn((_event: string, _data: any, cb?: Function) => {
        if (cb) cb({ success: true });
      }),
      connect: vi.fn(),
      disconnect: vi.fn(),
      connected: true,
      id: 'mock-id',
      removeAllListeners: vi.fn(),
    };
    (io as any).mockReturnValueOnce(mockSocket as any);

    await service.connect();
    (service as any).currentRoomId = 'room1';

    service.leaveRoom();

    expect(mockSocket.emit).toHaveBeenCalledWith('leave-room', { roomId: 'room1' });
    expect(service.messages()).toEqual([]);
    expect(service.currentRoom()).toBeNull();
    expect(service.isTyping()).toBeNull();
  });

  // ======= sendMessage() =======

  it('should throw if not connected to a room', async () => {
    await expect(service.sendMessage({ content: 'hello' })).rejects.toThrow(
      'Not connected to a chat room'
    );
  });

  // ======= emitTyping() =======

  it('should emit typing event when in room', async () => {
    mockAuth.getToken.mockResolvedValue('test-token');
    const mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      connected: true,
      id: 'mock-id',
      removeAllListeners: vi.fn(),
    };
    (io as any).mockReturnValueOnce(mockSocket as any);

    await service.connect();
    (service as any).currentRoomId = 'room1';

    service.emitTyping(true);
    expect(mockSocket.emit).toHaveBeenCalledWith('typing', { roomId: 'room1', isTyping: true });
  });

  it('should not emit typing without socket or room', () => {
    expect(() => service.emitTyping()).not.toThrow();
  });

  // ======= markAsRead() =======

  it('should emit mark-read event', async () => {
    mockAuth.getToken.mockResolvedValue('test-token');
    const mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      connected: true,
      id: 'mock-id',
      removeAllListeners: vi.fn(),
    };
    (io as any).mockReturnValueOnce(mockSocket as any);

    await service.connect();
    (service as any).currentRoomId = 'room1';

    service.markAsRead(['msg1', 'msg2']);
    expect(mockSocket.emit).toHaveBeenCalledWith('mark-read', {
      roomId: 'room1',
      messageIds: ['msg1', 'msg2'],
    });
  });

  // ======= markAllAsRead() =======

  it('should emit mark-all-read and reset unread count', async () => {
    mockAuth.getToken.mockResolvedValue('test-token');
    const mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      connected: true,
      id: 'mock-id',
      removeAllListeners: vi.fn(),
    };
    (io as any).mockReturnValueOnce(mockSocket as any);

    await service.connect();
    (service as any).currentRoomId = 'room1';
    (service as any)._unreadCount.set(5);

    service.markAllAsRead();
    expect(mockSocket.emit).toHaveBeenCalledWith('mark-all-read', { roomId: 'room1' });
    expect(service.unreadCount()).toBe(0);
  });

  // ======= REST API Methods =======

  it('should getOrCreateServiceRoom', async () => {
    const room = { _id: 'room1', type: 'service', status: 'active' };
    mockApi.post.mockReturnValue(of(room));

    const result = await service.getOrCreateServiceRoom('sr1');
    expect(mockApi.post).toHaveBeenCalledWith('/chat/service/sr1/room', {});
    expect(result).toEqual(room);
    expect(service.currentRoom()).toEqual(room);
  });

  it('should getRoomByServiceRequest and return room', async () => {
    const room = { _id: 'room1' };
    mockApi.get.mockReturnValue(of(room));

    const result = await service.getRoomByServiceRequest('sr1');
    expect(mockApi.get).toHaveBeenCalledWith('/chat/service/sr1');
    expect(result).toEqual(room);
  });

  it('should getRoomByServiceRequest and return null on error', async () => {
    mockApi.get.mockReturnValue(of(Promise.reject('error')));
    // Simulate error by making firstValueFrom reject
    mockApi.get.mockImplementation(() => {
      throw new Error('Not found');
    });

    const result = await service.getRoomByServiceRequest('sr-invalid');
    expect(result).toBeNull();
  });

  it('should getRooms with optional status', () => {
    service.getRooms('active');
    expect(mockApi.get).toHaveBeenCalledWith('/chat/rooms', { status: 'active' });
  });

  it('should getRooms without status', () => {
    service.getRooms();
    expect(mockApi.get).toHaveBeenCalledWith('/chat/rooms', {});
  });

  it('should getRoom and set currentRoom', async () => {
    const room = { _id: 'room1', status: 'active' };
    mockApi.get.mockReturnValue(of(room));

    const result = await service.getRoom('room1');
    expect(mockApi.get).toHaveBeenCalledWith('/chat/rooms/room1');
    expect(result).toEqual(room);
    expect(service.currentRoom()).toEqual(room);
  });

  it('should getMessages, reverse, and set state', async () => {
    const messages = [
      { _id: 'msg2', createdAt: new Date() },
      { _id: 'msg1', createdAt: new Date() },
    ];
    mockApi.get.mockReturnValue(of(messages));

    const result = await service.getMessages('room1', 50);
    expect(mockApi.get).toHaveBeenCalledWith('/chat/rooms/room1/messages', { limit: 50 });
    // Should reverse for display
    expect(result[0]._id).toBe('msg1');
    expect(result[1]._id).toBe('msg2');
    expect(service.messages()).toHaveLength(2);
  });

  it('should getMessages with before parameter', async () => {
    mockApi.get.mockReturnValue(of([]));
    await service.getMessages('room1', 25, 'cursor-id');
    expect(mockApi.get).toHaveBeenCalledWith('/chat/rooms/room1/messages', {
      limit: 25,
      before: 'cursor-id',
    });
  });

  it('should fetchUnreadCount and update signal', async () => {
    mockApi.get.mockReturnValue(of({ count: 3 }));
    const result = await service.fetchUnreadCount();
    expect(result).toBe(3);
    expect(service.unreadCount()).toBe(3);
  });

  it('should fetchUnreadCount return 0 on error', async () => {
    mockApi.get.mockImplementation(() => { throw new Error('fail'); });
    const result = await service.fetchUnreadCount();
    expect(result).toBe(0);
  });

  it('should sendMessageRest', () => {
    const msg = { content: 'hello' };
    service.sendMessageRest('room1', msg);
    expect(mockApi.post).toHaveBeenCalledWith('/chat/rooms/room1/messages', msg);
  });

  it('should archiveRoom', () => {
    service.archiveRoom('room1');
    expect(mockApi.post).toHaveBeenCalledWith('/chat/rooms/room1/archive', {});
  });

  it('should deleteMessage', () => {
    service.deleteMessage('msg1');
    expect(mockApi.delete).toHaveBeenCalledWith('/chat/messages/msg1');
  });

  // ======= clearCurrentRoom() =======

  it('should clear current room state', () => {
    (service as any)._messages.set([{ _id: 'msg1' }]);
    (service as any)._currentRoom.set({ _id: 'room1' });
    (service as any)._isTyping.set({ userId: 'u1', name: 'Test' });
    (service as any).currentRoomId = 'room1';

    service.clearCurrentRoom();

    expect(service.messages()).toEqual([]);
    expect(service.currentRoom()).toBeNull();
    expect(service.isTyping()).toBeNull();
  });

  // ======= Observables =======

  it('should expose onNewMessage observable', () => {
    expect(service.onNewMessage()).toBeDefined();
    expect(typeof service.onNewMessage().subscribe).toBe('function');
  });

  it('should expose onMessageRead observable', () => {
    expect(service.onMessageRead()).toBeDefined();
  });

  it('should expose onRoomNotification observable', () => {
    expect(service.onRoomNotification()).toBeDefined();
  });
});
