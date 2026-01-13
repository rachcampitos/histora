import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SafetyService } from './safety.service';
import { SafetyController } from './safety.controller';
import { SafetyIncident, SafetyIncidentSchema } from './schema/safety-incident.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SafetyIncident.name, schema: SafetyIncidentSchema },
    ]),
  ],
  controllers: [SafetyController],
  providers: [SafetyService],
  exports: [SafetyService],
})
export class SafetyModule {}
