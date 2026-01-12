import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NurseVerification, VerificationStatus } from './schema/nurse-verification.schema';
import { Nurse } from './schema/nurse.schema';
import { CloudinaryProvider } from '../uploads/providers/cloudinary.provider';
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
    private cloudinaryProvider: CloudinaryProvider,
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

    // Check if there's already a pending or approved verification
    const existingVerification = await this.verificationModel.findOne({
      nurseId: new Types.ObjectId(nurseId),
      status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW, VerificationStatus.APPROVED] },
    });

    if (existingVerification) {
      if (existingVerification.status === VerificationStatus.APPROVED) {
        throw new BadRequestException('This nurse is already verified');
      }
      throw new BadRequestException('There is already a pending verification request');
    }

    // Validate required documents
    const requiredTypes = ['cep_front', 'cep_back', 'dni_front', 'dni_back', 'selfie_with_dni'];
    const providedTypes = dto.documents.map((d) => d.documentType);
    const missingTypes = requiredTypes.filter((t) => !providedTypes.includes(t as UploadVerificationDocumentDto['documentType']));

    if (missingTypes.length > 0) {
      throw new BadRequestException(`Missing required documents: ${missingTypes.join(', ')}`);
    }

    // Upload all documents to Cloudinary
    const uploadedDocuments = await Promise.all(
      dto.documents.map(async (doc) => {
        const result = await this.uploadVerificationDocument(nurseId, doc);
        return {
          url: result.url,
          publicId: result.publicId,
          type: doc.documentType,
          uploadedAt: new Date(),
        };
      }),
    );

    // Get attempt number from previous rejected verifications
    const previousAttempts = await this.verificationModel.countDocuments({
      nurseId: new Types.ObjectId(nurseId),
      status: VerificationStatus.REJECTED,
    });

    // Create verification record
    const verification = new this.verificationModel({
      nurseId: new Types.ObjectId(nurseId),
      userId: new Types.ObjectId(userId),
      documents: uploadedDocuments,
      dniNumber: dto.dniNumber,
      fullNameOnDni: dto.fullNameOnDni,
      status: VerificationStatus.PENDING,
      attemptNumber: previousAttempts + 1,
    });

    await verification.save();

    // Update nurse verification status
    await this.nurseModel.findByIdAndUpdate(nurseId, {
      verificationStatus: VerificationStatus.PENDING,
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
    return this.verificationModel
      .findOne({
        nurseId: new Types.ObjectId(nurseId),
        userId: new Types.ObjectId(userId),
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get all pending verifications (admin)
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

    const [verifications, total] = await Promise.all([
      this.verificationModel
        .find(filter)
        .populate({
          path: 'nurseId',
          select: 'cepNumber specialties',
          populate: {
            path: 'userId',
            select: 'firstName lastName email avatar',
          },
        })
        .sort({ createdAt: 1 }) // Oldest first
        .skip(skip)
        .limit(limit)
        .exec(),
      this.verificationModel.countDocuments(filter),
    ]);

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
        select: 'cepNumber specialties bio yearsOfExperience',
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
    verification.status = dto.status;
    verification.reviewedBy = new Types.ObjectId(adminUserId);
    verification.reviewedAt = new Date();
    verification.reviewNotes = dto.reviewNotes;

    if (dto.status === VerificationStatus.REJECTED) {
      verification.rejectionReason = dto.rejectionReason;
    }

    await verification.save();

    // Update nurse verification status
    const nurse = await this.nurseModel.findById(verification.nurseId);
    if (nurse) {
      nurse.verificationStatus = dto.status;
      if (dto.status === VerificationStatus.APPROVED) {
        nurse.cepVerified = true;
        nurse.cepVerifiedAt = new Date();
      }
      await nurse.save();
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
