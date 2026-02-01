import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebPushService, SubscribeDto } from './web-push.service';

@ApiTags('Web Push Notifications')
@Controller('notifications/web-push')
export class WebPushController {
  constructor(private readonly webPushService: WebPushService) {}

  /**
   * Get VAPID public key for client-side subscription
   * This endpoint is public - needed before user can subscribe
   */
  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Get VAPID public key for push subscription' })
  @ApiResponse({ status: 200, description: 'Returns the VAPID public key' })
  getVapidPublicKey(): { publicKey: string | null; enabled: boolean } {
    return {
      publicKey: this.webPushService.getPublicKey(),
      enabled: this.webPushService.isEnabled(),
    };
  }

  /**
   * Subscribe to web push notifications
   */
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to web push notifications' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  async subscribe(
    @Request() req: { user: { userId: string } },
    @Body() dto: SubscribeDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.webPushService.subscribe(req.user.userId, dto);
    return {
      success: true,
      message: 'Subscribed to push notifications successfully',
    };
  }

  /**
   * Unsubscribe from web push notifications
   * Uses POST instead of DELETE since DELETE with body is non-standard
   */
  @Post('unsubscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from web push notifications' })
  @ApiResponse({ status: 200, description: 'Unsubscribed successfully' })
  async unsubscribe(
    @Request() req: { user: { userId: string } },
    @Body() body: { endpoint: string },
  ): Promise<{ success: boolean; message: string }> {
    const removed = await this.webPushService.unsubscribe(req.user.userId, body.endpoint);
    return {
      success: removed,
      message: removed ? 'Unsubscribed successfully' : 'Subscription not found',
    };
  }

  /**
   * Unsubscribe all devices
   */
  @Delete('unsubscribe-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe all devices from web push notifications' })
  @ApiResponse({ status: 200, description: 'All subscriptions removed' })
  async unsubscribeAll(
    @Request() req: { user: { userId: string } },
  ): Promise<{ success: boolean; count: number }> {
    const count = await this.webPushService.unsubscribeAll(req.user.userId);
    return { success: true, count };
  }

  /**
   * Get current subscriptions
   */
  @Get('subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current push notification subscriptions' })
  @ApiResponse({ status: 200, description: 'Returns list of active subscriptions' })
  async getSubscriptions(@Request() req: { user: { userId: string } }): Promise<{
    count: number;
    subscriptions: Array<{
      endpoint: string;
      platform: string;
      lastUsedAt?: Date;
      deviceInfo?: Record<string, any>;
    }>;
  }> {
    const subscriptions = await this.webPushService.getSubscriptions(req.user.userId);
    return {
      count: subscriptions.length,
      subscriptions: subscriptions.map((sub) => ({
        endpoint: sub.endpoint,
        platform: sub.platform,
        lastUsedAt: sub.lastUsedAt,
        deviceInfo: sub.deviceInfo,
      })),
    };
  }

  /**
   * Test push notification (development only)
   */
  @Post('test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a test push notification to current user' })
  @ApiResponse({ status: 200, description: 'Test notification sent' })
  async testNotification(
    @Request() req: { user: { userId: string } },
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    const result = await this.webPushService.sendToUser(req.user.userId, {
      title: 'Notificacion de Prueba',
      body: 'Las notificaciones push estan funcionando correctamente!',
      icon: '/assets/icons/icon-192x192.png',
      tag: 'test-notification',
      data: {
        type: 'TEST',
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: result.sent > 0,
      ...result,
    };
  }
}
