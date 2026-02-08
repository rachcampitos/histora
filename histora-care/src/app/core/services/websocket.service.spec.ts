import { describe, it, expect, vi, beforeEach } from 'vitest';

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
import { WebSocketService, LocationUpdate, RequestStatusUpdate, NewRequestNotification } from './websocket.service';
import { io } from 'socket.io-client';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockSocket: ReturnType<typeof createMockSocket>;

  function createMockSocket() {
    const listeners: Record<string, Function> = {};
    return {
      on: vi.fn((event: string, handler: Function) => {
        listeners[event] = handler;
      }),
      off: vi.fn(),
      emit: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      removeAllListeners: vi.fn(),
      connected: false,
      id: 'mock-socket-id',
      // Helper to trigger events in tests
      _trigger(event: string, data?: unknown) {
        listeners[event]?.(data);
      },
      _listeners: listeners,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    (io as any).mockReturnValue(mockSocket as any);
    service = new WebSocketService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= connect =============

  it('connect() should create socket via io() with correct parameters', () => {
    service.connect('test-token');

    expect(io as any).toHaveBeenCalledWith(
      expect.stringContaining('/tracking'),
      expect.objectContaining({
        auth: { token: 'test-token' },
        transports: ['websocket', 'polling'],
        reconnection: true,
      })
    );
  });

  it('connect() should set up event listeners on the socket', () => {
    service.connect('test-token');

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('nurse:location', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('request:status', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('nurse:arrived', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('service:started', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('service:completed', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('nurse:availability:changed', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('request:new', expect.any(Function));
  });

  it('connect() should return early if already connected', () => {
    service.connect('test-token');
    mockSocket.connected = true;

    // Second call should not create a new socket
    service.connect('another-token');
    expect(io as any).toHaveBeenCalledTimes(1);
  });

  // ============= Event handlers updating signals =============

  it('should set isConnected to true on connect event', () => {
    service.connect('test-token');
    expect(service.isConnected()).toBe(false);

    mockSocket._trigger('connect');
    expect(service.isConnected()).toBe(true);
  });

  it('should set isConnected to false on disconnect event', () => {
    service.connect('test-token');
    mockSocket._trigger('connect');
    expect(service.isConnected()).toBe(true);

    mockSocket._trigger('disconnect');
    expect(service.isConnected()).toBe(false);
  });

  it('should set connectionError on connect_error event', () => {
    service.connect('test-token');
    mockSocket._trigger('connect_error', { message: 'Auth failed' });

    expect(service.connectionError()).toBe('Auth failed');
    expect(service.isConnected()).toBe(false);
  });

  it('should clear connectionError on successful connect after error', () => {
    service.connect('test-token');
    mockSocket._trigger('connect_error', { message: 'timeout' });
    expect(service.connectionError()).toBe('timeout');

    mockSocket._trigger('connect');
    expect(service.connectionError()).toBeNull();
  });

  it('should update nurseLocation signal on nurse:location event', () => {
    service.connect('test-token');
    const locationData: LocationUpdate = {
      nurseId: 'nurse-1',
      requestId: 'req-1',
      latitude: -12.046,
      longitude: -77.042,
      timestamp: new Date('2026-01-15T10:00:00Z'),
    };

    mockSocket._trigger('nurse:location', locationData);

    const location = service.nurseLocation();
    expect(location).toBeTruthy();
    expect(location!.nurseId).toBe('nurse-1');
    expect(location!.latitude).toBe(-12.046);
    expect(location!.timestamp).toBeInstanceOf(Date);
  });

  it('should update statusUpdate signal on request:status event', () => {
    service.connect('test-token');
    const statusData: RequestStatusUpdate = {
      requestId: 'req-1',
      status: 'accepted',
      updatedAt: new Date('2026-01-15T10:00:00Z'),
    };

    mockSocket._trigger('request:status', statusData);

    const status = service.statusUpdate();
    expect(status).toBeTruthy();
    expect(status!.requestId).toBe('req-1');
    expect(status!.status).toBe('accepted');
  });

  it('should update statusUpdate to arrived on nurse:arrived event', () => {
    service.connect('test-token');
    mockSocket._trigger('nurse:arrived', { requestId: 'req-1' });

    const status = service.statusUpdate();
    expect(status!.status).toBe('arrived');
    expect(status!.requestId).toBe('req-1');
  });

  it('should update newRequest signal on request:new event', () => {
    service.connect('test-token');
    const requestData: NewRequestNotification = {
      requestId: 'req-new',
      service: { name: 'Inyeccion', category: 'general', price: 50 },
      location: { address: 'Av. Javier Prado 123' },
      requestedDate: new Date('2026-01-20T14:00:00Z'),
      timestamp: new Date('2026-01-15T10:00:00Z'),
    };

    mockSocket._trigger('request:new', requestData);

    const newReq = service.newRequest();
    expect(newReq).toBeTruthy();
    expect(newReq!.requestId).toBe('req-new');
    expect(newReq!.service.name).toBe('Inyeccion');
  });

  it('should update nurseAvailabilityChanged on nurse:availability:changed event', () => {
    service.connect('test-token');
    const timestamp = '2026-01-15T10:00:00Z';
    mockSocket._trigger('nurse:availability:changed', { nurseUserId: 'nurse-1', timestamp });

    expect(service.nurseAvailabilityChanged()).toBeInstanceOf(Date);
  });

  // ============= Emit methods =============

  it('joinTrackingRoom() should emit tracking:join when connected', () => {
    service.connect('test-token');
    mockSocket.connected = true;

    service.joinTrackingRoom('req-1');
    expect(mockSocket.emit).toHaveBeenCalledWith('tracking:join', { requestId: 'req-1' });
  });

  it('joinTrackingRoom() should not emit when not connected', () => {
    service.connect('test-token');
    mockSocket.connected = false;

    service.joinTrackingRoom('req-1');
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it('leaveTrackingRoom() should emit tracking:leave when connected', () => {
    service.connect('test-token');
    mockSocket.connected = true;

    service.leaveTrackingRoom('req-1');
    expect(mockSocket.emit).toHaveBeenCalledWith('tracking:leave', { requestId: 'req-1' });
  });

  it('sendLocationUpdate() should emit nurse:location:update with timestamp', () => {
    service.connect('test-token');
    mockSocket.connected = true;

    service.sendLocationUpdate({ nurseId: 'nurse-1', requestId: 'req-1', latitude: -12.0, longitude: -77.0 });
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'nurse:location:update',
      expect.objectContaining({
        nurseId: 'nurse-1',
        requestId: 'req-1',
        timestamp: expect.any(Date),
      })
    );
  });

  it('notifyArrival() should emit nurse:arrived', () => {
    service.connect('test-token');
    mockSocket.connected = true;

    service.notifyArrival('req-1');
    expect(mockSocket.emit).toHaveBeenCalledWith('nurse:arrived', { requestId: 'req-1' });
  });

  it('notifyServiceStarted() should emit service:started', () => {
    service.connect('test-token');
    mockSocket.connected = true;

    service.notifyServiceStarted('req-1');
    expect(mockSocket.emit).toHaveBeenCalledWith('service:started', { requestId: 'req-1' });
  });

  it('notifyServiceCompleted() should emit service:completed', () => {
    service.connect('test-token');
    mockSocket.connected = true;

    service.notifyServiceCompleted('req-1');
    expect(mockSocket.emit).toHaveBeenCalledWith('service:completed', { requestId: 'req-1' });
  });

  it('sendETA() should emit nurse:eta with estimatedArrival date', () => {
    service.connect('test-token');
    mockSocket.connected = true;

    service.sendETA('req-1', 15);
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'nurse:eta',
      expect.objectContaining({
        requestId: 'req-1',
        estimatedArrival: expect.any(Date),
      })
    );
  });

  it('joinMapRoom() should emit map:join', () => {
    service.connect('test-token');
    mockSocket.connected = true;

    service.joinMapRoom();
    expect(mockSocket.emit).toHaveBeenCalledWith('map:join');
  });

  it('leaveMapRoom() should emit map:leave', () => {
    service.connect('test-token');
    mockSocket.connected = true;

    service.leaveMapRoom();
    expect(mockSocket.emit).toHaveBeenCalledWith('map:leave');
  });

  // ============= disconnect =============

  it('disconnect() should cleanup socket and reset signals', () => {
    service.connect('test-token');
    mockSocket._trigger('connect');
    mockSocket._trigger('nurse:location', {
      nurseId: 'n1', requestId: 'r1', latitude: -12, longitude: -77, timestamp: new Date(),
    });

    service.disconnect();

    expect(mockSocket.removeAllListeners).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(service.isConnected()).toBe(false);
    expect(service.nurseLocation()).toBeNull();
    expect(service.statusUpdate()).toBeNull();
    expect(service.newRequest()).toBeNull();
    expect(service.nurseAvailabilityChanged()).toBeNull();
  });

  it('disconnect() should do nothing if no socket exists', () => {
    // No connect() called
    service.disconnect();
    // Should not throw
    expect(service.isConnected()).toBe(false);
  });

  // ============= clearNewRequest =============

  it('clearNewRequest() should reset newRequest signal to null', () => {
    service.connect('test-token');
    mockSocket._trigger('request:new', {
      requestId: 'req-1',
      service: { name: 'Test', category: 'cat', price: 10 },
      location: { address: 'Addr' },
      requestedDate: new Date(),
      timestamp: new Date(),
    });
    expect(service.newRequest()).toBeTruthy();

    service.clearNewRequest();
    expect(service.newRequest()).toBeNull();
  });

  // ============= connected getter =============

  it('connected getter should return false when no socket', () => {
    expect(service.connected).toBe(false);
  });

  it('connected getter should reflect socket.connected', () => {
    service.connect('test-token');
    expect(service.connected).toBe(false);

    mockSocket.connected = true;
    expect(service.connected).toBe(true);
  });
});
