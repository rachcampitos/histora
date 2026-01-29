import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationStatus,
} from './schema/notification.schema';

interface QueuedNotification {
  notificationId: string;
  retryCount: number;
  addedAt: Date;
}

/**
 * Simple in-memory notification queue service.
 * Processes notifications asynchronously with retry logic.
 *
 * For production with high volume, replace with Bull + Redis.
 */
@Injectable()
export class NotificationQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationQueueService.name);
  private queue: QueuedNotification[] = [];
  private isProcessing = false;
  private processInterval: NodeJS.Timeout | null = null;

  // Configuration
  private readonly maxRetries = 3;
  private readonly processingIntervalMs = 1000; // Process queue every 1 second
  private readonly concurrency = 5; // Process 5 notifications at a time
  private readonly retryDelayMs = 5000; // Wait 5 seconds before retry

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  onModuleInit() {
    this.startProcessing();
    this.logger.log('Notification queue service initialized');
  }

  onModuleDestroy() {
    this.stopProcessing();
    this.logger.log('Notification queue service stopped');
  }

  /**
   * Add a notification to the queue for async processing
   */
  enqueue(notificationId: string): void {
    this.queue.push({
      notificationId,
      retryCount: 0,
      addedAt: new Date(),
    });
    this.logger.debug(`Notification ${notificationId} added to queue. Queue size: ${this.queue.length}`);
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): { size: number; processing: boolean } {
    return {
      size: this.queue.length,
      processing: this.isProcessing,
    };
  }

  private startProcessing(): void {
    if (this.processInterval) return;

    this.processInterval = setInterval(() => {
      this.processQueue();
    }, this.processingIntervalMs);
  }

  private stopProcessing(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    try {
      // Take up to `concurrency` items from the queue
      const batch = this.queue.splice(0, this.concurrency);

      // Process in parallel
      const results = await Promise.allSettled(
        batch.map(item => this.processNotification(item))
      );

      // Handle failed notifications
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const item = batch[index];
          if (item.retryCount < this.maxRetries) {
            // Re-queue for retry
            setTimeout(() => {
              this.queue.push({
                ...item,
                retryCount: item.retryCount + 1,
              });
            }, this.retryDelayMs);
          } else {
            this.logger.error(`Notification ${item.notificationId} failed after ${this.maxRetries} retries`);
          }
        }
      });
    } finally {
      this.isProcessing = false;
    }
  }

  private async processNotification(item: QueuedNotification): Promise<void> {
    const notification = await this.notificationModel.findById(item.notificationId);

    if (!notification) {
      this.logger.warn(`Notification ${item.notificationId} not found`);
      return;
    }

    // Skip if already processed
    if (notification.status === NotificationStatus.SENT || notification.status === NotificationStatus.READ) {
      return;
    }

    // Mark as processing
    notification.status = NotificationStatus.PENDING;
    await notification.save();

    this.logger.debug(`Processing notification ${item.notificationId} (attempt ${item.retryCount + 1})`);
  }

  /**
   * Retry failed notifications (called by scheduler)
   */
  async retryFailedNotifications(): Promise<{ queued: number }> {
    const failedNotifications = await this.notificationModel.find({
      status: NotificationStatus.FAILED,
      retryCount: { $lt: this.maxRetries },
    }).limit(50);

    for (const notification of failedNotifications) {
      this.enqueue((notification._id as Types.ObjectId).toString());
    }

    return { queued: failedNotifications.length };
  }
}
