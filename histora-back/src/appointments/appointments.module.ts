import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController, PublicAppointmentsController } from './appointments.controller';
import { Appointment, AppointmentSchema } from './schema/appointment.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Appointment.name, schema: AppointmentSchema }]),
    forwardRef(() => NotificationsModule),
    forwardRef(() => DoctorsModule),
    forwardRef(() => PatientsModule),
  ],
  controllers: [AppointmentsController, PublicAppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
