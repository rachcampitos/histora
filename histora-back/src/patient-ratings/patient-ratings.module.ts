import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientRatingsService } from './patient-ratings.service';
import { PatientRatingsController } from './patient-ratings.controller';
import { PatientRating, PatientRatingSchema } from './schema/patient-rating.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PatientRating.name, schema: PatientRatingSchema },
    ]),
  ],
  controllers: [PatientRatingsController],
  providers: [PatientRatingsService],
  exports: [PatientRatingsService],
})
export class PatientRatingsModule {}
