import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from './schemas/patients.schema';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
  ) {}

  async create(clinicId: string, createPatientDto: CreatePatientDto): Promise<Patient> {
    const newPatient = new this.patientModel({
      ...createPatientDto,
      clinicId,
    });
    return newPatient.save();
  }

  async findAll(clinicId: string): Promise<Patient[]> {
    return this.patientModel
      .find({ clinicId, isDeleted: false })
      .sort({ lastName: 1, firstName: 1 })
      .exec();
  }

  async findOne(id: string, clinicId: string): Promise<Patient> {
    const patient = await this.patientModel
      .findOne({ _id: id, clinicId, isDeleted: false })
      .exec();

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }
    return patient;
  }

  async search(clinicId: string, query: string): Promise<Patient[]> {
    const searchRegex = new RegExp(query, 'i');
    return this.patientModel
      .find({
        clinicId,
        isDeleted: false,
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { documentNumber: searchRegex },
        ],
      })
      .limit(20)
      .exec();
  }

  async update(
    id: string,
    clinicId: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<Patient | null> {
    const patient = await this.patientModel
      .findOneAndUpdate(
        { _id: id, clinicId, isDeleted: false },
        updatePatientDto,
        { new: true },
      )
      .exec();

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async remove(id: string, clinicId: string): Promise<Patient | null> {
    const patient = await this.patientModel
      .findOneAndUpdate(
        { _id: id, clinicId },
        { isDeleted: true },
        { new: true },
      )
      .exec();

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async restore(id: string, clinicId: string): Promise<Patient | null> {
    return this.patientModel
      .findOneAndUpdate(
        { _id: id, clinicId },
        { isDeleted: false },
        { new: true },
      )
      .exec();
  }

  async countByClinic(clinicId: string): Promise<number> {
    return this.patientModel.countDocuments({ clinicId, isDeleted: false }).exec();
  }
}
