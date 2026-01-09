import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ServiceRequest } from './schema/service-request.schema';
import { Nurse } from '../nurses/schema/nurse.schema';
import { CreateServiceRequestDto, RateServiceRequestDto } from './dto';
import { NursesService } from '../nurses/nurses.service';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectModel(ServiceRequest.name)
    private serviceRequestModel: Model<ServiceRequest>,
    @InjectModel(Nurse.name)
    private nurseModel: Model<Nurse>,
    private nursesService: NursesService,
  ) {}

  async create(
    patientId: string,
    createDto: CreateServiceRequestDto,
  ): Promise<ServiceRequest> {
    // Get nurse and validate service exists
    const nurse = await this.nurseModel.findById(createDto.nurseId);
    if (!nurse) {
      throw new NotFoundException('Nurse not found');
    }

    const service = nurse.services.find(
      (s) => s._id?.toString() === createDto.serviceId,
    );
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (!service.isActive) {
      throw new BadRequestException('Service is not available');
    }

    const serviceRequest = new this.serviceRequestModel({
      patientId: new Types.ObjectId(patientId),
      nurseId: new Types.ObjectId(createDto.nurseId),
      service: {
        name: service.name,
        category: service.category,
        price: service.price,
        currency: service.currency || 'PEN',
        durationMinutes: service.durationMinutes || 60,
      },
      location: {
        type: 'Point',
        coordinates: createDto.location.coordinates,
        address: createDto.location.address,
        reference: createDto.location.reference,
        district: createDto.location.district,
        city: createDto.location.city,
      },
      requestedDate: new Date(createDto.requestedDate),
      requestedTimeSlot: createDto.requestedTimeSlot,
      patientNotes: createDto.patientNotes,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          changedAt: new Date(),
          changedBy: new Types.ObjectId(patientId),
        },
      ],
    });

    return serviceRequest.save();
  }

  async findById(id: string): Promise<ServiceRequest> {
    const request = await this.serviceRequestModel
      .findById(id)
      .populate('patientId', 'firstName lastName phone avatar')
      .populate({
        path: 'nurseId',
        populate: {
          path: 'userId',
          select: 'firstName lastName phone avatar',
        },
      });

    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    return request;
  }

  async findByPatient(
    patientId: string,
    status?: string,
  ): Promise<ServiceRequest[]> {
    const query: Record<string, unknown> = {
      patientId: new Types.ObjectId(patientId),
    };

    if (status) {
      query.status = status;
    }

    return this.serviceRequestModel
      .find(query)
      .populate({
        path: 'nurseId',
        populate: {
          path: 'userId',
          select: 'firstName lastName phone avatar',
        },
      })
      .sort({ createdAt: -1 });
  }

  async findByNurse(
    nurseId: string,
    status?: string,
  ): Promise<ServiceRequest[]> {
    const query: Record<string, unknown> = {
      nurseId: new Types.ObjectId(nurseId),
    };

    if (status) {
      query.status = status;
    }

    return this.serviceRequestModel
      .find(query)
      .populate('patientId', 'firstName lastName phone avatar')
      .sort({ createdAt: -1 });
  }

  async findPendingNearby(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<ServiceRequest[]> {
    const radiusInMeters = radiusKm * 1000;

    return this.serviceRequestModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          distanceField: 'distance',
          maxDistance: radiusInMeters,
          spherical: true,
          query: {
            status: 'pending',
            nurseId: { $exists: false },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patient',
        },
      },
      {
        $unwind: '$patient',
      },
      {
        $project: {
          _id: 1,
          service: 1,
          location: 1,
          requestedDate: 1,
          requestedTimeSlot: 1,
          patientNotes: 1,
          distance: { $divide: ['$distance', 1000] },
          patient: {
            firstName: '$patient.firstName',
            lastName: '$patient.lastName',
          },
        },
      },
      {
        $sort: { distance: 1 },
      },
    ]);
  }

  async accept(id: string, nurseUserId: string): Promise<ServiceRequest> {
    const nurse = await this.nurseModel.findOne({
      userId: new Types.ObjectId(nurseUserId),
    });
    if (!nurse) {
      throw new NotFoundException('Nurse profile not found');
    }

    const request = await this.serviceRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('Request is no longer pending');
    }

    request.nurseId = nurse._id as Types.ObjectId;
    request.status = 'accepted';
    request.statusHistory.push({
      status: 'accepted',
      changedAt: new Date(),
      changedBy: new Types.ObjectId(nurseUserId),
    });

    return request.save();
  }

  async reject(
    id: string,
    nurseUserId: string,
    reason?: string,
  ): Promise<ServiceRequest> {
    const request = await this.serviceRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    request.status = 'rejected';
    request.cancellationReason = reason;
    request.statusHistory.push({
      status: 'rejected',
      changedAt: new Date(),
      changedBy: new Types.ObjectId(nurseUserId),
      note: reason,
    });

    return request.save();
  }

  async updateStatus(
    id: string,
    userId: string,
    status: string,
    note?: string,
  ): Promise<ServiceRequest> {
    const request = await this.serviceRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      accepted: ['on_the_way', 'cancelled'],
      on_the_way: ['arrived', 'cancelled'],
      arrived: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
    };

    if (!validTransitions[request.status]?.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${request.status} to ${status}`,
      );
    }

    request.status = status;
    request.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: new Types.ObjectId(userId),
      note,
    });

    if (status === 'completed') {
      request.completedAt = new Date();
    }

    return request.save();
  }

  async cancel(
    id: string,
    userId: string,
    reason?: string,
  ): Promise<ServiceRequest> {
    const request = await this.serviceRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    if (['completed', 'cancelled', 'rejected'].includes(request.status)) {
      throw new BadRequestException('Cannot cancel this request');
    }

    request.status = 'cancelled';
    request.cancelledAt = new Date();
    request.cancellationReason = reason;
    request.statusHistory.push({
      status: 'cancelled',
      changedAt: new Date(),
      changedBy: new Types.ObjectId(userId),
      note: reason,
    });

    return request.save();
  }

  async rate(
    id: string,
    patientId: string,
    rateDto: RateServiceRequestDto,
  ): Promise<ServiceRequest> {
    const request = await this.serviceRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Service request not found');
    }

    if (request.patientId.toString() !== patientId) {
      throw new ForbiddenException('You can only rate your own requests');
    }

    if (request.status !== 'completed') {
      throw new BadRequestException('Can only rate completed services');
    }

    if (request.rating) {
      throw new BadRequestException('Already rated');
    }

    request.rating = rateDto.rating;
    request.review = rateDto.review;
    request.reviewedAt = new Date();

    await request.save();

    // Update nurse stats
    if (request.nurseId) {
      await this.nursesService.updateStats(
        request.nurseId.toString(),
        rateDto.rating,
      );
    }

    return request;
  }
}
