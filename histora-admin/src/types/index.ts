// User types
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'platform_admin' | 'nurse' | 'patient';
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser extends User {
  role: 'platform_admin';
  permissions?: string[];
}

// Nurse types
export interface Nurse {
  _id: string;
  userId: string;
  user?: User;
  cepNumber: string;
  cepVerified: boolean;
  cepVerificationStatus: 'pending' | 'approved' | 'rejected';
  cepPhoto?: string;
  selfiePhoto?: string;
  dni: string;
  specialties: string[];
  services: NurseService[];
  averageRating: number;
  totalReviews: number;
  totalServices: number;
  isActive: boolean;
  isAvailable: boolean;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  createdAt: string;
  updatedAt: string;
}

export interface NurseService {
  _id?: string;
  name: string;
  category: ServiceCategory;
  price: number;
  currency: 'PEN';
  durationMinutes: number;
  description?: string;
  isActive: boolean;
}

export type ServiceCategory =
  | 'injection'
  | 'wound_care'
  | 'catheter'
  | 'vital_signs'
  | 'iv_therapy'
  | 'blood_draw'
  | 'medication'
  | 'elderly_care'
  | 'post_surgery'
  | 'other';

// Service Request types
export interface ServiceRequest {
  _id: string;
  patientId: string;
  patient?: User;
  nurseId?: string;
  nurse?: Nurse;
  service: {
    name: string;
    category: ServiceCategory;
    price: number;
    currency: 'PEN';
    durationMinutes: number;
  };
  status: ServiceRequestStatus;
  location: {
    address: string;
    district: string;
    city: string;
    reference?: string;
    coordinates?: [number, number];
  };
  requestedDate: string;
  requestedTimeSlot: 'morning' | 'afternoon' | 'evening' | 'asap';
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  rating?: number;
  review?: string;
  patientNotes?: string;
  nurseNotes?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: 'card' | 'yape';
  createdAt: string;
  updatedAt: string;
}

export type ServiceRequestStatus =
  | 'pending'
  | 'accepted'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

// Analytics types
export interface DashboardMetrics {
  gmv: number;
  gmvChange: number;
  totalServices: number;
  servicesChange: number;
  activeNurses: number;
  nursesChange: number;
  activePatients: number;
  patientsChange: number;
  avgRating: number;
  conversionRate: number;
  cancellationRate: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

// Coupon types
export interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  maxUses: number;
  currentUses: number;
  maxUsesPerUser: number;
  userSegment: 'new' | 'existing' | 'all';
  serviceTypes?: ServiceCategory[];
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

// Notification types
export interface AdminNotification {
  _id: string;
  type: 'verification' | 'service' | 'payment' | 'alert';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  actionUrl?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
