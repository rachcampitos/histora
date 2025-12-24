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

  async create(
    clinicId: string,
    userId: string,
    createDoctorDto: CreateDoctorDto,
  ): Promise<Doctor> {
    const newDoctor = new this.doctorModel({
      ...createDoctorDto,
      clinicId,
      userId,
    });
    return newDoctor.save();
  }

  async findAll(clinicId: string): Promise<Doctor[]> {
    return this.doctorModel
      .find({ clinicId, isDeleted: false })
      .sort({ lastName: 1, firstName: 1 })
      .exec();
  }

  async findOne(id: string, clinicId: string): Promise<Doctor> {
    const doctor = await this.doctorModel
      .findOne({ _id: id, clinicId, isDeleted: false })
      .exec();

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    return doctor;
  }

  async findByUserId(userId: string): Promise<Doctor | null> {
    return this.doctorModel
      .findOne({ userId, isDeleted: false })
      .exec();
  }

  async findPublicDoctors(filters?: {
    specialty?: string;
    city?: string;
    minRating?: number;
  }): Promise<Doctor[]> {
    const query: any = {
      isPublicProfile: true,
      isDeleted: false,
    };

    if (filters?.specialty) {
      query.specialty = new RegExp(filters.specialty, 'i');
    }

    if (filters?.minRating) {
      query.averageRating = { $gte: filters.minRating };
    }

    return this.doctorModel
      .find(query)
      .select('-email -phone -userId')
      .sort({ averageRating: -1, totalReviews: -1 })
      .exec();
  }

  async findPublicDoctorById(id: string): Promise<Doctor | null> {
    return this.doctorModel
      .findOne({ _id: id, isPublicProfile: true, isDeleted: false })
      .select('-email -phone -userId')
      .exec();
  }

  async update(
    id: string,
    clinicId: string,
    updateDoctorDto: UpdateDoctorDto,
  ): Promise<Doctor | null> {
    const doctor = await this.doctorModel
      .findOneAndUpdate(
        { _id: id, clinicId, isDeleted: false },
        updateDoctorDto,
        { new: true },
      )
      .exec();

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async updateRating(id: string, averageRating: number, totalReviews: number): Promise<void> {
    await this.doctorModel
      .findByIdAndUpdate(id, { averageRating, totalReviews })
      .exec();
  }

  async remove(id: string, clinicId: string): Promise<Doctor | null> {
    const doctor = await this.doctorModel
      .findOneAndUpdate(
        { _id: id, clinicId },
        { isDeleted: true },
        { new: true },
      )
      .exec();

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async restore(id: string, clinicId: string): Promise<Doctor | null> {
    return this.doctorModel
      .findOneAndUpdate(
        { _id: id, clinicId },
        { isDeleted: false },
        { new: true },
      )
      .exec();
  }

  async countByClinic(clinicId: string): Promise<number> {
    return this.doctorModel.countDocuments({ clinicId, isDeleted: false }).exec();
  }
}
