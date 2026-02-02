import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schema/user.schema';
import { Nurse } from '../nurses/schema/nurse.schema';
import { NurseVerification, VerificationStatus } from '../nurses/schema/nurse-verification.schema';
import { ReniecUsage } from '../nurses/schema/reniec-usage.schema';
import { ServiceRequest } from '../service-requests/schema/service-request.schema';
import { PanicAlert, PanicAlertStatus, PanicAlertLevel } from '../safety/schema/panic-alert.schema';
import { ServicePayment, ServicePaymentStatus } from '../service-payments/schema/service-payment.schema';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/admin-user.dto';
import {
  NurseQueryDto,
  UpdateNurseDto,
  PatientQueryDto,
} from './dto/admin-nurse.dto';
import {
  DashboardStatsDto,
  PanicAlertDto,
  ActivityItemDto,
  PendingVerificationDto,
  ServiceChartDataDto,
  LowRatedReviewDto,
  ExpiringVerificationDto,
} from './dto/dashboard.dto';
import { UserRole } from '../users/schema/user.schema';
import { sanitizeRegex } from '../common/utils/security.util';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Nurse.name) private nurseModel: Model<Nurse>,
    @InjectModel(NurseVerification.name) private nurseVerificationModel: Model<NurseVerification>,
    @InjectModel(ReniecUsage.name) private reniecUsageModel: Model<ReniecUsage>,
    @InjectModel(ServiceRequest.name) private serviceRequestModel: Model<ServiceRequest>,
    @InjectModel(PanicAlert.name) private panicAlertModel: Model<PanicAlert>,
    @InjectModel(ServicePayment.name) private servicePaymentModel: Model<ServicePayment>,
    private readonly uploadsService: UploadsService,
  ) {}

  async getUsers(query: UserQueryDto) {
    const { search, role, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { isDeleted: false };

    if (search) {
      const safeSearch = sanitizeRegex(search);
      filter.$or = [
        { firstName: { $regex: safeSearch, $options: 'i' } },
        { lastName: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (status) {
      filter.isActive = status === 'active';
    }

    // Get total count
    const total = await this.userModel.countDocuments(filter);

    // Get users
    const users = await this.userModel
      .find(filter)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Transform data
    const data = users.map((user) => {
      const userDoc = user as any;
      return {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.isActive ? 'active' : 'inactive',
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        authProvider: user.authProvider || 'local',
        avatar: user.avatar,
        lastLoginAt: user.lastLoginAt,
        createdAt: userDoc.createdAt,
        updatedAt: userDoc.updatedAt,
      };
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUser(id: string) {
    const user = await this.userModel
      .findOne({ _id: id, isDeleted: false })
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .exec();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const userDoc = user as any;
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.isActive ? 'active' : 'inactive',
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      authProvider: user.authProvider || 'local',
      avatar: user.avatar,
      lastLoginAt: user.lastLoginAt,
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt,
    };
  }

  async createUser(dto: CreateUserDto) {
    // Check if email exists
    const existingUser = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
      isDeleted: false,
    });

    if (existingUser) {
      throw new ConflictException('Este email ya está registrado');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = new this.userModel({
      ...dto,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      isActive: true,
      isEmailVerified: true, // Admin created users are verified
      authProvider: 'local',
    });

    await user.save();
    this.logger.log(`Admin created user: ${user.email}`);

    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      message: 'Usuario creado exitosamente',
    };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.userModel.findOne({ _id: id, isDeleted: false });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Check email uniqueness if changing email
    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existingUser = await this.userModel.findOne({
        email: dto.email.toLowerCase(),
        isDeleted: false,
        _id: { $ne: id },
      });

      if (existingUser) {
        throw new ConflictException('Este email ya está registrado');
      }
      dto.email = dto.email.toLowerCase();
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .select('-password -refreshToken');

    this.logger.log(`Admin updated user: ${updatedUser?.email}`);

    return {
      id: updatedUser?._id.toString(),
      firstName: updatedUser?.firstName,
      lastName: updatedUser?.lastName,
      email: updatedUser?.email,
      role: updatedUser?.role,
      isActive: updatedUser?.isActive,
      message: 'Usuario actualizado exitosamente',
    };
  }

  async deleteUser(id: string) {
    const user = await this.userModel.findOne({ _id: id, isDeleted: false });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Clean up Cloudinary assets for user avatar
    if (user.avatar && user.avatar.includes('cloudinary')) {
      try {
        await this.uploadsService.deleteUserAvatar(user.avatar);
        this.logger.log(`Deleted Cloudinary avatar for user ${user.email}`);
      } catch (error) {
        this.logger.warn(`Failed to delete avatar for user ${user.email}: ${error.message}`);
      }
    }

    // Check if user is a nurse and perform cascade delete
    const nurse = await this.nurseModel.findOne({ userId: id, isDeleted: { $ne: true } });
    if (nurse) {
      // Clean up Cloudinary assets for nurse (verification documents, selfies, etc.)
      try {
        const deleteResult = await this.uploadsService.deleteNurseFiles(String(nurse._id));
        if (deleteResult.deletedCount > 0) {
          this.logger.log(`Deleted ${deleteResult.deletedCount} Cloudinary files for nurse ${nurse.cepNumber}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to delete Cloudinary files for nurse ${nurse.cepNumber}: ${error.message}`);
      }

      // Cancel any pending verifications for this nurse
      const cancelledCount = await this.nurseVerificationModel.updateMany(
        {
          nurseId: nurse._id,
          status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
        },
        {
          $set: {
            status: VerificationStatus.REJECTED,
            rejectionReason: 'Usuario eliminado por administrador',
            reviewedAt: new Date(),
          },
        },
      );

      if (cancelledCount.modifiedCount > 0) {
        this.logger.log(`Cancelled ${cancelledCount.modifiedCount} pending verification(s) for deleted user ${user.email}`);
      }

      // Soft delete nurse profile and free up the CEP number
      await this.nurseModel.findByIdAndUpdate(nurse._id, {
        isActive: false,
        isAvailable: false,
        isDeleted: true,
        verificationStatus: VerificationStatus.REJECTED,
        cepNumber: `deleted_${Date.now()}_${nurse.cepNumber}`, // Free up CEP for reuse
      });

      this.logger.log(`Cascade deleted nurse profile: CEP ${nurse.cepNumber}`);
    }

    // Soft delete user
    await this.userModel.findByIdAndUpdate(id, {
      isDeleted: true,
      isActive: false,
      email: `deleted_${Date.now()}_${user.email}`, // Prevent email conflicts
    });

    this.logger.log(`Admin deleted user: ${user.email}`);

    return {
      message: 'Usuario eliminado exitosamente',
    };
  }

  async toggleUserStatus(id: string) {
    const user = await this.userModel.findOne({ _id: id, isDeleted: false });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.isActive = !user.isActive;
    await user.save();

    this.logger.log(`Admin toggled user status: ${user.email} -> ${user.isActive ? 'active' : 'inactive'}`);

    return {
      id: user._id.toString(),
      isActive: user.isActive,
      status: user.isActive ? 'active' : 'inactive',
      message: `Usuario ${user.isActive ? 'activado' : 'desactivado'} exitosamente`,
    };
  }

  async resetUserPassword(id: string) {
    const user = await this.userModel.findOne({ _id: id, isDeleted: false });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Generate temporary password
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await this.userModel.findByIdAndUpdate(id, { password: hashedPassword });

    this.logger.log(`Admin reset password for user: ${user.email}`);

    // In production, send email with temp password
    // For now, return it (only for development)
    return {
      message: 'Contraseña restablecida exitosamente',
      temporaryPassword: tempPassword, // Remove in production
    };
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // ==================== DASHBOARD METHODS ====================

  /**
   * Get consolidated dashboard statistics for Histora Care admin
   * Optimized with aggregation pipelines for fewer database round trips
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Optimized: Single aggregation for all nurse stats
    const nurseStatsAgg = await this.nurseModel.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          active: [{ $match: { isActive: true } }, { $count: 'count' }],
          available: [{ $match: { isAvailable: true, isActive: true } }, { $count: 'count' }],
          verified: [{ $match: { verificationStatus: VerificationStatus.APPROVED } }, { $count: 'count' }],
        },
      },
    ]);

    const nurseStats = nurseStatsAgg[0] || {};
    const totalNurses = nurseStats.total?.[0]?.count || 0;
    const activeNurses = nurseStats.active?.[0]?.count || 0;
    const availableNurses = nurseStats.available?.[0]?.count || 0;
    const verifiedNurses = nurseStats.verified?.[0]?.count || 0;

    // Verification pending count (separate collection)
    const pendingVerifications = await this.nurseVerificationModel.countDocuments({
      status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
    });

    // Optimized: Single aggregation for all service stats
    const serviceStatsAgg = await this.serviceRequestModel.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          pending: [{ $match: { status: 'pending' } }, { $count: 'count' }],
          accepted: [{ $match: { status: 'accepted' } }, { $count: 'count' }],
          inProgress: [{ $match: { status: 'in_progress' } }, { $count: 'count' }],
          completedToday: [
            { $match: { status: 'completed', completedAt: { $gte: startOfToday } } },
            { $count: 'count' },
          ],
          cancelledToday: [
            { $match: { status: 'cancelled', cancelledAt: { $gte: startOfToday } } },
            { $count: 'count' },
          ],
          weekStats: [
            { $match: { status: 'completed', completedAt: { $gte: startOfWeek } } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                revenue: { $sum: '$service.price' },
              },
            },
          ],
        },
      },
    ]);

    const serviceStats = serviceStatsAgg[0] || {};
    const totalServices = serviceStats.total?.[0]?.count || 0;
    const pendingServices = serviceStats.pending?.[0]?.count || 0;
    const acceptedServices = serviceStats.accepted?.[0]?.count || 0;
    const inProgressServices = serviceStats.inProgress?.[0]?.count || 0;
    const completedToday = serviceStats.completedToday?.[0]?.count || 0;
    const cancelledToday = serviceStats.cancelledToday?.[0]?.count || 0;
    const completedThisWeek = serviceStats.weekStats?.[0]?.count || 0;
    const revenueThisWeek = serviceStats.weekStats?.[0]?.revenue || 0;

    // Optimized: Single aggregation for panic alert stats
    const safetyStatsAgg = await this.panicAlertModel.aggregate([
      {
        $facet: {
          active: [
            {
              $match: {
                status: { $in: [PanicAlertStatus.ACTIVE, PanicAlertStatus.ACKNOWLEDGED, PanicAlertStatus.RESPONDING] },
              },
            },
            { $count: 'count' },
          ],
          emergencies: [
            {
              $match: {
                status: { $in: [PanicAlertStatus.ACTIVE, PanicAlertStatus.ACKNOWLEDGED] },
                level: PanicAlertLevel.EMERGENCY,
              },
            },
            { $count: 'count' },
          ],
          resolvedThisMonth: [
            { $match: { status: PanicAlertStatus.RESOLVED, resolvedAt: { $gte: startOfMonth } } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const safetyStats = safetyStatsAgg[0] || {};
    const activePanicAlerts = safetyStats.active?.[0]?.count || 0;
    const activeEmergencies = safetyStats.emergencies?.[0]?.count || 0;
    const resolvedThisMonth = safetyStats.resolvedThisMonth?.[0]?.count || 0;

    // Rating stats from service requests
    const ratingResult = await this.serviceRequestModel.aggregate([
      { $match: { rating: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          lowRated: {
            $sum: { $cond: [{ $lte: ['$rating', 2] }, 1, 0] },
          },
          excellent: {
            $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] },
          },
        },
      },
    ]);
    const ratings = ratingResult[0] || { averageRating: 0, totalReviews: 0, lowRated: 0, excellent: 0 };

    // RENIEC usage
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const reniecUsage = await this.reniecUsageModel.findOne({ year, month });
    const reniecStats = {
      used: reniecUsage?.queryCount || 0,
      limit: reniecUsage?.queryLimit || 100,
      remaining: Math.max(0, (reniecUsage?.queryLimit || 100) - (reniecUsage?.queryCount || 0)),
      provider: process.env.RENIEC_API_PROVIDER || 'decolecta',
    };

    return {
      nurses: {
        total: totalNurses,
        active: activeNurses,
        available: availableNurses,
        pendingVerification: pendingVerifications,
        verified: verifiedNurses,
      },
      services: {
        total: totalServices,
        pending: pendingServices,
        accepted: acceptedServices,
        inProgress: inProgressServices,
        completedToday,
        cancelledToday,
        completedThisWeek,
        revenueThisWeek,
      },
      safety: {
        activePanicAlerts,
        activeEmergencies,
        pendingIncidents: activePanicAlerts,
        resolvedThisMonth,
      },
      ratings: {
        averageRating: Math.round(ratings.averageRating * 10) / 10,
        totalReviews: ratings.totalReviews,
        lowRatedCount: ratings.lowRated,
        excellentCount: ratings.excellent,
      },
      reniec: reniecStats,
    };
  }

  /**
   * Get active panic alerts for immediate attention
   */
  async getActivePanicAlerts(): Promise<PanicAlertDto[]> {
    const alerts = await this.panicAlertModel
      .find({
        status: { $in: [PanicAlertStatus.ACTIVE, PanicAlertStatus.ACKNOWLEDGED, PanicAlertStatus.RESPONDING] },
      })
      .populate({
        path: 'nurseId',
        populate: { path: 'userId', select: 'firstName lastName avatar' },
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    return alerts.map((alert) => {
      const nurse = alert.nurseId as any;
      const user = nurse?.userId as any;
      return {
        id: (alert as any)._id.toString(),
        nurseId: nurse?._id?.toString() || '',
        nurseName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        nurseAvatar: user?.avatar || '',
        level: alert.level,
        status: alert.status,
        location: alert.location,
        message: alert.message,
        serviceRequestId: alert.serviceRequestId?.toString(),
        createdAt: (alert as any).createdAt,
        policeContacted: alert.policeContacted,
      };
    });
  }

  /**
   * Get recent activity feed for dashboard
   */
  async getRecentActivity(limit = 20): Promise<ActivityItemDto[]> {
    const activities: ActivityItemDto[] = [];
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get recent service requests
    const recentServices = await this.serviceRequestModel
      .find({ createdAt: { $gte: last24Hours } })
      .populate('patientId', 'firstName lastName')
      .populate({
        path: 'nurseId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    for (const service of recentServices) {
      const patient = service.patientId as any;
      const nurse = service.nurseId as any;
      const nurseUser = nurse?.userId as any;

      if (service.status === 'completed') {
        activities.push({
          id: `service_${(service as any)._id}`,
          type: 'service_completed',
          title: 'Servicio completado',
          description: `${nurseUser?.firstName || 'Enfermera'} completó servicio de ${service.service.name}`,
          timestamp: service.completedAt || (service as any).updatedAt,
          severity: 'info',
          actionUrl: `/admin/services/${(service as any)._id}`,
          metadata: { rating: service.rating },
        });
      } else if (service.status === 'cancelled') {
        activities.push({
          id: `cancel_${(service as any)._id}`,
          type: 'service_cancelled',
          title: 'Servicio cancelado',
          description: `${patient?.firstName || 'Paciente'} canceló servicio`,
          timestamp: service.cancelledAt || (service as any).updatedAt,
          severity: 'warning',
          actionUrl: `/admin/services/${(service as any)._id}`,
          metadata: { reason: service.cancellationReason },
        });
      } else if (service.status === 'pending') {
        activities.push({
          id: `new_${(service as any)._id}`,
          type: 'new_service_request',
          title: 'Nueva solicitud',
          description: `${patient?.firstName || 'Paciente'} solicitó ${service.service.name}`,
          timestamp: (service as any).createdAt,
          severity: 'info',
          actionUrl: `/admin/services/${(service as any)._id}`,
        });
      }
    }

    // Get recent verifications
    const recentVerifications = await this.nurseVerificationModel
      .find({
        $or: [
          { status: VerificationStatus.APPROVED, reviewedAt: { $gte: last24Hours } },
          { status: VerificationStatus.REJECTED, reviewedAt: { $gte: last24Hours } },
          { status: VerificationStatus.PENDING, createdAt: { $gte: last24Hours } },
        ],
      })
      .populate({
        path: 'nurseId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .sort({ updatedAt: -1 })
      .limit(10)
      .exec();

    for (const verification of recentVerifications) {
      const nurse = verification.nurseId as any;
      const user = nurse?.userId as any;
      const nurseName = user ? `${user.firstName} ${user.lastName}` : 'Enfermera';

      if (verification.status === VerificationStatus.APPROVED) {
        activities.push({
          id: `verified_${(verification as any)._id}`,
          type: 'verification_approved',
          title: 'Verificación aprobada',
          description: `${nurseName} fue verificada`,
          timestamp: verification.reviewedAt || (verification as any).updatedAt,
          severity: 'info',
          actionUrl: `/admin/verifications/${(verification as any)._id}`,
        });
      } else if (verification.status === VerificationStatus.REJECTED) {
        activities.push({
          id: `rejected_${(verification as any)._id}`,
          type: 'verification_rejected',
          title: 'Verificación rechazada',
          description: `${nurseName}: ${verification.rejectionReason || 'Sin razón'}`,
          timestamp: verification.reviewedAt || (verification as any).updatedAt,
          severity: 'warning',
          actionUrl: `/admin/verifications/${(verification as any)._id}`,
        });
      } else if (verification.status === VerificationStatus.PENDING) {
        activities.push({
          id: `pending_${(verification as any)._id}`,
          type: 'new_verification',
          title: 'Nueva verificación pendiente',
          description: `${nurseName} envió documentos`,
          timestamp: (verification as any).createdAt,
          severity: 'info',
          actionUrl: `/admin/verifications/${(verification as any)._id}`,
        });
      }
    }

    // Get recent panic alerts
    const recentAlerts = await this.panicAlertModel
      .find({ createdAt: { $gte: last24Hours } })
      .populate({
        path: 'nurseId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    for (const alert of recentAlerts) {
      const nurse = alert.nurseId as any;
      const user = nurse?.userId as any;
      const nurseName = user ? `${user.firstName} ${user.lastName}` : 'Enfermera';

      activities.push({
        id: `panic_${(alert as any)._id}`,
        type: 'panic_alert',
        title: alert.level === PanicAlertLevel.EMERGENCY ? '🚨 EMERGENCIA' : '⚠️ Alerta de ayuda',
        description: `${nurseName}: ${alert.message || 'Necesita asistencia'}`,
        timestamp: (alert as any).createdAt,
        severity: alert.level === PanicAlertLevel.EMERGENCY ? 'critical' : 'warning',
        actionUrl: `/admin/safety/alerts/${(alert as any)._id}`,
        metadata: { status: alert.status, location: alert.location },
      });
    }

    // Get low rated reviews
    const lowRatedServices = await this.serviceRequestModel
      .find({
        rating: { $lte: 2 },
        reviewedAt: { $gte: last24Hours },
      })
      .populate('patientId', 'firstName lastName')
      .populate({
        path: 'nurseId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .sort({ reviewedAt: -1 })
      .limit(5)
      .exec();

    for (const service of lowRatedServices) {
      const patient = service.patientId as any;
      const nurse = service.nurseId as any;
      const nurseUser = nurse?.userId as any;

      activities.push({
        id: `review_${(service as any)._id}`,
        type: 'low_review',
        title: `⭐ Reseña ${service.rating}/5`,
        description: `${patient?.firstName || 'Paciente'} calificó a ${nurseUser?.firstName || 'Enfermera'}`,
        timestamp: service.reviewedAt || (service as any).updatedAt,
        severity: 'warning',
        actionUrl: `/admin/services/${(service as any)._id}`,
        metadata: { rating: service.rating, review: service.review },
      });
    }

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get pending verifications with waiting time
   * Filters out verifications for deleted users
   */
  async getPendingVerifications(): Promise<PendingVerificationDto[]> {
    const verifications = await this.nurseVerificationModel
      .find({
        status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
      })
      .populate({
        path: 'nurseId',
        populate: { path: 'userId', select: 'firstName lastName avatar isDeleted' },
      })
      .sort({ createdAt: 1 }) // Oldest first (longest waiting)
      .limit(50) // Fetch more to account for filtering
      .exec();

    const now = new Date();

    // Filter out verifications where the user has been deleted
    const activeVerifications = verifications.filter((v) => {
      const nurse = v.nurseId as any;
      const user = nurse?.userId as any;
      // Exclude if user is deleted or doesn't exist
      return user && !user.isDeleted;
    });

    return activeVerifications.slice(0, 20).map((v) => {
      const nurse = v.nurseId as any;
      const user = nurse?.userId as any;
      const createdAt = (v as any).createdAt;
      const waitingDays = Math.floor((now.getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: (v as any)._id.toString(),
        nurseId: nurse?._id?.toString() || '',
        nurseName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        nurseAvatar: user?.avatar || '',
        cepNumber: nurse?.cepNumber || '',
        dniNumber: v.dniNumber || '',
        status: v.status,
        waitingDays,
        createdAt,
        hasCepValidation: !!v.cepValidation?.isValid,
        cepPhotoUrl: v.officialCepPhotoUrl,
      };
    });
  }

  /**
   * Get service chart data for last 7 days
   * Optimized: Single aggregation query instead of 21 separate queries
   */
  async getServiceChartData(): Promise<ServiceChartDataDto[]> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startOfPeriod = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate());

    // Single aggregation for all 7 days of data
    const chartAgg = await this.serviceRequestModel.aggregate([
      {
        $match: {
          $or: [
            { status: 'completed', completedAt: { $gte: startOfPeriod } },
            { status: 'cancelled', cancelledAt: { $gte: startOfPeriod } },
          ],
        },
      },
      {
        $project: {
          status: 1,
          'service.price': 1,
          dateKey: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $ifNull: ['$completedAt', '$cancelledAt'] },
            },
          },
        },
      },
      {
        $group: {
          _id: { date: '$dateKey', status: '$status' },
          count: { $sum: 1 },
          revenue: { $sum: '$service.price' },
        },
      },
    ]);

    // Build result map for all 7 days
    const dataMap = new Map<string, { completed: number; cancelled: number; revenue: number }>();

    // Initialize all 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        .toISOString()
        .split('T')[0];
      dataMap.set(dateKey, { completed: 0, cancelled: 0, revenue: 0 });
    }

    // Fill in data from aggregation
    for (const row of chartAgg) {
      const dateKey = row._id.date;
      const status = row._id.status;
      const current = dataMap.get(dateKey);
      if (current) {
        if (status === 'completed') {
          current.completed = row.count;
          current.revenue = row.revenue || 0;
        } else if (status === 'cancelled') {
          current.cancelled = row.count;
        }
      }
    }

    // Convert to array sorted by date
    return Array.from(dataMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        completed: data.completed,
        cancelled: data.cancelled,
        revenue: data.revenue,
      }));
  }

  /**
   * Get low rated reviews that need attention
   */
  async getLowRatedReviews(): Promise<LowRatedReviewDto[]> {
    const services = await this.serviceRequestModel
      .find({
        rating: { $lte: 2 },
        review: { $exists: true, $ne: '' },
      })
      .populate('patientId', 'firstName lastName')
      .populate({
        path: 'nurseId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .sort({ reviewedAt: -1 })
      .limit(20)
      .exec();

    return services.map((s) => {
      const patient = s.patientId as any;
      const nurse = s.nurseId as any;
      const nurseUser = nurse?.userId as any;

      return {
        id: (s as any)._id.toString(),
        serviceRequestId: (s as any)._id.toString(),
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Anónimo',
        nurseName: nurseUser ? `${nurseUser.firstName} ${nurseUser.lastName}` : 'Unknown',
        rating: s.rating,
        review: s.review || '',
        reviewedAt: s.reviewedAt || (s as any).updatedAt,
        hasResponse: false, // TODO: implement nurse responses to reviews
      };
    });
  }

  /**
   * Get nurses with verification expiring soon (monthly re-validation)
   */
  async getExpiringVerifications(): Promise<ExpiringVerificationDto[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find nurses verified more than 23 days ago (expiring in ~7 days)
    const expiringNurses = await this.nurseModel
      .find({
        verificationStatus: VerificationStatus.APPROVED,
        cepVerifiedAt: { $lte: thirtyDaysAgo },
      })
      .populate('userId', 'firstName lastName')
      .limit(20)
      .exec();

    const now = new Date();

    return Promise.all(
      expiringNurses.map(async (nurse) => {
        const user = nurse.userId as any;
        const daysSinceVerified = Math.floor(
          (now.getTime() - new Date(nurse.cepVerifiedAt!).getTime()) / (1000 * 60 * 60 * 24),
        );
        const daysUntilExpiry = Math.max(0, 30 - daysSinceVerified);

        // Check if nurse has active services
        const activeServices = await this.serviceRequestModel.countDocuments({
          nurseId: nurse._id,
          status: { $in: ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress'] },
        });

        return {
          nurseId: (nurse as any)._id.toString(),
          nurseName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          cepNumber: nurse.cepNumber,
          lastVerifiedAt: nurse.cepVerifiedAt!,
          daysUntilExpiry,
          hasActiveServices: activeServices > 0,
        };
      }),
    );
  }

  // ==================== NURSE MANAGEMENT METHODS ====================

  /**
   * Get all nurses with filters and pagination
   */
  async getNurses(query: NurseQueryDto) {
    const { search, verificationStatus, status, availability, district, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // Build filter - exclude deleted nurses
    const filter: any = { isDeleted: { $ne: true } };

    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }

    if (status) {
      filter.isActive = status === 'active';
    }

    if (availability) {
      filter.isAvailable = availability === 'available';
    }

    if (district) {
      filter['location.district'] = { $regex: sanitizeRegex(district), $options: 'i' };
    }

    // Get nurses with user info
    let nurses = await this.nurseModel
      .find(filter)
      .populate('userId', 'firstName lastName email phone avatar isActive isDeleted')
      .sort({ createdAt: -1 })
      .exec();

    // Filter out nurses where the user has been deleted or doesn't exist
    nurses = nurses.filter((nurse) => {
      const user = nurse.userId as any;
      // Exclude if user is null (hard-deleted) or if user is soft-deleted
      return user && !user.isDeleted;
    });

    // Apply search filter on populated fields
    if (search) {
      const searchLower = search.toLowerCase();
      nurses = nurses.filter((nurse) => {
        const user = nurse.userId as any;
        const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase();
        const email = (user?.email || '').toLowerCase();
        const cep = nurse.cepNumber.toLowerCase();
        return fullName.includes(searchLower) || email.includes(searchLower) || cep.includes(searchLower);
      });
    }

    // Get total and paginate
    const total = nurses.length;
    const paginatedNurses = nurses.slice(skip, skip + limit);

    // Transform data
    const data = paginatedNurses.map((nurse) => {
      const user = nurse.userId as any;
      return {
        id: (nurse as any)._id.toString(),
        userId: user?._id?.toString(),
        cepNumber: nurse.cepNumber,
        cepVerified: nurse.cepVerified,
        cepVerifiedAt: nurse.cepVerifiedAt,
        officialCepPhotoUrl: nurse.officialCepPhotoUrl,
        verificationStatus: nurse.verificationStatus,
        specialties: nurse.specialties,
        bio: nurse.bio,
        yearsOfExperience: nurse.yearsOfExperience,
        serviceRadius: nurse.serviceRadius,
        isAvailable: nurse.isAvailable,
        isActive: nurse.isActive,
        averageRating: nurse.averageRating,
        totalReviews: nurse.totalReviews,
        totalServicesCompleted: nurse.totalServicesCompleted,
        user: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          isActive: user.isActive,
        } : null,
        location: nurse.location ? {
          address: nurse.location.address,
          district: nurse.location.district,
          city: nurse.location.city,
        } : null,
        createdAt: (nurse as any).createdAt,
        updatedAt: (nurse as any).updatedAt,
      };
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single nurse detail
   */
  async getNurse(id: string) {
    const nurse = await this.nurseModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('userId', 'firstName lastName email phone avatar isActive lastLoginAt createdAt')
      .exec();

    if (!nurse) {
      throw new NotFoundException('Enfermera no encontrada');
    }

    // Get verification info
    const verification = await this.nurseVerificationModel
      .findOne({ nurseId: id })
      .sort({ createdAt: -1 })
      .exec();

    // Get service stats
    const [totalServices, completedServices, cancelledServices, activeServices] = await Promise.all([
      this.serviceRequestModel.countDocuments({ nurseId: id }),
      this.serviceRequestModel.countDocuments({ nurseId: id, status: 'completed' }),
      this.serviceRequestModel.countDocuments({ nurseId: id, status: 'cancelled' }),
      this.serviceRequestModel.countDocuments({
        nurseId: id,
        status: { $in: ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress'] },
      }),
    ]);

    const user = nurse.userId as any;

    return {
      id: (nurse as any)._id.toString(),
      userId: user?._id?.toString(),
      cepNumber: nurse.cepNumber,
      cepVerified: nurse.cepVerified,
      cepVerifiedAt: nurse.cepVerifiedAt,
      officialCepPhotoUrl: nurse.officialCepPhotoUrl,
      selfieUrl: nurse.selfieUrl,
      verificationStatus: nurse.verificationStatus,
      specialties: nurse.specialties,
      bio: nurse.bio,
      yearsOfExperience: nurse.yearsOfExperience,
      services: nurse.services,
      serviceRadius: nurse.serviceRadius,
      extraChargePerKm: nurse.extraChargePerKm,
      minimumServiceFee: nurse.minimumServiceFee,
      availableFrom: nurse.availableFrom,
      availableTo: nurse.availableTo,
      availableDays: nurse.availableDays,
      isAvailable: nurse.isAvailable,
      isActive: nurse.isActive,
      averageRating: nurse.averageRating,
      totalReviews: nurse.totalReviews,
      totalServicesCompleted: nurse.totalServicesCompleted,
      user: user ? {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      } : null,
      location: nurse.location ? {
        coordinates: nurse.location.coordinates,
        address: nurse.location.address,
        district: nurse.location.district,
        city: nurse.location.city,
      } : null,
      verification: verification ? {
        id: (verification as any)._id.toString(),
        status: verification.status,
        dniNumber: verification.dniNumber,
        fullNameOnDni: verification.fullNameOnDni,
        cepValidation: verification.cepValidation,
        reviewNotes: verification.reviewNotes,
        rejectionReason: verification.rejectionReason,
        attemptNumber: verification.attemptNumber,
        createdAt: (verification as any).createdAt,
        reviewedAt: verification.reviewedAt,
      } : null,
      stats: {
        totalServices,
        completedServices,
        cancelledServices,
        activeServices,
        completionRate: totalServices > 0 ? Math.round((completedServices / totalServices) * 100) : 0,
      },
      createdAt: (nurse as any).createdAt,
      updatedAt: (nurse as any).updatedAt,
    };
  }

  /**
   * Update nurse profile (admin)
   */
  async updateNurse(id: string, dto: UpdateNurseDto) {
    const nurse = await this.nurseModel.findById(id);

    if (!nurse) {
      throw new NotFoundException('Enfermera no encontrada');
    }

    const updatedNurse = await this.nurseModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('userId', 'firstName lastName email');

    this.logger.log(`Admin updated nurse: ${updatedNurse?.cepNumber}`);

    const user = updatedNurse?.userId as any;

    return {
      id: (updatedNurse as any)._id.toString(),
      cepNumber: updatedNurse?.cepNumber,
      nurseName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      isActive: updatedNurse?.isActive,
      isAvailable: updatedNurse?.isAvailable,
      message: 'Enfermera actualizada exitosamente',
    };
  }

  /**
   * Toggle nurse active status
   */
  async toggleNurseStatus(id: string) {
    const nurse = await this.nurseModel.findById(id);

    if (!nurse) {
      throw new NotFoundException('Enfermera no encontrada');
    }

    nurse.isActive = !nurse.isActive;
    if (!nurse.isActive) {
      nurse.isAvailable = false; // If deactivated, also set unavailable
    }
    await nurse.save();

    this.logger.log(`Admin toggled nurse status: ${nurse.cepNumber} -> ${nurse.isActive ? 'active' : 'inactive'}`);

    return {
      id: (nurse as any)._id.toString(),
      cepNumber: nurse.cepNumber,
      isActive: nurse.isActive,
      isAvailable: nurse.isAvailable,
      message: `Enfermera ${nurse.isActive ? 'activada' : 'desactivada'} exitosamente`,
    };
  }

  /**
   * Toggle nurse availability
   */
  async toggleNurseAvailability(id: string) {
    const nurse = await this.nurseModel.findById(id);

    if (!nurse) {
      throw new NotFoundException('Enfermera no encontrada');
    }

    if (!nurse.isActive) {
      throw new ConflictException('No se puede cambiar disponibilidad de una enfermera inactiva');
    }

    nurse.isAvailable = !nurse.isAvailable;
    await nurse.save();

    this.logger.log(`Admin toggled nurse availability: ${nurse.cepNumber} -> ${nurse.isAvailable ? 'available' : 'unavailable'}`);

    return {
      id: (nurse as any)._id.toString(),
      cepNumber: nurse.cepNumber,
      isAvailable: nurse.isAvailable,
      message: `Enfermera marcada como ${nurse.isAvailable ? 'disponible' : 'no disponible'}`,
    };
  }

  /**
   * Delete nurse (soft delete - deactivate user and nurse, free up CEP)
   */
  async deleteNurse(id: string) {
    const nurse = await this.nurseModel.findOne({ _id: id, isDeleted: { $ne: true } });

    if (!nurse) {
      throw new NotFoundException('Enfermera no encontrada');
    }

    // Check for active services
    const activeServices = await this.serviceRequestModel.countDocuments({
      nurseId: id,
      status: { $in: ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress'] },
    });

    if (activeServices > 0) {
      throw new ConflictException(`No se puede eliminar: tiene ${activeServices} servicio(s) activo(s)`);
    }

    // Get user email before deleting for logging
    const user = await this.userModel.findById(nurse.userId);
    const userEmail = user?.email || 'unknown';
    const originalCep = nurse.cepNumber;

    // Cancel any pending verifications
    await this.nurseVerificationModel.updateMany(
      {
        nurseId: nurse._id,
        status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
      },
      {
        $set: {
          status: VerificationStatus.REJECTED,
          rejectionReason: 'Enfermera eliminada por administrador',
          reviewedAt: new Date(),
        },
      },
    );

    // Soft delete nurse profile and free up CEP number
    await this.nurseModel.findByIdAndUpdate(id, {
      isActive: false,
      isAvailable: false,
      isDeleted: true,
      verificationStatus: VerificationStatus.REJECTED,
      cepNumber: `deleted_${Date.now()}_${nurse.cepNumber}`, // Free up CEP for reuse
    });

    // Soft delete user
    if (user) {
      await this.userModel.findByIdAndUpdate(nurse.userId, {
        isActive: false,
        isDeleted: true,
        email: `deleted_${Date.now()}_${user.email}`, // Free up email for reuse
      });
    }

    this.logger.log(`Admin deleted nurse: ${originalCep} (${userEmail})`);

    return {
      message: 'Enfermera eliminada exitosamente',
    };
  }

  // ==================== PATIENT MANAGEMENT METHODS ====================

  /**
   * Get all patients (users with role PATIENT) with filters and pagination
   */
  async getPatients(query: PatientQueryDto) {
    const { search, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // Build filter for patients only
    const filter: any = {
      role: UserRole.PATIENT,
      isDeleted: { $ne: true },
    };

    if (search) {
      const safeSearch = sanitizeRegex(search);
      filter.$or = [
        { firstName: { $regex: safeSearch, $options: 'i' } },
        { lastName: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    if (status) {
      filter.isActive = status === 'active';
    }

    // Get total count
    const total = await this.userModel.countDocuments(filter);

    // Get patients
    const patients = await this.userModel
      .find(filter)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Get service stats for each patient
    const data = await Promise.all(
      patients.map(async (patient) => {
        const [totalRequested, totalCompleted, lastService] = await Promise.all([
          this.serviceRequestModel.countDocuments({ patientId: patient._id }),
          this.serviceRequestModel.countDocuments({ patientId: patient._id, status: 'completed' }),
          this.serviceRequestModel
            .findOne({ patientId: patient._id })
            .sort({ createdAt: -1 })
            .select('createdAt')
            .exec(),
        ]);

        return {
          id: patient._id.toString(),
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          phone: patient.phone,
          avatar: patient.avatar,
          isActive: patient.isActive,
          isEmailVerified: patient.isEmailVerified,
          authProvider: patient.authProvider || 'local',
          totalServicesRequested: totalRequested,
          totalServicesCompleted: totalCompleted,
          createdAt: (patient as any).createdAt,
          lastServiceAt: lastService ? (lastService as any).createdAt : null,
        };
      }),
    );

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single patient detail
   */
  async getPatient(id: string) {
    const patient = await this.userModel
      .findOne({ _id: id, role: UserRole.PATIENT, isDeleted: { $ne: true } })
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .exec();

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Get service history
    const [totalRequested, totalCompleted, totalCancelled, recentServices] = await Promise.all([
      this.serviceRequestModel.countDocuments({ patientId: id }),
      this.serviceRequestModel.countDocuments({ patientId: id, status: 'completed' }),
      this.serviceRequestModel.countDocuments({ patientId: id, status: 'cancelled' }),
      this.serviceRequestModel
        .find({ patientId: id })
        .populate({
          path: 'nurseId',
          populate: { path: 'userId', select: 'firstName lastName' },
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .exec(),
    ]);

    return {
      id: patient._id.toString(),
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      avatar: patient.avatar,
      isActive: patient.isActive,
      isEmailVerified: patient.isEmailVerified,
      authProvider: patient.authProvider || 'local',
      createdAt: (patient as any).createdAt,
      updatedAt: (patient as any).updatedAt,
      lastLoginAt: patient.lastLoginAt,
      stats: {
        totalServicesRequested: totalRequested,
        totalServicesCompleted: totalCompleted,
        totalServicesCancelled: totalCancelled,
      },
      recentServices: recentServices.map((s) => {
        const nurse = s.nurseId as any;
        const nurseUser = nurse?.userId as any;
        return {
          id: (s as any)._id.toString(),
          serviceName: s.service.name,
          status: s.status,
          nurseName: nurseUser ? `${nurseUser.firstName} ${nurseUser.lastName}` : null,
          rating: s.rating,
          createdAt: (s as any).createdAt,
          completedAt: s.completedAt,
        };
      }),
    };
  }

  /**
   * Toggle patient active status
   */
  async togglePatientStatus(id: string) {
    const patient = await this.userModel.findOne({
      _id: id,
      role: UserRole.PATIENT,
      isDeleted: { $ne: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    patient.isActive = !patient.isActive;
    await patient.save();

    this.logger.log(`Admin toggled patient status: ${patient.email} -> ${patient.isActive ? 'active' : 'inactive'}`);

    return {
      id: patient._id.toString(),
      isActive: patient.isActive,
      status: patient.isActive ? 'active' : 'inactive',
      message: `Paciente ${patient.isActive ? 'activado' : 'desactivado'} exitosamente`,
    };
  }

  /**
   * Delete patient (soft delete)
   */
  async deletePatient(id: string) {
    const patient = await this.userModel.findOne({
      _id: id,
      role: UserRole.PATIENT,
      isDeleted: { $ne: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Check for active services
    const activeServices = await this.serviceRequestModel.countDocuments({
      patientId: id,
      status: { $in: ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress'] },
    });

    if (activeServices > 0) {
      throw new ConflictException(`No se puede eliminar: tiene ${activeServices} servicio(s) activo(s)`);
    }

    // Soft delete user
    await this.userModel.findByIdAndUpdate(id, {
      isDeleted: true,
      isActive: false,
      email: `deleted_${Date.now()}_${patient.email}`, // Free up email for reuse
    });

    this.logger.log(`Admin deleted patient: ${patient.email}`);

    return {
      message: 'Paciente eliminado exitosamente',
    };
  }

  // ==================== SERVICE REQUEST MANAGEMENT METHODS ====================

  /**
   * Get all service requests with filters and pagination
   */
  async getServiceRequests(query: any) {
    const {
      search,
      status,
      paymentStatus,
      category,
      district,
      dateFrom,
      dateTo,
      minRating,
      maxRating,
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (category) {
      filter['service.category'] = category;
    }

    if (district) {
      filter['location.district'] = { $regex: sanitizeRegex(district), $options: 'i' };
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    if (minRating !== undefined || maxRating !== undefined) {
      filter.rating = {};
      if (minRating !== undefined) {
        filter.rating.$gte = minRating;
      }
      if (maxRating !== undefined) {
        filter.rating.$lte = maxRating;
      }
    }

    // Get total count
    let total = await this.serviceRequestModel.countDocuments(filter);

    // Get service requests with populated data
    let serviceRequests = await this.serviceRequestModel
      .find(filter)
      .populate('patientId', 'firstName lastName email phone avatar')
      .populate({
        path: 'nurseId',
        populate: { path: 'userId', select: 'firstName lastName avatar phone' },
      })
      .sort({ createdAt: -1 })
      .exec();

    // Apply search filter on populated fields (patient/nurse name, service name)
    if (search) {
      const searchLower = search.toLowerCase();
      serviceRequests = serviceRequests.filter((sr) => {
        const patient = sr.patientId as any;
        const nurse = sr.nurseId as any;
        const nurseUser = nurse?.userId as any;

        const patientName = `${patient?.firstName || ''} ${patient?.lastName || ''}`.toLowerCase();
        const nurseName = `${nurseUser?.firstName || ''} ${nurseUser?.lastName || ''}`.toLowerCase();
        const serviceName = sr.service.name.toLowerCase();
        const cepNumber = nurse?.cepNumber?.toLowerCase() || '';

        return (
          patientName.includes(searchLower) ||
          nurseName.includes(searchLower) ||
          serviceName.includes(searchLower) ||
          cepNumber.includes(searchLower)
        );
      });
      total = serviceRequests.length;
    }

    // Paginate
    const paginatedRequests = serviceRequests.slice(skip, skip + limit);

    // Transform data
    const data = paginatedRequests.map((sr) => {
      const patient = sr.patientId as any;
      const nurse = sr.nurseId as any;
      const nurseUser = nurse?.userId as any;

      return {
        id: (sr as any)._id.toString(),
        status: sr.status,
        paymentStatus: sr.paymentStatus,
        service: {
          name: sr.service.name,
          category: sr.service.category,
          price: sr.service.price,
          currency: sr.service.currency || 'PEN',
        },
        patient: patient
          ? {
              id: patient._id.toString(),
              firstName: patient.firstName,
              lastName: patient.lastName,
              avatar: patient.avatar,
            }
          : null,
        nurse: nurse
          ? {
              id: (nurse as any)._id.toString(),
              firstName: nurseUser?.firstName || '',
              lastName: nurseUser?.lastName || '',
              cepNumber: nurse.cepNumber,
              avatar: nurseUser?.avatar,
            }
          : null,
        location: {
          district: sr.location.district,
          city: sr.location.city,
          address: sr.location.address,
        },
        requestedDate: sr.requestedDate,
        requestedTimeSlot: sr.requestedTimeSlot,
        rating: sr.rating,
        createdAt: (sr as any).createdAt,
        completedAt: sr.completedAt,
        cancelledAt: sr.cancelledAt,
      };
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single service request detail
   */
  async getServiceRequest(id: string) {
    const sr = await this.serviceRequestModel
      .findById(id)
      .populate('patientId', 'firstName lastName email phone avatar')
      .populate({
        path: 'nurseId',
        populate: { path: 'userId', select: 'firstName lastName avatar phone email' },
      })
      .exec();

    if (!sr) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }

    const patient = sr.patientId as any;
    const nurse = sr.nurseId as any;
    const nurseUser = nurse?.userId as any;

    return {
      id: (sr as any)._id.toString(),
      status: sr.status,
      paymentStatus: sr.paymentStatus,
      paymentMethod: sr.paymentMethod,
      paymentId: sr.paymentId,
      service: {
        name: sr.service.name,
        category: sr.service.category,
        price: sr.service.price,
        currency: sr.service.currency || 'PEN',
        durationMinutes: sr.service.durationMinutes || 60,
      },
      patient: patient
        ? {
            id: patient._id.toString(),
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
            phone: patient.phone,
            avatar: patient.avatar,
          }
        : null,
      nurse: nurse
        ? {
            id: (nurse as any)._id.toString(),
            userId: nurseUser?._id?.toString(),
            firstName: nurseUser?.firstName || '',
            lastName: nurseUser?.lastName || '',
            cepNumber: nurse.cepNumber,
            phone: nurseUser?.phone,
            avatar: nurseUser?.avatar,
            averageRating: nurse.averageRating || 0,
          }
        : null,
      location: {
        coordinates: sr.location.coordinates,
        address: sr.location.address,
        reference: sr.location.reference,
        district: sr.location.district,
        city: sr.location.city,
      },
      requestedDate: sr.requestedDate,
      requestedTimeSlot: sr.requestedTimeSlot,
      scheduledAt: sr.scheduledAt,
      patientNotes: sr.patientNotes,
      nurseNotes: sr.nurseNotes,
      rating: sr.rating,
      review: sr.review,
      reviewedAt: sr.reviewedAt,
      completedAt: sr.completedAt,
      cancelledAt: sr.cancelledAt,
      cancellationReason: sr.cancellationReason,
      statusHistory: sr.statusHistory.map((sh) => ({
        status: sh.status,
        changedAt: sh.changedAt,
        changedBy: sh.changedBy?.toString(),
        note: sh.note,
      })),
      createdAt: (sr as any).createdAt,
      updatedAt: (sr as any).updatedAt,
    };
  }

  /**
   * Get service analytics
   */
  async getServiceAnalytics() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Summary stats
    const summaryAgg = await this.serviceRequestModel.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          pending: [{ $match: { status: 'pending' } }, { $count: 'count' }],
          inProgress: [
            { $match: { status: { $in: ['accepted', 'on_the_way', 'arrived', 'in_progress'] } } },
            { $count: 'count' },
          ],
          completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
          cancelled: [{ $match: { status: 'cancelled' } }, { $count: 'count' }],
          rejected: [{ $match: { status: 'rejected' } }, { $count: 'count' }],
        },
      },
    ]);

    const summary = summaryAgg[0] || {};

    // Revenue stats
    const revenueAgg = await this.serviceRequestModel.aggregate([
      {
        $facet: {
          total: [
            { $match: { status: 'completed' } },
            { $group: { _id: null, sum: { $sum: '$service.price' } } },
          ],
          thisWeek: [
            { $match: { status: 'completed', completedAt: { $gte: startOfWeek } } },
            { $group: { _id: null, sum: { $sum: '$service.price' } } },
          ],
          thisMonth: [
            { $match: { status: 'completed', completedAt: { $gte: startOfMonth } } },
            { $group: { _id: null, sum: { $sum: '$service.price' } } },
          ],
          pending: [
            { $match: { paymentStatus: 'pending', status: { $ne: 'cancelled' } } },
            { $group: { _id: null, sum: { $sum: '$service.price' } } },
          ],
          paid: [
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, sum: { $sum: '$service.price' } } },
          ],
          refunded: [
            { $match: { paymentStatus: 'refunded' } },
            { $group: { _id: null, sum: { $sum: '$service.price' } } },
          ],
        },
      },
    ]);

    const revenue = revenueAgg[0] || {};

    // Performance stats
    const performanceAgg = await this.serviceRequestModel.aggregate([
      {
        $facet: {
          ratings: [
            { $match: { rating: { $exists: true, $ne: null } } },
            { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
          ],
          completionRate: [
            { $match: { status: { $in: ['completed', 'cancelled', 'rejected'] } } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
              },
            },
          ],
          responseTime: [
            { $match: { status: { $in: ['accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'] } } },
            {
              $project: {
                responseMinutes: {
                  $divide: [
                    { $subtract: [{ $arrayElemAt: ['$statusHistory.changedAt', 1] }, '$createdAt'] },
                    60000,
                  ],
                },
              },
            },
            { $group: { _id: null, avg: { $avg: '$responseMinutes' } } },
          ],
        },
      },
    ]);

    const performance = performanceAgg[0] || {};
    const completionData = performance.completionRate?.[0] || { total: 0, completed: 0, cancelled: 0 };

    // By category
    const byCategory = await this.serviceRequestModel.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$service.category',
          count: { $sum: 1 },
          revenue: { $sum: '$service.price' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // By district
    const byDistrict = await this.serviceRequestModel.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$location.district',
          count: { $sum: 1 },
          revenue: { $sum: '$service.price' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // By time slot
    const byTimeSlot = await this.serviceRequestModel.aggregate([
      {
        $group: {
          _id: '$requestedTimeSlot',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      summary: {
        total: summary.total?.[0]?.count || 0,
        pending: summary.pending?.[0]?.count || 0,
        inProgress: summary.inProgress?.[0]?.count || 0,
        completed: summary.completed?.[0]?.count || 0,
        cancelled: summary.cancelled?.[0]?.count || 0,
        rejected: summary.rejected?.[0]?.count || 0,
      },
      revenue: {
        total: revenue.total?.[0]?.sum || 0,
        thisWeek: revenue.thisWeek?.[0]?.sum || 0,
        thisMonth: revenue.thisMonth?.[0]?.sum || 0,
        pending: revenue.pending?.[0]?.sum || 0,
        paid: revenue.paid?.[0]?.sum || 0,
        refunded: revenue.refunded?.[0]?.sum || 0,
      },
      performance: {
        averageRating: Math.round((performance.ratings?.[0]?.avg || 0) * 10) / 10,
        completionRate:
          completionData.total > 0
            ? Math.round((completionData.completed / completionData.total) * 100)
            : 0,
        cancellationRate:
          completionData.total > 0
            ? Math.round((completionData.cancelled / completionData.total) * 100)
            : 0,
        averageResponseTime: Math.round(performance.responseTime?.[0]?.avg || 0),
      },
      byCategory: byCategory.map((c) => ({
        category: c._id,
        count: c.count,
        revenue: c.revenue,
      })),
      byDistrict: byDistrict.map((d) => ({
        district: d._id,
        count: d.count,
        revenue: d.revenue,
      })),
      byTimeSlot: byTimeSlot.map((t) => ({
        timeSlot: t._id,
        count: t.count,
      })),
    };
  }

  /**
   * Admin action on service request (cancel, refund)
   */
  async adminServiceAction(id: string, dto: any, adminUserId: string) {
    const sr = await this.serviceRequestModel.findById(id);

    if (!sr) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }

    const { action, reason, adminNotes } = dto;

    if (action === 'cancel') {
      // Check if can be cancelled
      if (['completed', 'cancelled', 'rejected'].includes(sr.status)) {
        throw new ConflictException('No se puede cancelar este servicio');
      }

      sr.status = 'cancelled';
      sr.cancelledAt = new Date();
      sr.cancellationReason = reason || 'Cancelado por administrador';
      sr.statusHistory.push({
        status: 'cancelled',
        changedAt: new Date(),
        changedBy: adminUserId ? new (require('mongoose').Types.ObjectId)(adminUserId) : undefined,
        note: adminNotes || 'Cancelado por admin',
      });

      await sr.save();

      this.logger.log(`Admin cancelled service request: ${id}`);

      return {
        id: (sr as any)._id.toString(),
        status: sr.status,
        message: 'Servicio cancelado exitosamente',
      };
    }

    if (action === 'refund') {
      // Check if can be refunded
      if (sr.paymentStatus !== 'paid') {
        throw new ConflictException('Solo se puede reembolsar un pago completado');
      }

      sr.paymentStatus = 'refunded';
      sr.statusHistory.push({
        status: 'refunded',
        changedAt: new Date(),
        changedBy: adminUserId ? new (require('mongoose').Types.ObjectId)(adminUserId) : undefined,
        note: adminNotes || `Reembolso: ${reason || 'Autorizado por admin'}`,
      });

      await sr.save();

      this.logger.log(`Admin refunded service request: ${id}`);

      return {
        id: (sr as any)._id.toString(),
        paymentStatus: sr.paymentStatus,
        message: 'Reembolso procesado exitosamente',
      };
    }

    throw new ConflictException('Acción no válida');
  }

  // ==================== PAYMENT MANAGEMENT METHODS ====================

  /**
   * Get all payments with filters and pagination
   */
  async getPayments(query: any) {
    const {
      search,
      status,
      method,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { isDeleted: { $ne: true } };

    if (status) {
      filter.status = status;
    }

    if (method) {
      filter.method = method;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      filter.amount = {};
      if (minAmount !== undefined) {
        filter.amount.$gte = minAmount * 100; // Convert to cents
      }
      if (maxAmount !== undefined) {
        filter.amount.$lte = maxAmount * 100;
      }
    }

    // Get total count
    let total = await this.servicePaymentModel.countDocuments(filter);

    // Get payments with populated data
    let payments = await this.servicePaymentModel
      .find(filter)
      .populate('patientId', 'firstName lastName email')
      .populate({
        path: 'nurseId',
        populate: { path: 'userId', select: 'firstName lastName' },
      })
      .sort({ createdAt: -1 })
      .exec();

    // Apply search filter on populated fields
    if (search) {
      const searchLower = search.toLowerCase();
      payments = payments.filter((p) => {
        const patient = p.patientId as any;
        const nurse = p.nurseId as any;
        const nurseUser = nurse?.userId as any;

        const patientName = `${patient?.firstName || ''} ${patient?.lastName || ''}`.toLowerCase();
        const nurseName = `${nurseUser?.firstName || ''} ${nurseUser?.lastName || ''}`.toLowerCase();
        const reference = p.reference.toLowerCase();
        const cepNumber = nurse?.cepNumber?.toLowerCase() || '';

        return (
          patientName.includes(searchLower) ||
          nurseName.includes(searchLower) ||
          reference.includes(searchLower) ||
          cepNumber.includes(searchLower)
        );
      });
      total = payments.length;
    }

    // Paginate
    const paginatedPayments = payments.slice(skip, skip + limit);

    // Transform data
    const data = paginatedPayments.map((p) => {
      const patient = p.patientId as any;
      const nurse = p.nurseId as any;
      const nurseUser = nurse?.userId as any;

      return {
        id: (p as any)._id.toString(),
        reference: p.reference,
        status: p.status,
        method: p.method,
        amount: p.amount / 100, // Convert from cents
        currency: p.currency || 'PEN',
        serviceFee: (p.serviceFee || 0) / 100,
        nurseEarnings: (p.nurseEarnings || 0) / 100,
        patient: patient
          ? {
              id: patient._id.toString(),
              firstName: patient.firstName,
              lastName: patient.lastName,
            }
          : null,
        nurse: nurse
          ? {
              id: (nurse as any)._id.toString(),
              firstName: nurseUser?.firstName || '',
              lastName: nurseUser?.lastName || '',
              cepNumber: nurse.cepNumber,
            }
          : null,
        serviceRequestId: p.serviceRequestId?.toString(),
        cardBrand: p.cardBrand,
        cardLast4: p.cardLast4,
        createdAt: (p as any).createdAt,
        paidAt: p.paidAt,
        refundedAt: p.refundedAt,
      };
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single payment detail
   */
  async getPayment(id: string) {
    const p = await this.servicePaymentModel
      .findById(id)
      .populate('patientId', 'firstName lastName email phone')
      .populate({
        path: 'nurseId',
        populate: { path: 'userId', select: 'firstName lastName phone' },
      })
      .exec();

    if (!p) {
      throw new NotFoundException('Pago no encontrado');
    }

    const patient = p.patientId as any;
    const nurse = p.nurseId as any;
    const nurseUser = nurse?.userId as any;

    return {
      id: (p as any)._id.toString(),
      reference: p.reference,
      status: p.status,
      method: p.method,
      amount: p.amount / 100,
      currency: p.currency || 'PEN',
      serviceFee: (p.serviceFee || 0) / 100,
      culqiFee: (p.culqiFee || 0) / 100,
      nurseEarnings: (p.nurseEarnings || 0) / 100,
      patient: patient
        ? {
            id: patient._id.toString(),
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
            phone: patient.phone,
          }
        : null,
      nurse: nurse
        ? {
            id: (nurse as any)._id.toString(),
            firstName: nurseUser?.firstName || '',
            lastName: nurseUser?.lastName || '',
            cepNumber: nurse.cepNumber,
            phone: nurseUser?.phone,
          }
        : null,
      serviceRequestId: p.serviceRequestId?.toString(),
      culqiChargeId: p.culqiChargeId,
      culqiOrderId: p.culqiOrderId,
      cardBrand: p.cardBrand,
      cardLast4: p.cardLast4,
      yapeNumber: p.yapeNumber,
      yapeOperationNumber: p.yapeOperationNumber,
      customerEmail: p.customerEmail,
      customerName: p.customerName,
      customerPhone: p.customerPhone,
      description: p.description,
      errorCode: p.errorCode,
      errorMessage: p.errorMessage,
      metadata: p.metadata,
      createdAt: (p as any).createdAt,
      updatedAt: (p as any).updatedAt,
      paidAt: p.paidAt,
      refundedAt: p.refundedAt,
      failedAt: p.failedAt,
      releasedAt: p.releasedAt,
    };
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics() {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Summary stats
    const summaryAgg = await this.servicePaymentModel.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $facet: {
          total: [
            { $match: { status: ServicePaymentStatus.COMPLETED } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                volume: { $sum: '$amount' },
                fees: { $sum: { $add: ['$serviceFee', '$culqiFee'] } },
                nurseEarnings: { $sum: '$nurseEarnings' },
              },
            },
          ],
          pending: [
            { $match: { status: ServicePaymentStatus.PENDING } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                amount: { $sum: '$amount' },
              },
            },
          ],
          refunded: [
            { $match: { status: ServicePaymentStatus.REFUNDED } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                amount: { $sum: '$amount' },
              },
            },
          ],
        },
      },
    ]);

    const summary = summaryAgg[0] || {};

    // By method
    const byMethod = await this.servicePaymentModel.aggregate([
      { $match: { isDeleted: { $ne: true }, status: ServicePaymentStatus.COMPLETED } },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // By status
    const byStatus = await this.servicePaymentModel.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Daily volume (last 7 days)
    const dailyVolume = await this.servicePaymentModel.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          status: ServicePaymentStatus.COMPLETED,
          paidAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
          fees: { $sum: { $add: ['$serviceFee', '$culqiFee'] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      summary: {
        totalTransactions: summary.total?.[0]?.count || 0,
        totalVolume: (summary.total?.[0]?.volume || 0) / 100,
        totalFees: (summary.total?.[0]?.fees || 0) / 100,
        totalNurseEarnings: (summary.total?.[0]?.nurseEarnings || 0) / 100,
        pendingPayments: summary.pending?.[0]?.count || 0,
        pendingAmount: (summary.pending?.[0]?.amount || 0) / 100,
        refundedCount: summary.refunded?.[0]?.count || 0,
        refundedAmount: (summary.refunded?.[0]?.amount || 0) / 100,
      },
      byMethod: byMethod.map((m) => ({
        method: m._id,
        count: m.count,
        amount: m.amount / 100,
      })),
      byStatus: byStatus.map((s) => ({
        status: s._id,
        count: s.count,
        amount: s.amount / 100,
      })),
      dailyVolume: dailyVolume.map((d) => ({
        date: d._id,
        count: d.count,
        amount: d.amount / 100,
        fees: d.fees / 100,
      })),
    };
  }

  /**
   * Admin refund payment
   */
  async adminRefundPayment(id: string, dto: any, adminUserId: string) {
    const payment = await this.servicePaymentModel.findById(id);

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (payment.status !== ServicePaymentStatus.COMPLETED) {
      throw new ConflictException('Solo se puede reembolsar un pago completado');
    }

    const { reason, partialAmount } = dto;

    // Mark as refunded
    payment.status = ServicePaymentStatus.REFUNDED;
    payment.refundedAt = new Date();
    payment.metadata = {
      ...payment.metadata,
      refundReason: reason || 'Reembolso autorizado por administrador',
      refundedBy: adminUserId,
      refundedAt: new Date().toISOString(),
      partialAmount: partialAmount ? partialAmount * 100 : undefined,
    };

    await payment.save();

    // Also update the service request payment status
    if (payment.serviceRequestId) {
      await this.serviceRequestModel.findByIdAndUpdate(payment.serviceRequestId, {
        paymentStatus: 'refunded',
      });
    }

    this.logger.log(`Admin refunded payment: ${payment.reference}`);

    return {
      id: (payment as any)._id.toString(),
      reference: payment.reference,
      status: payment.status,
      refundedAt: payment.refundedAt,
      message: 'Pago reembolsado exitosamente',
    };
  }
}
