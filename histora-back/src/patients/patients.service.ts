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

  create(createPatientDto: CreatePatientDto): Promise<Patient> {
    const newPatient = new this.patientModel(createPatientDto);
    return newPatient.save();
  }

  findAll(): Promise<Patient[]> {
    return this.patientModel.find().exec();
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientModel.findById(id).exec();
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }
    return patient;
  }

  async update(
    id: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<Patient | null> {
    return this.patientModel
      .findByIdAndUpdate(id, updatePatientDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Patient | null> {
    return this.patientModel.findByIdAndDelete(id).exec();
  }
}
