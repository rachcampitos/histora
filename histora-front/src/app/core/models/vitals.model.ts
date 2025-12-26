export interface Vitals {
  _id: string;
  clinicId: string;
  patientId: string;
  consultationId?: string;
  recordedAt: Date;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  painLevel?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVitalsDto {
  patientId: string;
  consultationId?: string;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  painLevel?: number;
  notes?: string;
}
