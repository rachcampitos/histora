// clinical-history.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ClinicalHistory,
  ClinicalHistorySchema,
} from './schema/clinical-history.schema';
import { ClinicalHistoryService } from './clinical-history.service';
import { ClinicalHistoryController } from './clinical-history.controller';
import { Doctor, DoctorSchema } from 'src/doctors/schema/doctor.schema';
import { Patient, PatientSchema } from 'src/patients/schemas/patients.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClinicalHistory.name, schema: ClinicalHistorySchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Doctor.name, schema: DoctorSchema },
    ]),
  ],
  controllers: [ClinicalHistoryController],
  providers: [ClinicalHistoryService],
})
export class ClinicalHistoryModule {}
