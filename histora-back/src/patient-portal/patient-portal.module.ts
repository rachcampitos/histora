import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientPortalController } from './patient-portal.controller';
import { PatientPortalService } from './patient-portal.service';
import { Patient, PatientSchema } from '../patients/schemas/patients.schema';
import { Appointment, AppointmentSchema } from '../appointments/schema/appointment.schema';
import { ClinicalHistory, ClinicalHistorySchema } from '../clinical-history/schema/clinical-history.schema';
import { Consultation, ConsultationSchema } from '../consultations/schema/consultation.schema';
import { Vitals, VitalsSchema } from '../vitals/schema/vitals.schema';
import { Doctor, DoctorSchema } from '../doctors/schema/doctor.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: ClinicalHistory.name, schema: ClinicalHistorySchema },
      { name: Consultation.name, schema: ConsultationSchema },
      { name: Vitals.name, schema: VitalsSchema },
      { name: Doctor.name, schema: DoctorSchema },
    ]),
  ],
  controllers: [PatientPortalController],
  providers: [PatientPortalService],
  exports: [PatientPortalService],
})
export class PatientPortalModule {}
