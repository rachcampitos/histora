import { Controller, Get, Post, Patch, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PatientVerificationService } from './patient-verification.service';
import {
  SendPhoneCodeDto,
  VerifyPhoneCodeDto,
  SendEmailCodeDto,
  VerifyEmailCodeDto,
  UploadDniDto,
  UploadSelfieDto,
  VerifyPaymentMethodDto,
  SetEmergencyContactsDto,
  AddFlagDto,
  SuspendPatientDto,
  ReactivatePatientDto,
  CompleteVideoCallDto,
} from './dto/verification.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/schema/user.schema';

@ApiTags('Patient Verification')
@Controller('patient-verification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PatientVerificationController {
  constructor(private readonly verificationService: PatientVerificationService) {}

  // ==================== Patient Self-Service ====================

  @Post('start')
  @ApiOperation({ summary: 'Initialize verification process for current patient' })
  @ApiResponse({ status: 201, description: 'Verification initialized' })
  async startVerification(@CurrentUser() user: CurrentUserPayload) {
    return this.verificationService.initializeVerification(user.userId);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get verification status for current patient' })
  @ApiResponse({ status: 200, description: 'Verification status' })
  async getStatus(@CurrentUser() user: CurrentUserPayload) {
    return this.verificationService.getVerificationStatus(user.userId);
  }

  @Post('phone/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send phone verification code via SMS' })
  @ApiResponse({ status: 200, description: 'Code sent' })
  async sendPhoneCode(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SendPhoneCodeDto,
  ) {
    return this.verificationService.sendPhoneCode(user.userId, dto);
  }

  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify phone code' })
  @ApiResponse({ status: 200, description: 'Phone verified' })
  async verifyPhoneCode(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: VerifyPhoneCodeDto,
  ) {
    return this.verificationService.verifyPhoneCode(user.userId, dto);
  }

  @Post('email/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email verification code' })
  @ApiResponse({ status: 200, description: 'Code sent to email' })
  async sendEmailCode(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SendEmailCodeDto,
  ) {
    return this.verificationService.sendEmailCode(user.userId, dto);
  }

  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email code' })
  @ApiResponse({ status: 200, description: 'Email verified' })
  async verifyEmailCode(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: VerifyEmailCodeDto,
  ) {
    return this.verificationService.verifyEmailCode(user.userId, dto);
  }

  @Post('dni')
  @ApiOperation({ summary: 'Upload DNI photos' })
  @ApiResponse({ status: 201, description: 'DNI uploaded' })
  async uploadDni(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UploadDniDto,
  ) {
    return this.verificationService.uploadDni(user.userId, dto);
  }

  @Post('selfie')
  @ApiOperation({ summary: 'Upload selfie with DNI' })
  @ApiResponse({ status: 201, description: 'Selfie uploaded' })
  async uploadSelfie(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UploadSelfieDto,
  ) {
    return this.verificationService.uploadSelfie(user.userId, dto);
  }

  @Post('payment')
  @ApiOperation({ summary: 'Verify payment method' })
  @ApiResponse({ status: 201, description: 'Payment method verified' })
  async verifyPaymentMethod(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: VerifyPaymentMethodDto,
  ) {
    return this.verificationService.verifyPaymentMethod(user.userId, dto);
  }

  @Post('emergency-contacts')
  @ApiOperation({ summary: 'Set emergency contacts' })
  @ApiResponse({ status: 201, description: 'Emergency contacts set' })
  async setEmergencyContacts(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SetEmergencyContactsDto,
  ) {
    return this.verificationService.setEmergencyContacts(user.userId, dto);
  }

  @Get('can-request')
  @ApiOperation({ summary: 'Check if patient can request a service' })
  @ApiResponse({ status: 200, description: 'Returns whether patient can request service' })
  async canRequestService(@CurrentUser() user: CurrentUserPayload) {
    return this.verificationService.canRequestService(user.userId);
  }

  // ==================== Nurse Access ====================

  @Get('patient/:patientId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get patient verification info (for nurses)' })
  @ApiResponse({ status: 200, description: 'Patient verification info' })
  async getPatientVerification(@Param('patientId') patientId: string) {
    return this.verificationService.getVerificationStatus(patientId);
  }

  // ==================== Admin Actions ====================

  @Post('patient/:patientId/flag')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Add a flag to patient (nurse/admin)' })
  @ApiResponse({ status: 201, description: 'Flag added' })
  async addFlag(
    @Param('patientId') patientId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AddFlagDto,
  ) {
    return this.verificationService.addFlag(patientId, user.userId, dto);
  }

  @Patch('patient/:patientId/suspend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Suspend a patient (admin only)' })
  @ApiResponse({ status: 200, description: 'Patient suspended' })
  async suspendPatient(
    @Param('patientId') patientId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SuspendPatientDto,
  ) {
    return this.verificationService.suspendPatient(patientId, user.userId, dto);
  }

  @Patch('patient/:patientId/reactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Reactivate a suspended patient (admin only)' })
  @ApiResponse({ status: 200, description: 'Patient reactivated' })
  async reactivatePatient(
    @Param('patientId') patientId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ReactivatePatientDto,
  ) {
    return this.verificationService.reactivatePatient(patientId, user.userId, dto);
  }

  @Post('patient/:patientId/video-call')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Complete video call verification (admin only)' })
  @ApiResponse({ status: 201, description: 'Video call verification completed' })
  async completeVideoCall(
    @Param('patientId') patientId: string,
    @Body() dto: CompleteVideoCallDto,
  ) {
    return this.verificationService.upgradeToLevel2(patientId, dto);
  }

  @Post('patient/:patientId/recalculate-score')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Recalculate trust score (admin only)' })
  @ApiResponse({ status: 200, description: 'Trust score recalculated' })
  async recalculateTrustScore(@Param('patientId') patientId: string) {
    const newScore = await this.verificationService.recalculateTrustScore(patientId);
    return { trustScore: newScore };
  }
}
