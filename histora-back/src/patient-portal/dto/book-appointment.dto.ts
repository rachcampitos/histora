import {
  IsString,
  IsMongoId,
  IsDateString,
  Matches,
  IsOptional,
} from 'class-validator';

export class BookAppointmentDto {
  @IsMongoId()
  doctorId: string;

  @IsMongoId()
  clinicId: string;

  @IsDateString()
  scheduledDate: string;

  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM format',
  })
  startTime: string;

  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:MM format',
  })
  endTime: string;

  @IsOptional()
  @IsString()
  reasonForVisit?: string;
}
