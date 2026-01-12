import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
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

  // Terms acceptance (required for all user types)
  @IsBoolean()
  @IsNotEmpty({ message: 'Debe aceptar los términos y condiciones' })
  termsAccepted: boolean;

  // Professional disclaimer (required for doctors and nurses)
  @IsBoolean()
  @IsOptional()
  professionalDisclaimerAccepted?: boolean;
}
