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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto, CancelAppointmentDto } from './dto/update-appointment.dto';
import { Appointment, AppointmentStatus, BookedBy } from './schema/appointment.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClinicAccessGuard } from '../auth/guards/clinic-access.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/schema/user.schema';

@ApiTags('Appointments')
@ApiBearerAuth('JWT-auth')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicAccessGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Appointment> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.appointmentsService.create(
      user.clinicId,
      createAppointmentDto,
      BookedBy.CLINIC,
    );
  }

  @Get()
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Appointment[]> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.appointmentsService.findAll(user.clinicId, {
      doctorId,
      patientId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('today')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  getTodaysAppointments(
    @CurrentUser() user: CurrentUserData,
    @Query('doctorId') doctorId?: string,
  ): Promise<Appointment[]> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.appointmentsService.getTodaysAppointments(user.clinicId, doctorId);
  }

  @Get('doctor/:doctorId')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  findByDoctor(
    @Param('doctorId') doctorId: string,
    @CurrentUser() user: CurrentUserData,
    @Query('date') date?: string,
  ): Promise<Appointment[]> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.appointmentsService.findByDoctor(
      user.clinicId,
      doctorId,
      date ? new Date(date) : undefined,
    );
  }

  @Get('patient/:patientId')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  findByPatient(
    @Param('patientId') patientId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Appointment[]> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.appointmentsService.findByPatient(user.clinicId, patientId);
  }

  @Get('available/:doctorId')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  getAvailableSlots(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ startTime: string; endTime: string }[]> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.appointmentsService.getAvailableSlots(
      user.clinicId,
      doctorId,
      new Date(date),
    );
  }

  @Get('count')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  async count(
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: AppointmentStatus,
  ): Promise<{ count: number }> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    const count = await this.appointmentsService.countByClinicAndStatus(
      user.clinicId,
      status,
    );
    return { count };
  }

  @Get(':id')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Appointment> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.appointmentsService.findOne(id, user.clinicId);
  }

  @Patch(':id')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Appointment | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.appointmentsService.update(id, user.clinicId, updateAppointmentDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: AppointmentStatus,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Appointment | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.appointmentsService.updateStatus(id, user.clinicId, status);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  cancel(
    @Param('id') id: string,
    @Body() cancelDto: CancelAppointmentDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Appointment | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.appointmentsService.cancel(id, user.clinicId, cancelDto, user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.CLINIC_OWNER)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ message: string }> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    await this.appointmentsService.remove(id, user.clinicId);
    return { message: `Appointment with ID ${id} deleted successfully` };
  }
}

// Public endpoint for patients to see available slots
@Controller('public/appointments')
export class PublicAppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('available/:doctorId')
  @Public()
  getAvailableSlots(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
    @Query('clinicId') clinicId: string,
  ): Promise<{ startTime: string; endTime: string }[]> {
    return this.appointmentsService.getAvailableSlots(
      clinicId,
      doctorId,
      new Date(date),
    );
  }
}
