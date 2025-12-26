import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor, DoctorDocument, DayOfWeek, DaySchedule } from './schema/doctor.schema';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
  ) {}

  private getDefaultWorkingHours(): DaySchedule[] {
    const weekdays = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
    ];

    const defaultSchedule: DaySchedule[] = weekdays.map((day) => ({
      day,
      isWorking: true,
      slots: [
        { start: '09:00', end: '13:00' },
        { start: '14:00', end: '18:00' },
      ],
      breaks: [{ start: '13:00', end: '14:00' }],
    }));

    // Add weekend as non-working
    defaultSchedule.push({
      day: DayOfWeek.SATURDAY,
      isWorking: false,
      slots: [],
      breaks: [],
    });
    defaultSchedule.push({
      day: DayOfWeek.SUNDAY,
      isWorking: false,
      slots: [],
      breaks: [],
    });

    return defaultSchedule;
  }

  async create(
    clinicId: string,
    userId: string,
    createDoctorDto: CreateDoctorDto,
  ): Promise<Doctor> {
    const newDoctor = new this.doctorModel({
      ...createDoctorDto,
      clinicId,
      userId,
      workingHours: this.getDefaultWorkingHours(),
      appointmentDuration: 30,
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

  async updateWorkingHours(
    id: string,
    clinicId: string,
    workingHours: DaySchedule[],
  ): Promise<Doctor | null> {
    const doctor = await this.doctorModel
      .findOneAndUpdate(
        { _id: id, clinicId, isDeleted: false },
        { workingHours },
        { new: true },
      )
      .exec();

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async updateAppointmentDuration(
    id: string,
    clinicId: string,
    duration: number,
  ): Promise<Doctor | null> {
    if (duration < 15 || duration > 120) {
      throw new Error('Appointment duration must be between 15 and 120 minutes');
    }

    const doctor = await this.doctorModel
      .findOneAndUpdate(
        { _id: id, clinicId, isDeleted: false },
        { appointmentDuration: duration },
        { new: true },
      )
      .exec();

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async getWorkingHoursForDate(
    id: string,
    date: Date,
  ): Promise<{ slots: { start: string; end: string }[]; duration: number } | null> {
    const doctor = await this.doctorModel.findById(id).exec();
    if (!doctor || doctor.isDeleted) {
      return null;
    }

    const dayOfWeek = this.getDayOfWeek(date);
    const schedule = doctor.workingHours?.find((wh) => wh.day === dayOfWeek);

    if (!schedule || !schedule.isWorking) {
      return { slots: [], duration: doctor.appointmentDuration || 30 };
    }

    return {
      slots: schedule.slots || [],
      duration: doctor.appointmentDuration || 30,
    };
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[date.getDay()];
  }

  async getAvailableTimeSlots(
    id: string,
    date: Date,
    bookedSlots: { startTime: string; endTime: string }[],
  ): Promise<{ startTime: string; endTime: string }[]> {
    const workingHours = await this.getWorkingHoursForDate(id, date);
    if (!workingHours || workingHours.slots.length === 0) {
      return [];
    }

    const duration = workingHours.duration;
    const availableSlots: { startTime: string; endTime: string }[] = [];

    for (const slot of workingHours.slots) {
      let currentTime = this.timeToMinutes(slot.start);
      const slotEnd = this.timeToMinutes(slot.end);

      while (currentTime + duration <= slotEnd) {
        const startTime = this.minutesToTime(currentTime);
        const endTime = this.minutesToTime(currentTime + duration);

        // Check if this slot is already booked
        const isBooked = bookedSlots.some((booked) => {
          const bookedStart = this.timeToMinutes(booked.startTime);
          const bookedEnd = this.timeToMinutes(booked.endTime);
          return (
            (currentTime >= bookedStart && currentTime < bookedEnd) ||
            (currentTime + duration > bookedStart && currentTime + duration <= bookedEnd)
          );
        });

        if (!isBooked) {
          availableSlots.push({ startTime, endTime });
        }

        currentTime += duration;
      }
    }

    return availableSlots;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}
