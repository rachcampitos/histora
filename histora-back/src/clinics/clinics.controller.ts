import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { Clinic } from './schema/clinic.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/schema/user.schema';

@ApiTags('Clinics')
@ApiBearerAuth('JWT-auth')
@Controller('clinics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post()
  @Roles(UserRole.CLINIC_OWNER, UserRole.PLATFORM_ADMIN)
  create(
    @Body() createClinicDto: CreateClinicDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<Clinic> {
    return this.clinicsService.create(createClinicDto, user.userId);
  }

  @Get('mine')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  async getMyClinic(@CurrentUser() user: CurrentUserPayload): Promise<Clinic> {
    if (user.clinicId) {
      return this.clinicsService.findOne(user.clinicId);
    }

    const clinic = await this.clinicsService.findByOwner(user.userId);
    if (!clinic) {
      throw new Error('You do not have a clinic associated with your account');
    }
    return clinic;
  }

  @Patch('mine')
  @Roles(UserRole.CLINIC_OWNER)
  async updateMyClinic(
    @Body() updateClinicDto: UpdateClinicDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<Clinic | null> {
    const clinic = await this.clinicsService.findByOwner(user.userId);
    if (!clinic) {
      throw new Error('You do not have a clinic associated with your account');
    }
    return this.clinicsService.update(
      clinic['_id'].toString(),
      updateClinicDto,
      user.userId,
    );
  }

  @Delete('mine')
  @Roles(UserRole.CLINIC_OWNER)
  async deleteMyClinic(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<Clinic | null> {
    const clinic = await this.clinicsService.findByOwner(user.userId);
    if (!clinic) {
      throw new Error('You do not have a clinic associated with your account');
    }
    return this.clinicsService.remove(clinic['_id'].toString(), user.userId);
  }

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN)
  findAll(): Promise<Clinic[]> {
    return this.clinicsService.findAll();
  }
}
