import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus, BookedBy } from './schema/appointment.schema';
import {
  createMockModel,
  configureMockFind,
  configureMockFindOne,
  configureMockFindOneAndUpdate,
  configureMockCountDocuments,
  MockModel,
} from '../../test/mocks/mongoose-model.mock';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentModel: MockModel;

  const mockClinicId = 'clinic-id-123';
  const mockDoctorId = 'doctor-id-456';
  const mockPatientId = 'patient-id-789';

  const mockAppointment = {
    _id: 'appointment-id-123',
    clinicId: mockClinicId,
    doctorId: mockDoctorId,
    patientId: mockPatientId,
    scheduledDate: new Date('2025-01-15'),
    startTime: '10:00',
    endTime: '10:30',
    status: AppointmentStatus.SCHEDULED,
    bookedBy: BookedBy.CLINIC,
    isDeleted: false,
  };

  const mockCreateDto = {
    patientId: mockPatientId,
    doctorId: mockDoctorId,
    scheduledDate: '2025-01-15',
    startTime: '11:00',
    endTime: '11:30',
    reasonForVisit: 'Consulta general',
  };

  beforeEach(async () => {
    appointmentModel = createMockModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getModelToken(Appointment.name),
          useValue: appointmentModel,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new appointment when slot is available', async () => {
      configureMockFind(appointmentModel, []);

      const result = await service.create(mockClinicId, mockCreateDto, BookedBy.CLINIC);

      expect(result).toBeDefined();
      expect(result.clinicId).toBe(mockClinicId);
      expect(result.startTime).toBe(mockCreateDto.startTime);
    });

    it('should throw BadRequestException when slot is not available', async () => {
      configureMockFind(appointmentModel, [mockAppointment]);

      const conflictingDto = {
        ...mockCreateDto,
        startTime: '10:00',
        endTime: '10:30',
      };

      await expect(
        service.create(mockClinicId, conflictingDto, BookedBy.CLINIC),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all appointments for clinic', async () => {
      const appointments = [mockAppointment];
      configureMockFind(appointmentModel, appointments);

      const result = await service.findAll(mockClinicId);

      expect(result).toEqual(appointments);
    });

    it('should filter by doctorId', async () => {
      configureMockFind(appointmentModel, [mockAppointment]);

      await service.findAll(mockClinicId, { doctorId: mockDoctorId });

      expect(appointmentModel.find).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      configureMockFind(appointmentModel, []);

      await service.findAll(mockClinicId, { status: AppointmentStatus.CONFIRMED });

      expect(appointmentModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an appointment by id', async () => {
      configureMockFindOne(appointmentModel, mockAppointment);

      const result = await service.findOne('appointment-id-123', mockClinicId);

      expect(result).toEqual(mockAppointment);
    });

    it('should throw NotFoundException when appointment not found', async () => {
      configureMockFindOne(appointmentModel, null);

      await expect(service.findOne('non-existent', mockClinicId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByPatient', () => {
    it('should return appointments for a patient', async () => {
      configureMockFind(appointmentModel, [mockAppointment]);

      const result = await service.findByPatient(mockClinicId, mockPatientId);

      expect(result).toHaveLength(1);
      expect(result[0].patientId).toBe(mockPatientId);
    });
  });

  describe('findByDoctor', () => {
    it('should return appointments for a doctor', async () => {
      configureMockFind(appointmentModel, [mockAppointment]);

      const result = await service.findByDoctor(mockClinicId, mockDoctorId);

      expect(result).toHaveLength(1);
      expect(result[0].doctorId).toBe(mockDoctorId);
    });

    it('should filter by date when provided', async () => {
      configureMockFind(appointmentModel, [mockAppointment]);

      await service.findByDoctor(mockClinicId, mockDoctorId, new Date('2025-01-15'));

      expect(appointmentModel.find).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update appointment status', async () => {
      const updatedAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED,
      };
      configureMockFindOneAndUpdate(appointmentModel, updatedAppointment);

      const result = await service.updateStatus(
        'appointment-id-123',
        mockClinicId,
        AppointmentStatus.CONFIRMED,
      );

      expect(result?.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('should throw NotFoundException when appointment not found', async () => {
      configureMockFindOneAndUpdate(appointmentModel, null);

      await expect(
        service.updateStatus('non-existent', mockClinicId, AppointmentStatus.CONFIRMED),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should cancel an appointment', async () => {
      const cancelledAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Patient requested',
      };
      configureMockFindOneAndUpdate(appointmentModel, cancelledAppointment);

      const result = await service.cancel(
        'appointment-id-123',
        mockClinicId,
        { cancellationReason: 'Patient requested' },
        'user-id',
      );

      expect(result?.status).toBe(AppointmentStatus.CANCELLED);
    });
  });

  describe('remove', () => {
    it('should soft delete an appointment', async () => {
      const deletedAppointment = { ...mockAppointment, isDeleted: true };
      configureMockFindOneAndUpdate(appointmentModel, deletedAppointment);

      const result = await service.remove('appointment-id-123', mockClinicId);

      expect(result?.isDeleted).toBe(true);
    });
  });

  describe('countByClinicAndStatus', () => {
    it('should return count of appointments', async () => {
      configureMockCountDocuments(appointmentModel, 10);

      const result = await service.countByClinicAndStatus(mockClinicId);

      expect(result).toBe(10);
    });

    it('should filter by status when provided', async () => {
      configureMockCountDocuments(appointmentModel, 5);

      const result = await service.countByClinicAndStatus(
        mockClinicId,
        AppointmentStatus.SCHEDULED,
      );

      expect(result).toBe(5);
    });
  });

  describe('getAvailableSlots', () => {
    it('should return available slots for a day', async () => {
      configureMockFind(appointmentModel, []);

      const result = await service.getAvailableSlots(
        mockClinicId,
        mockDoctorId,
        new Date('2025-01-20'),
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should exclude booked slots', async () => {
      configureMockFind(appointmentModel, [mockAppointment]);

      const result = await service.getAvailableSlots(
        mockClinicId,
        mockDoctorId,
        new Date('2025-01-15'),
      );

      const bookedSlot = result.find(
        (slot) => slot.startTime === '10:00' && slot.endTime === '10:30',
      );
      expect(bookedSlot).toBeUndefined();
    });
  });
});
