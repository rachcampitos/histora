import {
  IsString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @IsMongoId()
  doctorId: string;

  @IsMongoId()
  clinicId: string;

  @IsOptional()
  @IsMongoId()
  consultationId?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class RespondToReviewDto {
  @IsString()
  @MaxLength(500)
  content: string;
}

export class FlagReviewDto {
  @IsString()
  @MaxLength(200)
  reason: string;
}
