import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  WebPushSubscription,
  WebPushSubscriptionDocument,
} from './schema/web-push-subscription.schema';
import { WebPushProvider, WebPushPayload } from './providers/web-push.provider';

export interface SubscribeDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo?: {
    userAgent?: string;
    language?: string;
    timezone?: string;
  };
}

@Injectable()
export class WebPushService {
  private readonly logger = new Logger(WebPushService.name);

  constructor(
    @InjectModel(WebPushSubscription.name)
    private subscriptionModel: Model<WebPushSubscriptionDocument>,
    private webPushProvider: WebPushProvider,
  ) {}

  /**
   * Get VAPID public key for client-side subscription
   */
  getPublicKey(): string | null {
    return this.webPushProvider.getPublicKey();
  }

  /**
   * Check if web push is enabled
   */
  isEnabled(): boolean {
    return this.webPushProvider.isEnabled();
  }

  /**
   * Subscribe a user to web push notifications
   */
  async subscribe(userId: string, dto: SubscribeDto): Promise<WebPushSubscription> {
    const existing = await this.subscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      endpoint: dto.endpoint,
    });

    if (existing) {
      // Update existing subscription
      existing.keys = dto.keys;
      existing.deviceInfo = dto.deviceInfo;
      existing.isActive = true;
      existing.lastUsedAt = new Date();
      existing.failureCount = 0;
      existing.lastFailedAt = undefined;
      await existing.save();

      this.logger.log(`Updated web push subscription for user ${userId}`);
      return existing;
    }

    // Create new subscription
    const subscription = await this.subscriptionModel.create({
      userId: new Types.ObjectId(userId),
      endpoint: dto.endpoint,
      keys: dto.keys,
      deviceInfo: dto.deviceInfo,
      isActive: true,
      lastUsedAt: new Date(),
    });

    this.logger.log(`Created new web push subscription for user ${userId}`);
    return subscription;
  }

  /**
   * Unsubscribe from web push notifications
   */
  async unsubscribe(userId: string, endpoint: string): Promise<boolean> {
    const result = await this.subscriptionModel.deleteOne({
      userId: new Types.ObjectId(userId),
      endpoint,
    });

    this.logger.log(`Unsubscribed user ${userId} from web push`);
    return result.deletedCount > 0;
  }

  /**
   * Unsubscribe all devices for a user
   */
  async unsubscribeAll(userId: string): Promise<number> {
    const result = await this.subscriptionModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });

    this.logger.log(`Removed all ${result.deletedCount} subscriptions for user ${userId}`);
    return result.deletedCount;
  }

  /**
   * Get all active subscriptions for a user
   */
  async getSubscriptions(userId: string): Promise<WebPushSubscription[]> {
    return this.subscriptionModel.find({
      userId: new Types.ObjectId(userId),
      isActive: true,
    });
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: string, payload: WebPushPayload): Promise<{ sent: number; failed: number }> {
    const subscriptions = await this.getSubscriptions(userId);

    if (subscriptions.length === 0) {
      this.logger.log(`No active subscriptions for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    const webPushSubs = subscriptions.map((sub) => ({
      endpoint: sub.endpoint,
      keys: sub.keys,
    }));

    const result = await this.webPushProvider.sendToMultiple(webPushSubs, payload);

    // Remove invalid subscriptions
    if (result.removed.length > 0) {
      await this.subscriptionModel.deleteMany({
        userId: new Types.ObjectId(userId),
        endpoint: { $in: result.removed },
      });
      this.logger.log(`Removed ${result.removed.length} invalid subscriptions for user ${userId}`);
    }

    return { sent: result.sent, failed: result.failed };
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(userIds: string[], payload: WebPushPayload): Promise<{ sent: number; failed: number }> {
    let totalSent = 0;
    let totalFailed = 0;

    for (const userId of userIds) {
      const result = await this.sendToUser(userId, payload);
      totalSent += result.sent;
      totalFailed += result.failed;
    }

    return { sent: totalSent, failed: totalFailed };
  }

  // =====================
  // NurseLite Specific Methods
  // =====================

  /**
   * Notify nurse when their account is verified
   */
  async notifyNurseVerified(userId: string, nurseName: string): Promise<void> {
    const payload = this.webPushProvider.getAccountVerifiedPayload({ nurseName });
    const result = await this.sendToUser(userId, payload);

    this.logger.log(
      `Sent verification notification to ${nurseName}: ${result.sent} sent, ${result.failed} failed`,
    );
  }

  /**
   * Notify nurse when their account is rejected
   */
  async notifyNurseRejected(userId: string, nurseName: string, reason?: string): Promise<void> {
    const payload = this.webPushProvider.getAccountRejectedPayload({ nurseName, reason });
    const result = await this.sendToUser(userId, payload);

    this.logger.log(
      `Sent rejection notification to ${nurseName}: ${result.sent} sent, ${result.failed} failed`,
    );
  }

  /**
   * Notify nurse of new service request
   */
  async notifyNurseNewRequest(
    nurseUserId: string,
    patientName: string,
    serviceName: string,
    requestId: string,
  ): Promise<void> {
    const payload = this.webPushProvider.getNewServiceRequestPayload({
      patientName,
      serviceName,
      requestId,
    });
    await this.sendToUser(nurseUserId, payload);
  }

  /**
   * Notify patient when service is accepted
   */
  async notifyPatientServiceAccepted(
    patientUserId: string,
    nurseName: string,
    serviceName: string,
    requestId: string,
    scheduledDate?: string,
  ): Promise<void> {
    const payload = this.webPushProvider.getServiceAcceptedPayload({
      nurseName,
      serviceName,
      requestId,
      scheduledDate,
    });
    await this.sendToUser(patientUserId, payload);
  }

  /**
   * Notify patient when nurse is on the way
   */
  async notifyPatientNurseOnTheWay(
    patientUserId: string,
    nurseName: string,
    requestId: string,
    estimatedMinutes?: number,
  ): Promise<void> {
    const payload = this.webPushProvider.getNurseOnTheWayPayload({
      nurseName,
      estimatedMinutes,
      requestId,
    });
    await this.sendToUser(patientUserId, payload);
  }

  /**
   * Notify patient when nurse arrives
   */
  async notifyPatientNurseArrived(
    patientUserId: string,
    nurseName: string,
    requestId: string,
  ): Promise<void> {
    const payload = this.webPushProvider.getNurseArrivedPayload({
      nurseName,
      requestId,
    });
    await this.sendToUser(patientUserId, payload);
  }

  /**
   * Notify patient when service is completed
   */
  async notifyPatientServiceCompleted(
    patientUserId: string,
    nurseName: string,
    serviceName: string,
    requestId: string,
  ): Promise<void> {
    const payload = this.webPushProvider.getServiceCompletedPayload({
      nurseName,
      serviceName,
      requestId,
    });
    await this.sendToUser(patientUserId, payload);
  }

  /**
   * Notify nurse of payment received
   */
  async notifyNursePaymentReceived(
    nurseUserId: string,
    amount: number,
    currency: string,
    serviceName: string,
  ): Promise<void> {
    const payload = this.webPushProvider.getPaymentReceivedPayload({
      amount,
      currency,
      serviceName,
    });
    await this.sendToUser(nurseUserId, payload);
  }
}
