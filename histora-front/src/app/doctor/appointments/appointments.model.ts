/**
 * Appointment Status Enum
 * Represents the lifecycle states of an appointment
 */
export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

/**
 * Booked By Enum
 * Indicates who created the appointment
 */
export enum BookedBy {
  CLINIC = 'clinic',
  PATIENT = 'patient',
}

/**
 * Patient summary for populated appointment data
 */
export interface AppointmentPatient {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

/**
 * Doctor summary for populated appointment data
 */
export interface AppointmentDoctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialty?: string;
}

/**
 * Main Appointment interface
 * Represents an appointment with populated patient/doctor info for display
 */
export interface Appointment {
  _id: string;
  clinicId: string;
  patientId: string | AppointmentPatient;
  doctorId: string | AppointmentDoctor;
  scheduledDate: Date | string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  status: AppointmentStatus;
  reasonForVisit?: string;
  notes?: string;
  bookedBy: BookedBy;
  consultationId?: string;
  cancelledAt?: Date | string;
  cancellationReason?: string;
  cancelledBy?: string;
  isDeleted: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Paginated response for appointment list
 */
export interface AppointmentListResponse {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * DTO for creating a new appointment
 */
export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  scheduledDate: string; // ISO date format
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  reasonForVisit?: string;
  notes?: string;
}

/**
 * DTO for updating an existing appointment
 * All fields are optional
 */
export interface UpdateAppointmentDto {
  patientId?: string;
  doctorId?: string;
  scheduledDate?: string; // ISO date format
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  status?: AppointmentStatus;
  reasonForVisit?: string;
  notes?: string;
  cancellationReason?: string;
}
