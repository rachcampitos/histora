import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondComplaintDto {
  @ApiProperty({
    description: 'Respuesta al reclamo o queja',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'La respuesta no puede exceder 2000 caracteres' })
  response: string;
}
