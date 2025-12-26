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

export interface CancellationRules {
  minHoursBeforeAppointment: number;
  allowPatientCancellation: boolean;
  allowClinicCancellation: boolean;
}

@Injectable()
export class AppointmentsService {
  private readonly DEFAULT_CANCELLATION_RULES: CancellationRules = {
    minHoursBeforeAppointment: 24, // Minimum 24 hours before appointment
    allowPatientCancellation: true,
    allowClinicCancellation: true,
  };

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
    isPatientCancellation: boolean = false,
  ): Promise<Appointment | null> {
    // First, find the appointment to validate cancellation
    const existingAppointment = await this.appointmentModel
      .findOne({ _id: id, clinicId, isDeleted: false })
      .exec();

    if (!existingAppointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    // Validate appointment can be cancelled (status check)
    const cancellableStatuses = [
      AppointmentStatus.SCHEDULED,
      AppointmentStatus.CONFIRMED,
    ];
    if (!cancellableStatuses.includes(existingAppointment.status)) {
      throw new BadRequestException(
        `Cannot cancel appointment with status '${existingAppointment.status}'. Only scheduled or confirmed appointments can be cancelled.`,
      );
    }

    // Validate cancellation time window
    const cancellationCheck = this.validateCancellationTime(
      existingAppointment.scheduledDate,
      existingAppointment.startTime,
      isPatientCancellation,
    );

    if (!cancellationCheck.canCancel) {
      throw new BadRequestException(cancellationCheck.reason);
    }

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

    return appointment;
  }

  private validateCancellationTime(
    scheduledDate: Date,
    startTime: string,
    isPatientCancellation: boolean,
  ): { canCancel: boolean; reason?: string } {
    const rules = this.DEFAULT_CANCELLATION_RULES;

    // Check if cancellation is allowed for this user type
    if (isPatientCancellation && !rules.allowPatientCancellation) {
      return { canCancel: false, reason: 'Patient cancellations are not allowed. Please contact the clinic.' };
    }

    // Calculate appointment datetime
    const [hours, minutes] = startTime.split(':').map(Number);
    const appointmentDateTime = new Date(scheduledDate);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    // Calculate hours until appointment
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // If appointment is in the past, can't cancel
    if (hoursUntilAppointment < 0) {
      return { canCancel: false, reason: 'Cannot cancel past appointments.' };
    }

    // Check minimum hours requirement (only for patient cancellations)
    if (isPatientCancellation && hoursUntilAppointment < rules.minHoursBeforeAppointment) {
      return {
        canCancel: false,
        reason: `Appointments must be cancelled at least ${rules.minHoursBeforeAppointment} hours in advance. Please contact the clinic directly.`,
      };
    }

    return { canCancel: true };
  }

  async canCancelAppointment(
    id: string,
    clinicId: string,
    isPatientCancellation: boolean = false,
  ): Promise<{ canCancel: boolean; reason?: string }> {
    const appointment = await this.appointmentModel
      .findOne({ _id: id, clinicId, isDeleted: false })
      .exec();

    if (!appointment) {
      return { canCancel: false, reason: 'Appointment not found.' };
    }

    const cancellableStatuses = [
      AppointmentStatus.SCHEDULED,
      AppointmentStatus.CONFIRMED,
    ];
    if (!cancellableStatuses.includes(appointment.status)) {
      return {
        canCancel: false,
        reason: `Cannot cancel appointment with status '${appointment.status}'.`,
      };
    }

    return this.validateCancellationTime(
      appointment.scheduledDate,
      appointment.startTime,
      isPatientCancellation,
    );
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

  async linkConsultation(
    id: string,
    clinicId: string,
    consultationId: string,
  ): Promise<Appointment | null> {
    const appointment = await this.appointmentModel
      .findOneAndUpdate(
        { _id: id, clinicId, isDeleted: false },
        {
          consultationId,
          status: AppointmentStatus.IN_PROGRESS,
        },
        { new: true },
      )
      .exec();

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async completeFromConsultation(
    id: string,
    clinicId: string,
  ): Promise<Appointment | null> {
    const appointment = await this.appointmentModel
      .findOneAndUpdate(
        { _id: id, clinicId, isDeleted: false },
        { status: AppointmentStatus.COMPLETED },
        { new: true },
      )
      .exec();

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }
}
