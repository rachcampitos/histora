import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NurseVerification, VerificationStatus, CepValidationResult } from './schema/nurse-verification.schema';
import { Nurse } from './schema/nurse.schema';
import { User } from '../users/schema/user.schema';
import { CloudinaryProvider } from '../uploads/providers/cloudinary.provider';
import { CepValidationService } from './cep-validation.service';
import {
  SubmitVerificationDto,
  ReviewVerificationDto,
  VerificationQueryDto,
  UploadVerificationDocumentDto,
} from './dto/nurse-verification.dto';

@Injectable()
export class NurseVerificationService {
  private readonly logger = new Logger(NurseVerificationService.name);
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly maxImageSize = 10 * 1024 * 1024; // 10MB per document

  constructor(
    @InjectModel(NurseVerification.name) private verificationModel: Model<NurseVerification>,
    @InjectModel(Nurse.name) private nurseModel: Model<Nurse>,
    @InjectModel(User.name) private userModel: Model<User>,
    private cloudinaryProvider: CloudinaryProvider,
    private cepValidationService: CepValidationService,
  ) {}

  /**
   * Submit verification documents for a nurse
   */
  async submitVerification(
    userId: string,
    nurseId: string,
    dto: SubmitVerificationDto,
  ): Promise<NurseVerification> {
    // Check if nurse exists and belongs to user
    const nurse = await this.nurseModel.findOne({
      _id: new Types.ObjectId(nurseId),
      userId: new Types.ObjectId(userId),
    });

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    // Check if there's already an approved verification
    const approvedVerification = await this.verificationModel.findOne({
      nurseId: new Types.ObjectId(nurseId),
      status: VerificationStatus.APPROVED,
    });

    if (approvedVerification) {
      throw new BadRequestException('This nurse is already verified');
    }

    // Check if there's a pending verification (from confirmCepIdentity step)
    const existingVerification = await this.verificationModel.findOne({
      nurseId: new Types.ObjectId(nurseId),
      status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
    });

    // Validate required documents
    const requiredTypes = ['cep_front', 'cep_back', 'dni_front', 'dni_back', 'selfie_with_dni'];
    const providedTypes = dto.documents.map((d) => d.documentType);
    const missingTypes = requiredTypes.filter((t) => !providedTypes.includes(t as UploadVerificationDocumentDto['documentType']));

    if (missingTypes.length > 0) {
      throw new BadRequestException(`Missing required documents: ${missingTypes.join(', ')}`);
    }

    // Upload all documents to Cloudinary
    this.logger.log(`[VERIFICATION] Starting upload of ${dto.documents.length} documents for nurse ${nurseId}`);
    const uploadedDocuments = await Promise.all(
      dto.documents.map(async (doc) => {
        this.logger.log(`[VERIFICATION] Uploading document: ${doc.documentType}, size: ${Math.round((doc.imageData?.length || 0) / 1024)}KB`);
        const result = await this.uploadVerificationDocument(nurseId, doc);
        this.logger.log(`[VERIFICATION] Document ${doc.documentType} uploaded successfully`);
        return {
          url: result.url,
          publicId: result.publicId,
          type: doc.documentType,
          uploadedAt: new Date(),
        };
      }),
    );
    this.logger.log(`[VERIFICATION] All documents uploaded successfully`);

    // If there's an existing pending verification (from CEP identity confirmation), update it
    if (existingVerification) {
      existingVerification.documents = uploadedDocuments;
      existingVerification.dniNumber = dto.dniNumber;
      existingVerification.fullNameOnDni = dto.fullNameOnDni;
      existingVerification.status = VerificationStatus.UNDER_REVIEW; // Move to under_review when documents are submitted
      await existingVerification.save();

      // Update nurse verification status
      await this.nurseModel.findByIdAndUpdate(nurseId, {
        verificationStatus: VerificationStatus.UNDER_REVIEW,
      });

      this.logger.log(`Verification documents added to existing verification for nurse ${nurseId}`);

      return existingVerification;
    }

    // Get attempt number from previous rejected verifications
    const previousAttempts = await this.verificationModel.countDocuments({
      nurseId: new Types.ObjectId(nurseId),
      status: VerificationStatus.REJECTED,
    });

    // Create new verification record
    const verification = new this.verificationModel({
      nurseId: new Types.ObjectId(nurseId),
      userId: new Types.ObjectId(userId),
      documents: uploadedDocuments,
      dniNumber: dto.dniNumber,
      fullNameOnDni: dto.fullNameOnDni,
      status: VerificationStatus.UNDER_REVIEW,
      attemptNumber: previousAttempts + 1,
    });

    await verification.save();

    // Update nurse verification status
    await this.nurseModel.findByIdAndUpdate(nurseId, {
      verificationStatus: VerificationStatus.UNDER_REVIEW,
    });

    this.logger.log(`Verification submitted for nurse ${nurseId}, attempt #${previousAttempts + 1}`);

    return verification;
  }

  /**
   * Upload a single verification document
   */
  private async uploadVerificationDocument(
    nurseId: string,
    doc: UploadVerificationDocumentDto,
  ): Promise<{ url: string; publicId: string }> {
    const base64Data = this.extractBase64Data(doc.imageData);
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > this.maxImageSize) {
      throw new BadRequestException(`Document ${doc.documentType} exceeds 10MB limit`);
    }

    const mimeType = doc.mimeType || this.detectMimeType(doc.imageData);
    if (!this.allowedImageTypes.includes(mimeType)) {
      throw new BadRequestException('Invalid image format. Allowed: JPEG, PNG, WebP');
    }

    const ext = mimeType.split('/')[1];
    const filename = `verification_${doc.documentType}_${nurseId}_${Date.now()}.${ext}`;
    const folder = `histora/nurses/${nurseId}/verification`;

    const result = await this.cloudinaryProvider.uploadBase64(base64Data, filename, {
      folder,
      transformation: {
        quality: 'auto',
        format: 'auto',
      },
    });

    if (!result.success) {
      throw new BadRequestException(`Failed to upload ${doc.documentType}: ${result.error}`);
    }

    return {
      url: result.secureUrl!,
      publicId: result.publicId!,
    };
  }

  /**
   * Get verification status for a nurse
   */
  async getVerificationStatus(userId: string, nurseId: string): Promise<NurseVerification | null> {
    this.logger.debug(`[VERIFICATION STATUS] Querying for nurseId=${nurseId}, userId=${userId}`);

    const verification = await this.verificationModel
      .findOne({
        nurseId: new Types.ObjectId(nurseId),
        userId: new Types.ObjectId(userId),
      })
      .sort({ createdAt: -1 })
      .exec();

    if (verification) {
      this.logger.debug(`[VERIFICATION STATUS] Found verification id=${verification._id}, status=${verification.status}`);
    } else {
      this.logger.debug(`[VERIFICATION STATUS] No verification found`);
    }

    return verification;
  }

  /**
   * Get all pending verifications (admin)
   * Filters out verifications for deleted users
   */
  async getPendingVerifications(
    query: VerificationQueryDto,
  ): Promise<{ verifications: NurseVerification[]; total: number; page: number; totalPages: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.status) {
      filter.status = query.status;
    } else {
      // Default to pending and under_review
      filter.status = { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] };
    }

    // Fetch more to account for filtering deleted users
    const allVerifications = await this.verificationModel
      .find(filter)
      .populate({
        path: 'nurseId',
        select: 'cepNumber specialties officialCepPhotoUrl selfieUrl cepRegisteredName',
        populate: {
          path: 'userId',
          select: 'firstName lastName email phone avatar isDeleted',
        },
      })
      .sort({ createdAt: 1 }) // Oldest first
      .exec();

    // Filter out verifications where the user has been deleted
    const activeVerifications = allVerifications.filter((v) => {
      const nurse = v.nurseId as any;
      const user = nurse?.userId as any;
      return user && !user.isDeleted;
    });

    const total = activeVerifications.length;
    const verifications = activeVerifications.slice(skip, skip + limit);

    return {
      verifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get verification by ID (admin)
   */
  async getVerificationById(verificationId: string): Promise<NurseVerification> {
    const verification = await this.verificationModel
      .findById(verificationId)
      .populate({
        path: 'nurseId',
        select: 'cepNumber specialties bio yearsOfExperience officialCepPhotoUrl selfieUrl cepRegisteredName',
        populate: {
          path: 'userId',
          select: 'firstName lastName email phone avatar',
        },
      })
      .populate('reviewedBy', 'firstName lastName')
      .exec();

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    return verification;
  }

  /**
   * Review and approve/reject verification (admin)
   */
  async reviewVerification(
    verificationId: string,
    adminUserId: string,
    dto: ReviewVerificationDto,
  ): Promise<NurseVerification> {
    const verification = await this.verificationModel.findById(verificationId);

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    if (verification.status === VerificationStatus.APPROVED) {
      throw new BadRequestException('This verification has already been approved');
    }

    if (dto.status === VerificationStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required when rejecting');
    }

    // Update verification
    const previousStatus = verification.status;
    verification.status = dto.status;
    verification.reviewedBy = new Types.ObjectId(adminUserId);
    verification.reviewedAt = new Date();
    verification.reviewNotes = dto.reviewNotes;

    if (dto.status === VerificationStatus.REJECTED) {
      verification.rejectionReason = dto.rejectionReason;
    }

    await verification.save();
    this.logger.log(
      `[REVIEW] Verification ${verificationId} status updated: ${previousStatus} -> ${dto.status}`,
    );

    // Update nurse verification status
    const nurse = await this.nurseModel.findById(verification.nurseId);
    if (nurse) {
      const previousNurseStatus = nurse.verificationStatus;
      nurse.verificationStatus = dto.status;
      if (dto.status === VerificationStatus.APPROVED) {
        nurse.cepVerified = true;
        nurse.cepVerifiedAt = new Date();
      }
      await nurse.save();
      this.logger.log(
        `[REVIEW] Nurse ${nurse._id} verificationStatus updated: ${previousNurseStatus} -> ${dto.status}`,
      );
    }

    this.logger.log(
      `Verification ${verificationId} ${dto.status} by admin ${adminUserId}`,
    );

    return verification;
  }

  /**
   * Mark verification as under review (admin)
   */
  async markUnderReview(verificationId: string, adminUserId: string): Promise<NurseVerification> {
    const verification = await this.verificationModel.findByIdAndUpdate(
      verificationId,
      {
        status: VerificationStatus.UNDER_REVIEW,
        reviewedBy: new Types.ObjectId(adminUserId),
      },
      { new: true },
    );

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    // Update nurse status too
    await this.nurseModel.findByIdAndUpdate(verification.nurseId, {
      verificationStatus: VerificationStatus.UNDER_REVIEW,
    });

    return verification;
  }

  /**
   * Get verification statistics (admin dashboard)
   */
  async getVerificationStats(): Promise<{
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
    total: number;
  }> {
    const [pending, underReview, approved, rejected] = await Promise.all([
      this.verificationModel.countDocuments({ status: VerificationStatus.PENDING }),
      this.verificationModel.countDocuments({ status: VerificationStatus.UNDER_REVIEW }),
      this.verificationModel.countDocuments({ status: VerificationStatus.APPROVED }),
      this.verificationModel.countDocuments({ status: VerificationStatus.REJECTED }),
    ]);

    return {
      pending,
      underReview,
      approved,
      rejected,
      total: pending + underReview + approved + rejected,
    };
  }

  // =====================
  // CEP VALIDATION METHODS
  // =====================

  /**
   * Pre-validate CEP credentials before starting the verification process
   * This is the first step: validates DNI and CEP with the official registry
   * Returns the official CEP photo and HABIL status for user confirmation
   *
   * Flow:
   * 1. Enfermera ingresa solo CEP + DNI
   * 2. Sistema valida CEP y obtiene: nombre, foto, estado HABIL
   * 3. Sistema retorna datos para confirmacion
   */
  async preValidateCep(
    userId: string,
    nurseId: string,
    dto: { dniNumber: string; cepNumber: string; fullName?: string },
  ): Promise<{
    isValid: boolean;
    cepValidation: CepValidationResult;
    message: string;
  }> {
    // Verify nurse belongs to user
    const nurse = await this.nurseModel.findOne({
      _id: new Types.ObjectId(nurseId),
      userId: new Types.ObjectId(userId),
    });

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    // Validate CEP number matches
    if (nurse.cepNumber !== dto.cepNumber) {
      throw new BadRequestException(
        `CEP number does not match. Expected: ${nurse.cepNumber}, Received: ${dto.cepNumber}`,
      );
    }

    this.logger.log(`Pre-validating CEP for nurse ${nurseId}: DNI=${dto.dniNumber}, CEP=${dto.cepNumber}`);

    // Validate with official CEP registry using the complete validation method
    // This uses view.php to get: full name, photo, DNI, region, HABIL status
    const validation = await this.cepValidationService.validateWithDni(
      dto.cepNumber,
      dto.dniNumber,
    );

    const cepValidation: CepValidationResult = {
      isValid: validation.isValid,
      cepNumber: validation.data?.cepNumber,
      fullName: validation.data?.fullName,
      dni: validation.data?.dni,
      photoUrl: validation.data?.photoUrl,
      isPhotoVerified: validation.data?.isPhotoVerified,
      isNameVerified: validation.data?.isNameVerified,
      region: validation.data?.region,
      isHabil: validation.data?.isHabil,
      status: validation.data?.status,
      validatedAt: new Date(),
      error: validation.error,
    };

    if (!validation.isValid) {
      return {
        isValid: false,
        cepValidation,
        message: validation.error || 'No se pudo validar el registro CEP',
      };
    }

    // Check if nurse is HABIL
    if (validation.data?.status === 'INHABILITADO') {
      return {
        isValid: false,
        cepValidation,
        message: 'La enfermera(o) se encuentra INHABILITADA para ejercer según el CEP',
      };
    }

    // Build success message
    let message = 'CEP validado exitosamente.';
    if (validation.data?.photoUrl) {
      message += ' Por favor confirma que la foto corresponde a tu identidad.';
    }
    if (validation.data?.isHabil) {
      message += ' Estado: HABIL ✓';
    }

    return {
      isValid: true,
      cepValidation,
      message,
    };
  }

  /**
   * Confirm identity after CEP pre-validation
   * User confirms "Sí, soy yo" after seeing their CEP photo
   * This creates or updates the verification record with CEP data
   */
  async confirmCepIdentity(
    userId: string,
    nurseId: string,
    dto: {
      dniNumber: string;
      cepNumber: string;
      fullName: string;
      cepValidation: CepValidationResult;
      confirmed: boolean;
    },
  ): Promise<NurseVerification> {
    // Verify nurse belongs to user
    const nurse = await this.nurseModel.findOne({
      _id: new Types.ObjectId(nurseId),
      userId: new Types.ObjectId(userId),
    });

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    if (!dto.confirmed) {
      throw new BadRequestException(
        'Debes confirmar tu identidad para continuar con la verificación',
      );
    }

    // Check for existing verification
    let verification = await this.verificationModel.findOne({
      nurseId: new Types.ObjectId(nurseId),
      status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
    });

    if (verification && verification.status === VerificationStatus.APPROVED) {
      throw new BadRequestException('Esta enfermera ya está verificada');
    }

    // Get attempt number from previous rejected verifications
    const previousAttempts = await this.verificationModel.countDocuments({
      nurseId: new Types.ObjectId(nurseId),
      status: VerificationStatus.REJECTED,
    });

    if (!verification) {
      // Create new verification record
      verification = new this.verificationModel({
        nurseId: new Types.ObjectId(nurseId),
        userId: new Types.ObjectId(userId),
        dniNumber: dto.dniNumber,
        fullNameOnDni: dto.fullName,
        cepValidation: dto.cepValidation,
        officialCepPhotoUrl: dto.cepValidation.photoUrl,
        cepIdentityConfirmed: true,
        cepIdentityConfirmedAt: new Date(),
        status: VerificationStatus.PENDING,
        attemptNumber: previousAttempts + 1,
      });
    } else {
      // Update existing verification
      verification.dniNumber = dto.dniNumber;
      verification.fullNameOnDni = dto.fullName;
      verification.cepValidation = dto.cepValidation;
      verification.officialCepPhotoUrl = dto.cepValidation.photoUrl;
      verification.cepIdentityConfirmed = true;
      verification.cepIdentityConfirmedAt = new Date();
    }

    await verification.save();

    // Update nurse with CEP photo URL
    if (dto.cepValidation.photoUrl) {
      await this.nurseModel.findByIdAndUpdate(nurseId, {
        officialCepPhotoUrl: dto.cepValidation.photoUrl,
        cepRegisteredName: dto.cepValidation.fullName,
      });
    }

    this.logger.log(`CEP identity confirmed for nurse ${nurseId}`);

    return verification;
  }

  /**
   * Override reviewVerification to also update user avatar with CEP photo
   */
  async approveAndSetCepAvatar(
    verificationId: string,
    adminUserId: string,
    dto: ReviewVerificationDto,
  ): Promise<NurseVerification> {
    // First, do the normal review
    const verification = await this.reviewVerification(verificationId, adminUserId, dto);

    // If approved and has CEP photo, update user avatar
    if (dto.status === VerificationStatus.APPROVED && verification.officialCepPhotoUrl) {
      const nurse = await this.nurseModel.findById(verification.nurseId);
      if (nurse) {
        // Update user's avatar with the official CEP photo
        await this.userModel.findByIdAndUpdate(nurse.userId, {
          avatar: verification.officialCepPhotoUrl,
        });

        this.logger.log(
          `Updated user ${nurse.userId} avatar with official CEP photo: ${verification.officialCepPhotoUrl}`,
        );
      }
    }

    return verification;
  }

  /**
   * Get the official CEP photo URL for a nurse
   */
  async getCepPhotoUrl(nurseId: string): Promise<{ photoUrl: string | null; isVerified: boolean }> {
    const nurse = await this.nurseModel.findById(nurseId);
    if (!nurse) {
      throw new NotFoundException('Nurse not found');
    }

    return {
      photoUrl: nurse.officialCepPhotoUrl || null,
      isVerified: nurse.cepVerified,
    };
  }

  // Helper methods
  private extractBase64Data(data: string): string {
    if (data.includes('base64,')) {
      return data.split('base64,')[1];
    }
    return data;
  }

  private detectMimeType(data: string): string {
    if (data.startsWith('data:')) {
      const match = data.match(/data:([^;]+);/);
      if (match) {
        return match[1];
      }
    }
    return 'image/jpeg';
  }
}
