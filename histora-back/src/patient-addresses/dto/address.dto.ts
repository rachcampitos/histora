import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsBoolean, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Mi casa', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  alias: string;

  @ApiProperty({ example: 'Jr. Las Flores 123' })
  @IsString()
  @IsNotEmpty()
  addressLine: string;

  @ApiProperty({ example: 'San Isidro' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ example: 'Lima' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: 'Lima' })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({ example: -12.0464 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: -77.0428 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ enum: ['home', 'family', 'hospital', 'work', 'other'] })
  @IsEnum(['home', 'family', 'hospital', 'work', 'other'])
  addressType: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  facadePhotoUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  facadePhotoPublicId?: string;

  @ApiPropertyOptional({ example: 'Frente al parque Kennedy' })
  @IsString()
  @IsOptional()
  references?: string;

  @ApiPropertyOptional({ example: '2do piso, Dpto 301' })
  @IsString()
  @IsOptional()
  floor?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hasElevator?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hasPets?: boolean;

  @ApiPropertyOptional({ example: 'Perro pequeño, amigable' })
  @IsString()
  @IsOptional()
  petDetails?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  alias?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  addressLine?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  facadePhotoUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  references?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  floor?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hasElevator?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  hasPets?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  petDetails?: string;
}
