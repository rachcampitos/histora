import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// Location DTO for nurse registration
export class NurseLocationDto {
  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: number[]; // [longitude, latitude]

  @IsString()
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'El distrito es obligatorio' })
  district: string;

  @IsString()
  @IsOptional()
  address?: string;
}

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

  // Terms acceptance
  @IsBoolean()
  @IsNotEmpty({ message: 'Debe aceptar los términos y condiciones' })
  termsAccepted: boolean;

  @IsBoolean()
  @IsNotEmpty({ message: 'Debe aceptar la exención de responsabilidad profesional' })
  professionalDisclaimerAccepted: boolean;
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

  // Terms acceptance
  @IsBoolean()
  @IsNotEmpty({ message: 'Debe aceptar los términos y condiciones' })
  termsAccepted: boolean;
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

  // Terms acceptance
  @IsBoolean()
  @IsNotEmpty({ message: 'Debe aceptar los términos y condiciones' })
  termsAccepted: boolean;

  @IsBoolean()
  @IsNotEmpty({ message: 'Debe aceptar la exención de responsabilidad profesional' })
  professionalDisclaimerAccepted: boolean;
}

export class CompleteGoogleRegistrationDto {
  @IsString()
  @IsNotEmpty()
  userType: 'doctor' | 'patient' | 'nurse';

  // Only required if userType is 'doctor'
  @IsString()
  @IsOptional()
  clinicName?: string;

  @IsString()
  @IsOptional()
  clinicPhone?: string;

  // Only required if userType is 'nurse' (for Histora Care)
  @IsString()
  @IsOptional()
  cepNumber?: string;

  @IsOptional()
  @IsString({ each: true })
  specialties?: string[];

  // Location data (required for nurses)
  @ValidateNested()
  @Type(() => NurseLocationDto)
  @IsOptional()
  location?: NurseLocationDto;

  @IsNumber()
  @Min(1, { message: 'El radio de servicio debe ser al menos 1 km' })
  @Max(50, { message: 'El radio de servicio no puede superar 50 km' })
  @IsOptional()
  serviceRadius?: number;

  // Terms acceptance (required for all user types)
  @IsBoolean()
  @IsNotEmpty({ message: 'Debe aceptar los términos y condiciones' })
  termsAccepted: boolean;

  // Professional disclaimer (required for doctors and nurses)
  @IsBoolean()
  @IsOptional()
  professionalDisclaimerAccepted?: boolean;
}

/**
 * Step 1: Validate nurse credentials with CEP registry
 * Only DNI + CEP required - name is fetched automatically
 */
export class ValidateNurseCepDto {
  @IsString()
  @IsNotEmpty({ message: 'El DNI es requerido' })
  dni: string;

  @IsString()
  @IsNotEmpty({ message: 'El número de CEP es requerido' })
  cepNumber: string;
}

/**
 * Step 2: Complete nurse registration after CEP validation
 */
export class CompleteNurseRegistrationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  // DNI and CEP (validated in step 1)
  @IsString()
  @IsNotEmpty()
  dni: string;

  @IsString()
  @IsNotEmpty()
  cepNumber: string;

  // Name from CEP registry (confirmed by user)
  @IsString()
  @IsNotEmpty()
  fullNameFromCep: string;

  // Photo URL from CEP registry
  @IsString()
  @IsOptional()
  cepPhotoUrl?: string;

  // User confirmed "Yes, this is me"
  @IsBoolean()
  @IsNotEmpty({ message: 'Debe confirmar su identidad' })
  identityConfirmed: boolean;

  // Selfie URL (uploaded to Cloudinary)
  @IsString()
  @IsOptional()
  selfieUrl?: string;

  // Specialties (optional on registration)
  @IsOptional()
  @IsString({ each: true })
  specialties?: string[];

  // Location data (REQUIRED for nurse registration)
  @ValidateNested()
  @Type(() => NurseLocationDto)
  @IsNotEmpty({ message: 'La ubicación es obligatoria' })
  location: NurseLocationDto;

  @IsNumber()
  @Min(1, { message: 'El radio de servicio debe ser al menos 1 km' })
  @Max(50, { message: 'El radio de servicio no puede superar 50 km' })
  @IsNotEmpty({ message: 'El radio de servicio es obligatorio' })
  serviceRadius: number;

  // Terms acceptance
  @IsBoolean()
  @IsNotEmpty({ message: 'Debe aceptar los términos y condiciones' })
  termsAccepted: boolean;

  @IsBoolean()
  @IsNotEmpty({ message: 'Debe aceptar la exención de responsabilidad profesional' })
  professionalDisclaimerAccepted: boolean;
}
