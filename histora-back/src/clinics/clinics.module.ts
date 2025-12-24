import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClinicsService } from './clinics.service';
import { ClinicsController } from './clinics.controller';
import { Clinic, ClinicSchema } from './schema/clinic.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Clinic.name, schema: ClinicSchema }]),
  ],
  controllers: [ClinicsController],
  providers: [ClinicsService],
  exports: [ClinicsService],
})
export class ClinicsModule {}
