import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Consultation, ConsultationDocument, ConsultationStatus } from './schema/consultation.schema';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import {
  UpdateConsultationDto,
  CompleteConsultationDto,
  UpdateConsultationStatusDto,
  AddExamResultsDto,
} from './dto/update-consultation.dto';

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectModel(Consultation.name) private consultationModel: Model<ConsultationDocument>,
  ) {}

  async create(clinicId: string, createConsultationDto: CreateConsultationDto): Promise<Consultation> {
    const consultation = new this.consultationModel({
      ...createConsultationDto,
      clinicId,
      date: createConsultationDto.date ? new Date(createConsultationDto.date) : new Date(),
      status: createConsultationDto.status || ConsultationStatus.SCHEDULED,
    });
    return consultation.save();
  }

  async createFromAppointment(
    clinicId: string,
    appointmentId: string,
    appointmentData: {
      patientId: string;
      doctorId: string;
      reasonForVisit?: string;
    },
  ): Promise<Consultation> {
    const existingConsultation = await this.consultationModel.findOne({
      clinicId,
      appointmentId,
      isDeleted: false,
    });

    if (existingConsultation) {
      throw new BadRequestException('A consultation already exists for this appointment');
    }

    const consultation = new this.consultationModel({
      clinicId,
      appointmentId,
      patientId: appointmentData.patientId,
      doctorId: appointmentData.doctorId,
      chiefComplaint: appointmentData.reasonForVisit || 'Consulta de rutina',
      date: new Date(),
      status: ConsultationStatus.IN_PROGRESS,
    });

    return consultation.save();
  }

  async findAll(
    clinicId: string,
    filters?: {
      patientId?: string;
      doctorId?: string;
      status?: ConsultationStatus;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<Consultation[]> {
    const query: any = { clinicId, isDeleted: false };

    if (filters?.patientId) {
      query.patientId = filters.patientId;
    }

    if (filters?.doctorId) {
      query.doctorId = filters.doctorId;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.date.$lte = filters.endDate;
      }
    }

    return this.consultationModel
      .find(query)
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ date: -1 })
      .exec();
  }

  async findOne(id: string, clinicId: string): Promise<Consultation> {
    const consultation = await this.consultationModel
      .findOne({ _id: id, clinicId, isDeleted: false })
      .populate('patientId', 'firstName lastName dateOfBirth gender')
      .populate('doctorId', 'firstName lastName specialty')
      .populate('vitalsId')
      .exec();

    if (!consultation) {
      throw new NotFoundException(`Consultation with ID ${id} not found`);
    }

    return consultation;
  }

  async findByPatient(clinicId: string, patientId: string, limit?: number): Promise<Consultation[]> {
    const query = this.consultationModel
      .find({ clinicId, patientId, isDeleted: false })
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ date: -1 });

    if (limit) {
      query.limit(limit);
    }

    return query.exec();
  }

  async findByDoctor(
    clinicId: string,
    doctorId: string,
    options?: { status?: ConsultationStatus; limit?: number },
  ): Promise<Consultation[]> {
    const query: any = { clinicId, doctorId, isDeleted: false };

    if (options?.status) {
      query.status = options.status;
    }

    const mongoQuery = this.consultationModel
      .find(query)
      .populate('patientId', 'firstName lastName')
      .sort({ date: -1 });

    if (options?.limit) {
      mongoQuery.limit(options.limit);
    }

    return mongoQuery.exec();
  }

  async findByAppointment(clinicId: string, appointmentId: string): Promise<Consultation | null> {
    return this.consultationModel
      .findOne({ clinicId, appointmentId, isDeleted: false })
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName specialty')
      .exec();
  }

  async update(
    id: string,
    clinicId: string,
    updateConsultationDto: UpdateConsultationDto,
  ): Promise<Consultation | null> {
    const consultation = await this.consultationModel
      .findOneAndUpdate(
        { _id: id, clinicId, isDeleted: false },
        updateConsultationDto,
        { new: true },
      )
      .exec();

    if (!consultation) {
      throw new NotFoundException(`Consultation with ID ${id} not found`);
    }

    return consultation;
  }

  async updateStatus(
    id: string,
    clinicId: string,
    updateStatusDto: UpdateConsultationStatusDto,
  ): Promise<Consultation | null> {
    const consultation = await this.consultationModel.findOne({
      _id: id,
      clinicId,
      isDeleted: false,
    });

    if (!consultation) {
      throw new NotFoundException(`Consultation with ID ${id} not found`);
    }

    // Validate status transitions
    const validTransitions: Record<ConsultationStatus, ConsultationStatus[]> = {
      [ConsultationStatus.SCHEDULED]: [ConsultationStatus.IN_PROGRESS, ConsultationStatus.CANCELLED],
      [ConsultationStatus.IN_PROGRESS]: [ConsultationStatus.COMPLETED, ConsultationStatus.CANCELLED],
      [ConsultationStatus.COMPLETED]: [],
      [ConsultationStatus.CANCELLED]: [],
    };

    if (!validTransitions[consultation.status].includes(updateStatusDto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${consultation.status} to ${updateStatusDto.status}`,
      );
    }

    consultation.status = updateStatusDto.status;
    return consultation.save();
  }

  async complete(
    id: string,
    clinicId: string,
    completeDto: CompleteConsultationDto,
  ): Promise<Consultation | null> {
    const consultation = await this.consultationModel.findOne({
      _id: id,
      clinicId,
      isDeleted: false,
    });

    if (!consultation) {
      throw new NotFoundException(`Consultation with ID ${id} not found`);
    }

    if (consultation.status === ConsultationStatus.COMPLETED) {
      throw new BadRequestException('Consultation is already completed');
    }

    if (consultation.status === ConsultationStatus.CANCELLED) {
      throw new BadRequestException('Cannot complete a cancelled consultation');
    }

    consultation.status = ConsultationStatus.COMPLETED;
    if (completeDto.treatmentPlan) consultation.treatmentPlan = completeDto.treatmentPlan;
    if (completeDto.clinicalNotes) consultation.clinicalNotes = completeDto.clinicalNotes;
    if (completeDto.followUpDate) consultation.followUpDate = new Date(completeDto.followUpDate);
    if (completeDto.followUpInstructions) consultation.followUpInstructions = completeDto.followUpInstructions;

    return consultation.save();
  }

  async addExamResults(
    id: string,
    clinicId: string,
    addResultsDto: AddExamResultsDto,
  ): Promise<Consultation | null> {
    const consultation = await this.consultationModel.findOne({
      _id: id,
      clinicId,
      isDeleted: false,
    });

    if (!consultation) {
      throw new NotFoundException(`Consultation with ID ${id} not found`);
    }

    for (const result of addResultsDto.examResults) {
      const examIndex = consultation.orderedExams.findIndex(
        (exam) => exam.name.toLowerCase() === result.name.toLowerCase(),
      );

      if (examIndex !== -1) {
        consultation.orderedExams[examIndex].results = result.results;
        consultation.orderedExams[examIndex].resultDate = result.resultDate
          ? new Date(result.resultDate)
          : new Date();
      }
    }

    return consultation.save();
  }

  async linkVitals(id: string, clinicId: string, vitalsId: string): Promise<Consultation | null> {
    const consultation = await this.consultationModel
      .findOneAndUpdate(
        { _id: id, clinicId, isDeleted: false },
        { vitalsId },
        { new: true },
      )
      .exec();

    if (!consultation) {
      throw new NotFoundException(`Consultation with ID ${id} not found`);
    }

    return consultation;
  }

  async remove(id: string, clinicId: string): Promise<Consultation | null> {
    const consultation = await this.consultationModel
      .findOneAndUpdate(
        { _id: id, clinicId },
        { isDeleted: true },
        { new: true },
      )
      .exec();

    if (!consultation) {
      throw new NotFoundException(`Consultation with ID ${id} not found`);
    }

    return consultation;
  }

  async getPatientConsultationSummary(
    clinicId: string,
    patientId: string,
  ): Promise<{
    totalConsultations: number;
    completedConsultations: number;
    lastConsultation?: Consultation;
    commonDiagnoses: { code: string; description: string; count: number }[];
  }> {
    const consultations = await this.consultationModel
      .find({ clinicId, patientId, isDeleted: false })
      .sort({ date: -1 })
      .exec();

    const totalConsultations = consultations.length;
    const completedConsultations = consultations.filter(
      (c) => c.status === ConsultationStatus.COMPLETED,
    ).length;
    const lastConsultation = consultations[0] || undefined;

    // Count diagnoses
    const diagnosisCount = new Map<string, { description: string; count: number }>();
    for (const consultation of consultations) {
      for (const diagnosis of consultation.diagnoses) {
        const existing = diagnosisCount.get(diagnosis.code);
        if (existing) {
          existing.count++;
        } else {
          diagnosisCount.set(diagnosis.code, { description: diagnosis.description, count: 1 });
        }
      }
    }

    const commonDiagnoses = Array.from(diagnosisCount.entries())
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalConsultations,
      completedConsultations,
      lastConsultation,
      commonDiagnoses,
    };
  }
}
