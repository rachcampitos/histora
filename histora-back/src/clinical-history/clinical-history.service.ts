// clinical-history.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ClinicalHistory,
  ClinicalHistoryDocument,
} from './schema/clinical-history.schema';
import { CreateClinicalHistoryDto } from './dto/create-clinical-history.dto';
import { Doctor, DoctorDocument } from '../doctors/schema/doctor.schema';
import { Patient, PatientDocument } from '../patients/schemas/patients.schema';

@Injectable()
export class ClinicalHistoryService {
  constructor(
    @InjectModel(ClinicalHistory.name)
    private clinicalHistoryModel: Model<ClinicalHistoryDocument>,
    @InjectModel(Patient.name)
    private patientModel: Model<PatientDocument>,
    @InjectModel(Doctor.name)
    private doctorModel: Model<DoctorDocument>,
  ) {}

  async create(data: CreateClinicalHistoryDto): Promise<ClinicalHistory> {
    const patient = await this.patientModel.findById(data.patientId);
    const doctor = await this.doctorModel.findById(data.doctorId);

    if (!patient || !doctor) {
      throw new NotFoundException('Paciente o doctor no encontrado');
    }

    const history = new this.clinicalHistoryModel(data);
    return history.save();
  }

  async findAll(): Promise<ClinicalHistory[]> {
    return this.clinicalHistoryModel.find({ isDeleted: false }).exec();
  }

  async findOne(id: string): Promise<ClinicalHistory> {
    const history = await this.clinicalHistoryModel
      .findOne({ _id: id, isDeleted: false })
      .populate('patientId')
      .populate('doctorId')
      .exec();
    if (!history) {
      throw new Error(`Clinical history with ID ${id} not found`);
    }
    return history;
  }

  async update(
    id: string,
    data: Partial<CreateClinicalHistoryDto>,
  ): Promise<ClinicalHistory | null> {
    return this.clinicalHistoryModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async remove(id: string): Promise<ClinicalHistory | null> {
    return this.clinicalHistoryModel
      .findByIdAndUpdate(id, { isDeleted: true }, { new: true })
      .exec();
  }

  async restore(id: string): Promise<ClinicalHistory | null> {
    return this.clinicalHistoryModel
      .findByIdAndUpdate(id, { isDeleted: false }, { new: true })
      .exec();
  }
}
