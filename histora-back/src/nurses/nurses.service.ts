import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
  forwardRef,
  Optional,
  Logger,
  OnModuleInit,
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
import { AdminNotificationsGateway } from '../admin/admin-notifications.gateway';

@Injectable()
export class NursesService implements OnModuleInit {
  private readonly logger = new Logger(NursesService.name);

  constructor(
    @InjectModel(Nurse.name) private nurseModel: Model<Nurse>,
    @InjectModel(NurseReview.name) private nurseReviewModel: Model<NurseReviewDocument>,
    @Optional() @Inject(forwardRef(() => AdminNotificationsGateway))
    private adminNotifications?: AdminNotificationsGateway,
  ) {}

  async onModuleInit() {
    // Sync indexes to drop old { patientId, nurseId } unique index
    // and create new { serviceRequestId } unique index
    try {
      await this.nurseReviewModel.syncIndexes();
      this.logger.log('NurseReview indexes synced');
    } catch (err) {
      this.logger.warn('Failed to sync NurseReview indexes', err);
    }
  }

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

    const savedNurse = await nurse.save();

    // Notify admins about new nurse registration
    if (this.adminNotifications) {
      this.adminNotifications.notifyNurseRegistered({
        id: (savedNurse as any)._id.toString(),
        name: createNurseDto.cepRegisteredName || 'Nueva enfermera',
        cepNumber: createNurseDto.cepNumber,
      });
    }

    return savedNurse;
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

    // Get current time in Peru timezone (UTC-5)
    const now = new Date();
    const peruOffset = -5 * 60; // UTC-5 in minutes
    const peruTime = new Date(now.getTime() + (peruOffset - now.getTimezoneOffset()) * 60000);
    const currentDay = peruTime.getDay(); // 0=Sunday, 1=Monday, etc.
    const currentHour = peruTime.getHours();
    const currentMinute = peruTime.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    if (availableNow) {
      matchConditions.isAvailable = true;
      // Filter by day of week - nurse must be available on current day
      matchConditions.availableDays = currentDay;
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

    // Filter by time if availableNow is requested
    let filteredNurses = nurses;
    if (availableNow) {
      this.logger.debug(`[searchNearby] Current Peru time: ${currentTimeStr}, Day: ${currentDay} (0=Sun,6=Sat)`);
      this.logger.debug(`[searchNearby] Nurses from DB (after isAvailable + day filter): ${nurses.length}`);

      filteredNurses = nurses.filter((n) => {
        // If no schedule defined, consider available (toggle is already checked)
        if (!n.availableFrom || !n.availableTo) {
          this.logger.debug(`[searchNearby] Nurse ${n.user?.firstName}: No schedule defined, included`);
          return true;
        }

        // Check if schedule crosses midnight (e.g., 08:00 to 01:00)
        const crossesMidnight = n.availableTo < n.availableFrom;

        let isInSchedule: boolean;
        if (crossesMidnight) {
          // For overnight schedules: available if current time >= start OR <= end
          // Example: 08:00 to 01:00 - available from 08:00 to 23:59 OR 00:00 to 01:00
          isInSchedule = currentTimeStr >= n.availableFrom || currentTimeStr <= n.availableTo;
        } else {
          // For same-day schedules: available if current time >= start AND <= end
          // Example: 08:00 to 18:00
          isInSchedule = currentTimeStr >= n.availableFrom && currentTimeStr <= n.availableTo;
        }

        this.logger.debug(`[searchNearby] Nurse ${n.user?.firstName}: schedule ${n.availableFrom}-${n.availableTo}, crossesMidnight=${crossesMidnight}, included=${isInSchedule}`);
        return isInSchedule;
      });

      this.logger.debug(`[searchNearby] After time filter: ${filteredNurses.length} nurses`);
    }

    return filteredNurses.map((n) => ({
      nurse: n,
      distance: n.distance,
    }));
  }

  async update(userId: string, updateNurseDto: UpdateNurseDto): Promise<Nurse> {
    const nurse = await this.nurseModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: updateNurseDto },
        { new: true },
      )
      .populate('userId', 'firstName lastName email phone avatar');

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
    const nurse = await this.nurseModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: { isAvailable } },
        { new: true },
      )
      .populate('userId', 'firstName lastName email phone avatar');

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
   * Get featured professionals for landing page
   * Returns verified nurses with good ratings and photos
   */
  async getFeatured(limit = 3): Promise<{
    professionals: Array<{
      id: string;
      firstName: string;
      rating: number;
      specialty: string;
      photoUrl: string | null;
      verified: boolean;
      totalReviews: number;
    }>;
    stats: {
      totalProfessionals: number;
      totalServices: number;
      averageRating: number;
    };
  }> {
    // Get verified nurses with good ratings, ordered by rating
    const nurses = await this.nurseModel.aggregate([
      {
        $match: {
          isActive: true,
          isDeleted: { $ne: true },
          verificationStatus: 'approved',
          cepVerified: true,
          officialCepPhotoUrl: { $exists: true, $nin: [null, ''] },
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
        $sort: { averageRating: -1, totalReviews: -1 },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 1,
          firstName: '$user.firstName',
          rating: { $ifNull: ['$averageRating', 5.0] },
          specialty: { $arrayElemAt: ['$specialties', 0] },
          photoUrl: '$officialCepPhotoUrl',
          verified: '$cepVerified',
          totalReviews: { $ifNull: ['$totalReviews', 0] },
        },
      },
    ]);

    // Get aggregate stats
    const statsResult = await this.nurseModel.aggregate([
      {
        $match: {
          isActive: true,
          isDeleted: { $ne: true },
          verificationStatus: 'approved',
        },
      },
      {
        $group: {
          _id: null,
          totalProfessionals: { $sum: 1 },
          totalServices: { $sum: '$totalServicesCompleted' },
          avgRating: { $avg: '$averageRating' },
        },
      },
    ]);

    const stats = statsResult[0] || {
      totalProfessionals: 0,
      totalServices: 0,
      avgRating: 0,
    };

    return {
      professionals: nurses.map((n) => ({
        id: n._id.toString(),
        firstName: n.firstName || 'Profesional',
        rating: n.rating || 5.0,
        specialty: this.translateSpecialty(n.specialty),
        photoUrl: n.photoUrl,
        verified: n.verified || false,
        totalReviews: n.totalReviews || 0,
      })),
      stats: {
        totalProfessionals: stats.totalProfessionals || 0,
        totalServices: stats.totalServices || 0,
        averageRating: Math.round((stats.avgRating || 4.9) * 10) / 10,
      },
    };
  }

  /**
   * Translate specialty code to Spanish label
   */
  private translateSpecialty(specialty: string | null): string {
    const translations: Record<string, string> = {
      elderly_care: 'Geriatria',
      injection: 'Inyecciones',
      wound_care: 'Curaciones',
      vital_signs: 'Signos Vitales',
      iv_therapy: 'Terapia IV',
      catheter: 'Sondas',
      blood_draw: 'Toma de muestras',
      medication: 'Medicacion',
      post_surgery: 'Post-operatorio',
    };
    return translations[specialty || ''] || 'Cuidado general';
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

    // Check if this service request already has a review
    if (createReviewDto.serviceRequestId) {
      const existingReview = await this.nurseReviewModel.findOne({
        serviceRequestId: new Types.ObjectId(createReviewDto.serviceRequestId),
        isDeleted: { $ne: true },
      });

      if (existingReview) {
        throw new ConflictException('Este servicio ya tiene una reseña');
      }
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
      allowPublicUse: createReviewDto.allowPublicUse || false,
    });

    const savedReview = await review.save();

    // Update nurse's average rating and total reviews
    await this.recalculateNurseRating(nurseId);

    // Notify admins about negative reviews (1-2 stars)
    if (this.adminNotifications && createReviewDto.rating <= 2) {
      this.adminNotifications.notifyNegativeReview({
        id: (savedReview as any)._id.toString(),
        nurseName: nurse.cepRegisteredName || 'Enfermera',
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
      });
    }

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
    ratingDistribution: { stars: number; count: number }[];
  }> {
    const skip = (page - 1) * limit;
    const filter = { nurseId: new Types.ObjectId(nurseId), isDeleted: { $ne: true } };

    const [reviews, total, stats, distribution] = await Promise.all([
      this.nurseReviewModel
        .find(filter)
        .populate('patientId', 'firstName lastName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.nurseReviewModel.countDocuments(filter),
      this.nurseReviewModel.aggregate([
        { $match: filter },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      this.nurseReviewModel.aggregate([
        { $match: filter },
        { $group: { _id: { $round: ['$rating', 0] }, count: { $sum: 1 } } },
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

    // Build per-star distribution (5 → 1)
    const distMap = new Map<number, number>();
    for (const d of distribution) {
      distMap.set(d._id, d.count);
    }
    const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
      stars,
      count: distMap.get(stars) || 0,
    }));

    const actualAvg = Math.round((stats[0]?.avgRating || 0) * 10) / 10;
    const actualCount = stats[0]?.count || 0;

    // Auto-sync nurse profile stats if they diverged (e.g. from seed data)
    const nurse = await this.nurseModel.findById(nurseId).select('averageRating totalReviews').lean();
    if (nurse && (nurse.totalReviews !== actualCount || Math.abs((nurse.averageRating || 0) - actualAvg) > 0.05)) {
      await this.nurseModel.findByIdAndUpdate(nurseId, {
        $set: { averageRating: actualAvg, totalReviews: actualCount },
      });
    }

    return {
      reviews: mappedReviews as unknown as NurseReview[],
      total,
      page,
      limit,
      averageRating: actualAvg,
      totalReviews: actualCount,
      ratingDistribution,
    };
  }

  /**
   * Recalculate nurse's average rating based on all reviews
   */
  private async recalculateNurseRating(nurseId: string): Promise<void> {
    const stats = await this.nurseReviewModel.aggregate([
      { $match: { nurseId: new Types.ObjectId(nurseId), isDeleted: { $ne: true } } },
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
      isDeleted: { $ne: true },
    });

    if (!review) {
      throw new NotFoundException('Reseña no encontrada o no tienes permisos para eliminarla');
    }

    review.isDeleted = true;
    await review.save();

    // Recalculate nurse's rating
    await this.recalculateNurseRating(review.nurseId.toString());
  }

  /**
   * Get public testimonials (reviews with allowPublicUse opt-in)
   */
  async getPublicTestimonials(limit = 10): Promise<NurseReview[]> {
    return this.nurseReviewModel
      .find({
        allowPublicUse: true,
        isDeleted: { $ne: true },
        rating: { $gte: 4 },
        comment: { $exists: true, $ne: '' },
      })
      .populate('patientId', 'firstName lastName')
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }
}
