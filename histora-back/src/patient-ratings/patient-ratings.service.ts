import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PatientRating, PatientRatingDocument, POSITIVE_TAGS, NEGATIVE_TAGS } from './schema/patient-rating.schema';

export interface CreateRatingDto {
  serviceRequestId: string;
  patientId: string;
  ratings: {
    safety: number;
    respect: number;
    environment: number;
    compliance: number;
  };
  positiveTags?: string[];
  negativeTags?: string[];
  privateComment?: string;
  hasIncident?: boolean;
  incidentId?: string;
  isAnonymous?: boolean;
}

export interface RatingSummary {
  patientId: string;
  totalRatings: number;
  averageRating: number;
  averageBreakdown: {
    safety: number;
    respect: number;
    environment: number;
    compliance: number;
  };
  topPositiveTags: { tag: string; count: number }[];
  topNegativeTags: { tag: string; count: number }[];
  recentComments: string[];
}

@Injectable()
export class PatientRatingsService {
  constructor(
    @InjectModel(PatientRating.name)
    private ratingModel: Model<PatientRatingDocument>,
  ) {}

  async create(nurseId: string, dto: CreateRatingDto): Promise<PatientRating> {
    // Check if rating already exists for this service
    const existing = await this.ratingModel.findOne({
      serviceRequestId: new Types.ObjectId(dto.serviceRequestId),
    });

    if (existing) {
      throw new BadRequestException('Ya existe una calificación para este servicio');
    }

    // Validate tags
    if (dto.positiveTags) {
      const invalidPositive = dto.positiveTags.filter(t => !POSITIVE_TAGS.includes(t));
      if (invalidPositive.length > 0) {
        throw new BadRequestException(`Tags positivos inválidos: ${invalidPositive.join(', ')}`);
      }
    }

    if (dto.negativeTags) {
      const invalidNegative = dto.negativeTags.filter(t => !NEGATIVE_TAGS.includes(t));
      if (invalidNegative.length > 0) {
        throw new BadRequestException(`Tags negativos inválidos: ${invalidNegative.join(', ')}`);
      }
    }

    // Calculate overall rating (average of the 4 categories)
    const { safety, respect, environment, compliance } = dto.ratings;
    const overallRating = Math.round(((safety + respect + environment + compliance) / 4) * 10) / 10;

    const rating = new this.ratingModel({
      serviceRequestId: new Types.ObjectId(dto.serviceRequestId),
      patientId: new Types.ObjectId(dto.patientId),
      nurseId: new Types.ObjectId(nurseId),
      ratings: dto.ratings,
      overallRating,
      positiveTags: dto.positiveTags || [],
      negativeTags: dto.negativeTags || [],
      privateComment: dto.privateComment,
      hasIncident: dto.hasIncident || false,
      incidentId: dto.incidentId ? new Types.ObjectId(dto.incidentId) : undefined,
      isAnonymous: dto.isAnonymous || false,
    });

    return rating.save();
  }

  async findByPatient(patientId: string, limit = 10): Promise<PatientRating[]> {
    return this.ratingModel
      .find({ patientId: new Types.ObjectId(patientId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('nurseId', 'firstName lastName')
      .exec();
  }

  async findByService(serviceRequestId: string): Promise<PatientRating | null> {
    return this.ratingModel.findOne({
      serviceRequestId: new Types.ObjectId(serviceRequestId),
    });
  }

  async getPatientSummary(patientId: string): Promise<RatingSummary> {
    const ratings = await this.ratingModel.find({
      patientId: new Types.ObjectId(patientId),
    });

    if (ratings.length === 0) {
      return {
        patientId,
        totalRatings: 0,
        averageRating: 0,
        averageBreakdown: { safety: 0, respect: 0, environment: 0, compliance: 0 },
        topPositiveTags: [],
        topNegativeTags: [],
        recentComments: [],
      };
    }

    // Calculate averages
    const avgSafety = ratings.reduce((sum, r) => sum + r.ratings.safety, 0) / ratings.length;
    const avgRespect = ratings.reduce((sum, r) => sum + r.ratings.respect, 0) / ratings.length;
    const avgEnvironment = ratings.reduce((sum, r) => sum + r.ratings.environment, 0) / ratings.length;
    const avgCompliance = ratings.reduce((sum, r) => sum + r.ratings.compliance, 0) / ratings.length;
    const avgOverall = ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length;

    // Count tags
    const positiveTagCounts = new Map<string, number>();
    const negativeTagCounts = new Map<string, number>();

    ratings.forEach(r => {
      r.positiveTags.forEach(tag => {
        positiveTagCounts.set(tag, (positiveTagCounts.get(tag) || 0) + 1);
      });
      r.negativeTags.forEach(tag => {
        negativeTagCounts.set(tag, (negativeTagCounts.get(tag) || 0) + 1);
      });
    });

    const topPositiveTags = Array.from(positiveTagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topNegativeTags = Array.from(negativeTagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get recent comments (non-anonymous only)
    const recentComments = ratings
      .filter(r => r.privateComment && !r.isAnonymous)
      .sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime())
      .slice(0, 5)
      .map(r => r.privateComment);

    return {
      patientId,
      totalRatings: ratings.length,
      averageRating: Math.round(avgOverall * 10) / 10,
      averageBreakdown: {
        safety: Math.round(avgSafety * 10) / 10,
        respect: Math.round(avgRespect * 10) / 10,
        environment: Math.round(avgEnvironment * 10) / 10,
        compliance: Math.round(avgCompliance * 10) / 10,
      },
      topPositiveTags,
      topNegativeTags,
      recentComments,
    };
  }

  async getAverageRating(patientId: string): Promise<number> {
    const result = await this.ratingModel.aggregate([
      { $match: { patientId: new Types.ObjectId(patientId) } },
      { $group: { _id: null, avgRating: { $avg: '$overallRating' }, count: { $sum: 1 } } },
    ]);

    return result.length > 0 ? Math.round(result[0].avgRating * 10) / 10 : 0;
  }
}
