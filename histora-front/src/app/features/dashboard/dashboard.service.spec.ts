import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        DashboardService,
      ],
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getStats', () => {
    it('should get dashboard statistics', () => {
      service.getStats().subscribe((stats) => {
        expect(stats.totalPatients).toBe(100);
        expect(stats.todayAppointments).toBe(5);
        expect(stats.pendingConsultations).toBe(3);
        expect(stats.monthlyGrowth).toBe(20);
      });

      // Expect multiple requests for forkJoin
      const patientsReq = httpMock.expectOne('/api/patients/count');
      patientsReq.flush({ count: 100 });

      const todayAppointmentsReq = httpMock.expectOne((req) =>
        req.url === '/api/appointments/count' && req.params.has('date')
      );
      todayAppointmentsReq.flush({ count: 5 });

      const pendingReq = httpMock.expectOne((req) =>
        req.url === '/api/consultations/count' && req.params.get('status') === 'in_progress'
      );
      pendingReq.flush({ count: 3 });

      const lastMonthReq = httpMock.expectOne((req) =>
        req.url === '/api/patients/count' && req.params.has('beforeDate')
      );
      lastMonthReq.flush({ count: 83 });
    });

    it('should handle errors gracefully', () => {
      service.getStats().subscribe((stats) => {
        expect(stats.totalPatients).toBe(0);
        expect(stats.todayAppointments).toBe(0);
        expect(stats.pendingConsultations).toBe(0);
        expect(stats.monthlyGrowth).toBe(0);
      });

      const patientsReq = httpMock.expectOne('/api/patients/count');
      patientsReq.error(new ErrorEvent('Network error'));

      const todayAppointmentsReq = httpMock.expectOne((req) =>
        req.url === '/api/appointments/count' && req.params.has('date')
      );
      todayAppointmentsReq.error(new ErrorEvent('Network error'));

      const pendingReq = httpMock.expectOne((req) =>
        req.url === '/api/consultations/count' && req.params.get('status') === 'in_progress'
      );
      pendingReq.error(new ErrorEvent('Network error'));

      const lastMonthReq = httpMock.expectOne((req) =>
        req.url === '/api/patients/count' && req.params.has('beforeDate')
      );
      lastMonthReq.error(new ErrorEvent('Network error'));
    });

    it('should calculate 100% growth when previous patients is 0', () => {
      service.getStats().subscribe((stats) => {
        expect(stats.monthlyGrowth).toBe(100);
      });

      const patientsReq = httpMock.expectOne('/api/patients/count');
      patientsReq.flush({ count: 10 });

      const todayAppointmentsReq = httpMock.expectOne((req) =>
        req.url === '/api/appointments/count' && req.params.has('date')
      );
      todayAppointmentsReq.flush({ count: 0 });

      const pendingReq = httpMock.expectOne((req) =>
        req.url === '/api/consultations/count' && req.params.get('status') === 'in_progress'
      );
      pendingReq.flush({ count: 0 });

      const lastMonthReq = httpMock.expectOne((req) =>
        req.url === '/api/patients/count' && req.params.has('beforeDate')
      );
      lastMonthReq.flush({ count: 0 });
    });
  });

  describe('getTodayAppointments', () => {
    it('should get today appointments', () => {
      const mockAppointments = [
        {
          _id: 'apt-1',
          patientId: { _id: 'p1', firstName: 'Juan', lastName: 'Pérez' },
          startTime: '09:00',
          status: 'scheduled',
          reasonForVisit: 'Consulta general',
        },
      ];

      service.getTodayAppointments().subscribe((appointments) => {
        expect(appointments.length).toBe(1);
        expect(appointments[0].patientName).toBe('Juan Pérez');
        expect(appointments[0].startTime).toBe('09:00');
      });

      const req = httpMock.expectOne('/api/appointments/today');
      expect(req.request.method).toBe('GET');
      req.flush(mockAppointments);
    });

    it('should handle missing patient data', () => {
      const mockAppointments = [
        {
          _id: 'apt-1',
          patientId: null,
          startTime: '09:00',
          status: 'scheduled',
        },
      ];

      service.getTodayAppointments().subscribe((appointments) => {
        expect(appointments[0].patientName).toBe('Paciente desconocido');
      });

      const req = httpMock.expectOne('/api/appointments/today');
      req.flush(mockAppointments);
    });

    it('should return empty array on error', () => {
      service.getTodayAppointments().subscribe((appointments) => {
        expect(appointments).toEqual([]);
      });

      const req = httpMock.expectOne('/api/appointments/today');
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getMonthAppointmentsCount', () => {
    it('should get month appointments count', () => {
      service.getMonthAppointmentsCount().subscribe((count) => {
        expect(count).toBe(25);
      });

      const req = httpMock.expectOne((r) =>
        r.url === '/api/appointments/count' && r.params.has('startDate')
      );
      expect(req.request.method).toBe('GET');
      req.flush({ count: 25 });
    });

    it('should return 0 on error', () => {
      service.getMonthAppointmentsCount().subscribe((count) => {
        expect(count).toBe(0);
      });

      const req = httpMock.expectOne((r) =>
        r.url === '/api/appointments/count' && r.params.has('startDate')
      );
      req.error(new ErrorEvent('Network error'));
    });
  });
});
