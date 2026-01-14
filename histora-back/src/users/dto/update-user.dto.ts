import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'email'] as const),
) {
  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  refreshTokenExpires?: Date;

  @IsOptional()
  doctorProfileId?: Types.ObjectId;

  @IsOptional()
  patientProfileId?: Types.ObjectId;

  @IsOptional()
  nurseProfileId?: Types.ObjectId;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  avatarPublicId?: string;

  // Terms and conditions acceptance (for updates)
  @IsBoolean()
  @IsOptional()
  termsAccepted?: boolean;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  termsAcceptedAt?: Date;

  @IsString()
  @IsOptional()
  termsVersion?: string;

  // Professional disclaimer acceptance (for nurses/doctors)
  @IsBoolean()
  @IsOptional()
  professionalDisclaimerAccepted?: boolean;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  professionalDisclaimerAcceptedAt?: Date;
}
