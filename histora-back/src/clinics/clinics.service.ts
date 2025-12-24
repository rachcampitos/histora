import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Clinic, ClinicDocument } from './schema/clinic.schema';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

@Injectable()
export class ClinicsService {
  constructor(
    @InjectModel(Clinic.name) private clinicModel: Model<ClinicDocument>,
  ) {}

  async create(createClinicDto: CreateClinicDto, ownerId: string): Promise<Clinic> {
    const slug = this.generateSlug(createClinicDto.name);

    const newClinic = new this.clinicModel({
      ...createClinicDto,
      slug,
      ownerId,
    });

    return newClinic.save();
  }

  async findAll(): Promise<Clinic[]> {
    return this.clinicModel.find({ isDeleted: false }).exec();
  }

  async findOne(id: string): Promise<Clinic> {
    const clinic = await this.clinicModel
      .findOne({ _id: id, isDeleted: false })
      .populate('ownerId', 'firstName lastName email')
      .exec();

    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }

    return clinic;
  }

  async findBySlug(slug: string): Promise<Clinic> {
    const clinic = await this.clinicModel
      .findOne({ slug, isDeleted: false, isActive: true })
      .exec();

    if (!clinic) {
      throw new NotFoundException(`Clinic not found`);
    }

    return clinic;
  }

  async findByOwner(ownerId: string): Promise<Clinic | null> {
    return this.clinicModel
      .findOne({ ownerId, isDeleted: false })
      .exec();
  }

  async update(
    id: string,
    updateClinicDto: UpdateClinicDto,
    userId: string,
  ): Promise<Clinic | null> {
    const clinic = await this.clinicModel.findById(id);

    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }

    if (clinic.ownerId.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to update this clinic');
    }

    // If name is being updated, regenerate slug
    if (updateClinicDto.name) {
      (updateClinicDto as any).slug = this.generateSlug(updateClinicDto.name);
    }

    return this.clinicModel
      .findByIdAndUpdate(id, updateClinicDto, { new: true })
      .exec();
  }

  async remove(id: string, userId: string): Promise<Clinic | null> {
    const clinic = await this.clinicModel.findById(id);

    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }

    if (clinic.ownerId.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to delete this clinic');
    }

    return this.clinicModel
      .findByIdAndUpdate(id, { isDeleted: true }, { new: true })
      .exec();
  }

  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
  }
}
