import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Nurse } from './schema/nurse.schema';
import { NurseReview, NurseReviewDocument } from './schema/nurse-review.schema';
import {
  CreateNurseDto,
  UpdateNurseDto,
  SearchNurseDto,
  NurseServiceDto,
} from './dto';
import { CreateNurseReviewDto } from './dto/nurse-review.dto';

@Injectable()
export class NursesService {
  constructor(
    @InjectModel(Nurse.name) private nurseModel: Model<Nurse>,
    @InjectModel(NurseReview.name) private nurseReviewModel: Model<NurseReviewDocument>,
  ) {}

  async create(userId: string, createNurseDto: CreateNurseDto): Promise<Nurse> {
    // Check if nurse profile already exists for this user
    const existingNurse = await this.nurseModel.findOne({ userId });
    if (existingNurse) {
      throw new ConflictException('Nurse profile already exists for this user');
    }

    // Check if CEP number is already registered
    const existingCep = await this.nurseModel.findOne({
      cepNumber: createNurseDto.cepNumber,
    });
    if (existingCep) {
      throw new ConflictException('CEP number is already registered');
    }

    // Map verificationStatus string to enum if provided
    let verificationStatus = createNurseDto.verificationStatus;
    if (verificationStatus && !Object.values(['pending', 'selfie_required', 'under_review', 'approved', 'rejected']).includes(verificationStatus)) {
      verificationStatus = 'pending';
    }

    const nurse = new this.nurseModel({
      userId: new Types.ObjectId(userId),
      cepNumber: createNurseDto.cepNumber,
      specialties: createNurseDto.specialties || [],
      bio: createNurseDto.bio,
      yearsOfExperience: createNurseDto.yearsOfExperience,
      services: createNurseDto.services || [],
      location: createNurseDto.location,
      serviceRadius: createNurseDto.serviceRadius,
      // CEP Verification fields
      cepVerified: createNurseDto.cepVerified || false,
      cepVerifiedAt: createNurseDto.cepVerified ? new Date() : undefined,
      officialCepPhotoUrl: createNurseDto.officialCepPhotoUrl,
      cepRegisteredName: createNurseDto.cepRegisteredName,
      selfieUrl: createNurseDto.selfieUrl,
      verificationStatus: verificationStatus || 'pending',
    });

    return nurse.save();
  }

  async findById(id: string): Promise<Record<string, unknown>> {
    const nurse = await this.nurseModel
      .findById(id)
      .populate('userId', 'firstName lastName email phone avatar')
      .lean()
      .exec();

    if (!nurse) {
      throw new NotFoundException('Nurse not found');
    }

    // Transform userId to user for consistent API response
    const nurseObj = nurse as Record<string, unknown>;
    const populatedUser = nurseObj.userId as Record<string, unknown> | null;

    // Build verification badge info
    const verificationBadge = this.buildVerificationBadge(nurseObj);

    return {
      ...nurseObj,
      userId: populatedUser?._id?.toString() || String(nurseObj.userId),
      user: populatedUser,
      verificationBadge,
    };
  }

  /**
   * Builds verification badge information for nurse profile
   */
  private buildVerificationBadge(nurse: Record<string, unknown>): {
    isVerified: boolean;
    isCepVerified: boolean;
    hasOfficialPhoto: boolean;
    officialPhotoUrl: string | null;
    verificationStatus: string;
    badgeLabel: string;
    badgeColor: string;
  } {
    const cepVerified = nurse.cepVerified as boolean || false;
    const verificationStatus = nurse.verificationStatus as string || 'pending';
    const officialCepPhotoUrl = nurse.officialCepPhotoUrl as string || null;

    const isVerified = verificationStatus === 'approved' && cepVerified;
    const hasOfficialPhoto = !!officialCepPhotoUrl;

    let badgeLabel = 'Pendiente';
    let badgeColor = 'warning';

    if (isVerified) {
      badgeLabel = 'Verificado CEP';
      badgeColor = 'success';
    } else if (verificationStatus === 'under_review') {
      badgeLabel = 'En revisión';
      badgeColor = 'info';
    } else if (verificationStatus === 'rejected') {
      badgeLabel = 'Rechazado';
      badgeColor = 'danger';
    }

    return {
      isVerified,
      isCepVerified: cepVerified,
      hasOfficialPhoto,
      officialPhotoUrl: officialCepPhotoUrl,
      verificationStatus,
      badgeLabel,
      badgeColor,
    };
  }

  async findByUserId(userIdParam: string): Promise<Record<string, unknown>> {
    const nurse = await this.nurseModel
      .findOne({ userId: new Types.ObjectId(userIdParam) })
      .populate('userId', 'firstName lastName email phone avatar')
      .lean()
      .exec();

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    // Transform userId to user for consistent API response
    const nurseObj = nurse as Record<string, unknown>;
    const populatedUser = nurseObj.userId as Record<string, unknown> | null;

    // Build verification badge info
    const verificationBadge = this.buildVerificationBadge(nurseObj);

    return {
      ...nurseObj,
      userId: populatedUser?._id?.toString() || String(nurseObj.userId),
      user: populatedUser,
      verificationBadge,
    };
  }

  /**
   * Find nurse by CEP number (returns null if not found, doesn't throw)
   * Excludes deleted nurses
   */
  async findByCepNumber(cepNumber: string): Promise<Nurse | null> {
    return this.nurseModel.findOne({ cepNumber, isDeleted: { $ne: true } }).exec();
  }

  async searchNearby(searchDto: SearchNurseDto): Promise<{ nurse: Nurse; distance: number }[]> {
    const {
      lat,
      lng,
      radius = 10,
      category,
      minRating,
      maxPrice,
      availableNow,
    } = searchDto;

    const radiusInMeters = radius * 1000;

    // Build match conditions - exclude deleted nurses
    const matchConditions: Record<string, unknown> = {
      isActive: true,
      isDeleted: { $ne: true },
    };

    if (availableNow) {
      matchConditions.isAvailable = true;
    }

    if (minRating) {
      matchConditions.averageRating = { $gte: minRating };
    }

    if (category) {
      matchConditions['services.category'] = category;
      matchConditions['services.isActive'] = true;
    }

    if (maxPrice && category) {
      matchConditions['services.price'] = { $lte: maxPrice };
    }

    const nurses = await this.nurseModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
          },
          distanceField: 'distance',
          maxDistance: radiusInMeters,
          spherical: true,
          query: matchConditions,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          cepNumber: 1,
          cepVerified: 1,
          specialties: 1,
          bio: 1,
          yearsOfExperience: 1,
          services: 1,
          location: 1,
          serviceRadius: 1,
          isAvailable: 1,
          availableFrom: 1,
          availableTo: 1,
          availableDays: 1,
          averageRating: 1,
          totalReviews: 1,
          totalServicesCompleted: 1,
          distance: { $divide: ['$distance', 1000] }, // Convert to km
          user: {
            firstName: '$user.firstName',
            lastName: '$user.lastName',
            // Prefer official CEP photo, fallback to user avatar
            avatar: { $ifNull: ['$officialCepPhotoUrl', '$user.avatar'] },
            phone: '$user.phone',
          },
        },
      },
      {
        $sort: { distance: 1 },
      },
    ]);

    return nurses.map((n) => ({
      nurse: n,
      distance: n.distance,
    }));
  }

  async update(userId: string, updateNurseDto: UpdateNurseDto): Promise<Nurse> {
    const nurse = await this.nurseModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: updateNurseDto },
      { new: true },
    );

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    return nurse;
  }

  async updateLocation(
    userId: string,
    location: { type: string; coordinates: number[]; address?: string; city?: string; district?: string },
  ): Promise<Nurse> {
    const nurse = await this.nurseModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: { location } },
      { new: true },
    );

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    return nurse;
  }

  async setAvailability(userId: string, isAvailable: boolean): Promise<Nurse> {
    const nurse = await this.nurseModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: { isAvailable } },
      { new: true },
    );

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    return nurse;
  }

  async addService(userId: string, serviceDto: NurseServiceDto): Promise<Nurse> {
    const nurse = await this.nurseModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $push: { services: serviceDto } },
      { new: true },
    );

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    return nurse;
  }

  async updateService(
    userId: string,
    serviceId: string,
    serviceDto: Partial<NurseServiceDto>,
  ): Promise<Nurse> {
    const updateFields: Record<string, unknown> = {};
    Object.keys(serviceDto).forEach((key) => {
      updateFields[`services.$.${key}`] = serviceDto[key as keyof NurseServiceDto];
    });

    const nurse = await this.nurseModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        'services._id': new Types.ObjectId(serviceId),
      },
      { $set: updateFields },
      { new: true },
    );

    if (!nurse) {
      throw new NotFoundException('Nurse or service not found');
    }

    return nurse;
  }

  async removeService(userId: string, serviceId: string): Promise<Nurse> {
    const nurse = await this.nurseModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $pull: { services: { _id: new Types.ObjectId(serviceId) } } },
      { new: true },
    );

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    return nurse;
  }

  async updateStats(
    nurseId: string,
    rating: number,
  ): Promise<void> {
    const nurse = await this.nurseModel.findById(nurseId);
    if (!nurse) return;

    const newTotalReviews = nurse.totalReviews + 1;
    const newAverageRating =
      (nurse.averageRating * nurse.totalReviews + rating) / newTotalReviews;

    await this.nurseModel.findByIdAndUpdate(nurseId, {
      $set: {
        averageRating: Math.round(newAverageRating * 10) / 10,
        totalReviews: newTotalReviews,
      },
      $inc: { totalServicesCompleted: 1 },
    });
  }

  async getEarnings(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ total: number; commission: number; net: number; servicesCount: number }> {
    // This would typically query the service-requests collection
    // For now, return placeholder data
    return {
      total: 0,
      commission: 0,
      net: 0,
      servicesCount: 0,
    };
  }

  /**
   * Get selfie public ID for a nurse (for deletion)
   */
  async getSelfiePublicId(nurseId: string): Promise<string | null> {
    const nurse = await this.nurseModel.findById(nurseId).select('selfiePublicId').exec();
    return nurse?.selfiePublicId || null;
  }

  /**
   * Update nurse selfie URL and public ID
   * Also updates verification status to 'pending' if selfie is provided
   */
  async updateSelfie(nurseId: string, selfieUrl: string, selfiePublicId: string): Promise<Nurse> {
    const updateData: Record<string, unknown> = {
      selfieUrl,
      selfiePublicId,
    };

    // If selfie is provided, update status to pending (ready for admin review)
    if (selfieUrl) {
      updateData.verificationStatus = 'pending';
    }

    const nurse = await this.nurseModel.findByIdAndUpdate(
      nurseId,
      { $set: updateData },
      { new: true },
    );

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    return nurse;
  }

  // ============= Nurse Review Methods =============

  /**
   * Create a review for a nurse
   */
  async createReview(
    nurseId: string,
    patientId: string,
    createReviewDto: CreateNurseReviewDto,
  ): Promise<NurseReview> {
    // Check if nurse exists
    const nurse = await this.nurseModel.findById(nurseId);
    if (!nurse) {
      throw new NotFoundException('Enfermera no encontrada');
    }

    // Check if patient already reviewed this nurse
    const existingReview = await this.nurseReviewModel.findOne({
      nurseId: new Types.ObjectId(nurseId),
      patientId: new Types.ObjectId(patientId),
      isDeleted: false,
    });

    if (existingReview) {
      throw new ConflictException('Ya has dejado una resena para esta enfermera');
    }

    // Determine if review is verified (linked to a completed service)
    let isVerified = false;
    if (createReviewDto.serviceRequestId) {
      // TODO: Check if service request exists and is completed
      isVerified = true;
    }

    const review = new this.nurseReviewModel({
      nurseId: new Types.ObjectId(nurseId),
      patientId: new Types.ObjectId(patientId),
      serviceRequestId: createReviewDto.serviceRequestId
        ? new Types.ObjectId(createReviewDto.serviceRequestId)
        : undefined,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment || '',
      isVerified,
    });

    const savedReview = await review.save();

    // Update nurse's average rating and total reviews
    await this.recalculateNurseRating(nurseId);

    return savedReview;
  }

  /**
   * Get reviews for a nurse
   */
  async getNurseReviews(
    nurseId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    reviews: NurseReview[];
    total: number;
    page: number;
    limit: number;
    averageRating: number;
    totalReviews: number;
  }> {
    const skip = (page - 1) * limit;

    const [reviews, total, stats] = await Promise.all([
      this.nurseReviewModel
        .find({ nurseId: new Types.ObjectId(nurseId), isDeleted: false })
        .populate('patientId', 'firstName lastName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.nurseReviewModel.countDocuments({
        nurseId: new Types.ObjectId(nurseId),
        isDeleted: false,
      }),
      this.nurseReviewModel.aggregate([
        { $match: { nurseId: new Types.ObjectId(nurseId), isDeleted: false } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    // Map reviews to include patient name but respect anonymity
    // Also map patientId to patient for frontend compatibility
    const mappedReviews = reviews.map((review) => {
      const r = review as Record<string, unknown>;
      if (r.isAnonymous) {
        const anonymousPatient = { firstName: 'Paciente', lastName: 'Anonimo' };
        return {
          ...r,
          patientId: anonymousPatient,
          patient: anonymousPatient,
        };
      }
      return {
        ...r,
        patient: r.patientId, // Map patientId to patient for frontend
      };
    });

    return {
      reviews: mappedReviews as unknown as NurseReview[],
      total,
      page,
      limit,
      averageRating: stats[0]?.avgRating || 0,
      totalReviews: stats[0]?.count || 0,
    };
  }

  /**
   * Recalculate nurse's average rating based on all reviews
   */
  private async recalculateNurseRating(nurseId: string): Promise<void> {
    const stats = await this.nurseReviewModel.aggregate([
      { $match: { nurseId: new Types.ObjectId(nurseId), isDeleted: false } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const averageRating = Math.round((stats[0]?.avgRating || 0) * 10) / 10;
    const totalReviews = stats[0]?.count || 0;

    await this.nurseModel.findByIdAndUpdate(nurseId, {
      $set: { averageRating, totalReviews },
    });
  }

  /**
   * Delete a review (soft delete)
   */
  async deleteReview(reviewId: string, patientId: string): Promise<void> {
    const review = await this.nurseReviewModel.findOne({
      _id: new Types.ObjectId(reviewId),
      patientId: new Types.ObjectId(patientId),
      isDeleted: false,
    });

    if (!review) {
      throw new NotFoundException('Resena no encontrada o no tienes permisos para eliminarla');
    }

    review.isDeleted = true;
    await review.save();

    // Recalculate nurse's rating
    await this.recalculateNurseRating(review.nurseId.toString());
  }
}
