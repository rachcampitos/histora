import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsMongoId,
  MaxLength,
  MinLength,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateComplaintDto {
  @ApiProperty({ enum: ['reclamo', 'queja'], description: 'Tipo de reclamo o queja' })
  @IsEnum(['reclamo', 'queja'])
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'Juan Perez Garcia' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '44778638' })
  @IsString()
  @IsNotEmpty()
  dni: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+51 999 888 777' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Descripcion detallada del reclamo o queja',
    minLength: 20,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'La descripcion debe tener al menos 20 caracteres' })
  @MaxLength(2000, { message: 'La descripcion no puede exceder 2000 caracteres' })
  description: string;

  @ApiPropertyOptional({ description: 'ID del servicio relacionado (opcional)' })
  @IsOptional()
  @IsMongoId()
  relatedServiceId?: string;
}
