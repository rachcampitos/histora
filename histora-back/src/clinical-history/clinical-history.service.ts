import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ClinicalHistory,
  ClinicalHistoryDocument,
} from './schema/clinical-history.schema';
import { CreateClinicalHistoryDto } from './dto/create-clinical-history.dto';
import { UpdateClinicalHistoryDto } from './dto/update-clinical-history.dto';

@Injectable()
export class ClinicalHistoryService {
  constructor(
    @InjectModel(ClinicalHistory.name)
    private clinicalHistoryModel: Model<ClinicalHistoryDocument>,
  ) {}

  async create(
    clinicId: string,
    createDto: CreateClinicalHistoryDto,
  ): Promise<ClinicalHistory> {
    const history = new this.clinicalHistoryModel({
      ...createDto,
      clinicId,
      date: createDto.date ? new Date(createDto.date) : new Date(),
    });
    return history.save();
  }

  async createFromConsultation(
    clinicId: string,
    consultationData: {
      consultationId: string;
      patientId: string;
      doctorId: string;
      chiefComplaint: string;
      diagnoses?: any[];
      treatmentPlan?: string;
    },
  ): Promise<ClinicalHistory> {
    const history = new this.clinicalHistoryModel({
      clinicId,
      consultationId: consultationData.consultationId,
      patientId: consultationData.patientId,
      doctorId: consultationData.doctorId,
      date: new Date(),
      reasonForVisit: consultationData.chiefComplaint,
      diagnosis: consultationData.diagnoses
        ?.map((d) => `${d.code}: ${d.description}`)
        .join('; '),
      treatment: consultationData.treatmentPlan,
    });
    return history.save();
  }

  async findAll(
    clinicId: string,
    filters?: {
      patientId?: string;
      doctorId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<ClinicalHistory[]> {
    const query: any = { clinicId, isDeleted: false };

    if (filters?.patientId) {
      query.patientId = filters.patientId;
    }

    if (filters?.doctorId) {
      query.doctorId = filters.doctorId;
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

    return this.clinicalHistoryModel
      .find(query)
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ date: -1 })
      .exec();
  }

  async findOne(id: string, clinicId: string): Promise<ClinicalHistory> {
    const history = await this.clinicalHistoryModel
      .findOne({ _id: id, clinicId, isDeleted: false })
      .populate('patientId', 'firstName lastName dateOfBirth gender')
      .populate('doctorId', 'firstName lastName specialty')
      .populate('consultationId')
      .exec();

    if (!history) {
      throw new NotFoundException(`Clinical history with ID ${id} not found`);
    }

    return history;
  }

  async findByPatient(
    clinicId: string,
    patientId: string,
    limit?: number,
  ): Promise<ClinicalHistory[]> {
    const query = this.clinicalHistoryModel
      .find({ clinicId, patientId, isDeleted: false })
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ date: -1 });

    if (limit) {
      query.limit(limit);
    }

    return query.exec();
  }

  async getPatientMedicalSummary(
    clinicId: string,
    patientId: string,
  ): Promise<{
    allergies: any[];
    chronicConditions: any[];
    currentMedications: any[];
    surgicalHistory: any[];
    familyHistory: any[];
    vaccinations: any[];
    lastVisit?: ClinicalHistory;
  }> {
    const histories = await this.clinicalHistoryModel
      .find({ clinicId, patientId, isDeleted: false })
      .sort({ date: -1 })
      .exec();

    // Aggregate medical background from all histories
    const allergies = new Map();
    const chronicConditions = new Map();
    const currentMedications = new Map();
    const surgicalHistory: any[] = [];
    const familyHistory = new Map();
    const vaccinations = new Map();

    for (const history of histories) {
      history.allergies?.forEach((a) => allergies.set(a.allergen, a));
      history.chronicConditions?.forEach((c) =>
        chronicConditions.set(c.condition, c),
      );
      history.currentMedications?.forEach((m) =>
        currentMedications.set(m.medication, m),
      );
      history.surgicalHistory?.forEach((s) => surgicalHistory.push(s));
      history.familyHistory?.forEach((f) =>
        familyHistory.set(`${f.relationship}-${f.condition}`, f),
      );
      history.vaccinations?.forEach((v) => vaccinations.set(v.vaccine, v));
    }

    return {
      allergies: Array.from(allergies.values()),
      chronicConditions: Array.from(chronicConditions.values()),
      currentMedications: Array.from(currentMedications.values()),
      surgicalHistory,
      familyHistory: Array.from(familyHistory.values()),
      vaccinations: Array.from(vaccinations.values()),
      lastVisit: histories[0] || undefined,
    };
  }

  async update(
    id: string,
    clinicId: string,
    updateDto: UpdateClinicalHistoryDto,
  ): Promise<ClinicalHistory | null> {
    const history = await this.clinicalHistoryModel
      .findOneAndUpdate(
        { _id: id, clinicId, isDeleted: false },
        updateDto,
        { new: true },
      )
      .exec();

    if (!history) {
      throw new NotFoundException(`Clinical history with ID ${id} not found`);
    }

    return history;
  }

  async addAllergy(
    id: string,
    clinicId: string,
    allergy: any,
  ): Promise<ClinicalHistory | null> {
    const history = await this.clinicalHistoryModel.findOne({
      _id: id,
      clinicId,
      isDeleted: false,
    });

    if (!history) {
      throw new NotFoundException(`Clinical history with ID ${id} not found`);
    }

    history.allergies.push(allergy);
    return history.save();
  }

  async addChronicCondition(
    id: string,
    clinicId: string,
    condition: any,
  ): Promise<ClinicalHistory | null> {
    const history = await this.clinicalHistoryModel.findOne({
      _id: id,
      clinicId,
      isDeleted: false,
    });

    if (!history) {
      throw new NotFoundException(`Clinical history with ID ${id} not found`);
    }

    history.chronicConditions.push(condition);
    return history.save();
  }

  async addVaccination(
    id: string,
    clinicId: string,
    vaccination: any,
  ): Promise<ClinicalHistory | null> {
    const history = await this.clinicalHistoryModel.findOne({
      _id: id,
      clinicId,
      isDeleted: false,
    });

    if (!history) {
      throw new NotFoundException(`Clinical history with ID ${id} not found`);
    }

    history.vaccinations.push(vaccination);
    return history.save();
  }

  async remove(id: string, clinicId: string): Promise<ClinicalHistory | null> {
    const history = await this.clinicalHistoryModel
      .findOneAndUpdate(
        { _id: id, clinicId },
        { isDeleted: true },
        { new: true },
      )
      .exec();

    if (!history) {
      throw new NotFoundException(`Clinical history with ID ${id} not found`);
    }

    return history;
  }

  async restore(id: string, clinicId: string): Promise<ClinicalHistory | null> {
    return this.clinicalHistoryModel
      .findOneAndUpdate(
        { _id: id, clinicId },
        { isDeleted: false },
        { new: true },
      )
      .exec();
  }
}
