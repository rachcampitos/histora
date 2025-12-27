import { IsBoolean, IsOptional, IsString, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { NotificationChannel } from '../schema/notification.schema';

class ChannelPreferenceDto {
  @ApiPropertyOptional({ description: 'Enable/disable this channel' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Channel value (email, phone, device token)' })
  @IsOptional()
  @IsString()
  value?: string;
}

class TypePreferenceDto {
  @ApiPropertyOptional({ description: 'Enable/disable this notification type' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ enum: NotificationChannel, isArray: true, description: 'Channels to use for this type' })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Email channel preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferenceDto)
  email?: ChannelPreferenceDto;

  @ApiPropertyOptional({ description: 'SMS channel preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferenceDto)
  sms?: ChannelPreferenceDto;

  @ApiPropertyOptional({ description: 'WhatsApp channel preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferenceDto)
  whatsapp?: ChannelPreferenceDto;

  @ApiPropertyOptional({ description: 'Push notification preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferenceDto)
  push?: ChannelPreferenceDto;

  @ApiPropertyOptional({ description: 'In-app notification preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelPreferenceDto)
  inApp?: ChannelPreferenceDto;

  @ApiPropertyOptional({ description: 'Appointment reminder preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TypePreferenceDto)
  appointmentReminders?: TypePreferenceDto;

  @ApiPropertyOptional({ description: 'Appointment confirmation preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TypePreferenceDto)
  appointmentConfirmations?: TypePreferenceDto;

  @ApiPropertyOptional({ description: 'Appointment cancellation preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TypePreferenceDto)
  appointmentCancellations?: TypePreferenceDto;

  @ApiPropertyOptional({ description: 'Consultation update preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TypePreferenceDto)
  consultationUpdates?: TypePreferenceDto;

  @ApiPropertyOptional({ description: 'Lab results preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TypePreferenceDto)
  labResults?: TypePreferenceDto;

  @ApiPropertyOptional({ description: 'Payment notification preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TypePreferenceDto)
  paymentNotifications?: TypePreferenceDto;

  @ApiPropertyOptional({ description: 'Marketing email preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TypePreferenceDto)
  marketingEmails?: TypePreferenceDto;

  @ApiPropertyOptional({ description: 'Enable quiet hours' })
  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Quiet hours start time (HH:mm)' })
  @IsOptional()
  @IsString()
  quietHoursStart?: string;

  @ApiPropertyOptional({ description: 'Quiet hours end time (HH:mm)' })
  @IsOptional()
  @IsString()
  quietHoursEnd?: string;

  @ApiPropertyOptional({ description: 'User timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class RegisterDeviceDto {
  @ApiPropertyOptional({ description: 'FCM device token for push notifications' })
  @IsString()
  deviceToken: string;

  @ApiPropertyOptional({ description: 'Device platform (ios, android, web)' })
  @IsOptional()
  @IsString()
  platform?: string;
}
