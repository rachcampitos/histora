import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schema/user.schema';
import { PatientPortalService } from './patient-portal.service';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';

@Controller('patient-portal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT)
export class PatientPortalController {
  constructor(private readonly patientPortalService: PatientPortalService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: CurrentUserData) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('User does not have a patient profile');
    }
    return this.patientPortalService.getPatientProfile(user.patientProfileId);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() updateDto: UpdatePatientProfileDto,
  ) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('User does not have a patient profile');
    }
    return this.patientPortalService.updatePatientProfile(user.patientProfileId, updateDto);
  }

  @Get('appointments')
  getMyAppointments(
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: string,
    @Query('upcoming') upcoming?: string,
  ) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('User does not have a patient profile');
    }
    return this.patientPortalService.getPatientAppointments(
      user.patientProfileId,
      {
        status,
        upcoming: upcoming === 'true',
      },
    );
  }

  @Post('appointments/book')
  bookAppointment(
    @CurrentUser() user: CurrentUserData,
    @Body() bookDto: BookAppointmentDto,
  ) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('User does not have a patient profile');
    }
    return this.patientPortalService.bookAppointment(user.patientProfileId, bookDto);
  }

  @Patch('appointments/:id/cancel')
  cancelAppointment(
    @Param('id') appointmentId: string,
    @CurrentUser() user: CurrentUserData,
    @Body('reason') reason?: string,
  ) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('User does not have a patient profile');
    }
    return this.patientPortalService.cancelAppointment(
      user.patientProfileId,
      appointmentId,
      reason,
    );
  }

  @Get('clinical-history')
  getMyClinicalHistory(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: number,
  ) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('User does not have a patient profile');
    }
    return this.patientPortalService.getPatientClinicalHistory(
      user.patientProfileId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('medical-summary')
  getMedicalSummary(@CurrentUser() user: CurrentUserData) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('User does not have a patient profile');
    }
    return this.patientPortalService.getPatientMedicalSummary(user.patientProfileId);
  }

  @Get('consultations')
  getMyConsultations(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: number,
  ) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('User does not have a patient profile');
    }
    return this.patientPortalService.getPatientConsultations(
      user.patientProfileId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('consultations/:id')
  getConsultationDetail(
    @Param('id') consultationId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('User does not have a patient profile');
    }
    return this.patientPortalService.getConsultationDetail(
      user.patientProfileId,
      consultationId,
    );
  }

  @Get('vitals')
  getMyVitals(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: number,
  ) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('User does not have a patient profile');
    }
    return this.patientPortalService.getPatientVitals(
      user.patientProfileId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('vitals/latest')
  getLatestVitals(@CurrentUser() user: CurrentUserData) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('User does not have a patient profile');
    }
    return this.patientPortalService.getLatestVitals(user.patientProfileId);
  }

  @Get('prescriptions')
  getMyPrescriptions(
    @CurrentUser() user: CurrentUserData,
    @Query('active') active?: string,
  ) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('User does not have a patient profile');
    }
    return this.patientPortalService.getPatientPrescriptions(
      user.patientProfileId,
      active === 'true',
    );
  }

  @Get('doctors')
  searchDoctors(
    @Query('specialty') specialty?: string,
    @Query('name') name?: string,
  ) {
    return this.patientPortalService.searchDoctors({ specialty, name });
  }

  @Get('doctors/:id')
  getDoctorProfile(@Param('id') doctorId: string) {
    return this.patientPortalService.getDoctorPublicProfile(doctorId);
  }

  @Get('doctors/:id/availability')
  getDoctorAvailability(
    @Param('id') doctorId: string,
    @Query('date') date: string,
  ) {
    if (!date) {
      throw new BadRequestException('Date is required');
    }
    return this.patientPortalService.getDoctorAvailability(doctorId, new Date(date));
  }
}
