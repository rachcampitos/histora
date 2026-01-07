import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { WhatsAppApiProvider } from './providers/whatsapp-api.provider';
import { Patient, PatientSchema } from '../patients/schemas/patients.schema';
import { Doctor, DoctorSchema } from '../doctors/schema/doctor.schema';
import { Appointment, AppointmentSchema } from '../appointments/schema/appointment.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService, WhatsAppApiProvider],
  exports: [ChatbotService, WhatsAppApiProvider],
})
export class ChatbotModule {}
