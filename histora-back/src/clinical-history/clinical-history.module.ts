import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ClinicalHistory,
  ClinicalHistorySchema,
} from './schema/clinical-history.schema';
import { ClinicalHistoryService } from './clinical-history.service';
import { ClinicalHistoryController } from './clinical-history.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClinicalHistory.name, schema: ClinicalHistorySchema },
    ]),
  ],
  controllers: [ClinicalHistoryController],
  providers: [ClinicalHistoryService],
  exports: [ClinicalHistoryService],
})
export class ClinicalHistoryModule {}
