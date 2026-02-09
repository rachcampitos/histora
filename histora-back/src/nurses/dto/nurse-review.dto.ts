import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsMongoId,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNurseReviewDto {
  @ApiProperty({
    description: 'Rating from 1 to 5',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1, { message: 'La calificacion debe ser al menos 1' })
  @Max(5, { message: 'La calificacion maxima es 5' })
  rating: number;

  @ApiPropertyOptional({
    description: 'Review comment',
    example: 'Excelente servicio, muy profesional',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'El comentario no puede exceder 1000 caracteres' })
  comment?: string;

  @ApiPropertyOptional({
    description: 'Service request ID for verified reviews',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'ID de solicitud invalido' })
  serviceRequestId?: string;

  @ApiPropertyOptional({ description: 'Allow review to be used as public testimonial on landing page' })
  @IsOptional()
  @IsBoolean()
  allowPublicUse?: boolean;
}

export class NurseReviewResponseDto {
  @ApiProperty({
    description: 'Response content',
    example: 'Gracias por tu comentario',
    maxLength: 500,
  })
  @IsNotEmpty({ message: 'La respuesta es requerida' })
  @IsString()
  @MaxLength(500, { message: 'La respuesta no puede exceder 500 caracteres' })
  content: string;
}
