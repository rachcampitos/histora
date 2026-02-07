import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VerificationCodeDocument = VerificationCode & Document;

@Schema({ timestamps: true })
export class VerificationCode {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true, index: true, expires: 0 })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;
}

export const VerificationCodeSchema = SchemaFactory.createForClass(VerificationCode);
