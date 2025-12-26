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
import { VitalsService } from './vitals.service';
import { CreateVitalsDto } from './dto/create-vitals.dto';
import { UpdateVitalsDto } from './dto/update-vitals.dto';
import { Vitals } from './schema/vitals.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClinicAccessGuard } from '../auth/guards/clinic-access.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schema/user.schema';

@Controller('vitals')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicAccessGuard)
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Post()
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  create(
    @Body() createVitalsDto: CreateVitalsDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Vitals> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.vitalsService.create(user.clinicId, createVitalsDto, user.userId);
  }

  @Get()
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('patientId') patientId?: string,
    @Query('consultationId') consultationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Vitals[]> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.vitalsService.findAll(user.clinicId, {
      patientId,
      consultationId,
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
  ): Promise<Vitals[]> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.vitalsService.findByPatient(
      user.clinicId,
      patientId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('patient/:patientId/latest')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  getLatestByPatient(
    @Param('patientId') patientId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Vitals | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.vitalsService.getLatestByPatient(user.clinicId, patientId);
  }

  @Get('patient/:patientId/history/:vitalType')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  getPatientVitalsHistory(
    @Param('patientId') patientId: string,
    @Param('vitalType') vitalType: 'weight' | 'bloodPressure' | 'heartRate' | 'temperature' | 'bloodGlucose',
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.vitalsService.getPatientVitalsHistory(
      user.clinicId,
      patientId,
      vitalType,
      limit ? Number(limit) : 10,
    );
  }

  @Get('consultation/:consultationId')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  findByConsultation(
    @Param('consultationId') consultationId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Vitals | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.vitalsService.findByConsultation(user.clinicId, consultationId);
  }

  @Get(':id')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Vitals> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.vitalsService.findOne(id, user.clinicId);
  }

  @Patch(':id')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  update(
    @Param('id') id: string,
    @Body() updateVitalsDto: UpdateVitalsDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Vitals | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.vitalsService.update(id, user.clinicId, updateVitalsDto);
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
    await this.vitalsService.remove(id, user.clinicId);
    return { message: `Vitals record with ID ${id} deleted successfully` };
  }
}
