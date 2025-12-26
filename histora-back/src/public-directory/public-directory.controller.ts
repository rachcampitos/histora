import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { PublicDirectoryService } from './public-directory.service';

@Controller('public')
export class PublicDirectoryController {
  constructor(private readonly publicDirectoryService: PublicDirectoryService) {}

  @Get('doctors')
  searchDoctors(
    @Query('specialty') specialty?: string,
    @Query('name') name?: string,
    @Query('city') city?: string,
    @Query('minRating') minRating?: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.publicDirectoryService.searchDoctors({
      specialty,
      name,
      city,
      minRating: minRating ? Number(minRating) : undefined,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get('doctors/:id')
  getDoctorProfile(@Param('id') doctorId: string) {
    return this.publicDirectoryService.getDoctorProfile(doctorId);
  }

  @Get('doctors/:id/reviews')
  getDoctorReviews(
    @Param('id') doctorId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.publicDirectoryService.getDoctorReviews(doctorId, {
      limit: limit ? Number(limit) : 10,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get('doctors/:id/availability')
  getDoctorAvailability(
    @Param('id') doctorId: string,
    @Query('date') date: string,
  ) {
    if (!date) {
      throw new BadRequestException('Date is required');
    }
    return this.publicDirectoryService.getDoctorAvailability(doctorId, new Date(date));
  }

  @Get('specialties')
  getSpecialties() {
    return this.publicDirectoryService.getSpecialties();
  }

  @Get('clinics')
  searchClinics(
    @Query('name') name?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.publicDirectoryService.searchClinics({
      name,
      city,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get('clinics/:slug')
  getClinicBySlug(@Param('slug') slug: string) {
    return this.publicDirectoryService.getClinicBySlug(slug);
  }

  @Get('clinics/:id/doctors')
  getClinicDoctors(@Param('id') clinicId: string) {
    return this.publicDirectoryService.getClinicDoctors(clinicId);
  }
}
