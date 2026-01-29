import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUrl,
  IsEnum,
  Min,
  Max,
  validateSync,
  IsNotEmpty,
  MinLength,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  // ============= Core Settings =============
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  // ============= Database =============
  @IsString()
  @IsNotEmpty({ message: 'MONGO_URL is required. Example: mongodb+srv://user:pass@cluster.mongodb.net/db' })
  MONGO_URL: string;

  // ============= JWT Authentication =============
  @IsString()
  @IsNotEmpty({ message: 'JWT_SECRET is required. Use a strong random string (min 32 chars)' })
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters for security' })
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  // ============= Frontend URLs =============
  @IsString()
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:4200';

  @IsString()
  @IsOptional()
  CARE_FRONTEND_URL: string = 'http://localhost:8100';

  @IsString()
  @IsOptional()
  CORS_ORIGINS: string;

  // ============= Cookie Settings =============
  @IsString()
  @IsOptional()
  COOKIE_DOMAIN: string;

  // ============= Mobile App =============
  @IsString()
  @IsOptional()
  MOBILE_APP_SCHEME: string = 'historacare';

  // ============= Google OAuth =============
  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET: string;

  @IsString()
  @IsOptional()
  GOOGLE_CALLBACK_URL: string;

  // ============= Cloudinary (File Uploads) =============
  @IsString()
  @IsOptional()
  CLOUDINARY_CLOUD_NAME: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_KEY: string;

  @IsString()
  @IsOptional()
  CLOUDINARY_API_SECRET: string;

  // ============= Email (Resend) =============
  @IsString()
  @IsOptional()
  RESEND_API_KEY: string;

  @IsString()
  @IsOptional()
  EMAIL_FROM: string = 'noreply@historahealth.com';

  // ============= SMS (Twilio) =============
  @IsString()
  @IsOptional()
  TWILIO_ACCOUNT_SID: string;

  @IsString()
  @IsOptional()
  TWILIO_AUTH_TOKEN: string;

  @IsString()
  @IsOptional()
  TWILIO_PHONE_NUMBER: string;

  // ============= WhatsApp =============
  @IsString()
  @IsOptional()
  WHATSAPP_API_URL: string;

  @IsString()
  @IsOptional()
  WHATSAPP_API_TOKEN: string;

  // ============= Push Notifications (Firebase) =============
  @IsString()
  @IsOptional()
  FIREBASE_PROJECT_ID: string;

  @IsString()
  @IsOptional()
  FIREBASE_PRIVATE_KEY: string;

  @IsString()
  @IsOptional()
  FIREBASE_CLIENT_EMAIL: string;

  // ============= Payments (Culqi) =============
  @IsString()
  @IsOptional()
  CULQI_PUBLIC_KEY: string;

  @IsString()
  @IsOptional()
  CULQI_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  CULQI_RSA_PUBLIC_KEY: string;

  // ============= External APIs =============
  @IsString()
  @IsOptional()
  RENIEC_API_TOKEN: string;

  // ============= AI Services =============
  @IsString()
  @IsOptional()
  OPENAI_API_KEY: string;

  @IsString()
  @IsOptional()
  ANTHROPIC_API_KEY: string;

  // ============= Encryption =============
  @IsString()
  @IsOptional()
  PHI_ENCRYPTION_KEY: string;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map((error) => {
      const constraints = error.constraints ? Object.values(error.constraints).join(', ') : 'Unknown error';
      return `${error.property}: ${constraints}`;
    });

    throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`);
  }

  return validatedConfig;
}
