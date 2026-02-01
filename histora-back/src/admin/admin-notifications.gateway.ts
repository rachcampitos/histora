import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export interface AdminNotification {
  type: 'nurse_registered' | 'verification_pending' | 'panic_alert' | 'negative_review' | 'service_completed' | 'payment_received';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/admin',
})
export class AdminNotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AdminNotificationsGateway.name);
  private connectedAdmins: Map<string, Set<string>> = new Map(); // userId -> socketIds

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token ||
                    client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Admin WS connection rejected: No token provided');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub || payload.userId;
      client.userRole = payload.role;

      // Only allow platform admins
      if (client.userRole !== 'platform_admin' && client.userRole !== 'platform_admin_ui') {
        this.logger.warn(`Admin WS connection rejected: User ${client.userId} is not an admin (role: ${client.userRole})`);
        client.disconnect();
        return;
      }

      // Add to connected admins
      const userId = client.userId!;
      if (!this.connectedAdmins.has(userId)) {
        this.connectedAdmins.set(userId, new Set());
      }
      this.connectedAdmins.get(userId)?.add(client.id);

      // Join admin room for broadcasts
      client.join('admins');
      // Join personal room for targeted notifications
      client.join(`admin:${client.userId}`);

      this.logger.log(`Admin ${client.userId} connected to admin notifications (socket: ${client.id})`);

      // Send connection confirmation with current admin count
      client.emit('connected', {
        userId: client.userId,
        connectedAdmins: this.connectedAdmins.size,
      });

    } catch (error) {
      this.logger.error('Admin WS connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.connectedAdmins.get(client.userId);
      userSockets?.delete(client.id);

      if (userSockets?.size === 0) {
        this.connectedAdmins.delete(client.userId);
      }

      this.logger.log(`Admin ${client.userId} disconnected from admin notifications`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    return { event: 'pong', timestamp: new Date() };
  }

  // ==================== Broadcast Methods ====================

  /**
   * Broadcast notification to all connected admins
   */
  broadcastToAllAdmins(notification: AdminNotification): void {
    this.server.to('admins').emit('notification', notification);
    this.logger.log(`Broadcasted ${notification.type} to ${this.connectedAdmins.size} admins`);
  }

  /**
   * Send notification to a specific admin
   */
  notifyAdmin(adminId: string, notification: AdminNotification): void {
    this.server.to(`admin:${adminId}`).emit('notification', notification);
  }

  /**
   * Notify when a new nurse registers
   */
  notifyNurseRegistered(nurseData: { id: string; name: string; cepNumber: string }): void {
    const notification: AdminNotification = {
      type: 'nurse_registered',
      title: 'Nueva enfermera registrada',
      message: `${nurseData.name} se ha registrado con CEP ${nurseData.cepNumber}`,
      data: nurseData,
      timestamp: new Date(),
      priority: 'medium',
    };
    this.broadcastToAllAdmins(notification);
  }

  /**
   * Notify when there's a new pending verification
   */
  notifyVerificationPending(verificationData: { id: string; nurseName: string; cepNumber: string }): void {
    const notification: AdminNotification = {
      type: 'verification_pending',
      title: 'Verificacion pendiente',
      message: `${verificationData.nurseName} requiere verificacion CEP`,
      data: verificationData,
      timestamp: new Date(),
      priority: 'high',
    };
    this.broadcastToAllAdmins(notification);
  }

  /**
   * Notify when there's a panic alert (critical!)
   */
  notifyPanicAlert(alertData: { id: string; nurseName: string; patientName: string; location?: { lat: number; lng: number } }): void {
    const notification: AdminNotification = {
      type: 'panic_alert',
      title: 'ALERTA DE PANICO',
      message: `Alerta activa: ${alertData.nurseName} con paciente ${alertData.patientName}`,
      data: alertData,
      timestamp: new Date(),
      priority: 'critical',
    };
    this.broadcastToAllAdmins(notification);
  }

  /**
   * Notify when there's a negative review (1-2 stars)
   */
  notifyNegativeReview(reviewData: { id: string; nurseName: string; rating: number; comment?: string }): void {
    const notification: AdminNotification = {
      type: 'negative_review',
      title: 'Resena negativa',
      message: `${reviewData.nurseName} recibio ${reviewData.rating} estrellas`,
      data: reviewData,
      timestamp: new Date(),
      priority: 'high',
    };
    this.broadcastToAllAdmins(notification);
  }

  /**
   * Notify when a service is completed
   */
  notifyServiceCompleted(serviceData: { id: string; nurseName: string; patientName: string; amount: number }): void {
    const notification: AdminNotification = {
      type: 'service_completed',
      title: 'Servicio completado',
      message: `${serviceData.nurseName} completo servicio con ${serviceData.patientName} - S/. ${serviceData.amount}`,
      data: serviceData,
      timestamp: new Date(),
      priority: 'low',
    };
    this.broadcastToAllAdmins(notification);
  }

  /**
   * Notify when a payment is received
   */
  notifyPaymentReceived(paymentData: { id: string; amount: number; method: string; nurseName?: string }): void {
    const notification: AdminNotification = {
      type: 'payment_received',
      title: 'Pago recibido',
      message: `Pago de S/. ${paymentData.amount} via ${paymentData.method}`,
      data: paymentData,
      timestamp: new Date(),
      priority: 'low',
    };
    this.broadcastToAllAdmins(notification);
  }

  // ==================== Utility Methods ====================

  isAdminOnline(adminId: string): boolean {
    return this.connectedAdmins.has(adminId);
  }

  getOnlineAdmins(): string[] {
    return Array.from(this.connectedAdmins.keys());
  }

  getOnlineAdminCount(): number {
    return this.connectedAdmins.size;
  }
}
