import { IsString, IsNotEmpty, MinLength, IsEmail, IsOptional, IsIn, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de recuperación enviado por email',
    example: 'abc123...',
  })
  @IsString()
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;

  @ApiProperty({
    description: 'Nueva contraseña (mínimo 8 caracteres)',
    example: 'NuevaPassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  newPassword: string;
}

// OTP-based password recovery DTOs
export class RequestPasswordOtpDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiPropertyOptional({
    description: 'Plataforma que solicita la recuperación',
    example: 'histora-care',
    enum: ['histora-front', 'histora-care'],
  })
  @IsOptional()
  @IsIn(['histora-front', 'histora-care'], { message: 'Plataforma no válida' })
  platform?: 'histora-front' | 'histora-care';
}

export class VerifyPasswordOtpDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Código OTP de 6 dígitos',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'El código es requerido' })
  @Length(6, 6, { message: 'El código debe tener 6 dígitos' })
  otp: string;
}

export class ResetPasswordWithOtpDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Código OTP de 6 dígitos',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'El código es requerido' })
  @Length(6, 6, { message: 'El código debe tener 6 dígitos' })
  otp: string;

  @ApiProperty({
    description: 'Nueva contraseña (mínimo 8 caracteres)',
    example: 'NuevaPassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  newPassword: string;
}
