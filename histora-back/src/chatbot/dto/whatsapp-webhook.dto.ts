import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Meta WhatsApp Cloud API Webhook DTOs

export class WhatsAppProfile {
  @IsString()
  name: string;
}

export class WhatsAppContact {
  @ValidateNested()
  @Type(() => WhatsAppProfile)
  profile: WhatsAppProfile;

  @IsString()
  wa_id: string;
}

export class WhatsAppTextMessage {
  @IsString()
  body: string;
}

export class WhatsAppButtonReply {
  @IsString()
  id: string;

  @IsString()
  title: string;
}

export class WhatsAppInteractive {
  @IsString()
  type: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppButtonReply)
  button_reply?: WhatsAppButtonReply;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppButtonReply)
  list_reply?: WhatsAppButtonReply;
}

export class WhatsAppMessage {
  @IsString()
  from: string;

  @IsString()
  id: string;

  @IsString()
  timestamp: string;

  @IsString()
  type: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppTextMessage)
  text?: WhatsAppTextMessage;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppInteractive)
  interactive?: WhatsAppInteractive;
}

export class WhatsAppMetadata {
  @IsString()
  display_phone_number: string;

  @IsString()
  phone_number_id: string;
}

export class WhatsAppValue {
  @IsString()
  messaging_product: string;

  @ValidateNested()
  @Type(() => WhatsAppMetadata)
  metadata: WhatsAppMetadata;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppContact)
  contacts?: WhatsAppContact[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppMessage)
  messages?: WhatsAppMessage[];
}

export class WhatsAppChange {
  @IsString()
  field: string;

  @ValidateNested()
  @Type(() => WhatsAppValue)
  value: WhatsAppValue;
}

export class WhatsAppEntry {
  @IsString()
  id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppChange)
  changes: WhatsAppChange[];
}

export class WhatsAppWebhookDto {
  @IsString()
  object: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppEntry)
  entry: WhatsAppEntry[];
}

// Outgoing message DTOs
export class SendMessageDto {
  phoneNumber: string;
  message: string;
}

export class SendButtonMessageDto {
  phoneNumber: string;
  bodyText: string;
  buttons: Array<{
    id: string;
    title: string;
  }>;
}

export class SendListMessageDto {
  phoneNumber: string;
  headerText: string;
  bodyText: string;
  footerText?: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
}
