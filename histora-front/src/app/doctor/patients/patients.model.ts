export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface Patient {
  _id?: string;
  clinicId?: string;
  userId?: string;
  firstName: string;
  lastName?: string;
  dateOfBirth?: Date | string;
  gender?: 'male' | 'female' | 'other';
  documentType?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  address?: Address;
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  bloodType?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
  isDeleted?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface PatientListResponse {
  data: Patient[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreatePatientDto {
  firstName: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  documentType?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  address?: Address;
  occupation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  bloodType?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
}

export type UpdatePatientDto = Partial<CreatePatientDto>;
