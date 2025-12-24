import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsString, IsOptional, IsIn } from 'class-validator';
import { AppointmentStatus } from '../schema/appointment.schema';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @IsString()
  @IsOptional()
  @IsIn(Object.values(AppointmentStatus))
  status?: AppointmentStatus;
}

export class CancelAppointmentDto {
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}
