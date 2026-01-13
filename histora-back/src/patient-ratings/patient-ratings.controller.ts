import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PatientRatingsService, CreateRatingDto } from './patient-ratings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/schema/user.schema';

@ApiTags('Patient Ratings')
@Controller('patient-ratings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PatientRatingsController {
  constructor(private readonly ratingsService: PatientRatingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Create rating for patient (nurse only)' })
  @ApiResponse({ status: 201, description: 'Rating created' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingsService.create(user.userId, dto);
  }

  @Get('patient/:patientId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get patient ratings history' })
  @ApiResponse({ status: 200, description: 'Patient ratings' })
  async findByPatient(
    @Param('patientId') patientId: string,
    @Query('limit') limit?: string,
  ) {
    return this.ratingsService.findByPatient(patientId, limit ? parseInt(limit, 10) : 10);
  }

  @Get('patient/:patientId/summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get patient rating summary' })
  @ApiResponse({ status: 200, description: 'Rating summary with averages and tags' })
  async getPatientSummary(@Param('patientId') patientId: string) {
    return this.ratingsService.getPatientSummary(patientId);
  }

  @Get('service/:serviceId')
  @ApiOperation({ summary: 'Get rating for a specific service' })
  @ApiResponse({ status: 200, description: 'Service rating' })
  async findByService(@Param('serviceId') serviceId: string) {
    return this.ratingsService.findByService(serviceId);
  }
}
