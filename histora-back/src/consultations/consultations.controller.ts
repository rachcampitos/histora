import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import {
  UpdateConsultationDto,
  CompleteConsultationDto,
  UpdateConsultationStatusDto,
  AddExamResultsDto,
} from './dto/update-consultation.dto';
import { Consultation, ConsultationStatus } from './schema/consultation.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClinicAccessGuard } from '../auth/guards/clinic-access.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schema/user.schema';

@Controller('consultations')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicAccessGuard)
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Post()
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  create(
    @Body() createConsultationDto: CreateConsultationDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Consultation> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.consultationsService.create(user.clinicId, createConsultationDto);
  }

  @Post('from-appointment/:appointmentId')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  createFromAppointment(
    @Param('appointmentId') appointmentId: string,
    @Body() appointmentData: { patientId: string; doctorId: string; reasonForVisit?: string },
    @CurrentUser() user: CurrentUserData,
  ): Promise<Consultation> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.consultationsService.createFromAppointment(
      user.clinicId,
      appointmentId,
      appointmentData,
    );
  }

  @Get()
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: ConsultationStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Consultation[]> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.consultationsService.findAll(user.clinicId, {
      patientId,
      doctorId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('patient/:patientId')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  findByPatient(
    @Param('patientId') patientId: string,
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: number,
  ): Promise<Consultation[]> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.consultationsService.findByPatient(
      user.clinicId,
      patientId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('patient/:patientId/summary')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  getPatientSummary(
    @Param('patientId') patientId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.consultationsService.getPatientConsultationSummary(user.clinicId, patientId);
  }

  @Get('doctor/:doctorId')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  findByDoctor(
    @Param('doctorId') doctorId: string,
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: ConsultationStatus,
    @Query('limit') limit?: number,
  ): Promise<Consultation[]> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.consultationsService.findByDoctor(user.clinicId, doctorId, {
      status,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('appointment/:appointmentId')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  findByAppointment(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Consultation | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.consultationsService.findByAppointment(user.clinicId, appointmentId);
  }

  @Get(':id')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Consultation> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.consultationsService.findOne(id, user.clinicId);
  }

  @Patch(':id')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  update(
    @Param('id') id: string,
    @Body() updateConsultationDto: UpdateConsultationDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Consultation | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.consultationsService.update(id, user.clinicId, updateConsultationDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateConsultationStatusDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Consultation | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.consultationsService.updateStatus(id, user.clinicId, updateStatusDto);
  }

  @Patch(':id/complete')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  complete(
    @Param('id') id: string,
    @Body() completeDto: CompleteConsultationDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Consultation | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.consultationsService.complete(id, user.clinicId, completeDto);
  }

  @Patch(':id/exam-results')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  addExamResults(
    @Param('id') id: string,
    @Body() addResultsDto: AddExamResultsDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Consultation | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.consultationsService.addExamResults(id, user.clinicId, addResultsDto);
  }

  @Patch(':id/link-vitals/:vitalsId')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  linkVitals(
    @Param('id') id: string,
    @Param('vitalsId') vitalsId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Consultation | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.consultationsService.linkVitals(id, user.clinicId, vitalsId);
  }

  @Delete(':id')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ message: string }> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    await this.consultationsService.remove(id, user.clinicId);
    return { message: `Consultation with ID ${id} deleted successfully` };
  }
}
