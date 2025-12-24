import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
  BookedBy,
} from './schema/appointment.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto, CancelAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async create(
    clinicId: string,
    createAppointmentDto: CreateAppointmentDto,
    bookedBy: BookedBy = BookedBy.CLINIC,
  ): Promise<Appointment> {
    // Validate time slot is available
    const isAvailable = await this.isTimeSlotAvailable(
      clinicId,
      createAppointmentDto.doctorId,
      new Date(createAppointmentDto.scheduledDate),
      createAppointmentDto.startTime,
      createAppointmentDto.endTime,
    );

    if (!isAvailable) {
      throw new BadRequestException('The selected time slot is not available');
    }

    const newAppointment = new this.appointmentModel({
      ...createAppointmentDto,
      clinicId,
      bookedBy,
      status: AppointmentStatus.SCHEDULED,
    });

    return newAppointment.save();
  }

  async findAll(
    clinicId: string,
    filters?: {
      doctorId?: string;
      patientId?: string;
      status?: AppointmentStatus;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<Appointment[]> {
    const query: any = { clinicId, isDeleted: false };

    if (filters?.doctorId) {
      query.doctorId = filters.doctorId;
    }

    if (filters?.patientId) {
      query.patientId = filters.patientId;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      query.scheduledDate = {};
      if (filters.startDate) {
        query.scheduledDate.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.scheduledDate.$lte = filters.endDate;
      }
    }

    return this.appointmentModel
      .find(query)
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ scheduledDate: 1, startTime: 1 })
      .exec();
  }

  async findOne(id: string, clinicId: string): Promise<Appointment> {
    const appointment = await this.appointmentModel
      .findOne({ _id: id, clinicId, isDeleted: false })
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName specialty')
      .exec();

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    return appointment;
  }

  async findByPatient(clinicId: string, patientId: string): Promise<Appointment[]> {
    return this.appointmentModel
      .find({ clinicId, patientId, isDeleted: false })
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ scheduledDate: -1 })
      .exec();
  }

  async findByDoctor(
    clinicId: string,
    doctorId: string,
    date?: Date,
  ): Promise<Appointment[]> {
    const query: any = { clinicId, doctorId, isDeleted: false };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }

    return this.appointmentModel
      .find(query)
      .populate('patientId', 'firstName lastName')
      .sort({ scheduledDate: 1, startTime: 1 })
      .exec();
  }

  async update(
    id: string,
    clinicId: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment | null> {
    // If changing time, validate availability
    if (
      updateAppointmentDto.scheduledDate ||
      updateAppointmentDto.startTime ||
      updateAppointmentDto.endTime ||
      updateAppointmentDto.doctorId
    ) {
      const existing = await this.appointmentModel.findOne({
        _id: id,
        clinicId,
        isDeleted: false,
      });

      if (!existing) {
        throw new NotFoundException(`Appointment with ID ${id} not found`);
      }

      const isAvailable = await this.isTimeSlotAvailable(
        clinicId,
        updateAppointmentDto.doctorId || existing.doctorId.toString(),
        updateAppointmentDto.scheduledDate
          ? new Date(updateAppointmentDto.scheduledDate)
          : existing.scheduledDate,
        updateAppointmentDto.startTime || existing.startTime,
        updateAppointmentDto.endTime || existing.endTime,
        id,
      );

      if (!isAvailable) {
        throw new BadRequestException('The selected time slot is not available');
      }
    }

    const appointment = await this.appointmentModel
      .findOneAndUpdate(
        { _id: id, clinicId, isDeleted: false },
        updateAppointmentDto,
        { new: true },
      )
      .exec();

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async updateStatus(
    id: string,
    clinicId: string,
    status: AppointmentStatus,
  ): Promise<Appointment | null> {
    const appointment = await this.appointmentModel
      .findOneAndUpdate(
        { _id: id, clinicId, isDeleted: false },
        { status },
        { new: true },
      )
      .exec();

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async cancel(
    id: string,
    clinicId: string,
    cancelDto: CancelAppointmentDto,
    cancelledBy: string,
  ): Promise<Appointment | null> {
    const appointment = await this.appointmentModel
      .findOneAndUpdate(
        { _id: id, clinicId, isDeleted: false },
        {
          status: AppointmentStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: cancelDto.cancellationReason,
          cancelledBy,
        },
        { new: true },
      )
      .exec();

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async remove(id: string, clinicId: string): Promise<Appointment | null> {
    const appointment = await this.appointmentModel
      .findOneAndUpdate(
        { _id: id, clinicId },
        { isDeleted: true },
        { new: true },
      )
      .exec();

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async getAvailableSlots(
    clinicId: string,
    doctorId: string,
    date: Date,
    slotDurationMinutes: number = 30,
  ): Promise<{ startTime: string; endTime: string }[]> {
    // Get existing appointments for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await this.appointmentModel
      .find({
        clinicId,
        doctorId,
        scheduledDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
        isDeleted: false,
      })
      .exec();

    // Default working hours (could be configurable per doctor/clinic)
    const workingHours = {
      start: '09:00',
      end: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00',
    };

    const bookedSlots = existingAppointments.map((apt) => ({
      start: apt.startTime,
      end: apt.endTime,
    }));

    return this.calculateAvailableSlots(
      workingHours,
      bookedSlots,
      slotDurationMinutes,
    );
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

  private async isTimeSlotAvailable(
    clinicId: string,
    doctorId: string,
    date: Date,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query: any = {
      clinicId,
      doctorId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
      isDeleted: false,
    };

    if (excludeAppointmentId) {
      query._id = { $ne: excludeAppointmentId };
    }

    const existingAppointments = await this.appointmentModel.find(query).exec();

    const toMinutes = (time: string): number => {
      const [hours, mins] = time.split(':').map(Number);
      return hours * 60 + mins;
    };

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);

    for (const apt of existingAppointments) {
      const aptStart = toMinutes(apt.startTime);
      const aptEnd = toMinutes(apt.endTime);

      // Check for overlap
      if (newStart < aptEnd && newEnd > aptStart) {
        return false;
      }
    }

    return true;
  }

  async countByClinicAndStatus(
    clinicId: string,
    status?: AppointmentStatus,
  ): Promise<number> {
    const query: any = { clinicId, isDeleted: false };
    if (status) {
      query.status = status;
    }
    return this.appointmentModel.countDocuments(query).exec();
  }

  async getTodaysAppointments(clinicId: string, doctorId?: string): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query: any = {
      clinicId,
      scheduledDate: { $gte: today, $lt: tomorrow },
      isDeleted: false,
    };

    if (doctorId) {
      query.doctorId = doctorId;
    }

    return this.appointmentModel
      .find(query)
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ startTime: 1 })
      .exec();
  }
}
