import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NursesController } from './nurses.controller';
import { NursesService } from './nurses.service';
import { Nurse, NurseSchema } from './schema/nurse.schema';
import { NurseVerification, NurseVerificationSchema } from './schema/nurse-verification.schema';
import { NurseVerificationController } from './nurse-verification.controller';
import { NurseVerificationService } from './nurse-verification.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Nurse.name, schema: NurseSchema },
      { name: NurseVerification.name, schema: NurseVerificationSchema },
    ]),
    UploadsModule,
  ],
  controllers: [NursesController, NurseVerificationController],
  providers: [NursesService, NurseVerificationService],
  exports: [NursesService, NurseVerificationService],
})
export class NursesModule {}
