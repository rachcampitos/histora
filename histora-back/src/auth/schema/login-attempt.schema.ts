import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LoginAttemptDocument = LoginAttempt & Document;

/**
 * Schema for tracking login attempts and account lockouts
 * Persisted in MongoDB to survive server restarts and support horizontal scaling
 */
@Schema({ timestamps: true })
export class LoginAttempt {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  identifier: string; // Email or IP address

  @Prop({ default: 0 })
  attempts: number;

  @Prop()
  lockedUntil?: Date;

  @Prop({ default: Date.now })
  lastAttempt: Date;
}

export const LoginAttemptSchema = SchemaFactory.createForClass(LoginAttempt);

// TTL index: automatically delete entries after 24 hours of inactivity
LoginAttemptSchema.index({ lastAttempt: 1 }, { expireAfterSeconds: 86400 });
// Note: identifier already has index via unique: true in @Prop decorator
