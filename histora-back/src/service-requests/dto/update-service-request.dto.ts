import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateServiceRequestStatusDto {
  @ApiProperty({
    enum: [
      'pending',
      'accepted',
      'on_the_way',
      'arrived',
      'in_progress',
      'completed',
      'cancelled',
      'rejected',
    ],
  })
  @IsEnum([
    'pending',
    'accepted',
    'on_the_way',
    'arrived',
    'in_progress',
    'completed',
    'cancelled',
    'rejected',
  ])
  status: string;

  @ApiPropertyOptional({ example: 'En camino, llego en 15 minutos' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CancelServiceRequestDto {
  @ApiPropertyOptional({ example: 'Ya no lo necesito' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RejectServiceRequestDto {
  @ApiPropertyOptional({ example: 'No puedo atender en esa zona' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RateServiceRequestDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Excelente servicio, muy profesional' })
  @IsOptional()
  @IsString()
  review?: string;
}
