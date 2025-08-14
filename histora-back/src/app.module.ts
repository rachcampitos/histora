import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';
import { ClinicalHistoryModule } from './clinical-history/clinical-history.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    PatientsModule,
    DoctorsModule,
    ClinicalHistoryModule,
    MongooseModule.forRoot(
      'mongodb+srv://histora:historaApp2025@histora.pcb3mhu.mongodb.net/histora_db?retryWrites=true&w=majority',
    ),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
