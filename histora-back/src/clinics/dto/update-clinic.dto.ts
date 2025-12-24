import { PartialType } from '@nestjs/mapped-types';
import { CreateClinicDto } from './create-clinic.dto';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class ScheduleDto {
  @IsObject()
  @IsOptional()
  monday?: { open?: string; close?: string; isOpen?: boolean };

  @IsObject()
  @IsOptional()
  tuesday?: { open?: string; close?: string; isOpen?: boolean };

  @IsObject()
  @IsOptional()
  wednesday?: { open?: string; close?: string; isOpen?: boolean };

  @IsObject()
  @IsOptional()
  thursday?: { open?: string; close?: string; isOpen?: boolean };

  @IsObject()
  @IsOptional()
  friday?: { open?: string; close?: string; isOpen?: boolean };

  @IsObject()
  @IsOptional()
  saturday?: { open?: string; close?: string; isOpen?: boolean };

  @IsObject()
  @IsOptional()
  sunday?: { open?: string; close?: string; isOpen?: boolean };
}

export class UpdateClinicDto extends PartialType(CreateClinicDto) {
  @IsObject()
  @IsOptional()
  schedule?: ScheduleDto;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
