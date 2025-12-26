import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppointmentsService, Appointment, AppointmentsResponse, CreateAppointmentDto } from './appointments.service';
import { ApiService } from '../../core/services/api.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockAppointment: Appointment = {
    _id: 'apt-123',
    clinicId: 'clinic-123',
    patientId: 'patient-123',
    patientName: 'Juan Pérez',
    doctorId: 'doctor-123',
    doctorName: 'Dr. García',
    scheduledDate: '2024-01-15',
    startTime: '09:00',
    endTime: '09:30',
    status: 'scheduled',
    reasonForVisit: 'Consulta general',
    bookedBy: 'clinic',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  };

  const mockResponse: AppointmentsResponse = {
    data: [mockAppointment],
    total: 1,
    limit: 20,
    offset: 0,
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'patch', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        AppointmentsService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(AppointmentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAppointments', () => {
    it('should get appointments', () => {
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAppointments().subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith('/appointments', undefined);
    });

    it('should get appointments with date filter', () => {
      const params = { date: '2024-01-15', viewMode: 'day' as const };
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getAppointments(params).subscribe();

      expect(apiServiceSpy.get).toHaveBeenCalledWith('/appointments', params);
    });
  });

  describe('getAppointment', () => {
    it('should get a single appointment by id', () => {
      apiServiceSpy.get.and.returnValue(of(mockAppointment));

      service.getAppointment('apt-123').subscribe((apt) => {
        expect(apt).toEqual(mockAppointment);
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith('/appointments/apt-123');
    });
  });

  describe('createAppointment', () => {
    it('should create a new appointment', () => {
      const createDto: CreateAppointmentDto = {
        patientId: 'patient-456',
        doctorId: 'doctor-123',
        scheduledDate: '2024-01-20',
        startTime: '10:00',
        endTime: '10:30',
      };

      apiServiceSpy.post.and.returnValue(of({ ...mockAppointment, ...createDto }));

      service.createAppointment(createDto).subscribe((apt) => {
        expect(apt.startTime).toBe('10:00');
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith('/appointments', createDto);
    });
  });

  describe('updateStatus', () => {
    it('should update appointment status', () => {
      apiServiceSpy.patch.and.returnValue(of({ ...mockAppointment, status: 'confirmed' }));

      service.updateStatus('apt-123', 'confirmed').subscribe((apt) => {
        expect(apt.status).toBe('confirmed');
      });

      expect(apiServiceSpy.patch).toHaveBeenCalledWith('/appointments/apt-123/status', { status: 'confirmed' });
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel an appointment', () => {
      apiServiceSpy.post.and.returnValue(of(undefined));

      service.cancelAppointment('apt-123', 'No puede asistir').subscribe();

      expect(apiServiceSpy.post).toHaveBeenCalledWith('/appointments/apt-123/cancel', { reason: 'No puede asistir' });
    });
  });

  describe('getAvailableSlots', () => {
    it('should get available slots for a doctor', () => {
      const slots = [
        { startTime: '09:00', endTime: '09:30' },
        { startTime: '10:00', endTime: '10:30' },
      ];
      apiServiceSpy.get.and.returnValue(of(slots));

      service.getAvailableSlots('doctor-123', '2024-01-20').subscribe((result) => {
        expect(result.length).toBe(2);
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith('/appointments/available/doctor-123', { date: '2024-01-20' });
    });
  });
});
