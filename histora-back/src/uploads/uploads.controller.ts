import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schema/user.schema';
import { UploadsService } from './uploads.service';
import { UsersService } from '../users/users.service';
import { DoctorsService } from '../doctors/doctors.service';
import {
  UploadProfilePhotoDto,
  UploadDocumentDto,
  UploadCvDto,
  FileResponseDto,
} from './dto/upload-file.dto';

@ApiTags('Uploads')
@ApiBearerAuth('JWT-auth')
@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly usersService: UsersService,
    private readonly doctorsService: DoctorsService,
  ) {}

  private requireClinicId(user: CurrentUserData): string {
    if (!user.clinicId) {
      throw new ForbiddenException('User must belong to a clinic to upload files');
    }
    return user.clinicId;
  }

  @Post('profile-photo')
  @ApiOperation({ summary: 'Upload own profile photo' })
  async uploadMyProfilePhoto(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UploadProfilePhotoDto,
  ): Promise<FileResponseDto> {
    // Delete old avatar if exists
    const oldPublicId = await this.usersService.getAvatarPublicId(user.userId);
    if (oldPublicId) {
      await this.uploadsService.deleteFile(oldPublicId).catch(() => {});
    }

    const result = await this.uploadsService.uploadProfilePhoto(
      dto,
      user.userId,
      user.clinicId,
      'user',
      user.userId
    );

    // Save avatar URL to user
    await this.usersService.updateAvatar(user.userId, result.url, result.publicId);

    return {
      success: true,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      publicId: result.publicId,
    };
  }

  @Post('doctor/cv')
  @Roles(UserRole.CLINIC_DOCTOR)
  @ApiOperation({ summary: 'Upload own CV (PDF or DOCX)' })
  async uploadMyCv(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UploadCvDto,
  ): Promise<FileResponseDto> {
    // Get doctor profile
    const doctor = await this.doctorsService.findByUserId(user.userId);
    if (!doctor) {
      throw new ForbiddenException('Doctor profile not found');
    }

    const doctorId = (doctor as any)._id.toString();

    // Delete old CV if exists
    const oldPublicId = await this.doctorsService.getCvPublicId(doctorId);
    if (oldPublicId) {
      await this.uploadsService.deleteFile(oldPublicId).catch(() => {});
    }

    const result = await this.uploadsService.uploadDoctorCv(
      dto.fileData,
      dto.mimeType,
      doctorId,
      user.clinicId
    );

    // Save CV URL to doctor
    await this.doctorsService.updateCv(doctorId, result.url, result.publicId, result.format);

    return {
      success: true,
      url: result.url,
      publicId: result.publicId,
    };
  }

  @Delete('doctor/cv')
  @Roles(UserRole.CLINIC_DOCTOR)
  @ApiOperation({ summary: 'Delete own CV' })
  async deleteMyCv(
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ success: boolean }> {
    const doctor = await this.doctorsService.findByUserId(user.userId);
    if (!doctor) {
      throw new ForbiddenException('Doctor profile not found');
    }

    const doctorId = (doctor as any)._id.toString();
    const publicId = await this.doctorsService.getCvPublicId(doctorId);

    if (publicId) {
      await this.uploadsService.deleteFile(publicId);
      await this.doctorsService.updateCv(doctorId, '', '', '');
    }

    return { success: true };
  }

  @Post('doctor/:doctorId/profile-photo')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  @ApiOperation({ summary: 'Upload doctor profile photo' })
  async uploadDoctorProfilePhoto(
    @Param('doctorId') doctorId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UploadProfilePhotoDto,
  ): Promise<FileResponseDto> {
    const result = await this.uploadsService.uploadProfilePhoto(
      dto,
      user.userId,
      user.clinicId,
      'doctor',
      doctorId
    );

    return {
      success: true,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      publicId: result.publicId,
    };
  }

  @Post('patient/:patientId/profile-photo')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Upload patient profile photo' })
  async uploadPatientProfilePhoto(
    @Param('patientId') patientId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UploadProfilePhotoDto,
  ): Promise<FileResponseDto> {
    const result = await this.uploadsService.uploadProfilePhoto(
      dto,
      user.userId,
      user.clinicId,
      'patient',
      patientId
    );

    return {
      success: true,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      publicId: result.publicId,
    };
  }

  @Post('clinic/logo')
  @Roles(UserRole.CLINIC_OWNER)
  @ApiOperation({ summary: 'Upload clinic logo' })
  async uploadClinicLogo(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UploadProfilePhotoDto,
  ): Promise<FileResponseDto> {
    const clinicId = this.requireClinicId(user);
    const result = await this.uploadsService.uploadClinicLogo(
      dto,
      clinicId,
      user.userId
    );

    return {
      success: true,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      publicId: result.publicId,
    };
  }

  @Post('document')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Upload a document (lab result, prescription, etc.)' })
  async uploadDocument(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UploadDocumentDto,
  ): Promise<FileResponseDto> {
    const clinicId = this.requireClinicId(user);
    const result = await this.uploadsService.uploadDocument(
      dto,
      user.userId,
      clinicId
    );

    return {
      success: true,
      url: result.url,
      publicId: result.publicId,
    };
  }

  @Delete(':publicId')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  @ApiOperation({ summary: 'Delete an uploaded file' })
  async deleteFile(
    @Param('publicId') publicId: string,
  ): Promise<{ success: boolean }> {
    // Note: publicId may contain slashes, so use query param instead
    return this.uploadsService.deleteFile(publicId);
  }

  @Delete()
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  @ApiOperation({ summary: 'Delete an uploaded file by public ID' })
  async deleteFileByQuery(
    @Query('publicId') publicId: string,
  ): Promise<{ success: boolean }> {
    return this.uploadsService.deleteFile(publicId);
  }
}
