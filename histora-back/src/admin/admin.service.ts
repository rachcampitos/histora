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
import { Clinic, ClinicDocument } from '../clinics/schema/clinic.schema';
import { Nurse } from '../nurses/schema/nurse.schema';
import { NurseVerification, VerificationStatus } from '../nurses/schema/nurse-verification.schema';
import { ReniecUsage } from '../nurses/schema/reniec-usage.schema';
import { ServiceRequest } from '../service-requests/schema/service-request.schema';
import { PanicAlert, PanicAlertStatus, PanicAlertLevel } from '../safety/schema/panic-alert.schema';
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

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Clinic.name) private clinicModel: Model<ClinicDocument>,
    @InjectModel(Nurse.name) private nurseModel: Model<Nurse>,
    @InjectModel(NurseVerification.name) private nurseVerificationModel: Model<NurseVerification>,
    @InjectModel(ReniecUsage.name) private reniecUsageModel: Model<ReniecUsage>,
    @InjectModel(ServiceRequest.name) private serviceRequestModel: Model<ServiceRequest>,
    @InjectModel(PanicAlert.name) private panicAlertModel: Model<PanicAlert>,
  ) {}

  async getUsers(query: UserQueryDto) {
    const { search, role, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { isDeleted: false };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
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

    // Get users with clinic info
    const users = await this.userModel
      .find(filter)
      .select('-password -refreshToken -passwordResetToken -passwordResetExpires')
      .populate('clinicId', 'name')
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
        clinic: user.clinicId ? (user.clinicId as any).name : null,
        clinicId: user.clinicId ? (user.clinicId as any)._id?.toString() : null,
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
      .populate('clinicId', 'name')
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
      clinic: user.clinicId ? (user.clinicId as any).name : null,
      clinicId: user.clinicId ? (user.clinicId as any)._id?.toString() : null,
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

    // Soft delete
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
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Nurse stats
    const [
      totalNurses,
      activeNurses,
      availableNurses,
      verifiedNurses,
      pendingVerifications,
    ] = await Promise.all([
      this.nurseModel.countDocuments(),
      this.nurseModel.countDocuments({ isActive: true }),
      this.nurseModel.countDocuments({ isAvailable: true, isActive: true }),
      this.nurseModel.countDocuments({ verificationStatus: VerificationStatus.APPROVED }),
      this.nurseVerificationModel.countDocuments({
        status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
      }),
    ]);

    // Service stats
    const [
      totalServices,
      pendingServices,
      acceptedServices,
      inProgressServices,
      completedToday,
      cancelledToday,
      completedThisWeek,
    ] = await Promise.all([
      this.serviceRequestModel.countDocuments(),
      this.serviceRequestModel.countDocuments({ status: 'pending' }),
      this.serviceRequestModel.countDocuments({ status: 'accepted' }),
      this.serviceRequestModel.countDocuments({ status: 'in_progress' }),
      this.serviceRequestModel.countDocuments({
        status: 'completed',
        completedAt: { $gte: startOfToday },
      }),
      this.serviceRequestModel.countDocuments({
        status: 'cancelled',
        cancelledAt: { $gte: startOfToday },
      }),
      this.serviceRequestModel.countDocuments({
        status: 'completed',
        completedAt: { $gte: startOfWeek },
      }),
    ]);

    // Revenue this week
    const revenueResult = await this.serviceRequestModel.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$service.price' },
        },
      },
    ]);
    const revenueThisWeek = revenueResult[0]?.total || 0;

    // Safety stats
    const [activePanicAlerts, activeEmergencies, resolvedThisMonth] = await Promise.all([
      this.panicAlertModel.countDocuments({
        status: { $in: [PanicAlertStatus.ACTIVE, PanicAlertStatus.ACKNOWLEDGED, PanicAlertStatus.RESPONDING] },
      }),
      this.panicAlertModel.countDocuments({
        status: { $in: [PanicAlertStatus.ACTIVE, PanicAlertStatus.ACKNOWLEDGED] },
        level: PanicAlertLevel.EMERGENCY,
      }),
      this.panicAlertModel.countDocuments({
        status: PanicAlertStatus.RESOLVED,
        resolvedAt: { $gte: startOfMonth },
      }),
    ]);

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
   */
  async getPendingVerifications(): Promise<PendingVerificationDto[]> {
    const verifications = await this.nurseVerificationModel
      .find({
        status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
      })
      .populate({
        path: 'nurseId',
        populate: { path: 'userId', select: 'firstName lastName avatar' },
      })
      .sort({ createdAt: 1 }) // Oldest first (longest waiting)
      .limit(20)
      .exec();

    const now = new Date();

    return verifications.map((v) => {
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
   */
  async getServiceChartData(): Promise<ServiceChartDataDto[]> {
    const now = new Date();
    const result: ServiceChartDataDto[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const [completed, cancelled, revenueResult] = await Promise.all([
        this.serviceRequestModel.countDocuments({
          status: 'completed',
          completedAt: { $gte: startOfDay, $lt: endOfDay },
        }),
        this.serviceRequestModel.countDocuments({
          status: 'cancelled',
          cancelledAt: { $gte: startOfDay, $lt: endOfDay },
        }),
        this.serviceRequestModel.aggregate([
          {
            $match: {
              status: 'completed',
              completedAt: { $gte: startOfDay, $lt: endOfDay },
            },
          },
          { $group: { _id: null, total: { $sum: '$service.price' } } },
        ]),
      ]);

      result.push({
        date: startOfDay.toISOString().split('T')[0],
        completed,
        cancelled,
        revenue: revenueResult[0]?.total || 0,
      });
    }

    return result;
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

    // Build filter
    const filter: any = {};

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
      filter['location.district'] = { $regex: district, $options: 'i' };
    }

    // Get nurses with user info
    let nurses = await this.nurseModel
      .find(filter)
      .populate('userId', 'firstName lastName email phone avatar isActive')
      .sort({ createdAt: -1 })
      .exec();

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
      .findById(id)
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
   * Delete nurse (soft delete - deactivate user and nurse)
   */
  async deleteNurse(id: string) {
    const nurse = await this.nurseModel.findById(id);

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

    // Soft delete: deactivate nurse and user
    nurse.isActive = false;
    nurse.isAvailable = false;
    await nurse.save();

    // Deactivate user
    await this.userModel.findByIdAndUpdate(nurse.userId, {
      isActive: false,
      isDeleted: true,
    });

    this.logger.log(`Admin deleted nurse: ${nurse.cepNumber}`);

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
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
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
}
