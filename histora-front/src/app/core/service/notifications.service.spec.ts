import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NotificationsService, NotificationData, NotificationsResponse } from './notifications.service';
import { environment } from 'environments/environment';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/notifications`;

  const mockNotification: NotificationData = {
    _id: 'notif-123',
    userId: 'user-123',
    type: 'new_appointment_booked',
    channel: 'in_app',
    status: 'pending',
    title: 'Nueva Cita Agendada',
    message: 'María López ha agendado una cita para el 20/01/2025 a las 14:00',
    createdAt: new Date().toISOString(),
    data: { appointmentId: 'appt-123' },
  };

  const mockNotificationsResponse: NotificationsResponse = {
    data: [mockNotification],
    total: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(NotificationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getNotifications', () => {
    it('should fetch notifications with default options', () => {
      service.getNotifications().subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.total).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}?limit=20&offset=0&unreadOnly=false`);
      expect(req.request.method).toBe('GET');
      req.flush(mockNotificationsResponse);
    });

    it('should fetch notifications with custom options', () => {
      service.getNotifications({ limit: 10, offset: 5, unreadOnly: true }).subscribe();

      const req = httpMock.expectOne(`${apiUrl}?limit=10&offset=5&unreadOnly=true`);
      expect(req.request.method).toBe('GET');
      req.flush(mockNotificationsResponse);
    });

    it('should update notifications$ subject on success', () => {
      let notificationsFromSubject: NotificationData[] = [];
      service.notifications.subscribe(notifications => {
        notificationsFromSubject = notifications;
      });

      service.getNotifications().subscribe();

      const req = httpMock.expectOne(`${apiUrl}?limit=20&offset=0&unreadOnly=false`);
      req.flush(mockNotificationsResponse);

      expect(notificationsFromSubject.length).toBe(1);
      expect(notificationsFromSubject[0]._id).toBe('notif-123');
    });
  });

  describe('fetchUnreadCount', () => {
    it('should fetch unread count', () => {
      service.fetchUnreadCount().subscribe(response => {
        expect(response.count).toBe(5);
      });

      const req = httpMock.expectOne(`${apiUrl}/unread-count`);
      expect(req.request.method).toBe('GET');
      req.flush({ count: 5 });
    });

    it('should update unreadCount$ subject on success', () => {
      let countFromSubject = 0;
      service.unreadCount.subscribe(count => {
        countFromSubject = count;
      });

      service.fetchUnreadCount().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/unread-count`);
      req.flush({ count: 3 });

      expect(countFromSubject).toBe(3);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', () => {
      service.markAsRead('notif-123').subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/notif-123/read`);
      expect(req.request.method).toBe('PATCH');
      req.flush({ ...mockNotification, status: 'read', readAt: new Date().toISOString() });
    });

    it('should decrease unread count on success', fakeAsync(() => {
      // Set initial count
      service.fetchUnreadCount().subscribe();
      const countReq = httpMock.expectOne(`${apiUrl}/unread-count`);
      countReq.flush({ count: 5 });
      tick();

      let countFromSubject = 0;
      service.unreadCount.subscribe(count => {
        countFromSubject = count;
      });

      service.markAsRead('notif-123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/notif-123/read`);
      req.flush({ ...mockNotification, status: 'read' });
      tick();

      expect(countFromSubject).toBe(4);
    }));
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', () => {
      service.markAllAsRead().subscribe(response => {
        expect(response.modified).toBe(5);
      });

      const req = httpMock.expectOne(`${apiUrl}/read-all`);
      expect(req.request.method).toBe('PATCH');
      req.flush({ modified: 5 });
    });

    it('should reset unread count to 0', fakeAsync(() => {
      // Set initial count
      service.fetchUnreadCount().subscribe();
      const countReq = httpMock.expectOne(`${apiUrl}/unread-count`);
      countReq.flush({ count: 5 });
      tick();

      let countFromSubject = 0;
      service.unreadCount.subscribe(count => {
        countFromSubject = count;
      });

      service.markAllAsRead().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/read-all`);
      req.flush({ modified: 5 });
      tick();

      expect(countFromSubject).toBe(0);
    }));
  });

  describe('toUiNotification', () => {
    it('should convert new_appointment_booked notification', () => {
      const notification: NotificationData = {
        _id: 'notif-1',
        userId: 'user-1',
        type: 'new_appointment_booked',
        channel: 'in_app',
        status: 'pending',
        title: 'Nueva Cita',
        message: 'María ha agendado una cita',
        createdAt: new Date().toISOString(),
      };

      const result = service.toUiNotification(notification);

      expect(result.icon).toBe('event_available');
      expect(result.color).toBe('notification-green');
      expect(result.actionLabel).toBe('Ver Cita');
      expect(result.actionType).toBe('view-appointment');
    });

    it('should convert appointment_cancelled_by_patient notification', () => {
      const notification: NotificationData = {
        _id: 'notif-2',
        userId: 'user-1',
        type: 'appointment_cancelled_by_patient',
        channel: 'in_app',
        status: 'pending',
        title: 'Cita Cancelada',
        message: 'María ha cancelado su cita',
        createdAt: new Date().toISOString(),
      };

      const result = service.toUiNotification(notification);

      expect(result.icon).toBe('event_busy');
      expect(result.color).toBe('notification-red');
    });

    it('should convert new_patient_review notification', () => {
      const notification: NotificationData = {
        _id: 'notif-3',
        userId: 'user-1',
        type: 'new_patient_review',
        channel: 'in_app',
        status: 'pending',
        title: 'Nueva Reseña',
        message: 'Ana te ha dejado una reseña: ★★★★★',
        createdAt: new Date().toISOString(),
      };

      const result = service.toUiNotification(notification);

      expect(result.icon).toBe('star');
      expect(result.color).toBe('notification-orange');
      expect(result.actionLabel).toBe('Ver Reseña');
    });

    it('should convert upcoming_appointment_reminder notification', () => {
      const notification: NotificationData = {
        _id: 'notif-4',
        userId: 'user-1',
        type: 'upcoming_appointment_reminder',
        channel: 'in_app',
        status: 'pending',
        title: 'Recordatorio',
        message: 'Tiene una cita en 30 minutos',
        createdAt: new Date().toISOString(),
      };

      const result = service.toUiNotification(notification);

      expect(result.icon).toBe('schedule');
      expect(result.color).toBe('notification-blue');
      expect(result.actionLabel).toBe('Ver Cita');
    });

    it('should mark read notifications correctly', () => {
      const notification: NotificationData = {
        _id: 'notif-5',
        userId: 'user-1',
        type: 'general',
        channel: 'in_app',
        status: 'read',
        title: 'Test',
        message: 'Test message',
        createdAt: new Date().toISOString(),
        readAt: new Date().toISOString(),
      };

      const result = service.toUiNotification(notification);

      expect(result.status).toBe('msg-read');
    });

    it('should mark unread notifications correctly', () => {
      const notification: NotificationData = {
        _id: 'notif-6',
        userId: 'user-1',
        type: 'general',
        channel: 'in_app',
        status: 'pending',
        title: 'Test',
        message: 'Test message',
        createdAt: new Date().toISOString(),
      };

      const result = service.toUiNotification(notification);

      expect(result.status).toBe('msg-unread');
    });

    it('should use default icon and color for unknown types', () => {
      const notification: NotificationData = {
        _id: 'notif-7',
        userId: 'user-1',
        type: 'unknown_type',
        channel: 'in_app',
        status: 'pending',
        title: 'Test',
        message: 'Test message',
        createdAt: new Date().toISOString(),
      };

      const result = service.toUiNotification(notification);

      expect(result.icon).toBe('notifications');
      expect(result.color).toBe('notification-blue');
    });
  });
});
