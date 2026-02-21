import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestLocationDto {
  @ApiProperty({ example: [-77.0428, -12.0464], description: '[longitude, latitude]' })
  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: number[];

  @ApiProperty({ example: 'Av. Javier Prado Este 123' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: 'Edificio azul, puerta verde' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ example: 'San Isidro' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ example: 'Lima' })
  @IsString()
  @IsNotEmpty()
  city: string;
}

export class AttachmentDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/...' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ example: 'histora/service-requests/abc123/attachment_1' })
  @IsString()
  @IsNotEmpty()
  publicId: string;

  @ApiProperty({ enum: ['image', 'pdf'] })
  @IsEnum(['image', 'pdf'])
  type: string;

  @ApiProperty({ example: 'receta-medica.jpg' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateServiceRequestDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  nurseId: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439012', description: 'Service ID from nurse profile' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ type: RequestLocationDto })
  @ValidateNested()
  @Type(() => RequestLocationDto)
  location: RequestLocationDto;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  requestedDate: string;

  @ApiProperty({ enum: ['morning', 'afternoon', 'evening', 'asap'] })
  @IsEnum(['morning', 'afternoon', 'evening', 'asap'])
  requestedTimeSlot: string;

  @ApiPropertyOptional({ example: 'Necesito que venga temprano por favor' })
  @IsOptional()
  @IsString()
  patientNotes?: string;

  @ApiPropertyOptional({ type: [AttachmentDto], description: 'Prescriptions/documents (max 3)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
