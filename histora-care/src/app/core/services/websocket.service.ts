import { Injectable, signal, computed } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

export interface LocationUpdate {
  nurseId: string;
  requestId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface RequestStatusUpdate {
  requestId: string;
  status: string;
  updatedAt: Date;
  estimatedArrival?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;

  // Signals for reactive state
  private _isConnected = signal(false);
  private _nurseLocation = signal<LocationUpdate | null>(null);
  private _statusUpdate = signal<RequestStatusUpdate | null>(null);
  private _connectionError = signal<string | null>(null);

  // Public readonly signals
  isConnected = this._isConnected.asReadonly();
  nurseLocation = this._nurseLocation.asReadonly();
  statusUpdate = this._statusUpdate.asReadonly();
  connectionError = this._connectionError.asReadonly();

  /**
   * Connect to WebSocket server
   * Note: WebSocket is optional - app works without it using HTTP polling
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    // Skip WebSocket in production if not configured
    // This prevents console errors when WebSocket server is not available
    if (environment.production) {
      console.log('WebSocket: Skipping connection in production (not configured)');
      return;
    }

    const wsUrl = (environment as any).wsUrl || environment.apiUrl.replace('/api', '');

    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 5000
    });

    this.setupListeners();
  }

  /**
   * Setup socket event listeners
   */
  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this._isConnected.set(true);
      this._connectionError.set(null);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this._isConnected.set(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this._connectionError.set(error.message);
      this._isConnected.set(false);
    });

    // Listen for nurse location updates
    this.socket.on('nurse:location', (data: LocationUpdate) => {
      this._nurseLocation.set({
        ...data,
        timestamp: new Date(data.timestamp)
      });
    });

    // Listen for request status updates
    this.socket.on('request:status', (data: RequestStatusUpdate) => {
      this._statusUpdate.set({
        ...data,
        updatedAt: new Date(data.updatedAt),
        estimatedArrival: data.estimatedArrival ? new Date(data.estimatedArrival) : undefined
      });
    });

    // Listen for nurse arrived
    this.socket.on('nurse:arrived', (data: { requestId: string }) => {
      this._statusUpdate.set({
        requestId: data.requestId,
        status: 'arrived',
        updatedAt: new Date()
      });
    });

    // Listen for service started
    this.socket.on('service:started', (data: { requestId: string }) => {
      this._statusUpdate.set({
        requestId: data.requestId,
        status: 'in_progress',
        updatedAt: new Date()
      });
    });

    // Listen for service completed
    this.socket.on('service:completed', (data: { requestId: string }) => {
      this._statusUpdate.set({
        requestId: data.requestId,
        status: 'completed',
        updatedAt: new Date()
      });
    });
  }

  /**
   * Join a tracking room (for patients tracking a request)
   */
  joinTrackingRoom(requestId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('tracking:join', { requestId });
    }
  }

  /**
   * Leave a tracking room
   */
  leaveTrackingRoom(requestId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('tracking:leave', { requestId });
    }
  }

  /**
   * Send nurse location update (for nurses broadcasting their location)
   */
  sendLocationUpdate(location: Omit<LocationUpdate, 'timestamp'>): void {
    if (this.socket?.connected) {
      this.socket.emit('nurse:location:update', {
        ...location,
        timestamp: new Date()
      });
    }
  }

  /**
   * Nurse marks arrival at patient location
   */
  notifyArrival(requestId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('nurse:arrived', { requestId });
    }
  }

  /**
   * Nurse starts service
   */
  notifyServiceStarted(requestId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('service:started', { requestId });
    }
  }

  /**
   * Nurse completes service
   */
  notifyServiceCompleted(requestId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('service:completed', { requestId });
    }
  }

  /**
   * Send estimated arrival time
   */
  sendETA(requestId: string, etaMinutes: number): void {
    if (this.socket?.connected) {
      const estimatedArrival = new Date();
      estimatedArrival.setMinutes(estimatedArrival.getMinutes() + etaMinutes);
      this.socket.emit('nurse:eta', { requestId, estimatedArrival });
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._isConnected.set(false);
      this._nurseLocation.set(null);
      this._statusUpdate.set(null);
    }
  }

  /**
   * Check if socket is connected
   */
  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}
