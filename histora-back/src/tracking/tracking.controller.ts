import { Controller, Get, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
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
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('start')
  @UseGuards(RolesGuard)
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
  @UseGuards(RolesGuard)
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
  @UseGuards(RolesGuard)
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
  @UseGuards(RolesGuard)
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
  @UseGuards(RolesGuard)
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
  @UseGuards(RolesGuard)
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
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Share tracking with a contact' })
  @ApiResponse({ status: 201, description: 'Tracking shared' })
  async shareTracking(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ShareTrackingDto,
  ) {
    return this.trackingService.shareTracking(serviceId, user.userId, dto);
  }

  @Get(':serviceId')
  @ApiOperation({ summary: 'Get tracking details for a service' })
  @ApiResponse({ status: 200, description: 'Tracking details' })
  async getTracking(@Param('serviceId') serviceId: string) {
    return this.trackingService.getTracking(serviceId);
  }

  @Get('nurse/active')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Get active tracking for current nurse' })
  @ApiResponse({ status: 200, description: 'Active tracking or null' })
  async getActiveTrackingForNurse(@CurrentUser() user: CurrentUserPayload) {
    return this.trackingService.getActiveTrackingForNurse(user.userId);
  }

  @Get('admin/missed-checkins')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get services with missed check-ins (admin only)' })
  @ApiResponse({ status: 200, description: 'List of missed check-ins' })
  async getMissedCheckIns() {
    return this.trackingService.getMissedCheckIns();
  }
}
