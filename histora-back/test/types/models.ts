export interface DoctorResponse {
  _id: string;
  name: string;
  specialty: string;
  phone?: string;
  email?: string;
}

export interface PatientResponse {
  _id: string;
  firstName: string;
  lastName?: string;
  birthDate?: string;
  gender?: string;
  email?: string;
  phone?: string;
}
