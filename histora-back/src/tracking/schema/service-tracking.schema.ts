import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ServiceTrackingDocument = ServiceTracking & Document;

export enum TrackingEventType {
  CHECK_IN = 'check_in',
  CHECK_OUT = 'check_out',
  LOCATION_UPDATE = 'location_update',
  AUTO_CHECK = 'auto_check',
  PANIC_BUTTON_HELP = 'panic_button_help',
  PANIC_BUTTON_EMERGENCY = 'panic_button_emergency',
  PANIC_CANCELLED = 'panic_cancelled',
  SERVICE_STARTED = 'service_started',
  SERVICE_COMPLETED = 'service_completed',
  SERVICE_PAUSED = 'service_paused',
  SERVICE_RESUMED = 'service_resumed',
}

export enum PanicAlertLevel {
  HELP_NEEDED = 'help_needed', // Orange button - needs assistance
  EMERGENCY = 'emergency', // Red button - critical emergency
}

export enum PanicAlertStatus {
  ACTIVE = 'active',
  RESPONDED = 'responded',
  RESOLVED = 'resolved',
  FALSE_ALARM = 'false_alarm',
}

@Schema({ _id: false })
export class TrackingEvent {
  @Prop({ required: true, enum: Object.values(TrackingEventType) })
  type: TrackingEventType;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ type: Object })
  metadata: Record<string, unknown>;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop()
  batteryLevel?: number; // Track nurse's phone battery

  @Prop()
  accuracy?: number; // GPS accuracy in meters
}

@Schema({ _id: false })
export class PanicAlert {
  @Prop({ required: true, enum: Object.values(PanicAlertLevel) })
  level: PanicAlertLevel;

  @Prop({ required: true })
  activatedAt: Date;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ enum: Object.values(PanicAlertStatus), default: PanicAlertStatus.ACTIVE })
  status: PanicAlertStatus;

  @Prop()
  respondedAt?: Date;

  @Prop()
  respondedBy?: string; // Name of responder

  @Prop()
  resolution?: string;

  @Prop()
  audioRecordingUrl?: string;

  @Prop({ type: [String], default: [] })
  notifiedContacts: string[]; // Phone numbers notified

  @Prop({ default: false })
  policeNotified: boolean;

  @Prop()
  policeResponseTime?: number; // Minutes

  @Prop()
  notes?: string;
}

@Schema({ _id: false })
export class SharedWithContact {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop()
  phone: string;

  @Prop()
  name: string;

  @Prop({ required: true })
  relationship: string;

  @Prop({ required: true, default: Date.now })
  notifiedAt: Date;

  @Prop({ required: true })
  token: string; // Unique token for this contact to access tracking

  @Prop()
  trackingUrl: string; // Full URL for this contact to track

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  expiresAt?: Date; // Optional expiration
}

@Schema({ timestamps: true })
export class ServiceTracking {
  @Prop({ type: Types.ObjectId, ref: 'ServiceRequest', required: true, unique: true })
  serviceRequestId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  nurseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId: Types.ObjectId;

  @Prop({ type: [TrackingEvent], default: [] })
  events: TrackingEvent[];

  @Prop({ type: [PanicAlert], default: [] })
  panicAlerts: PanicAlert[];

  @Prop({ type: [SharedWithContact], default: [] })
  sharedWith: SharedWithContact[];

  @Prop()
  startedAt: Date;

  @Prop()
  completedAt: Date;

  @Prop({ default: false })
  isActive: boolean;

  @Prop()
  lastLocationUpdate: Date;

  @Prop({ type: Object })
  lastKnownLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
  };

  @Prop({ default: 30 })
  checkInIntervalMinutes: number; // How often auto check-in is required

  @Prop()
  nextCheckInDue: Date;

  @Prop({ default: 0 })
  missedCheckIns: number;

  @Prop({ default: false })
  audioRecordingEnabled: boolean;

  @Prop({ type: [String], default: [] })
  audioRecordingUrls: string[];

  @Prop({ type: Object })
  patientAddress: {
    addressLine: string;
    district: string;
    latitude: number;
    longitude: number;
    safetyZone: string;
  };
}

export const ServiceTrackingSchema = SchemaFactory.createForClass(ServiceTracking);

// Indexes
ServiceTrackingSchema.index({ serviceRequestId: 1 }, { unique: true });
ServiceTrackingSchema.index({ nurseId: 1 });
ServiceTrackingSchema.index({ patientId: 1 });
ServiceTrackingSchema.index({ isActive: 1 });
ServiceTrackingSchema.index({ 'panicAlerts.status': 1 });
ServiceTrackingSchema.index({ nextCheckInDue: 1, isActive: 1 });
ServiceTrackingSchema.index({ 'sharedWith.token': 1 }); // For public tracking lookup
