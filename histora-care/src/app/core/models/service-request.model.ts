export interface ServiceRequest {
  _id: string;
  patientId: string;
  patient?: {
    firstName: string;
    lastName: string;
    phone: string;
    avatar?: string;
  };
  nurseId?: string;
  nurse?: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatar?: string;
    cepNumber: string;
  };

  // Service details
  service: {
    name: string;
    category: string;
    price: number;
    currency: string;
    durationMinutes: number;
  };

  // Location
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
    reference?: string; // Additional reference for finding the place
    district: string;
    city: string;
  };

  // Scheduling
  requestedDate: Date;
  requestedTimeSlot: string; // "morning" | "afternoon" | "evening" | "asap"
  scheduledAt?: Date;

  // Status flow
  status: ServiceRequestStatus;
  statusHistory: StatusChange[];

  // Notes
  patientNotes?: string;
  nurseNotes?: string;

  // Payment
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentId?: string;

  // Rating
  rating?: number;
  review?: string;
  reviewedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export type ServiceRequestStatus =
  | 'pending'        // Waiting for nurse to accept
  | 'accepted'       // Nurse accepted, waiting for scheduled time
  | 'on_the_way'     // Nurse is heading to location
  | 'arrived'        // Nurse arrived at location
  | 'in_progress'    // Service being performed
  | 'completed'      // Service completed
  | 'cancelled'      // Cancelled by patient or nurse
  | 'rejected';      // Rejected by nurse

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'refunded'
  | 'failed';

export interface StatusChange {
  status: ServiceRequestStatus;
  changedAt: Date;
  changedBy: string;
  note?: string;
}

export interface CreateServiceRequest {
  nurseId: string;
  serviceId: string;
  location: {
    coordinates: [number, number];
    address: string;
    reference?: string;
    district: string;
    city: string;
  };
  requestedDate: string; // ISO date
  requestedTimeSlot: string;
  patientNotes?: string;
}
