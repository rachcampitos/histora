import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
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
  UploadSelfieDto,
  UploadDniPhotoDto,
  FileResponseDto,
} from './dto/upload-file.dto';
import { NursesService } from '../nurses/nurses.service';

@ApiTags('Uploads')
@ApiBearerAuth('JWT-auth')
@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
    private readonly usersService: UsersService,
    private readonly nursesService: NursesService,
  ) {}

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
      undefined,
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

  // ============= PATIENT UPLOADS =============

  @Post('dni-photo')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Upload DNI photo for patient verification' })
  async uploadDniPhoto(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UploadDniPhotoDto,
  ): Promise<FileResponseDto> {
    const result = await this.uploadsService.uploadPatientDniPhoto(
      dto.imageData,
      dto.mimeType || 'image/jpeg',
      user.userId,
      dto.side,
      user.userId
    );

    return {
      success: true,
      url: result.url,
      publicId: result.publicId,
    };
  }

  // ============= NURSE UPLOADS =============

  @Post('nurse/selfie')
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Upload selfie for identity verification' })
  async uploadNurseSelfie(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UploadSelfieDto,
  ): Promise<FileResponseDto> {
    // Get nurse profile
    const nurse = await this.nursesService.findByUserId(user.userId);
    if (!nurse) {
      throw new ForbiddenException('Nurse profile not found');
    }

    const nurseId = (nurse as any)._id.toString();

    // Delete old selfie if exists
    const oldPublicId = await this.nursesService.getSelfiePublicId(nurseId);
    if (oldPublicId) {
      await this.uploadsService.deleteFile(oldPublicId).catch(() => {});
    }

    const result = await this.uploadsService.uploadNurseSelfie(
      dto.imageData,
      dto.mimeType || 'image/jpeg',
      nurseId,
      user.userId
    );

    // Save selfie URL to nurse profile and update status to pending
    await this.nursesService.updateSelfie(nurseId, result.url, result.publicId);

    return {
      success: true,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      publicId: result.publicId,
    };
  }

  @Delete('nurse/selfie')
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Delete own selfie' })
  async deleteNurseSelfie(
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ success: boolean }> {
    const nurse = await this.nursesService.findByUserId(user.userId);
    if (!nurse) {
      throw new ForbiddenException('Nurse profile not found');
    }

    const nurseId = (nurse as any)._id.toString();
    const publicId = await this.nursesService.getSelfiePublicId(nurseId);

    if (publicId) {
      await this.uploadsService.deleteFile(publicId);
      await this.nursesService.updateSelfie(nurseId, '', '');
    }

    return { success: true };
  }
}
