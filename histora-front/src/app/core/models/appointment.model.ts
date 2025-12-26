export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum BookedBy {
  CLINIC = 'clinic',
  PATIENT = 'patient',
}

export interface Appointment {
  _id: string;
  clinicId: string;
  patientId: string | { _id: string; firstName: string; lastName: string };
  doctorId: string | { _id: string; firstName: string; lastName: string };
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reasonForVisit?: string;
  bookedBy: BookedBy;
  consultationId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  reasonForVisit?: string;
  notes?: string;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
}
