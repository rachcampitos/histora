import { IsEmail, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiPropertyOptional({
    description: 'Plataforma que solicita la recuperación (histora-front o histora-care)',
    example: 'histora-care',
    enum: ['histora-front', 'histora-care'],
  })
  @IsOptional()
  @IsIn(['histora-front', 'histora-care'], { message: 'Plataforma no válida' })
  platform?: 'histora-front' | 'histora-care';
}
