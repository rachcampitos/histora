import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeviceTokenDocument = DeviceToken & Document;

@Schema({ timestamps: true })
export class DeviceToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true, enum: ['ios', 'android', 'web'] })
  platform: 'ios' | 'android' | 'web';

  @Prop({ type: Object })
  deviceInfo?: {
    model?: string;
    osVersion?: string;
    appVersion?: string;
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastUsedAt?: Date;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);

// Compound index for unique token per user
DeviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });
