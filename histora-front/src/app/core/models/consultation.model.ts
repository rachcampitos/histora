export enum ConsultationStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Diagnosis {
  code?: string;
  description: string;
  type: 'primary' | 'secondary';
}

export interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface OrderedExam {
  name: string;
  type: string;
  instructions?: string;
  priority: 'routine' | 'urgent';
}

export interface Consultation {
  _id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  date: Date;
  status: ConsultationStatus;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  physicalExamination?: Record<string, string>;
  diagnoses?: Diagnosis[];
  treatmentPlan?: string;
  prescriptions?: Prescription[];
  orderedExams?: OrderedExam[];
  followUpDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
