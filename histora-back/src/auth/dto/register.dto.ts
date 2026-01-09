import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
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

  // Clinic info for registration
  @IsString()
  @IsNotEmpty()
  clinicName: string;

  @IsString()
  @IsOptional()
  clinicAddress?: string;

  @IsString()
  @IsOptional()
  clinicPhone?: string;

  // Doctor specialty (optional, defaults to 'Medicina General')
  @IsString()
  @IsOptional()
  specialty?: string;
}

export class RegisterPatientDto {
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
}

export class RegisterNurseDto {
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

  // CEP Number (Colegio de Enfermeros del Peru)
  @IsString()
  @IsNotEmpty()
  cepNumber: string;

  // Specialties (optional on registration)
  @IsOptional()
  @IsString({ each: true })
  specialties?: string[];
}

export class CompleteGoogleRegistrationDto {
  @IsString()
  @IsNotEmpty()
  userType: 'doctor' | 'patient';

  // Only required if userType is 'doctor'
  @IsString()
  @IsOptional()
  clinicName?: string;

  @IsString()
  @IsOptional()
  clinicPhone?: string;
}
