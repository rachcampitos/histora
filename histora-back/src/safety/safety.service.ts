import { Injectable, NotFoundException, Inject, forwardRef, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SafetyIncident, SafetyIncidentDocument, IncidentType, IncidentSeverity, IncidentStatus } from './schema/safety-incident.schema';
import { PanicAlert, PanicAlertDocument, PanicAlertLevel, PanicAlertStatus } from './schema/panic-alert.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminNotificationsGateway } from '../admin/admin-notifications.gateway';

export interface ReportIncidentDto {
  serviceRequestId?: string;
  reportedUserId: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  description: string;
  evidenceUrls?: string[];
  locationAtIncident?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface UpdateIncidentDto {
  status?: IncidentStatus;
  resolution?: string;
  actionTaken?: 'warning' | 'suspension' | 'permanent_ban' | 'no_action';
  policeReportFiled?: boolean;
  policeReportNumber?: string;
  requiresFollowUp?: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
}

export interface TriggerPanicDto {
  level: PanicAlertLevel;
  serviceRequestId?: string;
  patientId?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  message?: string;
  deviceInfo?: {
    platform: string;
    deviceId?: string;
    batteryLevel?: number;
  };
}

export interface UpdatePanicAlertDto {
  status?: PanicAlertStatus;
  resolution?: string;
  policeContacted?: boolean;
  policeIncidentNumber?: string;
}

@Injectable()
export class SafetyService {
  constructor(
    @InjectModel(SafetyIncident.name)
    private incidentModel: Model<SafetyIncidentDocument>,
    @InjectModel(PanicAlert.name)
    private panicAlertModel: Model<PanicAlertDocument>,
    private notificationsService: NotificationsService,
    @Optional() @Inject(forwardRef(() => AdminNotificationsGateway))
    private adminNotifications?: AdminNotificationsGateway,
  ) {}

  async reportIncident(reporterId: string, dto: ReportIncidentDto): Promise<SafetyIncident> {
    const incident = new this.incidentModel({
      serviceRequestId: dto.serviceRequestId ? new Types.ObjectId(dto.serviceRequestId) : undefined,
      reporterId: new Types.ObjectId(reporterId),
      reportedUserId: new Types.ObjectId(dto.reportedUserId),
      incidentType: dto.incidentType,
      severity: dto.severity,
      description: dto.description,
      evidenceUrls: dto.evidenceUrls || [],
      locationAtIncident: dto.locationAtIncident,
      status: IncidentStatus.PENDING,
      timeline: [{
        action: 'Incident reported',
        performedBy: new Types.ObjectId(reporterId),
        timestamp: new Date(),
        notes: '',
      }],
    });

    return incident.save();
  }

  async findById(incidentId: string): Promise<SafetyIncident> {
    const incident = await this.incidentModel.findById(incidentId)
      .populate('reporterId', 'firstName lastName email')
      .populate('reportedUserId', 'firstName lastName email');

    if (!incident) {
      throw new NotFoundException('Incidente no encontrado');
    }

    return incident;
  }

  async findByPatient(patientId: string): Promise<SafetyIncident[]> {
    return this.incidentModel.find({
      reportedUserId: new Types.ObjectId(patientId),
    }).sort({ createdAt: -1 });
  }

  async findPending(): Promise<SafetyIncident[]> {
    return this.incidentModel.find({
      status: { $in: [IncidentStatus.PENDING, IncidentStatus.INVESTIGATING] },
    })
      .sort({ severity: -1, createdAt: 1 })
      .populate('reporterId', 'firstName lastName')
      .populate('reportedUserId', 'firstName lastName');
  }

  async updateIncident(
    incidentId: string,
    adminId: string,
    dto: UpdateIncidentDto,
  ): Promise<SafetyIncident> {
    const incident = await this.incidentModel.findById(incidentId);

    if (!incident) {
      throw new NotFoundException('Incidente no encontrado');
    }

    // Add timeline entry
    incident.timeline.push({
      action: `Status updated to ${dto.status || incident.status}`,
      performedBy: new Types.ObjectId(adminId),
      timestamp: new Date(),
      notes: dto.resolution || '',
    });

    // Update fields
    if (dto.status) {
      incident.status = dto.status;
      if (dto.status === IncidentStatus.RESOLVED) {
        incident.resolvedAt = new Date();
        incident.resolvedBy = new Types.ObjectId(adminId);
      }
    }

    if (dto.resolution) incident.resolution = dto.resolution;
    if (dto.actionTaken) incident.actionTaken = dto.actionTaken;
    if (dto.policeReportFiled !== undefined) incident.policeReportFiled = dto.policeReportFiled;
    if (dto.policeReportNumber) incident.policeReportNumber = dto.policeReportNumber;
    if (dto.requiresFollowUp !== undefined) incident.requiresFollowUp = dto.requiresFollowUp;
    if (dto.followUpDate) incident.followUpDate = dto.followUpDate;
    if (dto.followUpNotes) incident.followUpNotes = dto.followUpNotes;

    return incident.save();
  }

  async getIncidentStats(patientId: string): Promise<{ yellow: number; red: number; total: number }> {
    const incidents = await this.incidentModel.find({
      reportedUserId: new Types.ObjectId(patientId),
    });

    return {
      yellow: incidents.filter(i => i.severity === IncidentSeverity.YELLOW_FLAG).length,
      red: incidents.filter(i => i.severity === IncidentSeverity.RED_FLAG).length,
      total: incidents.length,
    };
  }

  // ==================== PANIC ALERT METHODS ====================

  /**
   * Trigger a panic alert - high priority endpoint
   */
  async triggerPanicAlert(nurseId: string, dto: TriggerPanicDto): Promise<PanicAlert> {
    const alert = new this.panicAlertModel({
      nurseId: new Types.ObjectId(nurseId),
      serviceRequestId: dto.serviceRequestId ? new Types.ObjectId(dto.serviceRequestId) : undefined,
      patientId: dto.patientId ? new Types.ObjectId(dto.patientId) : undefined,
      level: dto.level,
      status: PanicAlertStatus.ACTIVE,
      location: dto.location,
      message: dto.message,
      deviceInfo: dto.deviceInfo,
      timeline: [{
        action: dto.level === PanicAlertLevel.EMERGENCY
          ? 'EMERGENCY panic button activated'
          : 'Help needed alert triggered',
        timestamp: new Date(),
      }],
    });

    const savedAlert = await alert.save();

    // Notify platform admins immediately
    await this.notifyAdminsOfPanicAlert(savedAlert);

    // TODO: Send SMS to emergency contacts
    // TODO: Send push notification to emergency contacts

    return savedAlert;
  }

  /**
   * Get active panic alert for a nurse (if any)
   */
  async getActivePanicAlert(nurseId: string): Promise<PanicAlert | null> {
    return this.panicAlertModel.findOne({
      nurseId: new Types.ObjectId(nurseId),
      status: { $in: [PanicAlertStatus.ACTIVE, PanicAlertStatus.ACKNOWLEDGED, PanicAlertStatus.RESPONDING] },
    }).sort({ createdAt: -1 });
  }

  /**
   * Cancel a panic alert (false alarm)
   */
  async cancelPanicAlert(alertId: string, nurseId: string): Promise<PanicAlert> {
    const alert = await this.panicAlertModel.findOne({
      _id: alertId,
      nurseId: new Types.ObjectId(nurseId),
      status: { $in: [PanicAlertStatus.ACTIVE, PanicAlertStatus.ACKNOWLEDGED] },
    });

    if (!alert) {
      throw new NotFoundException('Alerta no encontrada o ya resuelta');
    }

    alert.status = PanicAlertStatus.FALSE_ALARM;
    alert.resolvedAt = new Date();
    alert.resolution = 'Cancelada por la enfermera (falsa alarma)';
    alert.timeline.push({
      action: 'Alert cancelled by nurse',
      performedBy: new Types.ObjectId(nurseId),
      timestamp: new Date(),
      notes: 'False alarm',
    });

    return alert.save();
  }

  /**
   * Acknowledge a panic alert (admin action)
   */
  async acknowledgePanicAlert(alertId: string, adminId: string): Promise<PanicAlert> {
    const alert = await this.panicAlertModel.findById(alertId);

    if (!alert) {
      throw new NotFoundException('Alerta no encontrada');
    }

    alert.status = PanicAlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = new Types.ObjectId(adminId);
    alert.timeline.push({
      action: 'Alert acknowledged by admin',
      performedBy: new Types.ObjectId(adminId),
      timestamp: new Date(),
    });

    return alert.save();
  }

  /**
   * Update panic alert status (admin action)
   */
  async updatePanicAlert(alertId: string, adminId: string, dto: UpdatePanicAlertDto): Promise<PanicAlert> {
    const alert = await this.panicAlertModel.findById(alertId);

    if (!alert) {
      throw new NotFoundException('Alerta no encontrada');
    }

    if (dto.status) {
      alert.status = dto.status;
      if (dto.status === PanicAlertStatus.RESOLVED) {
        alert.resolvedAt = new Date();
        alert.resolvedBy = new Types.ObjectId(adminId);
      }
    }

    if (dto.resolution) alert.resolution = dto.resolution;
    if (dto.policeContacted !== undefined) alert.policeContacted = dto.policeContacted;
    if (dto.policeIncidentNumber) alert.policeIncidentNumber = dto.policeIncidentNumber;

    alert.timeline.push({
      action: `Alert updated: ${dto.status || 'status unchanged'}`,
      performedBy: new Types.ObjectId(adminId),
      timestamp: new Date(),
      notes: dto.resolution || '',
    });

    return alert.save();
  }

  /**
   * Get all active panic alerts (for admin dashboard)
   */
  async getActivePanicAlerts(): Promise<PanicAlert[]> {
    return this.panicAlertModel.find({
      status: { $in: [PanicAlertStatus.ACTIVE, PanicAlertStatus.ACKNOWLEDGED, PanicAlertStatus.RESPONDING] },
    })
      .sort({ level: -1, createdAt: 1 }) // Emergencies first, then by time
      .populate('nurseId', 'firstName lastName phone avatar')
      .populate('patientId', 'firstName lastName phone');
  }

  /**
   * Get panic alert history for a nurse
   */
  async getPanicAlertHistory(nurseId: string): Promise<PanicAlert[]> {
    return this.panicAlertModel.find({
      nurseId: new Types.ObjectId(nurseId),
    }).sort({ createdAt: -1 }).limit(20);
  }

  /**
   * Notify admins of a panic alert
   */
  private async notifyAdminsOfPanicAlert(alert: PanicAlert): Promise<void> {
    try {
      const levelText = alert.level === PanicAlertLevel.EMERGENCY
        ? 'EMERGENCIA'
        : 'Ayuda necesaria';

      console.log(`[PANIC ALERT] ${levelText} triggered by nurse ${alert.nurseId}`);

      // Send real-time WebSocket notification to all connected admins
      if (this.adminNotifications) {
        this.adminNotifications.notifyPanicAlert({
          id: (alert as any)._id.toString(),
          nurseName: 'Enfermera', // Would need to populate nurse name
          patientName: 'Paciente', // Would need to populate patient name
          location: alert.location ? {
            lat: alert.location.latitude,
            lng: alert.location.longitude,
          } : undefined,
        });
      }
    } catch (error) {
      console.error('Error notifying admins of panic alert:', error);
    }
  }
}
