import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SafetyIncidentDocument = SafetyIncident & Document;

export enum IncidentType {
  VERBAL_HARASSMENT = 'verbal_harassment',
  PHYSICAL_HARASSMENT = 'physical_harassment',
  SEXUAL_HARASSMENT = 'sexual_harassment',
  UNSAFE_ENVIRONMENT = 'unsafe_environment',
  THREATENING_BEHAVIOR = 'threatening_behavior',
  INTOXICATION = 'intoxication',
  THEFT_ATTEMPT = 'theft_attempt',
  FALSE_ADDRESS = 'false_address',
  THIRD_PARTY_THREAT = 'third_party_threat',
  OTHER = 'other',
}

export enum IncidentSeverity {
  YELLOW_FLAG = 'yellow_flag', // Warning, minor incident
  RED_FLAG = 'red_flag', // Serious incident, immediate action
}

export enum IncidentStatus {
  PENDING = 'pending',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Schema({ timestamps: true })
export class SafetyIncident {
  @Prop({ type: Types.ObjectId, ref: 'ServiceRequest' })
  serviceRequestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporterId: Types.ObjectId; // Nurse who reported

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reportedUserId: Types.ObjectId; // Patient being reported

  @Prop({ required: true, enum: Object.values(IncidentType) })
  incidentType: IncidentType;

  @Prop({ required: true, enum: Object.values(IncidentSeverity) })
  severity: IncidentSeverity;

  @Prop({ required: true, maxlength: 2000 })
  description: string;

  @Prop({ type: [String], default: [] })
  evidenceUrls: string[]; // Photos, screenshots, etc.

  @Prop({ type: [String], default: [] })
  evidencePublicIds: string[]; // Cloudinary public IDs

  @Prop()
  audioRecordingUrl: string; // If panic button with audio was activated

  @Prop({ type: Object })
  locationAtIncident: {
    latitude: number;
    longitude: number;
    address: string;
  };

  @Prop({ required: true, enum: Object.values(IncidentStatus), default: IncidentStatus.PENDING })
  status: IncidentStatus;

  @Prop()
  resolution: string;

  @Prop({ enum: ['warning', 'suspension', 'permanent_ban', 'no_action'] })
  actionTaken: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedBy: Types.ObjectId;

  @Prop()
  resolvedAt: Date;

  @Prop({ type: [Object], default: [] })
  timeline: {
    action: string;
    performedBy: Types.ObjectId;
    timestamp: Date;
    notes: string;
  }[];

  @Prop({ default: false })
  policeReportFiled: boolean;

  @Prop()
  policeReportNumber: string;

  @Prop({ default: false })
  requiresFollowUp: boolean;

  @Prop()
  followUpDate: Date;

  @Prop()
  followUpNotes: string;
}

export const SafetyIncidentSchema = SchemaFactory.createForClass(SafetyIncident);

// Indexes
SafetyIncidentSchema.index({ reporterId: 1 });
SafetyIncidentSchema.index({ reportedUserId: 1 });
SafetyIncidentSchema.index({ serviceRequestId: 1 });
SafetyIncidentSchema.index({ status: 1 });
SafetyIncidentSchema.index({ severity: 1 });
SafetyIncidentSchema.index({ createdAt: -1 });
SafetyIncidentSchema.index({ reportedUserId: 1, severity: 1 });
