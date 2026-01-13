import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PatientAddress, PatientAddressDocument } from './schema/patient-address.schema';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

const MAX_ADDRESSES_PER_PATIENT = 5;

@Injectable()
export class PatientAddressesService {
  constructor(
    @InjectModel(PatientAddress.name)
    private addressModel: Model<PatientAddressDocument>,
  ) {}

  async create(patientId: string, dto: CreateAddressDto): Promise<PatientAddress> {
    // Check address limit
    const existingCount = await this.addressModel.countDocuments({
      patientId: new Types.ObjectId(patientId),
      isActive: true,
    });

    if (existingCount >= MAX_ADDRESSES_PER_PATIENT) {
      throw new BadRequestException(`Máximo ${MAX_ADDRESSES_PER_PATIENT} direcciones permitidas`);
    }

    // If this is the first address, make it primary
    const isPrimary = existingCount === 0 ? true : dto.isPrimary || false;

    // If setting as primary, unset other primary addresses
    if (isPrimary) {
      await this.addressModel.updateMany(
        { patientId: new Types.ObjectId(patientId) },
        { isPrimary: false },
      );
    }

    // Determine safety zone (TODO: integrate with external data)
    const safetyZone = await this.determineSafetyZone(dto.latitude, dto.longitude, dto.district);

    const address = new this.addressModel({
      patientId: new Types.ObjectId(patientId),
      ...dto,
      isPrimary,
      safetyZone,
      isActive: true,
      isVerified: false,
    });

    return address.save();
  }

  async findAllByPatient(patientId: string): Promise<PatientAddress[]> {
    return this.addressModel
      .find({
        patientId: new Types.ObjectId(patientId),
        isActive: true,
      })
      .sort({ isPrimary: -1, createdAt: -1 });
  }

  async findById(patientId: string, addressId: string): Promise<PatientAddress> {
    const address = await this.addressModel.findOne({
      _id: new Types.ObjectId(addressId),
      patientId: new Types.ObjectId(patientId),
    });

    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }

    return address;
  }

  async update(patientId: string, addressId: string, dto: UpdateAddressDto): Promise<PatientAddress> {
    const address = await this.findById(patientId, addressId);

    // Update safety zone if location changed
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      const newSafetyZone = await this.determineSafetyZone(
        dto.latitude,
        dto.longitude,
        dto.district || address.district,
      );
      (address as PatientAddressDocument).safetyZone = newSafetyZone;
    }

    Object.assign(address, dto);
    return (address as PatientAddressDocument).save();
  }

  async delete(patientId: string, addressId: string): Promise<void> {
    const address = await this.findById(patientId, addressId);

    // Soft delete
    (address as PatientAddressDocument).isActive = false;
    await (address as PatientAddressDocument).save();

    // If it was primary, set another address as primary
    if (address.isPrimary) {
      const anotherAddress = await this.addressModel.findOne({
        patientId: new Types.ObjectId(patientId),
        isActive: true,
      });

      if (anotherAddress) {
        anotherAddress.isPrimary = true;
        await anotherAddress.save();
      }
    }
  }

  async setPrimary(patientId: string, addressId: string): Promise<PatientAddress> {
    // Unset all primary
    await this.addressModel.updateMany(
      { patientId: new Types.ObjectId(patientId) },
      { isPrimary: false },
    );

    // Set this as primary
    const address = await this.addressModel.findByIdAndUpdate(
      addressId,
      { isPrimary: true },
      { new: true },
    );

    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }

    return address;
  }

  async verifyAddress(addressId: string, verifiedBy: string): Promise<PatientAddress> {
    const address = await this.addressModel.findByIdAndUpdate(
      addressId,
      {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: new Types.ObjectId(verifiedBy),
      },
      { new: true },
    );

    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }

    return address;
  }

  async incrementServiceCount(addressId: string): Promise<void> {
    await this.addressModel.updateOne(
      { _id: new Types.ObjectId(addressId) },
      {
        $inc: { servicesAtAddress: 1 },
        lastServiceAt: new Date(),
      },
    );
  }

  async getAddressForService(patientId: string, addressId: string): Promise<PatientAddress | null> {
    const address = await this.addressModel.findOne({
      _id: new Types.ObjectId(addressId),
      patientId: new Types.ObjectId(patientId),
      isActive: true,
    });

    return address;
  }

  async getPrimaryAddress(patientId: string): Promise<PatientAddress | null> {
    return this.addressModel.findOne({
      patientId: new Types.ObjectId(patientId),
      isPrimary: true,
      isActive: true,
    });
  }

  // ==================== Safety Zone Logic ====================

  private async determineSafetyZone(
    latitude: number,
    longitude: number,
    district: string,
  ): Promise<'green' | 'yellow' | 'red'> {
    // TODO: Integrate with external safety data sources
    // - MININTER crime statistics
    // - Historical incident data from the app
    // - User-reported safety concerns

    // For now, use a simple district-based heuristic for Lima
    const highRiskDistricts = [
      'callao', 'ventanilla', 'la victoria', 'el agustino',
      'san juan de lurigancho', 'villa el salvador', 'comas'
    ];

    const mediumRiskDistricts = [
      'rimac', 'breña', 'cercado de lima', 'ate',
      'santa anita', 'los olivos', 'independencia'
    ];

    const districtLower = district.toLowerCase();

    if (highRiskDistricts.some(d => districtLower.includes(d))) {
      return 'red';
    }

    if (mediumRiskDistricts.some(d => districtLower.includes(d))) {
      return 'yellow';
    }

    return 'green';
  }

  async updateSafetyZone(addressId: string, safetyZone: 'green' | 'yellow' | 'red'): Promise<PatientAddress> {
    const address = await this.addressModel.findByIdAndUpdate(
      addressId,
      { safetyZone },
      { new: true },
    );

    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }

    return address;
  }
}
