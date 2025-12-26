import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vitals, VitalsDocument } from './schema/vitals.schema';
import { CreateVitalsDto } from './dto/create-vitals.dto';
import { UpdateVitalsDto } from './dto/update-vitals.dto';

@Injectable()
export class VitalsService {
  constructor(
    @InjectModel(Vitals.name) private vitalsModel: Model<VitalsDocument>,
  ) {}

  async create(
    clinicId: string,
    createVitalsDto: CreateVitalsDto,
    recordedBy?: string,
  ): Promise<Vitals> {
    const vitals = new this.vitalsModel({
      ...createVitalsDto,
      clinicId,
      recordedBy,
      recordedAt: createVitalsDto.recordedAt || new Date(),
    });
    return vitals.save();
  }

  async findAll(
    clinicId: string,
    filters?: {
      patientId?: string;
      consultationId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<Vitals[]> {
    const query: any = { clinicId, isDeleted: false };

    if (filters?.patientId) {
      query.patientId = filters.patientId;
    }

    if (filters?.consultationId) {
      query.consultationId = filters.consultationId;
    }

    if (filters?.startDate || filters?.endDate) {
      query.recordedAt = {};
      if (filters.startDate) {
        query.recordedAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.recordedAt.$lte = filters.endDate;
      }
    }

    return this.vitalsModel
      .find(query)
      .populate('patientId', 'firstName lastName')
      .populate('recordedBy', 'firstName lastName')
      .sort({ recordedAt: -1 })
      .exec();
  }

  async findOne(id: string, clinicId: string): Promise<Vitals> {
    const vitals = await this.vitalsModel
      .findOne({ _id: id, clinicId, isDeleted: false })
      .populate('patientId', 'firstName lastName')
      .populate('recordedBy', 'firstName lastName')
      .exec();

    if (!vitals) {
      throw new NotFoundException(`Vitals record with ID ${id} not found`);
    }
    return vitals;
  }

  async findByPatient(
    clinicId: string,
    patientId: string,
    limit?: number,
  ): Promise<Vitals[]> {
    const query = this.vitalsModel
      .find({ clinicId, patientId, isDeleted: false })
      .sort({ recordedAt: -1 });

    if (limit) {
      query.limit(limit);
    }

    return query.exec();
  }

  async findByConsultation(
    clinicId: string,
    consultationId: string,
  ): Promise<Vitals | null> {
    return this.vitalsModel
      .findOne({ clinicId, consultationId, isDeleted: false })
      .exec();
  }

  async getLatestByPatient(
    clinicId: string,
    patientId: string,
  ): Promise<Vitals | null> {
    return this.vitalsModel
      .findOne({ clinicId, patientId, isDeleted: false })
      .sort({ recordedAt: -1 })
      .exec();
  }

  async update(
    id: string,
    clinicId: string,
    updateVitalsDto: UpdateVitalsDto,
  ): Promise<Vitals | null> {
    const vitals = await this.vitalsModel
      .findOneAndUpdate(
        { _id: id, clinicId, isDeleted: false },
        updateVitalsDto,
        { new: true },
      )
      .exec();

    if (!vitals) {
      throw new NotFoundException(`Vitals record with ID ${id} not found`);
    }

    return vitals;
  }

  async remove(id: string, clinicId: string): Promise<Vitals | null> {
    const vitals = await this.vitalsModel
      .findOneAndUpdate(
        { _id: id, clinicId },
        { isDeleted: true },
        { new: true },
      )
      .exec();

    if (!vitals) {
      throw new NotFoundException(`Vitals record with ID ${id} not found`);
    }

    return vitals;
  }

  async getPatientVitalsHistory(
    clinicId: string,
    patientId: string,
    vitalType: 'weight' | 'bloodPressure' | 'heartRate' | 'temperature' | 'bloodGlucose',
    limit: number = 10,
  ): Promise<any[]> {
    const vitals = await this.vitalsModel
      .find({ clinicId, patientId, isDeleted: false })
      .sort({ recordedAt: -1 })
      .limit(limit)
      .exec();

    return vitals.map((v) => {
      const record: any = { date: v.recordedAt };

      switch (vitalType) {
        case 'weight':
          record.value = v.weight;
          record.bmi = v.bmi;
          break;
        case 'bloodPressure':
          record.systolic = v.systolicBP;
          record.diastolic = v.diastolicBP;
          break;
        case 'heartRate':
          record.value = v.heartRate;
          break;
        case 'temperature':
          record.value = v.temperature;
          break;
        case 'bloodGlucose':
          record.value = v.bloodGlucose;
          break;
      }

      return record;
    }).filter((r) => r.value !== undefined || r.systolic !== undefined);
  }
}
