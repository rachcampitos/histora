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
import {
  UploadProfilePhotoDto,
  UploadDocumentDto,
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
