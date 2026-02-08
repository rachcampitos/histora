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

export interface NewRequestNotification {
  requestId: string;
  service: { name: string; category: string; price: number };
  location: { address: string; district?: string };
  requestedDate: Date;
  patient?: { firstName?: string; lastName?: string };
  timestamp: Date;
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
  private _newRequest = signal<NewRequestNotification | null>(null);
  private _connectionError = signal<string | null>(null);
  private _nurseAvailabilityChanged = signal<Date | null>(null);

  // Public readonly signals
  isConnected = this._isConnected.asReadonly();
  nurseLocation = this._nurseLocation.asReadonly();
  statusUpdate = this._statusUpdate.asReadonly();
  newRequest = this._newRequest.asReadonly();
  connectionError = this._connectionError.asReadonly();
  nurseAvailabilityChanged = this._nurseAvailabilityChanged.asReadonly();

  /**
   * Connect to WebSocket server for real-time tracking
   * Connects to the /tracking namespace
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    const wsUrl = environment.wsUrl || environment.apiUrl.replace('/api', '');

    // Connect to the /tracking namespace
    this.socket = io(`${wsUrl}/tracking`, {
      auth: { token },
      transports: ['websocket', 'polling'], // Allow fallback to polling
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000
    });

    this.setupListeners();
  }

  /**
   * Setup socket event listeners
   */
  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this._isConnected.set(true);
      this._connectionError.set(null);
    });

    this.socket.on('disconnect', () => {
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

    // Listen for nurse availability changes (for patients on map)
    this.socket.on('nurse:availability:changed', (data: { nurseUserId: string; timestamp: string }) => {
      this._nurseAvailabilityChanged.set(new Date(data.timestamp));
    });

    // Listen for new request notifications (for nurses)
    this.socket.on('request:new', (data: NewRequestNotification) => {
      this._newRequest.set({
        ...data,
        requestedDate: new Date(data.requestedDate),
        timestamp: new Date(data.timestamp)
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
   * Join the map viewers room to receive nurse availability updates
   */
  joinMapRoom(): void {
    if (this.socket?.connected) {
      this.socket.emit('map:join');
    }
  }

  /**
   * Leave the map viewers room
   */
  leaveMapRoom(): void {
    if (this.socket?.connected) {
      this.socket.emit('map:leave');
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this._isConnected.set(false);
      this._nurseLocation.set(null);
      this._statusUpdate.set(null);
      this._newRequest.set(null);
      this._nurseAvailabilityChanged.set(null);
    }
  }

  /**
   * Clear new request notification (after it's been handled)
   */
  clearNewRequest(): void {
    this._newRequest.set(null);
  }

  /**
   * Check if socket is connected
   */
  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}
