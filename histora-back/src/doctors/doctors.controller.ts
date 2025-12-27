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
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Doctor } from './schema/doctor.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClinicAccessGuard } from '../auth/guards/clinic-access.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/schema/user.schema';

@ApiTags('Doctors')
@ApiBearerAuth('JWT-auth')
@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicAccessGuard)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Roles(UserRole.CLINIC_OWNER)
  create(
    @Body() createDoctorDto: CreateDoctorDto,
    @CurrentUser() user: CurrentUserData,
    @Body('userId') doctorUserId: string,
  ): Promise<Doctor> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.doctorsService.create(user.clinicId, doctorUserId, createDoctorDto);
  }

  @Get()
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  findAll(@CurrentUser() user: CurrentUserData): Promise<Doctor[]> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.doctorsService.findAll(user.clinicId);
  }

  @Get('count')
  @Roles(UserRole.CLINIC_OWNER)
  async count(@CurrentUser() user: CurrentUserData): Promise<{ count: number }> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    const count = await this.doctorsService.countByClinic(user.clinicId);
    return { count };
  }

  @Get(':id')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Doctor> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.doctorsService.findOne(id, user.clinicId);
  }

  @Patch(':id')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  update(
    @Param('id') id: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Doctor | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.doctorsService.update(id, user.clinicId, updateDoctorDto);
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
    await this.doctorsService.remove(id, user.clinicId);
    return { message: `Doctor with ID ${id} deleted successfully` };
  }

  @Patch(':id/restore')
  @Roles(UserRole.CLINIC_OWNER)
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Doctor | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.doctorsService.restore(id, user.clinicId);
  }
}

// Public directory controller - separate for public access
@Controller('public/doctors')
export class PublicDoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @Public()
  findPublicDoctors(
    @Query('specialty') specialty?: string,
    @Query('minRating') minRating?: number,
  ): Promise<Doctor[]> {
    return this.doctorsService.findPublicDoctors({
      specialty,
      minRating: minRating ? Number(minRating) : undefined,
    });
  }

  @Get(':id')
  @Public()
  findPublicDoctor(@Param('id') id: string): Promise<Doctor | null> {
    return this.doctorsService.findPublicDoctorById(id);
  }
}
