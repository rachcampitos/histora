import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from '../patients/schemas/patients.schema';
import { Appointment, AppointmentDocument, AppointmentStatus, BookedBy } from '../appointments/schema/appointment.schema';
import { ClinicalHistory, ClinicalHistoryDocument } from '../clinical-history/schema/clinical-history.schema';
import { Consultation, ConsultationDocument, ConsultationStatus } from '../consultations/schema/consultation.schema';
import { Vitals, VitalsDocument } from '../vitals/schema/vitals.schema';
import { Doctor, DoctorDocument } from '../doctors/schema/doctor.schema';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';

@Injectable()
export class PatientPortalService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(ClinicalHistory.name) private clinicalHistoryModel: Model<ClinicalHistoryDocument>,
    @InjectModel(Consultation.name) private consultationModel: Model<ConsultationDocument>,
    @InjectModel(Vitals.name) private vitalsModel: Model<VitalsDocument>,
    @InjectModel(Doctor.name) private doctorModel: Model<DoctorDocument>,
  ) {}

  async getPatientProfile(patientId: string) {
    const patient = await this.patientModel
      .findOne({ _id: patientId, isDeleted: false })
      .select('-isDeleted -__v')
      .exec();

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    return patient;
  }

  async updatePatientProfile(patientId: string, updateDto: UpdatePatientProfileDto) {
    const patient = await this.patientModel
      .findOneAndUpdate(
        { _id: patientId, isDeleted: false },
        updateDto,
        { new: true },
      )
      .select('-isDeleted -__v')
      .exec();

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    return patient;
  }

  async getPatientAppointments(
    patientId: string,
    options?: { status?: string; upcoming?: boolean },
  ) {
    const query: any = { patientId, isDeleted: false };

    if (options?.status) {
      query.status = options.status;
    }

    if (options?.upcoming) {
      query.scheduledDate = { $gte: new Date() };
      query.status = { $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] };
    }

    return this.appointmentModel
      .find(query)
      .populate('doctorId', 'firstName lastName specialty')
      .populate('clinicId', 'name address')
      .sort({ scheduledDate: 1, startTime: 1 })
      .select('-isDeleted -__v')
      .exec();
  }

  async bookAppointment(patientId: string, bookDto: BookAppointmentDto) {
    // Verify doctor exists and is available
    const doctor = await this.doctorModel.findOne({
      _id: bookDto.doctorId,
      clinicId: bookDto.clinicId,
      isDeleted: false,
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Check if slot is available
    const isAvailable = await this.isSlotAvailable(
      bookDto.clinicId,
      bookDto.doctorId,
      new Date(bookDto.scheduledDate),
      bookDto.startTime,
      bookDto.endTime,
    );

    if (!isAvailable) {
      throw new BadRequestException('The selected time slot is not available');
    }

    const appointment = new this.appointmentModel({
      ...bookDto,
      patientId,
      status: AppointmentStatus.SCHEDULED,
      bookedBy: BookedBy.PATIENT,
    });

    const saved = await appointment.save();

    return this.appointmentModel
      .findById(saved._id)
      .populate('doctorId', 'firstName lastName specialty')
      .populate('clinicId', 'name address')
      .exec();
  }

  async cancelAppointment(patientId: string, appointmentId: string, reason?: string) {
    const appointment = await this.appointmentModel.findOne({
      _id: appointmentId,
      patientId,
      isDeleted: false,
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed appointment');
    }

    // Check if cancellation is allowed (e.g., at least 24 hours before)
    const appointmentDate = new Date(appointment.scheduledDate);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 24) {
      throw new BadRequestException('Appointments must be cancelled at least 24 hours in advance');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancellationReason = reason || 'Cancelled by patient';
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = patientId as any;

    return appointment.save();
  }

  async getPatientClinicalHistory(patientId: string, limit?: number) {
    const query = this.clinicalHistoryModel
      .find({ patientId, isDeleted: false })
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ date: -1 })
      .select('-isDeleted -__v');

    if (limit) {
      query.limit(limit);
    }

    return query.exec();
  }

  async getPatientMedicalSummary(patientId: string) {
    const histories = await this.clinicalHistoryModel
      .find({ patientId, isDeleted: false })
      .sort({ date: -1 })
      .exec();

    const allergies = new Map();
    const chronicConditions = new Map();
    const currentMedications = new Map();
    const vaccinations = new Map();

    for (const history of histories) {
      history.allergies?.forEach((a) => allergies.set(a.allergen, a));
      history.chronicConditions?.forEach((c) => chronicConditions.set(c.condition, c));
      history.currentMedications?.forEach((m) => currentMedications.set(m.medication, m));
      history.vaccinations?.forEach((v) => vaccinations.set(v.vaccine, v));
    }

    const latestVitals = await this.vitalsModel
      .findOne({ patientId, isDeleted: false })
      .sort({ recordedAt: -1 })
      .exec();

    return {
      allergies: Array.from(allergies.values()),
      chronicConditions: Array.from(chronicConditions.values()),
      currentMedications: Array.from(currentMedications.values()),
      vaccinations: Array.from(vaccinations.values()),
      latestVitals,
      totalVisits: histories.length,
    };
  }

  async getPatientConsultations(patientId: string, limit?: number) {
    const query = this.consultationModel
      .find({ patientId, isDeleted: false })
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ date: -1 })
      .select('date status chiefComplaint diagnoses doctorId');

    if (limit) {
      query.limit(limit);
    }

    return query.exec();
  }

  async getConsultationDetail(patientId: string, consultationId: string) {
    const consultation = await this.consultationModel
      .findOne({ _id: consultationId, patientId, isDeleted: false })
      .populate('doctorId', 'firstName lastName specialty')
      .populate('vitalsId')
      .exec();

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    return consultation;
  }

  async getPatientVitals(patientId: string, limit?: number) {
    const query = this.vitalsModel
      .find({ patientId, isDeleted: false })
      .sort({ recordedAt: -1 })
      .select('-isDeleted -__v');

    if (limit) {
      query.limit(limit);
    }

    return query.exec();
  }

  async getLatestVitals(patientId: string) {
    return this.vitalsModel
      .findOne({ patientId, isDeleted: false })
      .sort({ recordedAt: -1 })
      .select('-isDeleted -__v')
      .exec();
  }

  async getPatientPrescriptions(patientId: string, activeOnly: boolean = false) {
    const consultations = await this.consultationModel
      .find({
        patientId,
        isDeleted: false,
        'prescriptions.0': { $exists: true },
      })
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ date: -1 })
      .exec();

    const prescriptions = consultations.flatMap((c) =>
      c.prescriptions.map((p) => ({
        ...p,
        prescribedDate: c.date,
        prescribedBy: c.doctorId,
        consultationId: c._id,
      })),
    );

    return prescriptions;
  }

  async searchDoctors(filters: { specialty?: string; name?: string }) {
    const query: any = { isDeleted: false, isPublicProfile: true };

    if (filters.specialty) {
      query.specialty = { $regex: filters.specialty, $options: 'i' };
    }

    if (filters.name) {
      query.$or = [
        { firstName: { $regex: filters.name, $options: 'i' } },
        { lastName: { $regex: filters.name, $options: 'i' } },
      ];
    }

    return this.doctorModel
      .find(query)
      .select('firstName lastName specialty bio averageRating totalReviews clinicId')
      .populate('clinicId', 'name address')
      .exec();
  }

  async getDoctorPublicProfile(doctorId: string) {
    const doctor = await this.doctorModel
      .findOne({ _id: doctorId, isDeleted: false, isPublicProfile: true })
      .select('firstName lastName specialty subspecialties bio education averageRating totalReviews clinicId')
      .populate('clinicId', 'name address phone')
      .exec();

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
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
      .exec();

    // Default working hours
    const workingHours = { start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00' };
    const slotDuration = 30;

    const bookedSlots = existingAppointments.map((apt) => ({
      start: apt.startTime,
      end: apt.endTime,
    }));

    return this.calculateAvailableSlots(workingHours, bookedSlots, slotDuration);
  }

  private async isSlotAvailable(
    clinicId: string,
    doctorId: string,
    date: Date,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
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

    const toMinutes = (time: string): number => {
      const [hours, mins] = time.split(':').map(Number);
      return hours * 60 + mins;
    };

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);

    for (const apt of existingAppointments) {
      const aptStart = toMinutes(apt.startTime);
      const aptEnd = toMinutes(apt.endTime);

      if (newStart < aptEnd && newEnd > aptStart) {
        return false;
      }
    }

    return true;
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
