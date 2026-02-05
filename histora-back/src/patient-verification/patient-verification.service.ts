import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PatientVerification, PatientVerificationDocument } from './schema/patient-verification.schema';
import {
  SendPhoneCodeDto,
  VerifyPhoneCodeDto,
  UploadDniDto,
  UploadSelfieDto,
  VerifyPaymentMethodDto,
  SetEmergencyContactsDto,
  AddFlagDto,
  SuspendPatientDto,
  ReactivatePatientDto,
  CompleteVideoCallDto,
  VerificationStatusDto,
  PatientProfileForNurseDto,
} from './dto/verification.dto';
import { SmsProvider } from '../notifications/providers/sms.provider';

@Injectable()
export class PatientVerificationService {
  private readonly logger = new Logger(PatientVerificationService.name);

  // In-memory store for verification codes (use Redis in production)
  private verificationCodes: Map<string, { code: string; expiresAt: Date }> = new Map();

  constructor(
    @InjectModel(PatientVerification.name)
    private verificationModel: Model<PatientVerificationDocument>,
    private smsProvider: SmsProvider,
  ) {}

  // ==================== Initialization ====================

  async initializeVerification(patientId: string): Promise<PatientVerificationDocument> {
    const existing = await this.verificationModel.findOne({ patientId: new Types.ObjectId(patientId) });

    if (existing) {
      return existing;
    }

    const verification = new this.verificationModel({
      patientId: new Types.ObjectId(patientId),
      verificationLevel: 0,
      trustScore: 50,
      status: 'pending',
    });

    return verification.save();
  }

  // ==================== Phone Verification ====================

  async sendPhoneCode(patientId: string, dto: SendPhoneCodeDto): Promise<{ message: string }> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code with 5-minute expiration
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    this.verificationCodes.set(`${patientId}:${dto.phone}`, { code, expiresAt });

    // Format phone number with country code for Peru
    const formattedPhone = dto.phone.startsWith('+') ? dto.phone : `+51${dto.phone}`;

    // Send SMS with verification code
    try {
      const message = this.smsProvider.getVerificationCodeMessage(code);
      const result = await this.smsProvider.send({
        to: formattedPhone,
        message,
      });

      if (!result.success) {
        this.logger.error(`Failed to send SMS to ${formattedPhone}: ${result.error}`);
        // Don't throw - still allow verification via console log in dev
      } else {
        this.logger.log(`Verification SMS sent to ${formattedPhone}`);
      }
    } catch (error) {
      this.logger.error(`SMS sending failed: ${error.message}`);
      // Continue - code is still stored and can be verified
    }

    // Also log for development (remove in production)
    this.logger.debug(`[DEV] Verification code for ${dto.phone}: ${code}`);

    return { message: 'Código de verificación enviado' };
  }

  async verifyPhoneCode(patientId: string, dto: VerifyPhoneCodeDto): Promise<PatientVerification> {
    const key = `${patientId}:${dto.phone}`;
    const stored = this.verificationCodes.get(key);

    if (!stored) {
      throw new BadRequestException('No hay código de verificación pendiente');
    }

    if (new Date() > stored.expiresAt) {
      this.verificationCodes.delete(key);
      throw new BadRequestException('El código ha expirado');
    }

    if (stored.code !== dto.code) {
      throw new BadRequestException('Código incorrecto');
    }

    this.verificationCodes.delete(key);

    const verification = await this.getOrCreateVerification(patientId);
    verification.phoneVerified = true;

    return verification.save();
  }

  // ==================== DNI Verification ====================

  async uploadDni(patientId: string, dto: UploadDniDto): Promise<PatientVerification> {
    const verification = await this.getOrCreateVerification(patientId);

    verification.dni = {
      number: dto.dniNumber,
      frontPhotoUrl: dto.frontPhotoUrl,
      backPhotoUrl: dto.backPhotoUrl,
      verifiedWithReniec: false,
      reniecData: undefined,
    };

    // TODO: Integrate with RENIEC API for automatic verification
    // For MVP, we'll do manual verification or skip RENIEC

    return verification.save();
  }

  async verifyDniWithReniec(patientId: string): Promise<PatientVerification> {
    const verification = await this.getVerification(patientId);

    if (!verification.dni?.number) {
      throw new BadRequestException('DNI no ha sido cargado');
    }

    // TODO: Call RENIEC API
    // For now, mark as verified (remove in production)
    verification.dni.verifiedWithReniec = true;
    verification.dni.reniecData = {
      verified: true,
      verifiedAt: new Date(),
    };

    return verification.save();
  }

  // ==================== Selfie Verification ====================

  async uploadSelfie(patientId: string, dto: UploadSelfieDto): Promise<PatientVerification> {
    const verification = await this.getVerification(patientId);

    if (!verification.dni?.frontPhotoUrl) {
      throw new BadRequestException('Primero debe cargar el DNI');
    }

    verification.selfie = {
      photoUrl: dto.selfiePhotoUrl,
      biometricMatchScore: 0,
      verified: false,
    };

    // TODO: Integrate with AWS Rekognition for biometric comparison
    // For MVP, we'll do manual verification or auto-approve
    verification.selfie.verified = true;
    verification.selfie.biometricMatchScore = 85; // Mock score

    return verification.save();
  }

  // ==================== Payment Verification ====================

  async verifyPaymentMethod(patientId: string, dto: VerifyPaymentMethodDto): Promise<PatientVerification> {
    const verification = await this.getVerification(patientId);

    verification.paymentMethod = {
      verified: true,
      type: dto.type,
      last4: dto.last4 || '',
    };

    // Check if we should upgrade to level 1
    await this.checkAndUpgradeLevel(verification);

    return verification.save();
  }

  // ==================== Emergency Contacts ====================

  async setEmergencyContacts(patientId: string, dto: SetEmergencyContactsDto): Promise<PatientVerification> {
    const verification = await this.getVerification(patientId);

    verification.emergencyContacts = dto.contacts.map(c => ({
      name: c.name,
      phone: c.phone,
      relationship: c.relationship,
      verified: false,
    }));

    // Check if we should upgrade to level 1
    await this.checkAndUpgradeLevel(verification);

    return verification.save();
  }

  // ==================== Level Management ====================

  private async checkAndUpgradeLevel(verification: PatientVerificationDocument): Promise<void> {
    // Requirements for Level 1
    const level1Requirements =
      verification.phoneVerified &&
      verification.dni?.frontPhotoUrl &&
      verification.dni?.backPhotoUrl &&
      verification.selfie?.verified &&
      verification.paymentMethod?.verified &&
      verification.emergencyContacts?.length >= 2;

    if (level1Requirements && verification.verificationLevel < 1) {
      verification.verificationLevel = 1;
      verification.status = 'level1';
      verification.verifiedAt = new Date();
    }
  }

  async upgradeToLevel2(patientId: string, dto: CompleteVideoCallDto): Promise<PatientVerification> {
    const verification = await this.getVerification(patientId);

    if (verification.verificationLevel < 1) {
      throw new BadRequestException('Primero debe completar la verificación nivel 1');
    }

    if (!dto.verified) {
      throw new BadRequestException('La videollamada no fue aprobada');
    }

    verification.videoCallVerification = {
      completed: true,
      completedAt: new Date(),
      verifiedBy: undefined, // Set by admin later
      notes: dto.notes,
    };

    verification.verificationLevel = 2;
    verification.status = 'level2';
    verification.trustScore = Math.min(100, verification.trustScore + 10);

    return verification.save();
  }

  // ==================== Trust Score Management ====================

  async updateTrustScore(patientId: string, points: number, reason: string): Promise<PatientVerification> {
    const verification = await this.getVerification(patientId);

    const newScore = Math.max(0, Math.min(100, verification.trustScore + points));
    verification.trustScore = newScore;

    // Auto-suspend if score drops too low
    if (newScore <= 30 && verification.status !== 'suspended') {
      verification.status = 'suspended';
      verification.suspendedAt = new Date();
      verification.suspensionReason = `Trust score dropped below threshold: ${reason}`;
    }

    return verification.save();
  }

  async recalculateTrustScore(patientId: string): Promise<number> {
    const verification = await this.getVerification(patientId);

    let score = 50; // Base score

    // Verification bonuses
    if (verification.verificationLevel >= 1) score += 5;
    if (verification.verificationLevel >= 2) score += 10;
    if (verification.paymentMethod?.verified) score += 5;

    // Service history
    score += Math.min(15, verification.totalServices * 0.5);

    // Rating bonus/penalty
    if (verification.averageRating >= 4.5) score += 10;
    else if (verification.averageRating >= 4.0) score += 5;
    else if (verification.averageRating < 3.0) score -= 10;

    // Flag penalties
    score -= verification.yellowFlagsCount * 20;
    score -= verification.redFlagsCount * 50;

    // Clamp between 0 and 100
    score = Math.max(0, Math.min(100, score));

    verification.trustScore = score;
    await verification.save();

    return score;
  }

  // ==================== Flag Management ====================

  async addFlag(patientId: string, reporterId: string, dto: AddFlagDto): Promise<PatientVerification> {
    const verification = await this.getVerification(patientId);

    const flag = {
      type: dto.type as 'yellow' | 'red',
      reason: dto.reason,
      reportedBy: new Types.ObjectId(reporterId),
      serviceRequestId: dto.serviceRequestId ? new Types.ObjectId(dto.serviceRequestId) : undefined,
      createdAt: new Date(),
    };

    verification.flags.push(flag);

    // Update flag counts
    if (dto.type === 'yellow') {
      verification.yellowFlagsCount += 1;
    } else {
      verification.redFlagsCount += 1;
    }

    // Auto-suspend on red flag
    if (dto.type === 'red') {
      verification.status = 'suspended';
      verification.suspendedAt = new Date();
      verification.suspensionReason = `Red flag: ${dto.reason}`;
    }

    // Recalculate trust score
    await this.recalculateTrustScore(patientId);

    return verification.save();
  }

  // ==================== Suspension Management ====================

  async suspendPatient(patientId: string, adminId: string, dto: SuspendPatientDto): Promise<PatientVerification> {
    const verification = await this.getVerification(patientId);

    verification.status = 'suspended';
    verification.suspendedAt = new Date();
    verification.suspensionReason = dto.reason;
    verification.suspendedBy = new Types.ObjectId(adminId);

    return verification.save();
  }

  async reactivatePatient(patientId: string, adminId: string, dto: ReactivatePatientDto): Promise<PatientVerification> {
    const verification = await this.getVerification(patientId);

    if (verification.status !== 'suspended') {
      throw new BadRequestException('El paciente no está suspendido');
    }

    verification.status = verification.verificationLevel >= 1 ? 'level1' : 'pending';
    verification.suspendedAt = undefined;
    verification.suspensionReason = undefined;
    verification.suspendedBy = undefined;

    if (dto.newTrustScore !== undefined) {
      verification.trustScore = dto.newTrustScore;
    }

    return verification.save();
  }

  // ==================== Service Stats ====================

  async incrementServiceCount(patientId: string): Promise<void> {
    await this.verificationModel.updateOne(
      { patientId: new Types.ObjectId(patientId) },
      { $inc: { totalServices: 1 } },
    );
  }

  async updateAverageRating(patientId: string, newRating: number, totalRatings: number): Promise<void> {
    await this.verificationModel.updateOne(
      { patientId: new Types.ObjectId(patientId) },
      { averageRating: newRating },
    );

    // Recalculate trust score after rating update
    await this.recalculateTrustScore(patientId);
  }

  // ==================== Query Methods ====================

  async getVerificationStatus(patientId: string): Promise<VerificationStatusDto> {
    const verification = await this.getVerification(patientId);

    return {
      verificationLevel: verification.verificationLevel,
      status: verification.status,
      trustScore: verification.trustScore,
      phoneVerified: verification.phoneVerified,
      dniVerified: !!verification.dni?.frontPhotoUrl && !!verification.dni?.backPhotoUrl,
      selfieVerified: verification.selfie?.verified || false,
      paymentVerified: verification.paymentMethod?.verified || false,
      emergencyContactsCount: verification.emergencyContacts?.length || 0,
      totalServices: verification.totalServices,
      averageRating: verification.averageRating,
      flagsCount: {
        yellow: verification.yellowFlagsCount,
        red: verification.redFlagsCount,
      },
      verifiedAt: verification.verifiedAt,
    };
  }

  async getPatientProfileForNurse(patientId: string, patientData: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
    avatar?: string;
    createdAt: Date;
  }): Promise<PatientProfileForNurseDto> {
    const verification = await this.getVerification(patientId);

    // Calculate age
    const today = new Date();
    const birthDate = new Date(patientData.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Generate badges
    const badges: string[] = [];
    if (verification.verificationLevel >= 1) badges.push('dni_verified');
    if (verification.verificationLevel >= 2) badges.push('video_verified');
    if (verification.paymentMethod?.verified) badges.push('payment_verified');
    if (verification.totalServices >= 10) badges.push('frequent_patient');
    if (verification.totalServices >= 20) badges.push('premium_patient');
    if (verification.trustScore >= 80) badges.push('trusted');

    return {
      patientId,
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      age,
      gender: patientData.gender,
      avatar: patientData.avatar || '',
      verificationLevel: verification.verificationLevel,
      trustScore: verification.trustScore,
      totalServices: verification.totalServices,
      averageRating: verification.averageRating,
      badges,
      recentTags: [], // TODO: Get from ratings
      recentComments: [], // TODO: Get from ratings
      hasYellowFlags: verification.yellowFlagsCount > 0,
      memberSince: patientData.createdAt,
    };
  }

  async canRequestService(patientId: string): Promise<{ allowed: boolean; reason?: string }> {
    // Use getOrCreate to handle patients without verification record
    const verification = await this.getOrCreateVerification(patientId);

    if (verification.status === 'suspended') {
      return { allowed: false, reason: 'Cuenta suspendida' };
    }

    if (verification.verificationLevel < 1) {
      return { allowed: false, reason: 'Debe completar la verificación de identidad' };
    }

    if (verification.trustScore <= 30) {
      return { allowed: false, reason: 'Trust score demasiado bajo' };
    }

    return { allowed: true };
  }

  // ==================== Helper Methods ====================

  private async getOrCreateVerification(patientId: string): Promise<PatientVerificationDocument> {
    const verification = await this.verificationModel.findOne({
      patientId: new Types.ObjectId(patientId)
    });

    if (!verification) {
      return this.initializeVerification(patientId);
    }

    return verification;
  }

  private async getVerification(patientId: string): Promise<PatientVerificationDocument> {
    const verification = await this.verificationModel.findOne({
      patientId: new Types.ObjectId(patientId)
    });

    if (!verification) {
      throw new NotFoundException('Verificación no encontrada');
    }

    return verification;
  }

  async findByPatientId(patientId: string): Promise<PatientVerification | null> {
    return this.verificationModel.findOne({ patientId: new Types.ObjectId(patientId) });
  }
}
