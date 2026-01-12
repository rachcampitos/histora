import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../schema/user.schema';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  clinicId?: string;

  // Terms and conditions acceptance
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
