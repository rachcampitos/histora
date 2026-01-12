import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schema/user.schema';
import { NurseVerificationService } from './nurse-verification.service';
import {
  SubmitVerificationDto,
  ReviewVerificationDto,
  VerificationQueryDto,
  VerificationResponseDto,
} from './dto/nurse-verification.dto';
import { VerificationStatus } from './schema/nurse-verification.schema';

interface RequestWithUser extends Request {
  user: { userId: string; role: string };
}

@ApiTags('Nurse Verification')
@ApiBearerAuth()
@Controller('nurses')
export class NurseVerificationController {
  constructor(private readonly verificationService: NurseVerificationService) {}

  // ============= NURSE ENDPOINTS =============

  @Post(':nurseId/verification')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Submit verification documents' })
  @ApiParam({ name: 'nurseId', description: 'Nurse ID' })
  @ApiResponse({ status: 201, description: 'Verification submitted successfully' })
  @ApiResponse({ status: 400, description: 'Missing documents or already verified' })
  async submitVerification(
    @Param('nurseId') nurseId: string,
    @Body() dto: SubmitVerificationDto,
    @Request() req: RequestWithUser,
  ): Promise<VerificationResponseDto> {
    const verification = await this.verificationService.submitVerification(
      req.user.userId,
      nurseId,
      dto,
    );

    return this.mapToResponse(verification);
  }

  @Get(':nurseId/verification/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiOperation({ summary: 'Get verification status' })
  @ApiParam({ name: 'nurseId', description: 'Nurse ID' })
  @ApiResponse({ status: 200, description: 'Returns verification status' })
  async getVerificationStatus(
    @Param('nurseId') nurseId: string,
    @Request() req: RequestWithUser,
  ): Promise<VerificationResponseDto | null> {
    const verification = await this.verificationService.getVerificationStatus(
      req.user.userId,
      nurseId,
    );

    if (!verification) {
      return null;
    }

    return this.mapToResponse(verification);
  }

  // ============= ADMIN ENDPOINTS =============

  @Get('admin/verifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '[Admin] Get all verifications with filters' })
  @ApiQuery({ name: 'status', enum: VerificationStatus, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Returns list of verifications' })
  async getVerifications(
    @Query() query: VerificationQueryDto,
  ): Promise<{
    verifications: VerificationResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const result = await this.verificationService.getPendingVerifications(query);

    return {
      ...result,
      verifications: result.verifications.map((v) => this.mapToResponse(v)),
    };
  }

  @Get('admin/verifications/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '[Admin] Get verification statistics' })
  @ApiResponse({ status: 200, description: 'Returns verification stats' })
  async getVerificationStats(): Promise<{
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
    total: number;
  }> {
    return this.verificationService.getVerificationStats();
  }

  @Get('admin/verifications/:verificationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '[Admin] Get verification details' })
  @ApiParam({ name: 'verificationId', description: 'Verification ID' })
  @ApiResponse({ status: 200, description: 'Returns verification details' })
  async getVerificationDetail(
    @Param('verificationId') verificationId: string,
  ): Promise<VerificationResponseDto> {
    const verification = await this.verificationService.getVerificationById(verificationId);
    return this.mapToResponse(verification);
  }

  @Patch('admin/verifications/:verificationId/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '[Admin] Approve or reject verification' })
  @ApiParam({ name: 'verificationId', description: 'Verification ID' })
  @ApiResponse({ status: 200, description: 'Verification reviewed successfully' })
  async reviewVerification(
    @Param('verificationId') verificationId: string,
    @Body() dto: ReviewVerificationDto,
    @Request() req: RequestWithUser,
  ): Promise<VerificationResponseDto> {
    const verification = await this.verificationService.reviewVerification(
      verificationId,
      req.user.userId,
      dto,
    );

    return this.mapToResponse(verification);
  }

  @Patch('admin/verifications/:verificationId/under-review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '[Admin] Mark verification as under review' })
  @ApiParam({ name: 'verificationId', description: 'Verification ID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async markUnderReview(
    @Param('verificationId') verificationId: string,
    @Request() req: RequestWithUser,
  ): Promise<VerificationResponseDto> {
    const verification = await this.verificationService.markUnderReview(
      verificationId,
      req.user.userId,
    );

    return this.mapToResponse(verification);
  }

  // Helper to map verification to response DTO
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToResponse(verification: any): VerificationResponseDto {
    const v = verification as {
      _id: { toString(): string };
      nurseId: { toString(): string; cepNumber?: string; specialties?: string[]; userId?: { firstName?: string; lastName?: string; email?: string; avatar?: string } } | string;
      userId: { toString(): string } | string;
      status: VerificationStatus;
      dniNumber?: string;
      fullNameOnDni?: string;
      documents: Array<{ url: string; type: string; uploadedAt: Date }>;
      reviewedAt?: Date;
      reviewNotes?: string;
      rejectionReason?: string;
      attemptNumber: number;
      createdAt: Date;
    };

    return {
      id: v._id.toString(),
      nurseId: typeof v.nurseId === 'string' ? v.nurseId : v.nurseId.toString(),
      userId: typeof v.userId === 'string' ? v.userId : v.userId.toString(),
      status: v.status,
      dniNumber: v.dniNumber,
      fullNameOnDni: v.fullNameOnDni,
      documents: v.documents.map((d) => ({
        url: d.url,
        type: d.type,
        uploadedAt: d.uploadedAt,
      })),
      reviewedAt: v.reviewedAt,
      reviewNotes: v.reviewNotes,
      rejectionReason: v.rejectionReason,
      attemptNumber: v.attemptNumber,
      createdAt: v.createdAt,
      // Include populated nurse if available
      nurse: typeof v.nurseId === 'object' && v.nurseId !== null && 'cepNumber' in v.nurseId
        ? {
            cepNumber: v.nurseId.cepNumber || '',
            specialties: v.nurseId.specialties || [],
            user: v.nurseId.userId && typeof v.nurseId.userId === 'object'
              ? {
                  firstName: v.nurseId.userId.firstName || '',
                  lastName: v.nurseId.userId.lastName || '',
                  email: v.nurseId.userId.email || '',
                  avatar: v.nurseId.userId.avatar,
                }
              : undefined,
          }
        : undefined,
    };
  }
}
