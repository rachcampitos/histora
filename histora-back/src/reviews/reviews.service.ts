import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from './schema/review.schema';
import { Doctor, DoctorDocument } from '../doctors/schema/doctor.schema';
import { Consultation, ConsultationDocument } from '../consultations/schema/consultation.schema';
import { CreateReviewDto, RespondToReviewDto, FlagReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    @InjectModel(Consultation.name) private consultationModel: Model<ConsultationDocument>,
  ) {}

  async create(patientId: string, createReviewDto: CreateReviewDto): Promise<Review> {
    // Check if patient already reviewed this doctor
    const existingReview = await this.reviewModel.findOne({
      patientId,
      doctorId: createReviewDto.doctorId,
      isDeleted: false,
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this doctor');
    }

    // Check if the review is verified (patient had a consultation with this doctor)
    let isVerified = false;
    if (createReviewDto.consultationId) {
      const consultation = await this.consultationModel.findOne({
        _id: createReviewDto.consultationId,
        patientId,
        doctorId: createReviewDto.doctorId,
        status: 'completed',
      });
      isVerified = !!consultation;
    } else {
      // Check if patient has any completed consultation with this doctor
      const hasConsultation = await this.consultationModel.findOne({
        patientId,
        doctorId: createReviewDto.doctorId,
        status: 'completed',
      });
      isVerified = !!hasConsultation;
    }

    const review = new this.reviewModel({
      ...createReviewDto,
      patientId,
      isVerified,
    });

    const savedReview = await review.save();

    // Update doctor's average rating
    await this.updateDoctorRating(createReviewDto.doctorId);

    return savedReview;
  }

  async findByDoctor(
    doctorId: string,
    options?: { limit?: number; offset?: number; onlyVerified?: boolean },
  ): Promise<{ reviews: Review[]; total: number; averageRating: number }> {
    const query: any = {
      doctorId,
      isDeleted: false,
      isApproved: true,
    };

    if (options?.onlyVerified) {
      query.isVerified = true;
    }

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(query)
        .populate('patientId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(options?.offset || 0)
        .limit(options?.limit || 10)
        .exec(),
      this.reviewModel.countDocuments(query),
    ]);

    // Calculate average from approved reviews
    const avgResult = await this.reviewModel.aggregate([
      { $match: { doctorId: doctorId, isDeleted: false, isApproved: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } },
    ]);

    const averageRating = avgResult[0]?.avgRating || 0;

    // Map reviews to hide patient info if anonymous
    const mappedReviews = reviews.map((review) => {
      if (review.isAnonymous) {
        return {
          ...review.toObject(),
          patientId: { firstName: 'Paciente', lastName: 'Anónimo' },
        };
      }
      return review;
    });

    return { reviews: mappedReviews as Review[], total, averageRating };
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewModel
      .findOne({ _id: id, isDeleted: false })
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName specialty')
      .exec();

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async findByPatient(patientId: string): Promise<Review[]> {
    return this.reviewModel
      .find({ patientId, isDeleted: false })
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ createdAt: -1 })
      .exec();
  }

  async respondToReview(
    reviewId: string,
    doctorId: string,
    responseDto: RespondToReviewDto,
  ): Promise<Review> {
    const review = await this.reviewModel.findOne({
      _id: reviewId,
      doctorId,
      isDeleted: false,
    });

    if (!review) {
      throw new NotFoundException('Review not found or you are not authorized to respond');
    }

    if (review.response) {
      throw new BadRequestException('Review already has a response');
    }

    review.response = {
      content: responseDto.content,
      respondedAt: new Date(),
    };

    return review.save();
  }

  async flagReview(reviewId: string, flagDto: FlagReviewDto): Promise<Review> {
    const review = await this.reviewModel.findOne({
      _id: reviewId,
      isDeleted: false,
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isFlagged = true;
    review.flagReason = flagDto.reason;

    return review.save();
  }

  async approveReview(reviewId: string, clinicId: string): Promise<Review> {
    const review = await this.reviewModel.findOne({
      _id: reviewId,
      clinicId,
      isDeleted: false,
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isApproved = true;
    review.isFlagged = false;

    const savedReview = await review.save();

    // Update doctor rating
    await this.updateDoctorRating(review.doctorId.toString());

    return savedReview;
  }

  async rejectReview(reviewId: string, clinicId: string): Promise<Review> {
    const review = await this.reviewModel.findOne({
      _id: reviewId,
      clinicId,
      isDeleted: false,
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isApproved = false;

    const savedReview = await review.save();

    // Update doctor rating
    await this.updateDoctorRating(review.doctorId.toString());

    return savedReview;
  }

  async remove(reviewId: string, patientId: string): Promise<Review> {
    const review = await this.reviewModel.findOne({
      _id: reviewId,
      patientId,
      isDeleted: false,
    });

    if (!review) {
      throw new NotFoundException('Review not found or you are not authorized to delete it');
    }

    review.isDeleted = true;
    const savedReview = await review.save();

    // Update doctor rating
    await this.updateDoctorRating(review.doctorId.toString());

    return savedReview;
  }

  async getDoctorRatingStats(doctorId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { rating: number; count: number }[];
  }> {
    const [stats, distribution] = await Promise.all([
      this.reviewModel.aggregate([
        { $match: { doctorId: doctorId, isDeleted: false, isApproved: true } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            total: { $sum: 1 },
          },
        },
      ]),
      this.reviewModel.aggregate([
        { $match: { doctorId: doctorId, isDeleted: false, isApproved: true } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),
    ]);

    const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: distribution.find((d) => d._id === rating)?.count || 0,
    }));

    return {
      averageRating: stats[0]?.avgRating || 0,
      totalReviews: stats[0]?.total || 0,
      ratingDistribution,
    };
  }

  private async updateDoctorRating(doctorId: string): Promise<void> {
    const stats = await this.reviewModel.aggregate([
      { $match: { doctorId: doctorId, isDeleted: false, isApproved: true } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          total: { $sum: 1 },
        },
      },
    ]);

    const averageRating = Math.round((stats[0]?.avgRating || 0) * 10) / 10;
    const totalReviews = stats[0]?.total || 0;

    await this.doctorModel.findByIdAndUpdate(doctorId, {
      averageRating,
      totalReviews,
    });
  }
}
