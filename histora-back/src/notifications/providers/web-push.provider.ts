import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webPush from 'web-push';

export interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  vibrate?: number[];
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface WebPushResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  shouldRemove?: boolean; // True if subscription is invalid and should be removed
}

@Injectable()
export class WebPushProvider implements OnModuleInit {
  private readonly logger = new Logger(WebPushProvider.name);
  private isConfigured = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.configure();
  }

  /**
   * Configure VAPID details for web push
   */
  private configure(): void {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>('VAPID_SUBJECT', 'mailto:soporte@historahealth.com');

    if (!publicKey || !privateKey) {
      this.logger.warn('VAPID keys not configured. Web Push will be disabled.');
      this.logger.warn('Generate keys with: npx web-push generate-vapid-keys');
      return;
    }

    try {
      webPush.setVapidDetails(subject, publicKey, privateKey);
      this.isConfigured = true;
      this.logger.log('Web Push configured successfully with VAPID keys');
    } catch (error) {
      this.logger.error(`Failed to configure VAPID: ${error.message}`);
    }
  }

  /**
   * Get VAPID public key for client-side subscription
   */
  getPublicKey(): string | null {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') || null;
  }

  /**
   * Check if web push is properly configured
   */
  isEnabled(): boolean {
    return this.isConfigured;
  }

  /**
   * Send a web push notification
   */
  async send(subscription: WebPushSubscription, payload: WebPushPayload): Promise<WebPushResult> {
    if (!this.isConfigured) {
      this.logger.warn('Web Push not configured, skipping notification');
      return { success: false, error: 'Web Push not configured' };
    }

    const pushSubscription: webPush.PushSubscription = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    };

    const notificationPayload = JSON.stringify({
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/assets/icons/icon-192x192.png',
        badge: payload.badge || '/assets/icons/badge-72x72.png',
        image: payload.image,
        tag: payload.tag,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: payload.requireInteraction ?? false,
        vibrate: payload.vibrate || [100, 50, 100],
      },
    });

    try {
      const result = await webPush.sendNotification(pushSubscription, notificationPayload);

      this.logger.log(`Web Push sent successfully to ${subscription.endpoint.substring(0, 50)}...`);

      return {
        success: true,
        statusCode: result.statusCode,
      };
    } catch (error) {
      this.logger.error(`Web Push failed: ${error.message}`);

      // Check if subscription is no longer valid
      const shouldRemove = error.statusCode === 404 || error.statusCode === 410;

      return {
        success: false,
        statusCode: error.statusCode,
        error: error.message,
        shouldRemove,
      };
    }
  }

  /**
   * Send to multiple subscriptions
   */
  async sendToMultiple(
    subscriptions: WebPushSubscription[],
    payload: WebPushPayload,
  ): Promise<{ sent: number; failed: number; removed: string[] }> {
    let sent = 0;
    let failed = 0;
    const removed: string[] = [];

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const result = await this.send(sub, payload);
        return { subscription: sub, result };
      }),
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.result.success) {
          sent++;
        } else {
          failed++;
          if (result.value.result.shouldRemove) {
            removed.push(result.value.subscription.endpoint);
          }
        }
      } else {
        failed++;
      }
    }

    return { sent, failed, removed };
  }

  // =====================
  // NurseLite Notification Templates
  // =====================

  /**
   * Notification when nurse account is verified
   */
  getAccountVerifiedPayload(data: {
    nurseName: string;
  }): WebPushPayload {
    return {
      title: 'Cuenta Verificada',
      body: `${data.nurseName}, tu cuenta ha sido verificada exitosamente. Ya puedes recibir solicitudes de servicio.`,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      tag: 'account-verified',
      data: {
        type: 'ACCOUNT_VERIFIED',
        url: '/nurse/dashboard',
      },
      actions: [
        {
          action: 'open',
          title: 'Ver Dashboard',
        },
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200],
    };
  }

  /**
   * Notification when nurse account is rejected
   */
  getAccountRejectedPayload(data: {
    nurseName: string;
    reason?: string;
  }): WebPushPayload {
    return {
      title: 'Verificacion Rechazada',
      body: data.reason
        ? `${data.nurseName}, tu verificacion fue rechazada: ${data.reason}`
        : `${data.nurseName}, tu verificacion fue rechazada. Por favor revisa los requisitos.`,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      tag: 'account-rejected',
      data: {
        type: 'ACCOUNT_REJECTED',
        url: '/nurse/verification',
        reason: data.reason,
      },
      actions: [
        {
          action: 'retry',
          title: 'Intentar de nuevo',
        },
      ],
      requireInteraction: true,
    };
  }

  /**
   * Notification for new service request
   */
  getNewServiceRequestPayload(data: {
    patientName: string;
    serviceName: string;
    requestId: string;
  }): WebPushPayload {
    return {
      title: 'Nueva Solicitud de Servicio',
      body: `${data.patientName} solicita: ${data.serviceName}`,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      tag: `service-request-${data.requestId}`,
      data: {
        type: 'NEW_SERVICE_REQUEST',
        requestId: data.requestId,
        url: `/nurse/requests/${data.requestId}`,
      },
      actions: [
        {
          action: 'accept',
          title: 'Aceptar',
        },
        {
          action: 'view',
          title: 'Ver detalles',
        },
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
    };
  }

  /**
   * Notification when service request is accepted (for patient)
   */
  getServiceAcceptedPayload(data: {
    nurseName: string;
    serviceName: string;
    requestId: string;
    scheduledDate?: string;
  }): WebPushPayload {
    const dateText = data.scheduledDate ? ` para el ${data.scheduledDate}` : '';
    return {
      title: 'Solicitud Aceptada',
      body: `${data.nurseName} acepto tu solicitud de ${data.serviceName}${dateText}`,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      tag: `service-accepted-${data.requestId}`,
      data: {
        type: 'SERVICE_ACCEPTED',
        requestId: data.requestId,
        url: `/patient/requests/${data.requestId}`,
      },
      actions: [
        {
          action: 'view',
          title: 'Ver detalles',
        },
        {
          action: 'chat',
          title: 'Enviar mensaje',
        },
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200],
    };
  }

  /**
   * Notification when nurse is on the way
   */
  getNurseOnTheWayPayload(data: {
    nurseName: string;
    estimatedMinutes?: number;
    requestId: string;
  }): WebPushPayload {
    const etaText = data.estimatedMinutes
      ? `Llegara en aprox. ${data.estimatedMinutes} min`
      : 'En camino a tu ubicacion';
    return {
      title: 'Enfermera en Camino',
      body: `${data.nurseName} esta en camino. ${etaText}`,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      tag: `nurse-otw-${data.requestId}`,
      data: {
        type: 'NURSE_ON_THE_WAY',
        requestId: data.requestId,
        url: `/patient/tracking/${data.requestId}`,
      },
      actions: [
        {
          action: 'track',
          title: 'Ver ubicacion',
        },
      ],
      vibrate: [100, 50, 100],
    };
  }

  /**
   * Notification when nurse arrives
   */
  getNurseArrivedPayload(data: {
    nurseName: string;
    requestId: string;
  }): WebPushPayload {
    return {
      title: 'Enfermera ha Llegado',
      body: `${data.nurseName} ha llegado a tu ubicacion`,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      tag: `nurse-arrived-${data.requestId}`,
      data: {
        type: 'NURSE_ARRIVED',
        requestId: data.requestId,
      },
      requireInteraction: true,
      vibrate: [300, 100, 300],
    };
  }

  /**
   * Notification when service is completed
   */
  getServiceCompletedPayload(data: {
    nurseName: string;
    serviceName: string;
    requestId: string;
  }): WebPushPayload {
    return {
      title: 'Servicio Completado',
      body: `${data.nurseName} ha completado el servicio de ${data.serviceName}. Por favor califica tu experiencia.`,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      tag: `service-completed-${data.requestId}`,
      data: {
        type: 'SERVICE_COMPLETED',
        requestId: data.requestId,
        url: `/patient/requests/${data.requestId}/review`,
      },
      actions: [
        {
          action: 'rate',
          title: 'Calificar',
        },
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200],
    };
  }

  /**
   * Payment received notification
   */
  getPaymentReceivedPayload(data: {
    amount: number;
    currency: string;
    serviceName: string;
  }): WebPushPayload {
    const formattedAmount = new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: data.currency,
    }).format(data.amount);

    return {
      title: 'Pago Recibido',
      body: `Has recibido ${formattedAmount} por ${data.serviceName}`,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      tag: 'payment-received',
      data: {
        type: 'PAYMENT_RECEIVED',
        url: '/nurse/earnings',
      },
      vibrate: [100, 50, 100],
    };
  }
}
