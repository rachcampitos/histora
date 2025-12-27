export interface DoctorResponse {
  _id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  phone?: string;
  email?: string;
  clinicId?: string;
  userId?: string;
}

export interface PatientResponse {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  clinicId?: string;
}

export interface ClinicalHistoryResponse {
  _id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  date: string;
  reasonForVisit: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
}
