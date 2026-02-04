import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  TrackingService,
  StartTrackingDto,
  CheckInDto,
  LocationUpdateDto,
  PanicAlertDto,
  ShareTrackingDto,
} from './tracking.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/schema/user.schema';

@ApiTags('Tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  // PUBLIC endpoint - No authentication required
  @Get('public/:token')
  @ApiOperation({ summary: 'Get public tracking by token (no auth required)' })
  @ApiResponse({ status: 200, description: 'Public tracking data' })
  @ApiResponse({ status: 404, description: 'Invalid or expired tracking link' })
  async getPublicTracking(@Param('token') token: string) {
    return this.trackingService.getPublicTracking(token);
  }

  @Post('start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Start tracking for a service (nurse only)' })
  @ApiResponse({ status: 201, description: 'Tracking started' })
  async startTracking(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: StartTrackingDto,
  ) {
    return this.trackingService.startTracking(user.userId, dto);
  }

  @Post(':serviceId/check-in')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Check-in during service' })
  @ApiResponse({ status: 200, description: 'Check-in recorded' })
  async checkIn(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CheckInDto,
  ) {
    return this.trackingService.checkIn(serviceId, user.userId, dto);
  }

  @Post(':serviceId/check-out')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Check-out (end service)' })
  @ApiResponse({ status: 200, description: 'Check-out recorded, tracking ended' })
  async checkOut(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: LocationUpdateDto,
  ) {
    return this.trackingService.checkOut(serviceId, user.userId, dto);
  }

  @Post(':serviceId/location')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Update location' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  async updateLocation(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: LocationUpdateDto,
  ) {
    return this.trackingService.updateLocation(serviceId, user.userId, dto);
  }

  @Post(':serviceId/panic')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Activate panic button' })
  @ApiResponse({ status: 200, description: 'Panic alert activated' })
  async activatePanic(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: PanicAlertDto,
  ) {
    return this.trackingService.activatePanicButton(serviceId, user.userId, dto);
  }

  @Post(':serviceId/panic/respond')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Respond to panic alert (admin only)' })
  @ApiResponse({ status: 200, description: 'Panic alert responded' })
  async respondToPanic(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { resolution: string },
  ) {
    return this.trackingService.respondToPanicAlert(
      serviceId,
      `${user.email}`,
      body.resolution,
    );
  }

  @Post(':serviceId/share')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Share tracking with a contact (max 3)' })
  @ApiResponse({ status: 201, description: 'Tracking shared, returns share URL' })
  async shareTracking(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ShareTrackingDto,
  ) {
    return this.trackingService.shareTracking(serviceId, user.userId, dto);
  }

  @Delete(':serviceId/share')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Revoke tracking share for a contact' })
  @ApiResponse({ status: 200, description: 'Share revoked' })
  async revokeShare(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query('phone') phone: string,
  ) {
    return this.trackingService.revokeShare(serviceId, user.userId, phone);
  }

  @Get(':serviceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get tracking details for a service' })
  @ApiResponse({ status: 200, description: 'Tracking details' })
  async getTracking(@Param('serviceId') serviceId: string) {
    return this.trackingService.getTracking(serviceId);
  }

  @Get('nurse/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Get active tracking for current nurse' })
  @ApiResponse({ status: 200, description: 'Active tracking or null' })
  async getActiveTrackingForNurse(@CurrentUser() user: CurrentUserPayload) {
    return this.trackingService.getActiveTrackingForNurse(user.userId);
  }

  @Get('admin/missed-checkins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT-auth')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get services with missed check-ins (admin only)' })
  @ApiResponse({ status: 200, description: 'List of missed check-ins' })
  async getMissedCheckIns() {
    return this.trackingService.getMissedCheckIns();
  }
}
