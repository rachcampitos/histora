import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SafetyService, ReportIncidentDto, UpdateIncidentDto } from './safety.service';
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
