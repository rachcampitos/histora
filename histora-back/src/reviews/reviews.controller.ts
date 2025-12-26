import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  ForbiddenException,
  Patch,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, RespondToReviewDto, FlagReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/schema/user.schema';

@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(UserRole.PATIENT)
  create(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('User does not have a patient profile');
    }
    return this.reviewsService.create(user.patientProfileId, createReviewDto);
  }

  @Get('doctor/:doctorId')
  @Public()
  findByDoctor(
    @Param('doctorId') doctorId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('verified') verified?: string,
  ) {
    return this.reviewsService.findByDoctor(doctorId, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      onlyVerified: verified === 'true',
    });
  }

  @Get('doctor/:doctorId/stats')
  @Public()
  getDoctorStats(@Param('doctorId') doctorId: string) {
    return this.reviewsService.getDoctorRatingStats(doctorId);
  }

  @Get('my-reviews')
  @Roles(UserRole.PATIENT)
  getMyReviews(@CurrentUser() user: CurrentUserData) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('User does not have a patient profile');
    }
    return this.reviewsService.findByPatient(user.patientProfileId);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Post(':id/respond')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  respondToReview(
    @Param('id') reviewId: string,
    @Body() responseDto: RespondToReviewDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (!user.doctorProfileId) {
      throw new ForbiddenException('User does not have a doctor profile');
    }
    return this.reviewsService.respondToReview(reviewId, user.doctorProfileId, responseDto);
  }

  @Post(':id/flag')
  flagReview(
    @Param('id') reviewId: string,
    @Body() flagDto: FlagReviewDto,
  ) {
    return this.reviewsService.flagReview(reviewId, flagDto);
  }

  @Patch(':id/approve')
  @Roles(UserRole.CLINIC_OWNER)
  approveReview(
    @Param('id') reviewId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.reviewsService.approveReview(reviewId, user.clinicId);
  }

  @Patch(':id/reject')
  @Roles(UserRole.CLINIC_OWNER)
  rejectReview(
    @Param('id') reviewId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.reviewsService.rejectReview(reviewId, user.clinicId);
  }

  @Delete(':id')
  @Roles(UserRole.PATIENT)
  remove(
    @Param('id') reviewId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    if (!user.patientProfileId) {
      throw new ForbiddenException('User does not have a patient profile');
    }
    return this.reviewsService.remove(reviewId, user.patientProfileId);
  }
}
