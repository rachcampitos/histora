export enum ConsultationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum DiagnosisType {
  PRINCIPAL = 'principal',
  SECONDARY = 'secondary',
  DIFFERENTIAL = 'differential',
}

export interface Diagnosis {
  code: string;
  description: string;
  type: DiagnosisType;
  notes?: string;
}

export interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
  isControlled: boolean;
}

export interface OrderedExam {
  name: string;
  type?: string;
  instructions?: string;
  isUrgent: boolean;
  results?: string;
  resultDate?: Date;
}

export interface PhysicalExamination {
  generalAppearance?: string;
  head?: string;
  eyes?: string;
  ears?: string;
  nose?: string;
  throat?: string;
  neck?: string;
  chest?: string;
  lungs?: string;
  heart?: string;
  abdomen?: string;
  extremities?: string;
  skin?: string;
  neurological?: string;
  musculoskeletal?: string;
  other?: string;
}

export interface Consultation {
  _id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  vitalsId?: string;
  date: Date;
  status: ConsultationStatus;
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  socialHistory?: string;
  allergies?: string;
  currentMedications?: string;
  physicalExamination?: PhysicalExamination;
  diagnoses: Diagnosis[];
  treatmentPlan?: string;
  prescriptions: Prescription[];
  orderedExams: OrderedExam[];
  clinicalNotes?: string;
  followUpDate?: Date;
  followUpInstructions?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  patient?: {
    _id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    gender?: string;
    phone?: string;
  };
  doctor?: {
    _id: string;
    firstName: string;
    lastName: string;
    specialty?: string;
  };
}

export interface CreateConsultationDto {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  date: Date;
  chiefComplaint: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  socialHistory?: string;
  allergies?: string;
  currentMedications?: string;
}

export interface UpdateConsultationDto {
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  familyHistory?: string;
  socialHistory?: string;
  allergies?: string;
  currentMedications?: string;
  physicalExamination?: PhysicalExamination;
  diagnoses?: Diagnosis[];
  treatmentPlan?: string;
  prescriptions?: Prescription[];
  orderedExams?: OrderedExam[];
  clinicalNotes?: string;
  followUpDate?: Date;
  followUpInstructions?: string;
}

export interface CompleteConsultationDto {
  treatmentPlan?: string;
  clinicalNotes?: string;
  followUpDate?: Date;
  followUpInstructions?: string;
}

export interface ConsultationFilters {
  patientId?: string;
  doctorId?: string;
  status?: ConsultationStatus;
  startDate?: string;
  endDate?: string;
}
