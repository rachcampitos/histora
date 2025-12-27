import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Patch,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClinicalHistoryService } from './clinical-history.service';
import { CreateClinicalHistoryDto, AllergyDto, ChronicConditionDto, VaccinationDto } from './dto/create-clinical-history.dto';
import { UpdateClinicalHistoryDto } from './dto/update-clinical-history.dto';
import { ClinicalHistory } from './schema/clinical-history.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClinicAccessGuard } from '../auth/guards/clinic-access.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schema/user.schema';

@ApiTags('Clinical History')
@ApiBearerAuth('JWT-auth')
@Controller('clinical-history')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicAccessGuard)
export class ClinicalHistoryController {
  constructor(private readonly service: ClinicalHistoryService) {}

  @Post()
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  create(
    @Body() dto: CreateClinicalHistoryDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ClinicalHistory> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.service.create(user.clinicId, dto);
  }

  @Get()
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ClinicalHistory[]> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.service.findAll(user.clinicId, {
      patientId,
      doctorId,
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
  ): Promise<ClinicalHistory[]> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.service.findByPatient(
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
    return this.service.getPatientMedicalSummary(user.clinicId, patientId);
  }

  @Get(':id')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ClinicalHistory> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.service.findOne(id, user.clinicId);
  }

  @Patch(':id')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClinicalHistoryDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ClinicalHistory | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.service.update(id, user.clinicId, dto);
  }

  @Post(':id/allergies')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  addAllergy(
    @Param('id') id: string,
    @Body() allergy: AllergyDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ClinicalHistory | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.service.addAllergy(id, user.clinicId, allergy);
  }

  @Post(':id/chronic-conditions')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  addChronicCondition(
    @Param('id') id: string,
    @Body() condition: ChronicConditionDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ClinicalHistory | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.service.addChronicCondition(id, user.clinicId, condition);
  }

  @Post(':id/vaccinations')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  addVaccination(
    @Param('id') id: string,
    @Body() vaccination: VaccinationDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ClinicalHistory | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.service.addVaccination(id, user.clinicId, vaccination);
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
    await this.service.remove(id, user.clinicId);
    return { message: `Clinical history with ID ${id} deleted successfully` };
  }

  @Patch(':id/restore')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  restore(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ClinicalHistory | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.service.restore(id, user.clinicId);
  }
}
