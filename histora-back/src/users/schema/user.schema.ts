import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  PLATFORM_ADMIN = 'platform_admin',
  CLINIC_OWNER = 'clinic_owner',
  CLINIC_DOCTOR = 'clinic_doctor',
  CLINIC_STAFF = 'clinic_staff',
  PATIENT = 'patient',
}

@Schema({ timestamps: true })
export class User {
  _id: any;
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.PATIENT,
  })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Clinic' })
  clinicId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Doctor' })
  doctorProfileId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient' })
  patientProfileId?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop()
  refreshToken?: string;

  @Prop()
  refreshTokenExpires?: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  avatar?: string;

  @Prop()
  avatarPublicId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Additional indexes (email already indexed via unique: true)
UserSchema.index({ clinicId: 1 });
UserSchema.index({ role: 1 });
