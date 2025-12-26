import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor, DoctorDocument } from '../doctors/schema/doctor.schema';
import { Clinic, ClinicDocument } from '../clinics/schema/clinic.schema';
import { Review, ReviewDocument } from '../reviews/schema/review.schema';
import { Appointment, AppointmentDocument, AppointmentStatus } from '../appointments/schema/appointment.schema';

@Injectable()
export class PublicDirectoryService {
  constructor(
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
    @InjectModel(Clinic.name) private clinicModel: Model<ClinicDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async searchDoctors(filters: {
    specialty?: string;
    name?: string;
    city?: string;
    minRating?: number;
    limit: number;
    offset: number;
  }) {
    const query: any = { isDeleted: false, isPublicProfile: true };

    if (filters.specialty) {
      query.$or = [
        { specialty: { $regex: filters.specialty, $options: 'i' } },
        { subspecialties: { $regex: filters.specialty, $options: 'i' } },
      ];
    }

    if (filters.name) {
      const nameQuery = [
        { firstName: { $regex: filters.name, $options: 'i' } },
        { lastName: { $regex: filters.name, $options: 'i' } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: nameQuery }];
        delete query.$or;
      } else {
        query.$or = nameQuery;
      }
    }

    if (filters.minRating) {
      query.averageRating = { $gte: filters.minRating };
    }

    let doctorQuery = this.doctorModel
      .find(query)
      .select('firstName lastName specialty subspecialties bio averageRating totalReviews clinicId')
      .populate('clinicId', 'name address city');

    // Filter by city (from clinic)
    if (filters.city) {
      const clinicsInCity = await this.clinicModel
        .find({ 'address.city': { $regex: filters.city, $options: 'i' }, isDeleted: false })
        .select('_id');
      const clinicIds = clinicsInCity.map((c) => c._id);
      query.clinicId = { $in: clinicIds };
    }

    const [doctors, total] = await Promise.all([
      doctorQuery
        .skip(filters.offset)
        .limit(filters.limit)
        .sort({ averageRating: -1, totalReviews: -1 })
        .exec(),
      this.doctorModel.countDocuments(query),
    ]);

    return {
      doctors,
      total,
      limit: filters.limit,
      offset: filters.offset,
    };
  }

  async getDoctorProfile(doctorId: string) {
    const doctor = await this.doctorModel
      .findOne({ _id: doctorId, isDeleted: false, isPublicProfile: true })
      .select('-isDeleted -__v -userId')
      .populate('clinicId', 'name address phone schedule')
      .exec();

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Get recent reviews
    const recentReviews = await this.reviewModel
      .find({ doctorId, isDeleted: false, isApproved: true })
      .select('rating title comment isVerified createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    // Get rating distribution
    const ratingStats = await this.reviewModel.aggregate([
      { $match: { doctorId: doctorId, isDeleted: false, isApproved: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: ratingStats.find((r) => r._id === rating)?.count || 0,
    }));

    return {
      ...doctor.toObject(),
      recentReviews,
      ratingDistribution,
    };
  }

  async getDoctorReviews(
    doctorId: string,
    options: { limit: number; offset: number },
  ) {
    const query = {
      doctorId,
      isDeleted: false,
      isApproved: true,
    };

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(query)
        .select('rating title comment isVerified isAnonymous response createdAt')
        .populate('patientId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(options.offset)
        .limit(options.limit)
        .exec(),
      this.reviewModel.countDocuments(query),
    ]);

    // Hide patient info for anonymous reviews
    const mappedReviews = reviews.map((review) => {
      const reviewObj = review.toObject();
      if (review.isAnonymous) {
        reviewObj.patientId = { firstName: 'Paciente', lastName: 'Anónimo' };
      }
      return reviewObj;
    });

    return {
      reviews: mappedReviews,
      total,
      limit: options.limit,
      offset: options.offset,
    };
  }

  async getDoctorAvailability(doctorId: string, date: Date) {
    const doctor = await this.doctorModel.findOne({
      _id: doctorId,
      isDeleted: false,
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await this.appointmentModel
      .find({
        doctorId,
        scheduledDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
        isDeleted: false,
      })
      .select('startTime endTime')
      .exec();

    // Default working hours
    const workingHours = {
      start: '09:00',
      end: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00',
    };
    const slotDuration = 30;

    const bookedSlots = existingAppointments.map((apt) => ({
      start: apt.startTime,
      end: apt.endTime,
    }));

    const availableSlots = this.calculateAvailableSlots(
      workingHours,
      bookedSlots,
      slotDuration,
    );

    return {
      date: date.toISOString().split('T')[0],
      doctorId,
      availableSlots,
      clinicId: doctor.clinicId,
    };
  }

  async getSpecialties() {
    const specialties = await this.doctorModel.distinct('specialty', {
      isDeleted: false,
      isPublicProfile: true,
    });

    const subspecialties = await this.doctorModel.distinct('subspecialties', {
      isDeleted: false,
      isPublicProfile: true,
    });

    // Combine and deduplicate
    const allSpecialties = [...new Set([...specialties, ...subspecialties.flat()])]
      .filter(Boolean)
      .sort();

    return { specialties: allSpecialties };
  }

  async searchClinics(filters: {
    name?: string;
    city?: string;
    limit: number;
    offset: number;
  }) {
    const query: any = { isDeleted: false, isActive: true };

    if (filters.name) {
      query.name = { $regex: filters.name, $options: 'i' };
    }

    if (filters.city) {
      query['address.city'] = { $regex: filters.city, $options: 'i' };
    }

    const [clinics, total] = await Promise.all([
      this.clinicModel
        .find(query)
        .select('name slug address phone specialties logo')
        .skip(filters.offset)
        .limit(filters.limit)
        .exec(),
      this.clinicModel.countDocuments(query),
    ]);

    return {
      clinics,
      total,
      limit: filters.limit,
      offset: filters.offset,
    };
  }

  async getClinicBySlug(slug: string) {
    const clinic = await this.clinicModel
      .findOne({ slug, isDeleted: false, isActive: true })
      .select('-isDeleted -__v -ownerId')
      .exec();

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    // Get doctors count
    const doctorsCount = await this.doctorModel.countDocuments({
      clinicId: clinic._id,
      isDeleted: false,
      isPublicProfile: true,
    });

    return {
      ...clinic.toObject(),
      doctorsCount,
    };
  }

  async getClinicDoctors(clinicId: string) {
    const doctors = await this.doctorModel
      .find({
        clinicId,
        isDeleted: false,
        isPublicProfile: true,
      })
      .select('firstName lastName specialty subspecialties bio averageRating totalReviews')
      .sort({ averageRating: -1 })
      .exec();

    return { doctors };
  }

  private calculateAvailableSlots(
    workingHours: { start: string; end: string; breakStart: string; breakEnd: string },
    bookedSlots: { start: string; end: string }[],
    slotDurationMinutes: number,
  ): { startTime: string; endTime: string }[] {
    const availableSlots: { startTime: string; endTime: string }[] = [];

    const toMinutes = (time: string): number => {
      const [hours, mins] = time.split(':').map(Number);
      return hours * 60 + mins;
    };

    const toTimeString = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const isSlotBooked = (start: number, end: number): boolean => {
      return bookedSlots.some((slot) => {
        const slotStart = toMinutes(slot.start);
        const slotEnd = toMinutes(slot.end);
        return start < slotEnd && end > slotStart;
      });
    };

    const isInBreak = (start: number, end: number): boolean => {
      const breakStart = toMinutes(workingHours.breakStart);
      const breakEnd = toMinutes(workingHours.breakEnd);
      return start < breakEnd && end > breakStart;
    };

    const workStart = toMinutes(workingHours.start);
    const workEnd = toMinutes(workingHours.end);

    for (let time = workStart; time + slotDurationMinutes <= workEnd; time += slotDurationMinutes) {
      const slotEnd = time + slotDurationMinutes;

      if (!isSlotBooked(time, slotEnd) && !isInBreak(time, slotEnd)) {
        availableSlots.push({
          startTime: toTimeString(time),
          endTime: toTimeString(slotEnd),
        });
      }
    }

    return availableSlots;
  }
}
