import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SafetyIncident, SafetyIncidentDocument, IncidentType, IncidentSeverity, IncidentStatus } from './schema/safety-incident.schema';

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

@Injectable()
export class SafetyService {
  constructor(
    @InjectModel(SafetyIncident.name)
    private incidentModel: Model<SafetyIncidentDocument>,
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
}
