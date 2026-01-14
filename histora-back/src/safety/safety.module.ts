import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SafetyService } from './safety.service';
import { SafetyController } from './safety.controller';
import { SafetyIncident, SafetyIncidentSchema } from './schema/safety-incident.schema';
import { PanicAlert, PanicAlertSchema } from './schema/panic-alert.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SafetyIncident.name, schema: SafetyIncidentSchema },
      { name: PanicAlert.name, schema: PanicAlertSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [SafetyController],
  providers: [SafetyService],
  exports: [SafetyService],
})
export class SafetyModule {}
