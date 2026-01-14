import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PanicAlertDocument = PanicAlert & Document;

export enum PanicAlertLevel {
  HELP_NEEDED = 'help_needed', // Need assistance but not emergency
  EMERGENCY = 'emergency', // Immediate danger - call police
}

export enum PanicAlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESPONDING = 'responding',
  RESOLVED = 'resolved',
  FALSE_ALARM = 'false_alarm',
}

@Schema({ timestamps: true })
export class PanicAlert {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  nurseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ServiceRequest' })
  serviceRequestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  patientId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(PanicAlertLevel) })
  level: PanicAlertLevel;

  @Prop({ required: true, enum: Object.values(PanicAlertStatus), default: PanicAlertStatus.ACTIVE })
  status: PanicAlertStatus;

  @Prop({ type: Object, required: true })
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };

  @Prop()
  message: string; // Optional message from nurse

  @Prop()
  audioRecordingUrl: string; // Auto-recorded audio if enabled

  @Prop()
  audioPublicId: string;

  // Emergency contacts notified
  @Prop({ type: [Object], default: [] })
  contactsNotified: {
    name: string;
    phone: string;
    relationship: string;
    notifiedAt: Date;
    method: 'sms' | 'call' | 'push';
  }[];

  // Response timeline
  @Prop({ type: [Object], default: [] })
  timeline: {
    action: string;
    performedBy?: Types.ObjectId;
    timestamp: Date;
    notes?: string;
  }[];

  @Prop()
  acknowledgedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  acknowledgedBy: Types.ObjectId;

  @Prop()
  resolvedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedBy: Types.ObjectId;

  @Prop()
  resolution: string;

  @Prop({ default: false })
  policeContacted: boolean;

  @Prop()
  policeIncidentNumber: string;

  // Device info for tracking
  @Prop({ type: Object })
  deviceInfo: {
    platform: string;
    deviceId?: string;
    batteryLevel?: number;
  };
}

export const PanicAlertSchema = SchemaFactory.createForClass(PanicAlert);

// Indexes for fast queries
PanicAlertSchema.index({ nurseId: 1 });
PanicAlertSchema.index({ status: 1 });
PanicAlertSchema.index({ level: 1 });
PanicAlertSchema.index({ createdAt: -1 });
PanicAlertSchema.index({ serviceRequestId: 1 });
PanicAlertSchema.index({ status: 1, level: 1 }); // For finding active emergencies
