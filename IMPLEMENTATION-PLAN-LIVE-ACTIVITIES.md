# Plan de Implementación: Live Activities y Foreground Service Tracking

## 1. Plugins Necesarios

### Frontend (histora-care)

```bash
cd histora-care

# iOS Live Activities
npm install capacitor-live-activity

# Android Foreground Service
npm install @capawesome-team/capacitor-android-foreground-service

npx cap sync
```

### Backend (histora-back)

```bash
cd histora-back

# Google Maps SDK (para ETA)
npm install @googlemaps/google-maps-services-js

# Firebase Admin (para push notifications)
npm install firebase-admin
```

## 2. Estructura de Archivos a Crear

### Backend

```
histora-back/src/
├── tracking/
│   ├── tracking.module.ts
│   ├── tracking.gateway.ts           # WebSocket gateway
│   ├── tracking.service.ts           # Lógica de tracking
│   ├── eta-calculator.service.ts     # Cálculo de ETA
│   ├── push-notification.service.ts  # APNs + FCM
│   └── dto/
│       ├── location-update.dto.ts
│       └── tracking-data.dto.ts
└── app.module.ts                      # Importar TrackingModule
```

### Frontend

```
histora-care/src/app/
├── core/
│   ├── services/
│   │   ├── live-activity.service.ts      # iOS Live Activities
│   │   ├── foreground-service.service.ts # Android Foreground
│   │   ├── tracking.service.ts           # Orquestador
│   │   └── websocket.service.ts          # (ya existe, extender)
│   └── models/
│       └── tracking.model.ts
└── features/
    ├── nurse/
    │   └── pages/
    │       └── active-service/
    │           └── active-service.page.ts # Nurse tracking
    └── patient/
        └── pages/
            └── track-nurse/
                └── track-nurse.page.ts    # Patient tracking view
```

### iOS (Xcode)

```
ios/App/
├── NurseLiteWidget/                   # Widget Extension
│   ├── NurseLiteWidget.swift
│   ├── NurseTrackingAttributes.swift  # Live Activity definition
│   ├── NurseTrackingLiveActivity.swift
│   └── Info.plist
└── App/
    ├── Info.plist                     # Agregar NSSupportsLiveActivitiesFrequentUpdates
    └── App.entitlements               # Push notifications capability
```

### Android

```
android/app/src/main/
├── AndroidManifest.xml                # Permisos + Service
└── res/
    └── values/
        └── strings.xml                # Notification channel
```

## 3. Código Backend

### 3.1. tracking.module.ts

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';
import { EtaCalculatorService } from './eta-calculator.service';
import { PushNotificationService } from './push-notification.service';
import { ServiceRequest, ServiceRequestSchema } from '../service-requests/schema/service-request.schema';
import { Nurse, NurseSchema } from '../nurses/schema/nurse.schema';
import { User, UserSchema } from '../users/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceRequest.name, schema: ServiceRequestSchema },
      { name: Nurse.name, schema: NurseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [
    TrackingGateway,
    TrackingService,
    EtaCalculatorService,
    PushNotificationService,
  ],
  exports: [TrackingService],
})
export class TrackingModule {}
```

### 3.2. tracking.gateway.ts

```typescript
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
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TrackingService } from './tracking.service';
import { LocationUpdateDto } from './dto/location-update.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/tracking',
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private activeNurses: Map<string, string[]> = new Map(); // nurseId -> socketIds

  constructor(
    private trackingService: TrackingService,
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

      // Track nurse connections
      if (client.userRole === 'nurse') {
        const nurseId = client.userId!;
        if (!this.activeNurses.has(nurseId)) {
          this.activeNurses.set(nurseId, []);
        }
        this.activeNurses.get(nurseId)?.push(client.id);
      }

      // Join user's personal room
      client.join(`user:${client.userId}`);

      this.logger.log(`User ${client.userId} (${client.userRole}) connected to tracking`);
      client.emit('connected', { userId: client.userId });

    } catch (error) {
      this.logger.error('Tracking connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId && client.userRole === 'nurse') {
      const sockets = this.activeNurses.get(client.userId);
      if (sockets) {
        const index = sockets.indexOf(client.id);
        if (index > -1) {
          sockets.splice(index, 1);
        }
        if (sockets.length === 0) {
          this.activeNurses.delete(client.userId);
        }
      }
    }
    this.logger.log(`User ${client.userId} disconnected from tracking`);
  }

  @SubscribeMessage('tracking:join')
  async handleJoinTracking(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { requestId: string },
  ) {
    try {
      client.join(`tracking:${data.requestId}`);
      this.logger.log(`User ${client.userId} joined tracking room ${data.requestId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Join tracking error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('tracking:leave')
  async handleLeaveTracking(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { requestId: string },
  ) {
    client.leave(`tracking:${data.requestId}`);
    return { success: true };
  }

  @SubscribeMessage('nurse:location:update')
  async handleLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: LocationUpdateDto,
  ) {
    try {
      if (client.userRole !== 'nurse') {
        return { success: false, error: 'Only nurses can send location updates' };
      }

      // Process location and calculate ETA
      const trackingData = await this.trackingService.processLocationUpdate({
        ...data,
        nurseId: client.userId!,
      });

      // Broadcast to patients tracking this request
      this.server.to(`tracking:${data.requestId}`).emit('nurse:location', trackingData);

      // Send push notification to update Live Activity / Foreground notification
      await this.trackingService.sendTrackingPushUpdate(data.requestId, trackingData);

      return { success: true };
    } catch (error) {
      this.logger.error('Location update error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('nurse:start:tracking')
  async handleStartTracking(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { requestId: string },
  ) {
    try {
      if (client.userRole !== 'nurse') {
        return { success: false, error: 'Unauthorized' };
      }

      await this.trackingService.startTracking(data.requestId, client.userId!);

      // Notify patient to start Live Activity
      this.server.to(`tracking:${data.requestId}`).emit('tracking:started', {
        requestId: data.requestId,
        nurseId: client.userId,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('nurse:arrived')
  async handleNurseArrived(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { requestId: string },
  ) {
    try {
      await this.trackingService.markArrived(data.requestId);

      this.server.to(`tracking:${data.requestId}`).emit('nurse:arrived', {
        requestId: data.requestId,
      });

      // Send push to end Live Activity
      await this.trackingService.sendArrivalPushUpdate(data.requestId);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Utility method to broadcast to specific request
  async broadcastToRequest(requestId: string, event: string, data: any) {
    this.server.to(`tracking:${requestId}`).emit(event, data);
  }
}
```

### 3.3. tracking.service.ts

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceRequest } from '../service-requests/schema/service-request.schema';
import { Nurse } from '../nurses/schema/nurse.schema';
import { User } from '../users/schema/user.schema';
import { EtaCalculatorService } from './eta-calculator.service';
import { PushNotificationService } from './push-notification.service';
import { LocationUpdateDto } from './dto/location-update.dto';
import { TrackingDataDto } from './dto/tracking-data.dto';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectModel(ServiceRequest.name) private requestModel: Model<ServiceRequest>,
    @InjectModel(Nurse.name) private nurseModel: Model<Nurse>,
    @InjectModel(User.name) private userModel: Model<User>,
    private etaCalculator: EtaCalculatorService,
    private pushService: PushNotificationService,
  ) {}

  async processLocationUpdate(data: LocationUpdateDto & { nurseId: string }): Promise<TrackingDataDto> {
    const request = await this.requestModel.findById(data.requestId)
      .populate('patientId', 'name profilePicture')
      .populate('nurseId', 'name profilePicture');

    if (!request) {
      throw new Error('Service request not found');
    }

    const nurse = await this.nurseModel.findOne({ userId: data.nurseId });
    if (!nurse) {
      throw new Error('Nurse not found');
    }

    // Calculate ETA using Google Maps
    const eta = await this.etaCalculator.calculateETA(
      { latitude: data.latitude, longitude: data.longitude },
      { latitude: request.patientLocation.latitude, longitude: request.patientLocation.longitude },
    );

    // Update request with latest location
    request.nurseCurrentLocation = {
      latitude: data.latitude,
      longitude: data.longitude,
      lastUpdated: new Date(),
    };
    request.estimatedArrival = eta.arrivalTime;
    await request.save();

    return {
      requestId: data.requestId,
      nurse: {
        id: nurse.userId.toString(),
        name: nurse.fullName,
        photo: nurse.profilePicture || '',
        cep: nurse.cepNumber,
      },
      location: {
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        speed: data.speed,
      },
      eta: {
        minutes: eta.durationMinutes,
        arrivalTime: eta.arrivalTime,
        distance: eta.distanceKm,
      },
      status: request.status,
      timestamp: new Date(),
    };
  }

  async sendTrackingPushUpdate(requestId: string, data: TrackingDataDto): Promise<void> {
    try {
      const request = await this.requestModel.findById(requestId);
      if (!request) return;

      const patient = await this.userModel.findById(request.patientId);
      if (!patient || !patient.deviceTokens || patient.deviceTokens.length === 0) {
        return;
      }

      // Send push notification to update Live Activity (iOS) or Foreground Notification (Android)
      await this.pushService.sendTrackingUpdate(patient.deviceTokens, data);
    } catch (error) {
      this.logger.error('Failed to send tracking push update:', error);
    }
  }

  async sendArrivalPushUpdate(requestId: string): Promise<void> {
    try {
      const request = await this.requestModel.findById(requestId);
      if (!request) return;

      const patient = await this.userModel.findById(request.patientId);
      if (!patient || !patient.deviceTokens) return;

      await this.pushService.sendArrivalNotification(patient.deviceTokens, requestId);
    } catch (error) {
      this.logger.error('Failed to send arrival push:', error);
    }
  }

  async startTracking(requestId: string, nurseId: string): Promise<void> {
    const request = await this.requestModel.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    request.status = 'en_route';
    request.trackingStartedAt = new Date();
    await request.save();
  }

  async markArrived(requestId: string): Promise<void> {
    const request = await this.requestModel.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    request.status = 'arrived';
    request.arrivedAt = new Date();
    await request.save();
  }
}
```

### 3.4. eta-calculator.service.ts

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Client, TravelMode } from '@googlemaps/google-maps-services-js';
import { ConfigService } from '@nestjs/config';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface EtaResult {
  distanceKm: number;
  durationMinutes: number;
  arrivalTime: Date;
}

@Injectable()
export class EtaCalculatorService {
  private readonly logger = new Logger(EtaCalculatorService.name);
  private client: Client;
  private apiKey: string;

  constructor(private configService: ConfigService) {
    this.client = new Client({});
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY')!;
  }

  async calculateETA(origin: Coordinates, destination: Coordinates): Promise<EtaResult> {
    try {
      const response = await this.client.distancematrix({
        params: {
          origins: [`${origin.latitude},${origin.longitude}`],
          destinations: [`${destination.latitude},${destination.longitude}`],
          mode: TravelMode.driving,
          departure_time: 'now', // Traffic-aware
          key: this.apiKey,
        },
      });

      const result = response.data.rows[0].elements[0];

      if (result.status !== 'OK') {
        this.logger.warn('Distance Matrix API returned non-OK status:', result.status);
        // Fallback: straight-line distance estimation
        return this.calculateFallbackETA(origin, destination);
      }

      const distanceMeters = result.distance.value;
      const durationSeconds = result.duration_in_traffic?.value || result.duration.value;

      const distanceKm = distanceMeters / 1000;
      const durationMinutes = Math.ceil(durationSeconds / 60);

      const arrivalTime = new Date();
      arrivalTime.setSeconds(arrivalTime.getSeconds() + durationSeconds);

      return {
        distanceKm,
        durationMinutes,
        arrivalTime,
      };
    } catch (error) {
      this.logger.error('Google Maps API error:', error);
      return this.calculateFallbackETA(origin, destination);
    }
  }

  private calculateFallbackETA(origin: Coordinates, destination: Coordinates): EtaResult {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(destination.latitude - origin.latitude);
    const dLon = this.toRad(destination.longitude - origin.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(origin.latitude)) *
        Math.cos(this.toRad(destination.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Assume 30 km/h average speed in city
    const durationMinutes = Math.ceil((distanceKm / 30) * 60);

    const arrivalTime = new Date();
    arrivalTime.setMinutes(arrivalTime.getMinutes() + durationMinutes);

    return { distanceKm, durationMinutes, arrivalTime };
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
```

### 3.5. push-notification.service.ts

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { TrackingDataDto } from './dto/tracking-data.dto';

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Initialize Firebase Admin SDK
    const serviceAccount = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT');

    if (!serviceAccount) {
      this.logger.warn('Firebase service account not configured');
      return;
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });
    }
  }

  async sendTrackingUpdate(deviceTokens: string[], data: TrackingDataDto): Promise<void> {
    try {
      const payload = {
        data: {
          type: 'tracking_update',
          requestId: data.requestId,
          nurseName: data.nurse.name,
          nursePhoto: data.nurse.photo,
          latitude: data.location.latitude.toString(),
          longitude: data.location.longitude.toString(),
          etaMinutes: data.eta.minutes.toString(),
          distance: data.eta.distance.toFixed(2),
          status: data.status,
          timestamp: data.timestamp.toISOString(),
        },
        // iOS: content-available for background update
        apns: {
          headers: {
            'apns-push-type': 'background',
            'apns-priority': '5',
          },
          payload: {
            aps: {
              'content-available': 1,
              'mutable-content': 1,
            },
          },
        },
        // Android: high priority for foreground service
        android: {
          priority: 'high',
          data: {
            channelId: 'nurse_tracking',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast({
        tokens: deviceTokens,
        ...payload,
      });

      this.logger.log(`Sent tracking update to ${response.successCount} devices`);
    } catch (error) {
      this.logger.error('Failed to send tracking push:', error);
    }
  }

  async sendArrivalNotification(deviceTokens: string[], requestId: string): Promise<void> {
    try {
      const payload = {
        notification: {
          title: 'Tu enfermera ha llegado',
          body: 'La enfermera está en tu ubicación',
        },
        data: {
          type: 'nurse_arrived',
          requestId,
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
        android: {
          notification: {
            channelId: 'nurse_arrival',
            priority: 'high',
            sound: 'default',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast({
        tokens: deviceTokens,
        ...payload,
      });

      this.logger.log(`Sent arrival notification to ${response.successCount} devices`);
    } catch (error) {
      this.logger.error('Failed to send arrival notification:', error);
    }
  }
}
```

### 3.6. DTOs

```typescript
// dto/location-update.dto.ts
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class LocationUpdateDto {
  @IsString()
  requestId: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;
}

// dto/tracking-data.dto.ts
export interface TrackingDataDto {
  requestId: string;
  nurse: {
    id: string;
    name: string;
    photo: string;
    cep: string;
  };
  location: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  };
  eta: {
    minutes: number;
    arrivalTime: Date;
    distance: number;
  };
  status: string;
  timestamp: Date;
}
```

## 4. Código Frontend

### 4.1. live-activity.service.ts

```typescript
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LiveActivity } from 'capacitor-live-activity';

export interface NurseTrackingData {
  nurseName: string;
  nursePhoto: string;
  etaMinutes: number;
  distance: number;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class LiveActivityService {
  private currentActivityId: string | null = null;

  async isSupported(): Promise<boolean> {
    if (Capacitor.getPlatform() !== 'ios') {
      return false;
    }
    // Check iOS version >= 16.2
    return true; // Implement version check if needed
  }

  async startLiveActivity(requestId: string, data: NurseTrackingData): Promise<void> {
    if (!await this.isSupported()) {
      console.warn('Live Activities not supported on this device');
      return;
    }

    try {
      const result = await LiveActivity.startActivity({
        activityType: 'NurseTrackingAttributes',
        contentState: {
          nurseName: data.nurseName,
          nursePhoto: data.nursePhoto,
          etaMinutes: data.etaMinutes,
          distance: data.distance,
          status: data.status,
        },
        pushToken: true, // Request push token for remote updates
      });

      this.currentActivityId = result.activityId;
      console.log('Live Activity started:', result.activityId);

      // Send push token to backend
      if (result.pushToken) {
        await this.sendPushTokenToBackend(requestId, result.pushToken);
      }
    } catch (error) {
      console.error('Failed to start Live Activity:', error);
    }
  }

  async updateLiveActivity(data: NurseTrackingData): Promise<void> {
    if (!this.currentActivityId) {
      console.warn('No active Live Activity to update');
      return;
    }

    try {
      await LiveActivity.updateActivity({
        activityId: this.currentActivityId,
        contentState: {
          nurseName: data.nurseName,
          nursePhoto: data.nursePhoto,
          etaMinutes: data.etaMinutes,
          distance: data.distance,
          status: data.status,
        },
      });
    } catch (error) {
      console.error('Failed to update Live Activity:', error);
    }
  }

  async endLiveActivity(): Promise<void> {
    if (!this.currentActivityId) {
      return;
    }

    try {
      await LiveActivity.endActivity({
        activityId: this.currentActivityId,
      });
      this.currentActivityId = null;
    } catch (error) {
      console.error('Failed to end Live Activity:', error);
    }
  }

  private async sendPushTokenToBackend(requestId: string, pushToken: string): Promise<void> {
    // Implement HTTP call to backend to register push token
    // POST /api/tracking/register-push-token
    // { requestId, pushToken, platform: 'ios' }
  }
}
```

### 4.2. foreground-service.service.ts

```typescript
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';

export interface TrackingNotificationData {
  nurseName: string;
  etaMinutes: number;
  distance: number;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ForegroundServiceService {
  private isRunning = false;

  async isSupported(): Promise<boolean> {
    return Capacitor.getPlatform() === 'android';
  }

  async startForegroundService(data: TrackingNotificationData): Promise<void> {
    if (!await this.isSupported()) {
      return;
    }

    try {
      // Check and request permissions
      const permission = await ForegroundService.checkPermissions();
      if (permission.display !== 'granted') {
        await ForegroundService.requestPermissions();
      }

      await ForegroundService.startForegroundService({
        id: 1,
        title: `${data.nurseName} viene en camino`,
        body: `ETA: ${data.etaMinutes} min | ${data.distance.toFixed(1)} km`,
        smallIcon: 'ic_notification',
        buttons: [
          {
            id: 'stop',
            title: 'Detener seguimiento',
          },
        ],
      });

      this.isRunning = true;
    } catch (error) {
      console.error('Failed to start foreground service:', error);
    }
  }

  async updateNotification(data: TrackingNotificationData): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await ForegroundService.updateForegroundService({
        id: 1,
        title: `${data.nurseName} viene en camino`,
        body: `ETA: ${data.etaMinutes} min | ${data.distance.toFixed(1)} km`,
      });
    } catch (error) {
      console.error('Failed to update foreground notification:', error);
    }
  }

  async stopForegroundService(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await ForegroundService.stopForegroundService();
      this.isRunning = false;
    } catch (error) {
      console.error('Failed to stop foreground service:', error);
    }
  }
}
```

### 4.3. tracking.service.ts (Orquestador)

```typescript
import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LiveActivityService } from './live-activity.service';
import { ForegroundServiceService } from './foreground-service.service';
import { WebSocketService } from './websocket.service';
import { GeolocationService } from './geolocation.service';

interface TrackingState {
  isTracking: boolean;
  requestId: string | null;
  nurseData: any;
  location: any;
  eta: any;
}

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private trackingState = signal<TrackingState>({
    isTracking: false,
    requestId: null,
    nurseData: null,
    location: null,
    eta: null,
  });

  state = this.trackingState.asReadonly();

  constructor(
    private liveActivity: LiveActivityService,
    private foregroundService: ForegroundServiceService,
    private websocket: WebSocketService,
    private geolocation: GeolocationService,
  ) {
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners(): void {
    // Listen for tracking updates
    this.websocket.nurseLocation().subscribe((data) => {
      if (data) {
        this.updateTracking(data);
      }
    });

    this.websocket.statusUpdate().subscribe((status) => {
      if (status?.status === 'arrived') {
        this.stopTracking();
      }
    });
  }

  async startTracking(requestId: string, initialData: any): Promise<void> {
    const platform = Capacitor.getPlatform();

    // Start appropriate tracking method
    if (platform === 'ios') {
      await this.liveActivity.startLiveActivity(requestId, {
        nurseName: initialData.nurse.name,
        nursePhoto: initialData.nurse.photo,
        etaMinutes: initialData.eta.minutes,
        distance: initialData.eta.distance,
        status: initialData.status,
      });
    } else if (platform === 'android') {
      await this.foregroundService.startForegroundService({
        nurseName: initialData.nurse.name,
        etaMinutes: initialData.eta.minutes,
        distance: initialData.eta.distance,
        status: initialData.status,
      });
    }

    // Join WebSocket tracking room
    this.websocket.joinTrackingRoom(requestId);

    this.trackingState.update((state) => ({
      ...state,
      isTracking: true,
      requestId,
      nurseData: initialData.nurse,
    }));
  }

  private async updateTracking(data: any): Promise<void> {
    const platform = Capacitor.getPlatform();

    const updateData = {
      nurseName: data.nurse.name,
      nursePhoto: data.nurse.photo,
      etaMinutes: data.eta.minutes,
      distance: data.eta.distance,
      status: data.status,
    };

    if (platform === 'ios') {
      await this.liveActivity.updateLiveActivity(updateData);
    } else if (platform === 'android') {
      await this.foregroundService.updateNotification(updateData);
    }

    this.trackingState.update((state) => ({
      ...state,
      location: data.location,
      eta: data.eta,
    }));
  }

  async stopTracking(): Promise<void> {
    const platform = Capacitor.getPlatform();

    if (platform === 'ios') {
      await this.liveActivity.endLiveActivity();
    } else if (platform === 'android') {
      await this.foregroundService.stopForegroundService();
    }

    const currentRequestId = this.trackingState().requestId;
    if (currentRequestId) {
      this.websocket.leaveTrackingRoom(currentRequestId);
    }

    this.trackingState.set({
      isTracking: false,
      requestId: null,
      nurseData: null,
      location: null,
      eta: null,
    });
  }
}
```

### 4.4. Nurse Tracking (active-service.page.ts)

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { GeolocationService } from '../../../core/services/geolocation.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { ServiceRequestService } from '../../../core/services/service-request.service';

@Component({
  selector: 'app-active-service',
  templateUrl: './active-service.page.html',
})
export class ActiveServicePage implements OnInit, OnDestroy {
  requestId: string = '';
  isTracking = false;
  private locationWatchId: string | null = null;

  constructor(
    private geolocation: GeolocationService,
    private websocket: WebSocketService,
    private requestService: ServiceRequestService,
  ) {}

  async ngOnInit() {
    // Get active request
    // this.requestId = ...
  }

  async startTracking() {
    try {
      // Request location permissions
      const permission = await this.geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        await this.geolocation.requestPermissions();
      }

      // Start watching location
      await this.geolocation.startWatching();

      // Subscribe to location updates
      this.geolocation.location().subscribe((location) => {
        if (location) {
          this.sendLocationUpdate(location);
        }
      });

      // Notify backend that tracking started
      this.websocket.emit('nurse:start:tracking', { requestId: this.requestId });

      this.isTracking = true;
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  }

  private sendLocationUpdate(location: any) {
    // Send update every 5 seconds (throttle in production)
    this.websocket.sendLocationUpdate({
      nurseId: '', // Will be set by backend from JWT
      requestId: this.requestId,
      latitude: location.latitude,
      longitude: location.longitude,
      heading: location.heading ?? undefined,
      speed: location.speed ?? undefined,
    });
  }

  async stopTracking() {
    await this.geolocation.stopWatching();
    this.isTracking = false;
  }

  async markArrived() {
    this.websocket.notifyArrival(this.requestId);
    await this.stopTracking();
  }

  ngOnDestroy() {
    if (this.isTracking) {
      this.stopTracking();
    }
  }
}
```

### 4.5. Patient Tracking View (track-nurse.page.ts)

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TrackingService } from '../../../core/services/tracking.service';
import { ServiceRequestService } from '../../../core/services/service-request.service';

@Component({
  selector: 'app-track-nurse',
  templateUrl: './track-nurse.page.html',
})
export class TrackNursePage implements OnInit, OnDestroy {
  requestId: string = '';
  trackingData$ = this.tracking.state;

  constructor(
    private route: ActivatedRoute,
    private tracking: TrackingService,
    private requestService: ServiceRequestService,
  ) {}

  async ngOnInit() {
    this.requestId = this.route.snapshot.params['id'];

    // Get initial request data
    const request = await this.requestService.getRequest(this.requestId);

    // Start tracking (will start Live Activity or Foreground Service)
    await this.tracking.startTracking(this.requestId, {
      nurse: {
        name: request.nurse.name,
        photo: request.nurse.photo,
      },
      eta: {
        minutes: 15, // Initial estimate
        distance: 2.5,
      },
      status: 'en_route',
    });
  }

  async ngOnDestroy() {
    await this.tracking.stopTracking();
  }
}
```

## 5. Configuración iOS (Xcode)

### 5.1. Crear Widget Extension

1. Abrir `ios/App/App.xcworkspace` en Xcode
2. File → New → Target → Widget Extension
3. Nombre: `NurseLiteWidget`
4. Crear `NurseTrackingAttributes.swift`:

```swift
import ActivityKit
import Foundation

struct NurseTrackingAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var nurseName: String
        var nursePhoto: String
        var etaMinutes: Int
        var distance: Double
        var status: String
    }

    var requestId: String
}
```

5. Crear `NurseTrackingLiveActivity.swift`:

```swift
import ActivityKit
import WidgetKit
import SwiftUI

struct NurseTrackingLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: NurseTrackingAttributes.self) { context in
            // Lock screen/banner UI
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    AsyncImage(url: URL(string: context.state.nursePhoto)) { image in
                        image
                            .resizable()
                            .scaledToFill()
                    } placeholder: {
                        Circle()
                            .fill(Color.gray)
                    }
                    .frame(width: 40, height: 40)
                    .clipShape(Circle())

                    VStack(alignment: .leading) {
                        Text(context.state.nurseName)
                            .font(.headline)
                        Text("Viene en camino")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    VStack(alignment: .trailing) {
                        Text("\(context.state.etaMinutes) min")
                            .font(.title2)
                            .fontWeight(.bold)
                        Text("\(String(format: "%.1f", context.state.distance)) km")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                ProgressView(value: calculateProgress(context.state.etaMinutes))
                    .tint(.blue)
            }
            .padding()
            .background(Color(UIColor.systemBackground))

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI
                DynamicIslandExpandedRegion(.leading) {
                    HStack {
                        AsyncImage(url: URL(string: context.state.nursePhoto)) { image in
                            image
                                .resizable()
                                .scaledToFill()
                        } placeholder: {
                            Circle().fill(Color.gray)
                        }
                        .frame(width: 40, height: 40)
                        .clipShape(Circle())

                        Text(context.state.nurseName)
                            .font(.headline)
                    }
                }

                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing) {
                        Text("\(context.state.etaMinutes) min")
                            .font(.title3)
                            .fontWeight(.bold)
                        Text("\(String(format: "%.1f", context.state.distance)) km")
                            .font(.caption)
                    }
                }

                DynamicIslandExpandedRegion(.bottom) {
                    ProgressView(value: calculateProgress(context.state.etaMinutes))
                }
            } compactLeading: {
                Image(systemName: "figure.walk")
            } compactTrailing: {
                Text("\(context.state.etaMinutes) min")
                    .font(.caption)
            } minimal: {
                Image(systemName: "figure.walk")
            }
        }
    }

    func calculateProgress(_ etaMinutes: Int) -> Double {
        // Example: 30 min max
        return max(0, min(1, 1 - (Double(etaMinutes) / 30)))
    }
}
```

### 5.2. Actualizar Info.plist

```xml
<key>NSSupportsLiveActivities</key>
<true/>
<key>NSSupportsLiveActivitiesFrequentUpdates</key>
<true/>
```

### 5.3. Configurar App Groups

1. Signing & Capabilities → + Capability → App Groups
2. Crear grupo: `group.com.historahealth.nurselite`
3. Agregar mismo grupo en Widget Extension

## 6. Configuración Android

### 6.1. AndroidManifest.xml

```xml
<manifest>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

    <application>
        <!-- Notification channels will be created programmatically -->
    </application>
</manifest>
```

### 6.2. Crear Notification Channel (en código)

```typescript
// En app.component.ts o similar
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';

async setupNotificationChannels() {
  if (Capacitor.getPlatform() === 'android') {
    await ForegroundService.createNotificationChannel({
      id: 'nurse_tracking',
      name: 'Seguimiento de enfermera',
      description: 'Tracking en tiempo real de tu enfermera',
      importance: 4, // HIGH
    });
  }
}
```

## 7. Variables de Entorno

### Backend (.env)

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### Frontend (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'http://localhost:3000',
  trackingUpdateInterval: 5000, // 5 seconds
};
```

## 8. Testing y Consideraciones

### Pruebas iOS

1. Requiere dispositivo físico con iOS 16.2+
2. Simulator muestra Live Activities pero sin notificaciones push
3. Usar Apple Push Notification Tool para probar push updates

### Pruebas Android

1. Funciona en emulador y dispositivo físico
2. Probar en Android 13+ para permisos POST_NOTIFICATIONS
3. Verificar que usuario puede dismissear en Android 14+

### Optimizaciones

1. **Throttling de ubicación**: No enviar updates cada segundo, usar 5-10s
2. **Batería**: Pausar tracking si app en background por mucho tiempo
3. **Fallback**: Si Google Maps API falla, usar cálculo Haversine
4. **Caché**: Guardar último estado en localStorage para recovery

### Limitaciones

1. **iOS**: Live Activities max 8 horas, sistema termina automáticamente
2. **Android 14+**: Usuario puede dismissear notificación foreground
3. **Push throttling**: Apple limita frecuencia de high priority pushes
4. **Costos**: Google Maps API y Firebase tienen costos después de tier gratuito

## 9. Próximos Pasos

1. **Fase 1**: Implementar backend (tracking module + ETA calculator)
2. **Fase 2**: Implementar frontend services (iOS + Android)
3. **Fase 3**: Configurar Xcode widget extension
4. **Fase 4**: Configurar Android foreground service
5. **Fase 5**: Integrar con UI existente (nurse/patient pages)
6. **Fase 6**: Testing en dispositivos reales
7. **Fase 7**: Monitoreo y optimización

## 10. Referencias

- [iOS Live Activities in Capacitor](https://medium.com/@kisimedia/ios-live-activities-in-capacitor-a-practical-plugin-to-make-it-work-9c85d40e35e1)
- [capacitor-live-activity GitHub](https://github.com/kisimediaDE/capacitor-live-activity)
- [Capacitor Android Foreground Service](https://capawesome.io/plugins/android-foreground-service/)
- [Apple ActivityKit Documentation](https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications)
- [Google Maps Distance Matrix API](https://developers.google.com/maps/documentation/distance-matrix/overview)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

---

**Última actualización**: 2026-01-22
