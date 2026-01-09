import { IsNumber, IsOptional, IsBoolean, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchNurseDto {
  @ApiProperty({ example: -12.0464, description: 'Latitude' })
  @IsNumber()
  @Type(() => Number)
  lat: number;

  @ApiProperty({ example: -77.0428, description: 'Longitude' })
  @IsNumber()
  @Type(() => Number)
  lng: number;

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Radius in km' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  radius?: number;

  @ApiPropertyOptional({
    enum: [
      'injection',
      'wound_care',
      'catheter',
      'vital_signs',
      'iv_therapy',
      'blood_draw',
      'medication',
      'elderly_care',
      'post_surgery',
      'other',
    ],
  })
  @IsOptional()
  @IsEnum([
    'injection',
    'wound_care',
    'catheter',
    'vital_signs',
    'iv_therapy',
    'blood_draw',
    'medication',
    'elderly_care',
    'post_surgery',
    'other',
  ])
  category?: string;

  @ApiPropertyOptional({ example: 4, description: 'Minimum rating (1-5)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ example: 100, description: 'Maximum price' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: true, description: 'Only available nurses' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  availableNow?: boolean;
}
