export type VerificationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface Nurse {
  _id: string;
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  cepNumber: string; // Colegio de Enfermeros del Peru
  cepVerified: boolean;
  cepVerifiedAt?: Date;
  verificationStatus: VerificationStatus;
  specialties: string[];
  bio?: string;
  yearsOfExperience: number;

  // Services offered
  services: NurseService[];

  // Location
  location: GeoLocation;
  serviceRadius: number; // in kilometers
  extraChargePerKm?: number;
  minimumServiceFee?: number;

  // Availability
  isAvailable: boolean;
  availableFrom?: string; // HH:mm format
  availableTo?: string;
  availableDays: number[]; // 0-6 (Sunday-Saturday)

  // Stats
  averageRating: number;
  totalReviews: number;
  totalServicesCompleted: number;

  // Status
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Verification document types
export type VerificationDocumentType = 'cep_front' | 'cep_back' | 'dni_front' | 'dni_back' | 'selfie_with_dni';

export interface VerificationDocument {
  url: string;
  publicId: string;
  type: VerificationDocumentType;
  uploadedAt: Date;
}

export interface CepValidationResult {
  isValid: boolean;
  cepNumber?: string;
  fullName?: string;
  dni?: string;
  photoUrl?: string;
  isPhotoVerified?: boolean;
  isNameVerified?: boolean;
  // New fields from view.php endpoint
  region?: string;
  isHabil?: boolean;
  status?: 'HABIL' | 'INHABILITADO' | 'UNKNOWN';
  validatedAt?: Date;
  error?: string;
}

export interface NurseVerification {
  id: string;
  nurseId: string;
  userId: string;
  documents: VerificationDocument[];
  status: VerificationStatus;
  dniNumber?: string;
  fullNameOnDni?: string;
  // CEP validation fields
  cepValidation?: CepValidationResult;
  officialCepPhotoUrl?: string;
  cepIdentityConfirmed?: boolean;
  cepIdentityConfirmedAt?: Date;
  // Review fields
  reviewedAt?: Date;
  reviewNotes?: string;
  rejectionReason?: string;
  attemptNumber: number;
  createdAt: Date;
  nurse?: {
    cepNumber: string;
    specialties: string[];
    officialCepPhotoUrl?: string;
    cepRegisteredName?: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
  };
}

export interface NurseService {
  _id?: string;
  name: string;
  description: string;
  category: ServiceCategory;
  price: number;
  currency: string;
  durationMinutes: number;
  isActive: boolean;
}

export type ServiceCategory =
  | 'injection'      // Inyectables
  | 'wound_care'     // Curaciones
  | 'catheter'       // Sondas
  | 'vital_signs'    // Control de signos vitales
  | 'iv_therapy'     // Terapia intravenosa
  | 'blood_draw'     // Toma de muestras
  | 'medication'     // Administracion de medicamentos
  | 'elderly_care'   // Cuidado de adulto mayor
  | 'post_surgery'   // Cuidado post-operatorio
  | 'other';

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  city?: string;
  district?: string;
}

export interface NurseSearchParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  category?: ServiceCategory;
  minRating?: number;
  maxPrice?: number;
  availableNow?: boolean;
}

export interface NurseSearchResult {
  nurse: Nurse;
  distance: number; // in km
}

export interface NurseReview {
  _id: string;
  nurseId: string;
  patientId: string;
  patient?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  serviceRequestId?: string;
  rating: number;
  comment: string;
  createdAt: Date;
}
