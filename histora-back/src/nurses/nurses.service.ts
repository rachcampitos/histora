import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Nurse } from './schema/nurse.schema';
import {
  CreateNurseDto,
  UpdateNurseDto,
  SearchNurseDto,
  NurseServiceDto,
} from './dto';

@Injectable()
export class NursesService {
  constructor(
    @InjectModel(Nurse.name) private nurseModel: Model<Nurse>,
  ) {}

  async create(userId: string, createNurseDto: CreateNurseDto): Promise<Nurse> {
    // Check if nurse profile already exists for this user
    const existingNurse = await this.nurseModel.findOne({ userId });
    if (existingNurse) {
      throw new ConflictException('Nurse profile already exists for this user');
    }

    // Check if CEP number is already registered
    const existingCep = await this.nurseModel.findOne({
      cepNumber: createNurseDto.cepNumber,
    });
    if (existingCep) {
      throw new ConflictException('CEP number is already registered');
    }

    const nurse = new this.nurseModel({
      userId: new Types.ObjectId(userId),
      ...createNurseDto,
    });

    return nurse.save();
  }

  async findById(id: string): Promise<Nurse & { user?: Record<string, unknown> }> {
    const nurse = await this.nurseModel
      .findById(id)
      .populate('userId', 'firstName lastName email phone avatar')
      .lean();

    if (!nurse) {
      throw new NotFoundException('Nurse not found');
    }

    // Transform userId to user for consistent API response
    const { userId, ...rest } = nurse as Nurse & { userId: Record<string, unknown> };
    return {
      ...rest,
      userId: (userId as { _id?: string })?._id?.toString() || nurse.userId?.toString(),
      user: userId,
    } as Nurse & { user?: Record<string, unknown> };
  }

  async findByUserId(userIdParam: string): Promise<Nurse & { user?: Record<string, unknown> }> {
    const nurse = await this.nurseModel
      .findOne({ userId: new Types.ObjectId(userIdParam) })
      .populate('userId', 'firstName lastName email phone avatar')
      .lean();

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    // Transform userId to user for consistent API response
    const { userId, ...rest } = nurse as Nurse & { userId: Record<string, unknown> };
    return {
      ...rest,
      userId: (userId as { _id?: string })?._id?.toString() || nurse.userId?.toString(),
      user: userId,
    } as Nurse & { user?: Record<string, unknown> };
  }

  /**
   * Find nurse by CEP number (returns null if not found, doesn't throw)
   */
  async findByCepNumber(cepNumber: string): Promise<Nurse | null> {
    return this.nurseModel.findOne({ cepNumber }).exec();
  }

  async searchNearby(searchDto: SearchNurseDto): Promise<{ nurse: Nurse; distance: number }[]> {
    const {
      lat,
      lng,
      radius = 10,
      category,
      minRating,
      maxPrice,
      availableNow,
    } = searchDto;

    const radiusInMeters = radius * 1000;

    // Build match conditions
    const matchConditions: Record<string, unknown> = {
      isActive: true,
    };

    if (availableNow) {
      matchConditions.isAvailable = true;
    }

    if (minRating) {
      matchConditions.averageRating = { $gte: minRating };
    }

    if (category) {
      matchConditions['services.category'] = category;
      matchConditions['services.isActive'] = true;
    }

    if (maxPrice && category) {
      matchConditions['services.price'] = { $lte: maxPrice };
    }

    const nurses = await this.nurseModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
          },
          distanceField: 'distance',
          maxDistance: radiusInMeters,
          spherical: true,
          query: matchConditions,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          cepNumber: 1,
          cepVerified: 1,
          specialties: 1,
          bio: 1,
          yearsOfExperience: 1,
          services: 1,
          location: 1,
          serviceRadius: 1,
          isAvailable: 1,
          availableFrom: 1,
          availableTo: 1,
          availableDays: 1,
          averageRating: 1,
          totalReviews: 1,
          totalServicesCompleted: 1,
          distance: { $divide: ['$distance', 1000] }, // Convert to km
          user: {
            firstName: '$user.firstName',
            lastName: '$user.lastName',
            avatar: '$user.avatar',
            phone: '$user.phone',
          },
        },
      },
      {
        $sort: { distance: 1 },
      },
    ]);

    return nurses.map((n) => ({
      nurse: n,
      distance: n.distance,
    }));
  }

  async update(userId: string, updateNurseDto: UpdateNurseDto): Promise<Nurse> {
    const nurse = await this.nurseModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: updateNurseDto },
      { new: true },
    );

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    return nurse;
  }

  async updateLocation(
    userId: string,
    location: { type: string; coordinates: number[]; address?: string; city?: string; district?: string },
  ): Promise<Nurse> {
    const nurse = await this.nurseModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: { location } },
      { new: true },
    );

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    return nurse;
  }

  async setAvailability(userId: string, isAvailable: boolean): Promise<Nurse> {
    const nurse = await this.nurseModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: { isAvailable } },
      { new: true },
    );

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    return nurse;
  }

  async addService(userId: string, serviceDto: NurseServiceDto): Promise<Nurse> {
    const nurse = await this.nurseModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $push: { services: serviceDto } },
      { new: true },
    );

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    return nurse;
  }

  async updateService(
    userId: string,
    serviceId: string,
    serviceDto: Partial<NurseServiceDto>,
  ): Promise<Nurse> {
    const updateFields: Record<string, unknown> = {};
    Object.keys(serviceDto).forEach((key) => {
      updateFields[`services.$.${key}`] = serviceDto[key as keyof NurseServiceDto];
    });

    const nurse = await this.nurseModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        'services._id': new Types.ObjectId(serviceId),
      },
      { $set: updateFields },
      { new: true },
    );

    if (!nurse) {
      throw new NotFoundException('Nurse or service not found');
    }

    return nurse;
  }

  async removeService(userId: string, serviceId: string): Promise<Nurse> {
    const nurse = await this.nurseModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $pull: { services: { _id: new Types.ObjectId(serviceId) } } },
      { new: true },
    );

    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    return nurse;
  }

  async updateStats(
    nurseId: string,
    rating: number,
  ): Promise<void> {
    const nurse = await this.nurseModel.findById(nurseId);
    if (!nurse) return;

    const newTotalReviews = nurse.totalReviews + 1;
    const newAverageRating =
      (nurse.averageRating * nurse.totalReviews + rating) / newTotalReviews;

    await this.nurseModel.findByIdAndUpdate(nurseId, {
      $set: {
        averageRating: Math.round(newAverageRating * 10) / 10,
        totalReviews: newTotalReviews,
      },
      $inc: { totalServicesCompleted: 1 },
    });
  }

  async getEarnings(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ total: number; commission: number; net: number; servicesCount: number }> {
    // This would typically query the service-requests collection
    // For now, return placeholder data
    return {
      total: 0,
      commission: 0,
      net: 0,
      servicesCount: 0,
    };
  }
}
