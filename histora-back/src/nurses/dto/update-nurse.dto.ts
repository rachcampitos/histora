import { PartialType } from '@nestjs/swagger';
import { CreateNurseDto, GeoPointDto, NurseServiceDto } from './create-nurse.dto';
import {
  IsOptional,
  IsBoolean,
  IsString,
  IsArray,
  IsNumber,
  ValidateNested,
  Matches,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNurseDto extends PartialType(CreateNurseDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  availableFrom?: string;

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  @IsString()
  availableTo?: string;

  @ApiPropertyOptional({ example: [1, 2, 3, 4, 5], description: '0=Sunday, 6=Saturday' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  availableDays?: number[];

  // Payment Methods (P2P)
  @ApiPropertyOptional({ example: '987654321', description: 'Yape phone number (9 digits or empty)' })
  @IsOptional()
  @IsString()
  @MaxLength(9)
  @Matches(/^(\d{9})?$/, { message: 'yapeNumber must be exactly 9 digits or empty' })
  yapeNumber?: string;

  @ApiPropertyOptional({ example: '987654321', description: 'Plin phone number (9 digits or empty)' })
  @IsOptional()
  @IsString()
  @MaxLength(9)
  @Matches(/^(\d{9})?$/, { message: 'plinNumber must be exactly 9 digits or empty' })
  plinNumber?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether nurse accepts cash payments' })
  @IsOptional()
  @IsBoolean()
  acceptsCash?: boolean;
}

export class UpdateNurseLocationDto {
  @ApiPropertyOptional({ type: GeoPointDto })
  @ValidateNested()
  @Type(() => GeoPointDto)
  location: GeoPointDto;
}

export class UpdateNurseAvailabilityDto {
  @ApiPropertyOptional()
  @IsBoolean()
  isAvailable: boolean;
}

export class AddNurseServiceDto extends NurseServiceDto {}

export class UpdateNurseServiceDto extends PartialType(NurseServiceDto) {}
