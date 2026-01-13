import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ServiceTracking,
  ServiceTrackingDocument,
  TrackingEventType,
  PanicAlertLevel,
  PanicAlertStatus,
} from './schema/service-tracking.schema';

export interface StartTrackingDto {
  serviceRequestId: string;
  patientId: string;
  patientAddress: {
    addressLine: string;
    district: string;
    latitude: number;
    longitude: number;
    safetyZone: string;
  };
  checkInIntervalMinutes?: number;
}

export interface LocationUpdateDto {
  latitude: number;
  longitude: number;
  accuracy?: number;
  batteryLevel?: number;
}

export interface CheckInDto extends LocationUpdateDto {
  message?: string;
}

export interface PanicAlertDto {
  level: PanicAlertLevel;
  latitude: number;
  longitude: number;
}

export interface ShareTrackingDto {
  name: string;
  phone: string;
  relationship: string;
}

@Injectable()
export class TrackingService {
  constructor(
    @InjectModel(ServiceTracking.name)
    private trackingModel: Model<ServiceTrackingDocument>,
  ) {}

  async startTracking(nurseId: string, dto: StartTrackingDto): Promise<ServiceTracking> {
    // Check if tracking already exists for this service
    const existing = await this.trackingModel.findOne({
      serviceRequestId: new Types.ObjectId(dto.serviceRequestId),
    });

    if (existing && existing.isActive) {
      throw new BadRequestException('Ya existe un tracking activo para este servicio');
    }

    const checkInInterval = dto.checkInIntervalMinutes || 30;
    const nextCheckInDue = new Date(Date.now() + checkInInterval * 60 * 1000);

    const tracking = new this.trackingModel({
      serviceRequestId: new Types.ObjectId(dto.serviceRequestId),
      nurseId: new Types.ObjectId(nurseId),
      patientId: new Types.ObjectId(dto.patientId),
      patientAddress: dto.patientAddress,
      isActive: true,
      startedAt: new Date(),
      checkInIntervalMinutes: checkInInterval,
      nextCheckInDue,
      events: [{
        type: TrackingEventType.SERVICE_STARTED,
        latitude: dto.patientAddress.latitude,
        longitude: dto.patientAddress.longitude,
        timestamp: new Date(),
        metadata: { message: 'Servicio iniciado' },
      }],
    });

    return tracking.save();
  }

  async checkIn(serviceRequestId: string, nurseId: string, dto: CheckInDto): Promise<ServiceTracking> {
    const tracking = await this.getActiveTracking(serviceRequestId, nurseId);

    // Add check-in event
    tracking.events.push({
      type: TrackingEventType.CHECK_IN,
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy,
      batteryLevel: dto.batteryLevel,
      timestamp: new Date(),
      metadata: { message: dto.message || 'Check-in realizado' },
    });

    // Update last known location
    tracking.lastKnownLocation = {
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy || 0,
      timestamp: new Date(),
    };
    tracking.lastLocationUpdate = new Date();

    // Reset next check-in time
    tracking.nextCheckInDue = new Date(Date.now() + tracking.checkInIntervalMinutes * 60 * 1000);
    tracking.missedCheckIns = 0;

    return tracking.save();
  }

  async checkOut(serviceRequestId: string, nurseId: string, dto: LocationUpdateDto): Promise<ServiceTracking> {
    const tracking = await this.getActiveTracking(serviceRequestId, nurseId);

    // Add check-out event
    tracking.events.push({
      type: TrackingEventType.CHECK_OUT,
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy,
      batteryLevel: dto.batteryLevel,
      timestamp: new Date(),
      metadata: { message: 'Servicio completado' },
    });

    tracking.events.push({
      type: TrackingEventType.SERVICE_COMPLETED,
      latitude: dto.latitude,
      longitude: dto.longitude,
      timestamp: new Date(),
      metadata: {},
    });

    tracking.isActive = false;
    tracking.completedAt = new Date();

    return tracking.save();
  }

  async updateLocation(serviceRequestId: string, nurseId: string, dto: LocationUpdateDto): Promise<ServiceTracking> {
    const tracking = await this.getActiveTracking(serviceRequestId, nurseId);

    // Add location event
    tracking.events.push({
      type: TrackingEventType.LOCATION_UPDATE,
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy,
      batteryLevel: dto.batteryLevel,
      timestamp: new Date(),
      metadata: {},
    });

    // Update last known location
    tracking.lastKnownLocation = {
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy || 0,
      timestamp: new Date(),
    };
    tracking.lastLocationUpdate = new Date();

    return tracking.save();
  }

  async activatePanicButton(serviceRequestId: string, nurseId: string, dto: PanicAlertDto): Promise<ServiceTracking> {
    const tracking = await this.getActiveTracking(serviceRequestId, nurseId);

    const eventType = dto.level === PanicAlertLevel.EMERGENCY
      ? TrackingEventType.PANIC_BUTTON_EMERGENCY
      : TrackingEventType.PANIC_BUTTON_HELP;

    // Add panic event
    tracking.events.push({
      type: eventType,
      latitude: dto.latitude,
      longitude: dto.longitude,
      timestamp: new Date(),
      metadata: { level: dto.level },
    });

    // Add panic alert record
    tracking.panicAlerts.push({
      level: dto.level,
      activatedAt: new Date(),
      latitude: dto.latitude,
      longitude: dto.longitude,
      status: PanicAlertStatus.ACTIVE,
      notifiedContacts: [],
      policeNotified: dto.level === PanicAlertLevel.EMERGENCY,
    });

    // TODO: Send notifications
    // - Notify emergency contacts
    // - Notify Histora Care monitoring center
    // - If EMERGENCY level, notify police (105)

    return tracking.save();
  }

  async respondToPanicAlert(
    serviceRequestId: string,
    respondedBy: string,
    resolution: string,
  ): Promise<ServiceTracking> {
    const tracking = await this.trackingModel.findOne({
      serviceRequestId: new Types.ObjectId(serviceRequestId),
    });

    if (!tracking) {
      throw new NotFoundException('Tracking no encontrado');
    }

    // Find the active panic alert
    const activeAlert = tracking.panicAlerts.find(a => a.status === PanicAlertStatus.ACTIVE);
    if (!activeAlert) {
      throw new BadRequestException('No hay alerta de pánico activa');
    }

    activeAlert.status = PanicAlertStatus.RESPONDED;
    activeAlert.respondedAt = new Date();
    activeAlert.respondedBy = respondedBy;
    activeAlert.resolution = resolution;

    return tracking.save();
  }

  async shareTracking(serviceRequestId: string, nurseId: string, dto: ShareTrackingDto): Promise<ServiceTracking> {
    const tracking = await this.getActiveTracking(serviceRequestId, nurseId);

    // Generate unique tracking URL
    const trackingToken = this.generateTrackingToken();
    const trackingUrl = `https://care.historahealth.com/track/${trackingToken}`;

    tracking.sharedWith.push({
      name: dto.name,
      phone: dto.phone,
      relationship: dto.relationship,
      trackingUrl,
      notifiedAt: new Date(),
      isActive: true,
    });

    // TODO: Send SMS/notification to the contact with the tracking URL

    return tracking.save();
  }

  async getTracking(serviceRequestId: string): Promise<ServiceTracking> {
    const tracking = await this.trackingModel.findOne({
      serviceRequestId: new Types.ObjectId(serviceRequestId),
    });

    if (!tracking) {
      throw new NotFoundException('Tracking no encontrado');
    }

    return tracking;
  }

  async getActiveTrackingForNurse(nurseId: string): Promise<ServiceTracking | null> {
    return this.trackingModel.findOne({
      nurseId: new Types.ObjectId(nurseId),
      isActive: true,
    });
  }

  async getMissedCheckIns(): Promise<ServiceTracking[]> {
    return this.trackingModel.find({
      isActive: true,
      nextCheckInDue: { $lt: new Date() },
    }).populate('nurseId', 'firstName lastName phone');
  }

  async incrementMissedCheckIn(serviceRequestId: string): Promise<void> {
    await this.trackingModel.updateOne(
      { serviceRequestId: new Types.ObjectId(serviceRequestId) },
      { $inc: { missedCheckIns: 1 } },
    );
  }

  private async getActiveTracking(serviceRequestId: string, nurseId: string): Promise<ServiceTrackingDocument> {
    const tracking = await this.trackingModel.findOne({
      serviceRequestId: new Types.ObjectId(serviceRequestId),
      nurseId: new Types.ObjectId(nurseId),
      isActive: true,
    });

    if (!tracking) {
      throw new NotFoundException('Tracking activo no encontrado');
    }

    return tracking;
  }

  private generateTrackingToken(): string {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  }
}
