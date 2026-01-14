import { Module, forwardRef } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { UsersModule } from '../users/users.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { NursesModule } from '../nurses/nurses.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => DoctorsModule),
    forwardRef(() => NursesModule),
  ],
  controllers: [UploadsController],
  providers: [UploadsService, CloudinaryProvider],
  exports: [UploadsService, CloudinaryProvider],
})
export class UploadsModule {}
