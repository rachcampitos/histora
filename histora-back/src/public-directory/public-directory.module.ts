import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicDirectoryController } from './public-directory.controller';
import { PublicDirectoryService } from './public-directory.service';
import { Doctor, DoctorSchema } from '../doctors/schema/doctor.schema';
import { Clinic, ClinicSchema } from '../clinics/schema/clinic.schema';
import { Review, ReviewSchema } from '../reviews/schema/review.schema';
import { Appointment, AppointmentSchema } from '../appointments/schema/appointment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Doctor.name, schema: DoctorSchema },
      { name: Clinic.name, schema: ClinicSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [PublicDirectoryController],
  providers: [PublicDirectoryService],
  exports: [PublicDirectoryService],
})
export class PublicDirectoryModule {}
