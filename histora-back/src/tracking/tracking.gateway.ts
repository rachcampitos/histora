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
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ServiceRequest } from '../service-requests/schema/service-request.schema';
import { Nurse } from '../nurses/schema/nurse.schema';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  nurseDocId?: string; // Nurse document _id (different from userId)
}

interface LocationUpdateData {
  requestId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

interface TrackingData {
  requestId: string;
  nurseId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  nurse?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
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
  namespace: '/tracking',
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);
  private activeNurses: Map<string, Set<string>> = new Map(); // nurseDocId -> socketIds
  private nurseRequests: Map<string, string> = new Map(); // nurseDocId -> current requestId
  private lastLocationUpdate: Map<string, number> = new Map(); // nurseDocId -> timestamp

  constructor(
    private jwtService: JwtService,
    @InjectModel(ServiceRequest.name) private requestModel: Model<ServiceRequest>,
    @InjectModel(Nurse.name) private nurseModel: Model<Nurse>,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token ||
                    client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Tracking connection rejected: No token provided');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub || payload.userId;
      client.userRole = payload.role;
      client.nurseDocId = payload.nurseId; // Nurse document _id from JWT

      // Track nurse connections (keyed by Nurse doc _id)
      if (client.userRole === 'nurse' && client.nurseDocId) {
        if (!this.activeNurses.has(client.nurseDocId)) {
          this.activeNurses.set(client.nurseDocId, new Set());
        }
        this.activeNurses.get(client.nurseDocId)?.add(client.id);
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
    if (client.nurseDocId && client.userRole === 'nurse') {
      const sockets = this.activeNurses.get(client.nurseDocId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.activeNurses.delete(client.nurseDocId);
          // Clean up nurse request mapping
          this.nurseRequests.delete(client.nurseDocId);
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
      // Verify user has access to this request
      const request = await this.requestModel.findById(data.requestId);
      if (!request) {
        return { success: false, error: 'Solicitud no encontrada' };
      }

      // Check if user is patient or nurse for this request
      const isPatient = request.patientId.toString() === client.userId;
      const isNurse = client.nurseDocId && request.nurseId?.toString() === client.nurseDocId;

      if (!isPatient && !isNurse && client.userRole !== 'platform_admin') {
        return { success: false, error: 'No autorizado para este tracking' };
      }

      client.join(`tracking:${data.requestId}`);
      this.logger.log(`User ${client.userId} joined tracking room ${data.requestId}`);

      // If nurse is joining, store the mapping
      if (isNurse) {
        this.nurseRequests.set(client.nurseDocId!, data.requestId);
      }

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

    // Clean up nurse request mapping if nurse is leaving
    if (client.userRole === 'nurse' && client.nurseDocId && this.nurseRequests.get(client.nurseDocId) === data.requestId) {
      this.nurseRequests.delete(client.nurseDocId);
    }

    return { success: true };
  }

  @SubscribeMessage('nurse:location:update')
  async handleLocationUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: LocationUpdateData,
  ) {
    try {
      if (client.userRole !== 'nurse') {
        return { success: false, error: 'Solo enfermeras pueden enviar ubicación' };
      }

      // Rate limit: max 1 location update per 2 seconds
      const now = Date.now();
      const lastUpdate = this.lastLocationUpdate.get(client.nurseDocId!) || 0;
      if (now - lastUpdate < 2000) {
        return { success: false, error: 'Actualizacion muy frecuente' };
      }
      this.lastLocationUpdate.set(client.nurseDocId!, now);

      // Verify nurse is assigned to this request
      const request = await this.requestModel.findById(data.requestId);
      if (!request || request.nurseId?.toString() !== client.nurseDocId) {
        return { success: false, error: 'No autorizado para este servicio' };
      }

      // Get nurse info for broadcast
      const nurse = await this.nurseModel.findById(client.nurseDocId)
        .populate('userId', 'firstName lastName');

      // Parse name from cepRegisteredName or populated user
      let firstName = '';
      let lastName = '';
      let avatar = '';

      if (nurse) {
        // Use cepRegisteredName if available (format: "LASTNAME FIRSTNAME")
        if (nurse.cepRegisteredName) {
          const nameParts = nurse.cepRegisteredName.split(' ');
          // CEP format is usually "LASTNAME LASTNAME FIRSTNAME FIRSTNAME"
          // Take first two as lastName, rest as firstName
          if (nameParts.length >= 3) {
            lastName = nameParts.slice(0, 2).join(' ');
            firstName = nameParts.slice(2).join(' ');
          } else if (nameParts.length === 2) {
            lastName = nameParts[0];
            firstName = nameParts[1];
          } else {
            firstName = nurse.cepRegisteredName;
          }
        } else if (nurse.userId && typeof nurse.userId === 'object') {
          // Fallback to populated user data
          const user = nurse.userId as any;
          firstName = user.firstName || '';
          lastName = user.lastName || '';
        }
        avatar = nurse.officialCepPhotoUrl || '';
      }

      // Build tracking data
      const trackingData: TrackingData = {
        requestId: data.requestId,
        nurseId: client.nurseDocId!,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        speed: data.speed,
        timestamp: new Date(),
        nurse: nurse ? {
          firstName,
          lastName,
          avatar,
        } : undefined,
      };

      // Broadcast to all in the tracking room
      this.server.to(`tracking:${data.requestId}`).emit('nurse:location', trackingData);

      // Update request status if needed (when nurse starts moving)
      if (request.status === 'accepted') {
        request.status = 'on_the_way';
        request.statusHistory.push({
          status: 'on_the_way',
          changedAt: new Date(),
          changedBy: new Types.ObjectId(client.userId),
        });
        await request.save();

        // Notify status change
        this.server.to(`tracking:${data.requestId}`).emit('request:status', {
          requestId: data.requestId,
          status: 'on_the_way',
          updatedAt: new Date(),
        });
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Location update error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('nurse:arrived')
  async handleNurseArrived(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { requestId: string },
  ) {
    try {
      if (client.userRole !== 'nurse') {
        return { success: false, error: 'No autorizado' };
      }

      const request = await this.requestModel.findById(data.requestId);
      if (!request || request.nurseId?.toString() !== client.nurseDocId) {
        return { success: false, error: 'Servicio no encontrado' };
      }

      // Update request status
      request.status = 'arrived';
      request.statusHistory.push({
        status: 'arrived',
        changedAt: new Date(),
        changedBy: new Types.ObjectId(client.userId),
      });
      await request.save();

      // Notify all in tracking room
      this.server.to(`tracking:${data.requestId}`).emit('nurse:arrived', {
        requestId: data.requestId,
      });

      this.server.to(`tracking:${data.requestId}`).emit('request:status', {
        requestId: data.requestId,
        status: 'arrived',
        updatedAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Nurse arrived error:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('service:started')
  async handleServiceStarted(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { requestId: string },
  ) {
    try {
      if (client.userRole !== 'nurse') {
        return { success: false, error: 'No autorizado' };
      }

      const request = await this.requestModel.findById(data.requestId);
      if (!request || request.nurseId?.toString() !== client.nurseDocId) {
        return { success: false, error: 'Servicio no encontrado' };
      }

      request.status = 'in_progress';
      request.statusHistory.push({
        status: 'in_progress',
        changedAt: new Date(),
        changedBy: new Types.ObjectId(client.userId),
      });
      await request.save();

      this.server.to(`tracking:${data.requestId}`).emit('service:started', {
        requestId: data.requestId,
      });

      this.server.to(`tracking:${data.requestId}`).emit('request:status', {
        requestId: data.requestId,
        status: 'in_progress',
        updatedAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('service:completed')
  async handleServiceCompleted(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { requestId: string },
  ) {
    try {
      if (client.userRole !== 'nurse') {
        return { success: false, error: 'No autorizado' };
      }

      const request = await this.requestModel.findById(data.requestId);
      if (!request || request.nurseId?.toString() !== client.nurseDocId) {
        return { success: false, error: 'Servicio no encontrado' };
      }

      request.status = 'completed';
      request.completedAt = new Date();
      request.statusHistory.push({
        status: 'completed',
        changedAt: new Date(),
        changedBy: new Types.ObjectId(client.userId),
      });
      await request.save();

      this.server.to(`tracking:${data.requestId}`).emit('service:completed', {
        requestId: data.requestId,
      });

      this.server.to(`tracking:${data.requestId}`).emit('request:status', {
        requestId: data.requestId,
        status: 'completed',
        updatedAt: new Date(),
      });

      // Clean up nurse request mapping
      this.nurseRequests.delete(client.nurseDocId!);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('nurse:eta')
  async handleNurseEta(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { requestId: string; estimatedArrival: Date },
  ) {
    try {
      if (client.userRole !== 'nurse') {
        return { success: false, error: 'No autorizado' };
      }

      // Broadcast ETA to tracking room
      this.server.to(`tracking:${data.requestId}`).emit('request:status', {
        requestId: data.requestId,
        status: 'on_the_way',
        updatedAt: new Date(),
        estimatedArrival: data.estimatedArrival,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('map:join')
  handleJoinMapRoom(@ConnectedSocket() client: AuthenticatedSocket) {
    client.join('map:viewers');
    this.logger.log(`User ${client.userId} joined map:viewers room`);
    return { success: true };
  }

  @SubscribeMessage('map:leave')
  handleLeaveMapRoom(@ConnectedSocket() client: AuthenticatedSocket) {
    client.leave('map:viewers');
    this.logger.log(`User ${client.userId} left map:viewers room`);
    return { success: true };
  }

  /**
   * Broadcast to all patients viewing the map that a nurse's availability changed
   */
  broadcastNurseAvailabilityChanged(nurseUserId: string) {
    this.server.to('map:viewers').emit('nurse:availability:changed', {
      nurseUserId,
      timestamp: new Date(),
    });
  }

  // Utility method for external services to broadcast
  async broadcastToRequest(requestId: string, event: string, data: any) {
    this.server.to(`tracking:${requestId}`).emit(event, data);
  }

  // Check if a nurse is currently online
  isNurseOnline(nurseId: string): boolean {
    return this.activeNurses.has(nurseId);
  }

  // Get all online nurses
  getOnlineNurses(): string[] {
    return Array.from(this.activeNurses.keys());
  }

  /**
   * Notify nurse about a new service request
   * Broadcasts to the nurse's personal room
   */
  notifyNurseNewRequest(nurseUserId: string, requestData: {
    requestId: string;
    service: { name: string; category: string; price: number };
    location: { address: string; district?: string };
    requestedDate: Date;
    patient?: { firstName?: string; lastName?: string };
  }) {
    this.logger.log(`Notifying nurse ${nurseUserId} about new request ${requestData.requestId}`);

    // Broadcast to nurse's personal room
    this.server.to(`user:${nurseUserId}`).emit('request:new', {
      ...requestData,
      timestamp: new Date(),
    });
  }

  /**
   * Notify patient about request status change
   */
  notifyPatientStatusChange(patientUserId: string, data: {
    requestId: string;
    status: string;
    nurse?: { firstName?: string; lastName?: string };
  }) {
    this.server.to(`user:${patientUserId}`).emit('request:status', {
      ...data,
      updatedAt: new Date(),
    });
  }
}
