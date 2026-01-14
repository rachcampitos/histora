import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SafetyService, ReportIncidentDto, UpdateIncidentDto, TriggerPanicDto, UpdatePanicAlertDto } from './safety.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/schema/user.schema';

@ApiTags('Safety')
@Controller('safety')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  // ==================== PANIC ALERT ENDPOINTS ====================

  @Post('panic')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Trigger panic alert (nurse only) - HIGH PRIORITY' })
  @ApiResponse({ status: 201, description: 'Panic alert triggered' })
  async triggerPanic(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: TriggerPanicDto,
  ) {
    return this.safetyService.triggerPanicAlert(user.userId, dto);
  }

  @Get('panic/active')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Get active panic alert for current nurse' })
  @ApiResponse({ status: 200, description: 'Active panic alert or null' })
  async getMyActivePanicAlert(@CurrentUser() user: CurrentUserPayload) {
    return this.safetyService.getActivePanicAlert(user.userId);
  }

  @Delete('panic/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel panic alert (false alarm)' })
  @ApiResponse({ status: 200, description: 'Panic alert cancelled' })
  async cancelPanicAlert(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.safetyService.cancelPanicAlert(id, user.userId);
  }

  @Get('panic/history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Get panic alert history for current nurse' })
  @ApiResponse({ status: 200, description: 'Panic alert history' })
  async getMyPanicHistory(@CurrentUser() user: CurrentUserPayload) {
    return this.safetyService.getPanicAlertHistory(user.userId);
  }

  // Admin endpoints for panic alerts
  @Get('panic/all-active')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get all active panic alerts (admin only)' })
  @ApiResponse({ status: 200, description: 'All active panic alerts' })
  async getAllActivePanicAlerts() {
    return this.safetyService.getActivePanicAlerts();
  }

  @Patch('panic/:id/acknowledge')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Acknowledge a panic alert (admin only)' })
  @ApiResponse({ status: 200, description: 'Panic alert acknowledged' })
  async acknowledgePanicAlert(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.safetyService.acknowledgePanicAlert(id, user.userId);
  }

  @Patch('panic/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Update panic alert (admin only)' })
  @ApiResponse({ status: 200, description: 'Panic alert updated' })
  async updatePanicAlert(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdatePanicAlertDto,
  ) {
    return this.safetyService.updatePanicAlert(id, user.userId, dto);
  }

  // ==================== INCIDENT ENDPOINTS ====================

  @Post('incidents')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Report a safety incident (nurse only)' })
  @ApiResponse({ status: 201, description: 'Incident reported' })
  async reportIncident(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ReportIncidentDto,
  ) {
    return this.safetyService.reportIncident(user.userId, dto);
  }

  @Get('incidents/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get incident details' })
  @ApiResponse({ status: 200, description: 'Incident details' })
  async getIncident(@Param('id') id: string) {
    return this.safetyService.findById(id);
  }

  @Get('incidents/patient/:patientId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get incidents for a patient' })
  @ApiResponse({ status: 200, description: 'Patient incidents' })
  async getPatientIncidents(@Param('patientId') patientId: string) {
    return this.safetyService.findByPatient(patientId);
  }

  @Get('incidents/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get all pending incidents (admin only)' })
  @ApiResponse({ status: 200, description: 'Pending incidents' })
  async getPendingIncidents() {
    return this.safetyService.findPending();
  }

  @Patch('incidents/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Update incident (admin only)' })
  @ApiResponse({ status: 200, description: 'Incident updated' })
  async updateIncident(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateIncidentDto,
  ) {
    return this.safetyService.updateIncident(id, user.userId, dto);
  }

  @Get('stats/patient/:patientId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get incident stats for a patient' })
  @ApiResponse({ status: 200, description: 'Incident statistics' })
  async getPatientStats(@Param('patientId') patientId: string) {
    return this.safetyService.getIncidentStats(patientId);
  }
}
