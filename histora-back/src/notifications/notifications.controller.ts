import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schema/user.schema';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto, SendBulkNotificationDto } from './dto/send-notification.dto';
import { UpdateNotificationPreferencesDto, RegisterDeviceDto } from './dto/update-preferences.dto';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  getMyNotifications(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.getUserNotifications(user.userId, {
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser() user: CurrentUserData) {
    const count = await this.notificationsService.getUnreadCount(user.userId);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markAsRead(
    @Param('id') notificationId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.notificationsService.markAsRead(notificationId, user.userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@CurrentUser() user: CurrentUserData) {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  getPreferences(@CurrentUser() user: CurrentUserData) {
    return this.notificationsService.getOrCreatePreferences(user.userId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  updatePreferences(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(user.userId, dto);
  }

  @Post('device')
  @ApiOperation({ summary: 'Register device for push notifications' })
  registerDevice(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.notificationsService.registerDevice(
      user.userId,
      dto.deviceToken,
      dto.platform,
    );
  }

  // Admin endpoints
  @Post('send')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Send notification to a user (admin)' })
  sendNotification(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SendNotificationDto,
  ) {
    return this.notificationsService.send(dto, user.clinicId);
  }

  @Post('send-bulk')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Send notification to multiple users (admin)' })
  sendBulkNotification(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SendBulkNotificationDto,
  ) {
    return this.notificationsService.sendBulk(dto, user.clinicId);
  }
}
