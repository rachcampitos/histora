import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PatientPortalService } from './patient-portal.service';
import { Patient } from '../patients/schemas/patients.schema';
import { Appointment, AppointmentStatus } from '../appointments/schema/appointment.schema';
import { ClinicalHistory } from '../clinical-history/schema/clinical-history.schema';
import { Consultation } from '../consultations/schema/consultation.schema';
import { Vitals } from '../vitals/schema/vitals.schema';
import { Doctor } from '../doctors/schema/doctor.schema';
import {
  createMockModel,
  configureMockFind,
  configureMockFindOne,
  configureMockFindOneAndUpdate,
  MockModel,
} from '../../test/mocks/mongoose-model.mock';

describe('PatientPortalService', () => {
  let service: PatientPortalService;
  let patientModel: MockModel;
  let appointmentModel: MockModel;
  let clinicalHistoryModel: MockModel;
  let consultationModel: MockModel;
  let vitalsModel: MockModel;
  let doctorModel: MockModel;

  const mockPatientId = 'patient-id-123';
  const mockDoctorId = 'doctor-id-456';
  const mockClinicId = 'clinic-id-789';

  const mockPatient = {
    _id: mockPatientId,
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    isDeleted: false,
  };

  const mockDoctor = {
    _id: mockDoctorId,
    firstName: 'María',
    lastName: 'García',
    specialty: 'Medicina General',
    clinicId: mockClinicId,
    isDeleted: false,
    isPublicProfile: true,
  };

  const mockAppointment = {
    _id: 'appointment-id-123',
    patientId: mockPatientId,
    doctorId: mockDoctorId,
    clinicId: mockClinicId,
    scheduledDate: new Date('2025-12-30'),
    startTime: '10:00',
    endTime: '10:30',
    status: AppointmentStatus.SCHEDULED,
    isDeleted: false,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  beforeEach(async () => {
    patientModel = createMockModel();
    appointmentModel = createMockModel();
    clinicalHistoryModel = createMockModel();
    consultationModel = createMockModel();
    vitalsModel = createMockModel();
    doctorModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientPortalService,
        { provide: getModelToken(Patient.name), useValue: patientModel },
        { provide: getModelToken(Appointment.name), useValue: appointmentModel },
        { provide: getModelToken(ClinicalHistory.name), useValue: clinicalHistoryModel },
        { provide: getModelToken(Consultation.name), useValue: consultationModel },
        { provide: getModelToken(Vitals.name), useValue: vitalsModel },
        { provide: getModelToken(Doctor.name), useValue: doctorModel },
      ],
    }).compile();

    service = module.get<PatientPortalService>(PatientPortalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPatientProfile', () => {
    it('should return patient profile', async () => {
      configureMockFindOne(patientModel, mockPatient);

      const result = await service.getPatientProfile(mockPatientId);

      expect(result).toEqual(mockPatient);
    });

    it('should throw NotFoundException when patient not found', async () => {
      configureMockFindOne(patientModel, null);

      await expect(service.getPatientProfile('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePatientProfile', () => {
    it('should update patient profile', async () => {
      const updatedPatient = { ...mockPatient, phone: '123456789' };
      configureMockFindOneAndUpdate(patientModel, updatedPatient);

      const result = await service.updatePatientProfile(mockPatientId, {
        phone: '123456789',
      });

      expect(result.phone).toBe('123456789');
    });
  });

  describe('getPatientAppointments', () => {
    it('should return patient appointments', async () => {
      configureMockFind(appointmentModel, [mockAppointment]);

      const result = await service.getPatientAppointments(mockPatientId);

      expect(result).toHaveLength(1);
    });

    it('should filter upcoming appointments', async () => {
      configureMockFind(appointmentModel, [mockAppointment]);

      await service.getPatientAppointments(mockPatientId, { upcoming: true });

      expect(appointmentModel.find).toHaveBeenCalled();
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel appointment', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days from now

      const appointmentToCancelMock = {
        ...mockAppointment,
        scheduledDate: futureDate,
        save: jest.fn().mockResolvedValue({
          ...mockAppointment,
          status: AppointmentStatus.CANCELLED,
        }),
      };

      configureMockFindOne(appointmentModel, appointmentToCancelMock);

      await service.cancelAppointment(mockPatientId, 'appointment-id-123', 'Personal reasons');

      expect(appointmentToCancelMock.save).toHaveBeenCalled();
    });

    it('should throw error if appointment not found', async () => {
      configureMockFindOne(appointmentModel, null);

      await expect(
        service.cancelAppointment(mockPatientId, 'non-existent', 'reason'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if appointment already cancelled', async () => {
      const cancelledAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      };
      configureMockFindOne(appointmentModel, cancelledAppointment);

      await expect(
        service.cancelAppointment(mockPatientId, 'appointment-id-123', 'reason'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPatientClinicalHistory', () => {
    it('should return clinical history', async () => {
      const mockHistory = [{ _id: 'history-1', patientId: mockPatientId }];
      configureMockFind(clinicalHistoryModel, mockHistory);

      const result = await service.getPatientClinicalHistory(mockPatientId);

      expect(result).toHaveLength(1);
    });
  });

  describe('getPatientMedicalSummary', () => {
    it('should return aggregated medical summary', async () => {
      const mockHistories = [{
        allergies: [{ allergen: 'Penicilina' }],
        chronicConditions: [{ condition: 'Hipertensión' }],
        currentMedications: [{ medication: 'Losartán' }],
        vaccinations: [{ vaccine: 'COVID-19' }],
      }];
      configureMockFind(clinicalHistoryModel, mockHistories);
      configureMockFindOne(vitalsModel, { weight: 70, height: 175 });

      const result = await service.getPatientMedicalSummary(mockPatientId);

      expect(result.allergies).toBeDefined();
      expect(result.chronicConditions).toBeDefined();
      expect(result.latestVitals).toBeDefined();
    });
  });

  describe('getPatientConsultations', () => {
    it('should return patient consultations', async () => {
      const mockConsultations = [{ _id: 'consult-1', patientId: mockPatientId }];
      configureMockFind(consultationModel, mockConsultations);

      const result = await service.getPatientConsultations(mockPatientId);

      expect(result).toHaveLength(1);
    });
  });

  describe('getPatientVitals', () => {
    it('should return patient vitals history', async () => {
      const mockVitals = [{ _id: 'vitals-1', weight: 70 }];
      configureMockFind(vitalsModel, mockVitals);

      const result = await service.getPatientVitals(mockPatientId);

      expect(result).toHaveLength(1);
    });
  });

  describe('getLatestVitals', () => {
    it('should return latest vitals', async () => {
      const mockLatestVitals = { weight: 70, height: 175 };
      configureMockFindOne(vitalsModel, mockLatestVitals);

      const result = await service.getLatestVitals(mockPatientId);

      expect(result).toEqual(mockLatestVitals);
    });
  });

  describe('searchDoctors', () => {
    it('should search doctors by specialty', async () => {
      configureMockFind(doctorModel, [mockDoctor]);

      const result = await service.searchDoctors({ specialty: 'General' });

      expect(result).toHaveLength(1);
    });

    it('should search doctors by name', async () => {
      configureMockFind(doctorModel, [mockDoctor]);

      const result = await service.searchDoctors({ name: 'María' });

      expect(result).toHaveLength(1);
    });
  });

  describe('getDoctorPublicProfile', () => {
    it('should return doctor public profile', async () => {
      configureMockFindOne(doctorModel, mockDoctor);

      const result = await service.getDoctorPublicProfile(mockDoctorId);

      expect(result).toEqual(mockDoctor);
    });

    it('should throw NotFoundException when doctor not found', async () => {
      configureMockFindOne(doctorModel, null);

      await expect(
        service.getDoctorPublicProfile('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDoctorAvailability', () => {
    it('should return available slots', async () => {
      configureMockFindOne(doctorModel, mockDoctor);
      configureMockFind(appointmentModel, []);

      const result = await service.getDoctorAvailability(
        mockDoctorId,
        new Date('2025-12-30'),
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
