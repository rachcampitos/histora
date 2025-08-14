// src/doctors/doctors.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor, DoctorDocument } from './schema/doctor.schema';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    const newDoctor = new this.doctorModel(createDoctorDto);
    return newDoctor.save();
  }

  async findAll(): Promise<Doctor[]> {
    return this.doctorModel.find().exec();
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.doctorModel.findById(id).exec();
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    return doctor;
  }

  async update(
    id: string,
    updateDoctorDto: UpdateDoctorDto,
  ): Promise<Doctor | null> {
    return this.doctorModel
      .findByIdAndUpdate(id, updateDoctorDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Doctor | null> {
    return this.doctorModel.findByIdAndDelete(id).exec();
  }
}
