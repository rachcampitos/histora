import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NursesController } from './nurses.controller';
import { NursesService } from './nurses.service';
import { Nurse, NurseSchema } from './schema/nurse.schema';
import { NurseVerification, NurseVerificationSchema } from './schema/nurse-verification.schema';
import { NurseReview, NurseReviewSchema } from './schema/nurse-review.schema';
import { ReniecUsage, ReniecUsageSchema } from './schema/reniec-usage.schema';
import { User, UserSchema } from '../users/schema/user.schema';
import { NurseVerificationController } from './nurse-verification.controller';
import { NurseVerificationService } from './nurse-verification.service';
import { CepValidationService } from './cep-validation.service';
import { CepRevalidationScheduler } from './cep-revalidation.scheduler';
import { ReniecValidationService } from './reniec-validation.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Nurse.name, schema: NurseSchema },
      { name: NurseVerification.name, schema: NurseVerificationSchema },
      { name: NurseReview.name, schema: NurseReviewSchema },
      { name: ReniecUsage.name, schema: ReniecUsageSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UploadsModule,
  ],
  controllers: [NursesController, NurseVerificationController],
  providers: [NursesService, NurseVerificationService, CepValidationService, CepRevalidationScheduler, ReniecValidationService],
  exports: [NursesService, NurseVerificationService, CepValidationService, CepRevalidationScheduler, ReniecValidationService],
})
export class NursesModule {}
