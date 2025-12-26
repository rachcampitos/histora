import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { Consultation, ConsultationStatus, DiagnosisType } from './schema/consultation.schema';
import {
  createMockModel,
  configureMockFind,
  configureMockFindOne,
  configureMockFindOneAndUpdate,
  MockModel,
} from '../../test/mocks/mongoose-model.mock';

describe('ConsultationsService', () => {
  let service: ConsultationsService;
  let consultationModel: MockModel;

  const mockClinicId = 'clinic-id-123';
  const mockPatientId = 'patient-id-456';
  const mockDoctorId = 'doctor-id-789';
  const mockAppointmentId = 'appointment-id-101';

  const mockConsultation = {
    _id: 'consultation-id-123',
    clinicId: mockClinicId,
    patientId: mockPatientId,
    doctorId: mockDoctorId,
    date: new Date(),
    status: ConsultationStatus.IN_PROGRESS,
    chiefComplaint: 'Dolor de cabeza persistente',
    historyOfPresentIllness: 'El paciente reporta dolores de cabeza por 3 días',
    diagnoses: [
      {
        code: 'G43.9',
        description: 'Migraña, no especificada',
        type: DiagnosisType.PRINCIPAL,
      },
    ],
    prescriptions: [
      {
        medication: 'Ibuprofeno',
        dosage: '400mg',
        frequency: 'Cada 8 horas',
        duration: '5 días',
        route: 'oral',
      },
    ],
    orderedExams: [
      {
        name: 'Hemograma completo',
        type: 'laboratory',
        isUrgent: false,
      },
    ],
    isDeleted: false,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  const mockCreateDto = {
    patientId: mockPatientId,
    doctorId: mockDoctorId,
    chiefComplaint: 'Dolor de cabeza persistente',
    historyOfPresentIllness: 'El paciente reporta dolores de cabeza por 3 días',
  };

  beforeEach(async () => {
    consultationModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationsService,
        {
          provide: getModelToken(Consultation.name),
          useValue: consultationModel,
        },
      ],
    }).compile();

    service = module.get<ConsultationsService>(ConsultationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a consultation', async () => {
      const result = await service.create(mockClinicId, mockCreateDto);

      expect(result).toBeDefined();
      expect(result.clinicId).toBe(mockClinicId);
      expect(result.chiefComplaint).toBe(mockCreateDto.chiefComplaint);
    });

    it('should create consultation with scheduled status by default', async () => {
      const result = await service.create(mockClinicId, mockCreateDto);

      expect(result.status).toBe(ConsultationStatus.SCHEDULED);
    });
  });

  describe('createFromAppointment', () => {
    it('should create consultation from appointment', async () => {
      configureMockFindOne(consultationModel, null); // No existing consultation

      const result = await service.createFromAppointment(mockClinicId, mockAppointmentId, {
        patientId: mockPatientId,
        doctorId: mockDoctorId,
        reasonForVisit: 'Control mensual',
      });

      expect(result).toBeDefined();
      expect(result.appointmentId).toBe(mockAppointmentId);
      expect(result.status).toBe(ConsultationStatus.IN_PROGRESS);
    });

    it('should throw error if consultation already exists for appointment', async () => {
      configureMockFindOne(consultationModel, mockConsultation);

      await expect(
        service.createFromAppointment(mockClinicId, mockAppointmentId, {
          patientId: mockPatientId,
          doctorId: mockDoctorId,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all consultations for clinic', async () => {
      configureMockFind(consultationModel, [mockConsultation]);

      const result = await service.findAll(mockClinicId);

      expect(result).toHaveLength(1);
    });

    it('should filter by patientId', async () => {
      configureMockFind(consultationModel, [mockConsultation]);

      await service.findAll(mockClinicId, { patientId: mockPatientId });

      expect(consultationModel.find).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      configureMockFind(consultationModel, [mockConsultation]);

      await service.findAll(mockClinicId, { status: ConsultationStatus.IN_PROGRESS });

      expect(consultationModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return consultation by id', async () => {
      configureMockFindOne(consultationModel, mockConsultation);

      const result = await service.findOne('consultation-id-123', mockClinicId);

      expect(result).toEqual(mockConsultation);
    });

    it('should throw NotFoundException when not found', async () => {
      configureMockFindOne(consultationModel, null);

      await expect(
        service.findOne('non-existent', mockClinicId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPatient', () => {
    it('should return consultations for patient', async () => {
      configureMockFind(consultationModel, [mockConsultation]);

      const result = await service.findByPatient(mockClinicId, mockPatientId);

      expect(result).toHaveLength(1);
    });

    it('should limit results when specified', async () => {
      configureMockFind(consultationModel, [mockConsultation]);

      await service.findByPatient(mockClinicId, mockPatientId, 5);

      expect(consultationModel.find).toHaveBeenCalled();
    });
  });

  describe('findByDoctor', () => {
    it('should return consultations for doctor', async () => {
      configureMockFind(consultationModel, [mockConsultation]);

      const result = await service.findByDoctor(mockClinicId, mockDoctorId);

      expect(result).toHaveLength(1);
    });

    it('should filter by status', async () => {
      configureMockFind(consultationModel, [mockConsultation]);

      await service.findByDoctor(mockClinicId, mockDoctorId, {
        status: ConsultationStatus.IN_PROGRESS,
      });

      expect(consultationModel.find).toHaveBeenCalled();
    });
  });

  describe('findByAppointment', () => {
    it('should return consultation for appointment', async () => {
      configureMockFindOne(consultationModel, mockConsultation);

      const result = await service.findByAppointment(mockClinicId, mockAppointmentId);

      expect(result).toEqual(mockConsultation);
    });
  });

  describe('update', () => {
    it('should update consultation', async () => {
      const updatedConsultation = {
        ...mockConsultation,
        treatmentPlan: 'Descanso y medicación',
      };
      configureMockFindOneAndUpdate(consultationModel, updatedConsultation);

      const result = await service.update('consultation-id-123', mockClinicId, {
        treatmentPlan: 'Descanso y medicación',
      });

      expect(result?.treatmentPlan).toBe('Descanso y medicación');
    });

    it('should throw NotFoundException when not found', async () => {
      configureMockFindOneAndUpdate(consultationModel, null);

      await expect(
        service.update('non-existent', mockClinicId, { treatmentPlan: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update status with valid transition', async () => {
      const inProgressConsultation = {
        ...mockConsultation,
        status: ConsultationStatus.SCHEDULED,
        save: jest.fn().mockResolvedValue({
          ...mockConsultation,
          status: ConsultationStatus.IN_PROGRESS,
        }),
      };
      configureMockFindOne(consultationModel, inProgressConsultation);

      const result = await service.updateStatus('consultation-id-123', mockClinicId, {
        status: ConsultationStatus.IN_PROGRESS,
      });

      expect(inProgressConsultation.save).toHaveBeenCalled();
    });

    it('should throw error for invalid status transition', async () => {
      const completedConsultation = {
        ...mockConsultation,
        status: ConsultationStatus.COMPLETED,
      };
      configureMockFindOne(consultationModel, completedConsultation);

      await expect(
        service.updateStatus('consultation-id-123', mockClinicId, {
          status: ConsultationStatus.IN_PROGRESS,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete', () => {
    it('should complete an in-progress consultation', async () => {
      const inProgressConsultation = {
        ...mockConsultation,
        status: ConsultationStatus.IN_PROGRESS,
        save: jest.fn().mockResolvedValue({
          ...mockConsultation,
          status: ConsultationStatus.COMPLETED,
        }),
      };
      configureMockFindOne(consultationModel, inProgressConsultation);

      const result = await service.complete('consultation-id-123', mockClinicId, {
        treatmentPlan: 'Reposo absoluto',
        followUpInstructions: 'Regresar en 1 semana',
      });

      expect(inProgressConsultation.save).toHaveBeenCalled();
    });

    it('should throw error if consultation is already completed', async () => {
      const completedConsultation = {
        ...mockConsultation,
        status: ConsultationStatus.COMPLETED,
      };
      configureMockFindOne(consultationModel, completedConsultation);

      await expect(
        service.complete('consultation-id-123', mockClinicId, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if consultation is cancelled', async () => {
      const cancelledConsultation = {
        ...mockConsultation,
        status: ConsultationStatus.CANCELLED,
      };
      configureMockFindOne(consultationModel, cancelledConsultation);

      await expect(
        service.complete('consultation-id-123', mockClinicId, {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addExamResults', () => {
    it('should add exam results to existing exams', async () => {
      const consultationWithExams = {
        ...mockConsultation,
        orderedExams: [
          { name: 'Hemograma completo', type: 'laboratory', isUrgent: false },
        ],
        save: jest.fn().mockResolvedValue(mockConsultation),
      };
      configureMockFindOne(consultationModel, consultationWithExams);

      await service.addExamResults('consultation-id-123', mockClinicId, {
        examResults: [
          { name: 'Hemograma completo', results: 'Normal' },
        ],
      });

      expect(consultationWithExams.save).toHaveBeenCalled();
    });
  });

  describe('linkVitals', () => {
    it('should link vitals to consultation', async () => {
      const vitalsId = 'vitals-id-123';
      configureMockFindOneAndUpdate(consultationModel, { ...mockConsultation, vitalsId });

      const result = await service.linkVitals('consultation-id-123', mockClinicId, vitalsId);

      expect(result?.vitalsId).toBe(vitalsId);
    });
  });

  describe('remove', () => {
    it('should soft delete consultation', async () => {
      const deletedConsultation = { ...mockConsultation, isDeleted: true };
      configureMockFindOneAndUpdate(consultationModel, deletedConsultation);

      const result = await service.remove('consultation-id-123', mockClinicId);

      expect(result?.isDeleted).toBe(true);
    });
  });

  describe('getPatientConsultationSummary', () => {
    it('should return patient consultation summary', async () => {
      const consultations = [
        { ...mockConsultation, status: ConsultationStatus.COMPLETED },
        {
          ...mockConsultation,
          _id: 'consultation-id-456',
          status: ConsultationStatus.COMPLETED,
          diagnoses: [
            { code: 'G43.9', description: 'Migraña', type: DiagnosisType.PRINCIPAL },
          ],
        },
      ];
      configureMockFind(consultationModel, consultations);

      const result = await service.getPatientConsultationSummary(mockClinicId, mockPatientId);

      expect(result.totalConsultations).toBe(2);
      expect(result.completedConsultations).toBe(2);
      expect(result.commonDiagnoses).toBeDefined();
    });
  });
});
