import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType, NotificationChannel, NotificationStatus } from './schema/notification.schema';
import { NotificationPreferences } from './schema/notification-preferences.schema';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { PushProvider } from './providers/push.provider';
import { Types } from 'mongoose';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockUserId = new Types.ObjectId().toString();
  const mockClinicId = new Types.ObjectId().toString();

  const mockNotification = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(mockUserId),
    type: NotificationType.APPOINTMENT_REMINDER,
    channel: NotificationChannel.EMAIL,
    status: NotificationStatus.PENDING,
    title: 'Recordatorio de Cita',
    message: 'Tu cita es mañana',
    recipient: 'test@example.com',
    save: jest.fn().mockResolvedValue(this),
  };

  const mockPreferences = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(mockUserId),
    email: { enabled: true, value: 'test@example.com' },
    sms: { enabled: false },
    whatsapp: { enabled: false },
    push: { enabled: true },
    inApp: { enabled: true },
    save: jest.fn().mockResolvedValue(this),
  };

  const mockNotificationModel = {
    create: jest.fn().mockResolvedValue(mockNotification),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockNotification]),
          }),
        }),
      }),
    }),
    findOne: jest.fn().mockResolvedValue(mockNotification),
    countDocuments: jest.fn().mockResolvedValue(1),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  };

  const mockPreferencesModel = {
    findOne: jest.fn().mockResolvedValue(mockPreferences),
    create: jest.fn().mockResolvedValue(mockPreferences),
  };

  const mockEmailProvider = {
    send: jest.fn().mockResolvedValue({ success: true, messageId: 'email_123' }),
    getAppointmentReminderTemplate: jest.fn().mockReturnValue('<html>Reminder</html>'),
    getAppointmentConfirmationTemplate: jest.fn().mockReturnValue('<html>Confirmation</html>'),
    getWelcomeTemplate: jest.fn().mockReturnValue('<html>Welcome</html>'),
  };

  const mockSmsProvider = {
    send: jest.fn().mockResolvedValue({ success: true, messageId: 'sms_123' }),
  };

  const mockWhatsAppProvider = {
    send: jest.fn().mockResolvedValue({ success: true, messageId: 'wa_123' }),
    formatPhoneNumber: jest.fn().mockReturnValue('+51999999999'),
  };

  const mockPushProvider = {
    send: jest.fn().mockResolvedValue({ success: true, messageId: 'push_123' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
        {
          provide: getModelToken(NotificationPreferences.name),
          useValue: mockPreferencesModel,
        },
        {
          provide: EmailProvider,
          useValue: mockEmailProvider,
        },
        {
          provide: SmsProvider,
          useValue: mockSmsProvider,
        },
        {
          provide: WhatsAppProvider,
          useValue: mockWhatsAppProvider,
        },
        {
          provide: PushProvider,
          useValue: mockPushProvider,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('send', () => {
    it('should create and send a notification', async () => {
      const dto = {
        userId: mockUserId,
        type: NotificationType.APPOINTMENT_REMINDER,
        title: 'Recordatorio',
        message: 'Tu cita es mañana',
        channels: [NotificationChannel.EMAIL],
      };

      const result = await service.send(dto, mockClinicId);

      expect(result).toBeDefined();
      expect(mockNotificationModel.create).toHaveBeenCalled();
    });

    it('should skip disabled channels', async () => {
      mockPreferencesModel.findOne.mockResolvedValueOnce({
        ...mockPreferences,
        email: { enabled: false },
      });

      const dto = {
        userId: mockUserId,
        type: NotificationType.APPOINTMENT_REMINDER,
        title: 'Recordatorio',
        message: 'Tu cita es mañana',
        channels: [NotificationChannel.EMAIL],
      };

      const result = await service.send(dto, mockClinicId);

      expect(result).toHaveLength(0);
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications', async () => {
      const result = await service.getUserNotifications(mockUserId);

      expect(result.data).toBeDefined();
      expect(result.total).toBe(1);
      expect(mockNotificationModel.find).toHaveBeenCalled();
    });

    it('should filter unread only when specified', async () => {
      await service.getUserNotifications(mockUserId, { unreadOnly: true });

      expect(mockNotificationModel.find).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = new Types.ObjectId().toString();

      const result = await service.markAsRead(notificationId, mockUserId);

      expect(mockNotificationModel.findOne).toHaveBeenCalled();
      expect(mockNotification.save).toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const result = await service.markAllAsRead(mockUserId);

      expect(result.modified).toBe(1);
      expect(mockNotificationModel.updateMany).toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const result = await service.getUnreadCount(mockUserId);

      expect(result).toBe(1);
      expect(mockNotificationModel.countDocuments).toHaveBeenCalled();
    });
  });

  describe('getOrCreatePreferences', () => {
    it('should return existing preferences', async () => {
      const result = await service.getOrCreatePreferences(mockUserId);

      expect(result).toBeDefined();
      expect(mockPreferencesModel.findOne).toHaveBeenCalled();
    });

    it('should create preferences if not exists', async () => {
      mockPreferencesModel.findOne.mockResolvedValueOnce(null);

      const result = await service.getOrCreatePreferences(mockUserId);

      expect(result).toBeDefined();
      expect(mockPreferencesModel.create).toHaveBeenCalled();
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences', async () => {
      const dto = {
        email: { enabled: false },
      };

      const result = await service.updatePreferences(mockUserId, dto);

      expect(result).toBeDefined();
      expect(mockPreferences.save).toHaveBeenCalled();
    });
  });

  describe('registerDevice', () => {
    it('should register device token', async () => {
      const deviceToken = 'fcm_token_123';

      const result = await service.registerDevice(mockUserId, deviceToken, 'android');

      expect(result).toBeDefined();
      expect(mockPreferences.save).toHaveBeenCalled();
    });
  });

  describe('sendAppointmentReminder', () => {
    it('should send appointment reminder notification', async () => {
      const appointment = {
        id: new Types.ObjectId().toString(),
        patientId: new Types.ObjectId().toString(),
        patientName: 'Juan Pérez',
        patientUserId: mockUserId,
        doctorName: 'Dr. García',
        date: '2025-01-15',
        time: '10:00',
        clinicId: mockClinicId,
        clinicName: 'Clínica Central',
      };

      await service.sendAppointmentReminder(appointment);

      expect(mockEmailProvider.getAppointmentReminderTemplate).toHaveBeenCalled();
    });

    it('should skip if patient has no user account', async () => {
      const appointment = {
        id: new Types.ObjectId().toString(),
        patientId: new Types.ObjectId().toString(),
        patientName: 'Juan Pérez',
        patientUserId: undefined,
        doctorName: 'Dr. García',
        date: '2025-01-15',
        time: '10:00',
        clinicId: mockClinicId,
        clinicName: 'Clínica Central',
      };

      await service.sendAppointmentReminder(appointment);

      expect(mockNotificationModel.create).not.toHaveBeenCalled();
    });
  });

  describe('sendWelcomeNotification', () => {
    it('should send welcome notification', async () => {
      const user = {
        id: mockUserId,
        email: 'test@example.com',
        firstName: 'Juan',
        clinicName: 'Clínica Central',
      };

      await service.sendWelcomeNotification(user);

      expect(mockEmailProvider.getWelcomeTemplate).toHaveBeenCalledWith({
        userName: 'Juan',
        clinicName: 'Clínica Central',
      });
    });
  });

  describe('notifyDoctorNewAppointment', () => {
    it('should notify doctor when patient books appointment', async () => {
      const appointment = {
        id: new Types.ObjectId().toString(),
        doctorUserId: mockUserId,
        patientName: 'María López',
        date: '2025-01-20',
        time: '14:00',
        clinicId: mockClinicId,
        reason: 'Consulta general',
      };

      await service.notifyDoctorNewAppointment(appointment);

      expect(mockNotificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.NEW_APPOINTMENT_BOOKED,
          title: 'Nueva Cita Agendada',
        })
      );
    });

    it('should include reason in notification message', async () => {
      const appointment = {
        id: new Types.ObjectId().toString(),
        doctorUserId: mockUserId,
        patientName: 'María López',
        date: '2025-01-20',
        time: '14:00',
        clinicId: mockClinicId,
        reason: 'Dolor de cabeza',
      };

      await service.notifyDoctorNewAppointment(appointment);

      expect(mockNotificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Dolor de cabeza'),
        })
      );
    });
  });

  describe('notifyDoctorAppointmentCancelled', () => {
    it('should notify doctor when patient cancels appointment', async () => {
      const appointment = {
        id: new Types.ObjectId().toString(),
        doctorUserId: mockUserId,
        patientName: 'María López',
        date: '2025-01-20',
        time: '14:00',
        clinicId: mockClinicId,
        reason: 'Emergencia personal',
      };

      await service.notifyDoctorAppointmentCancelled(appointment);

      expect(mockNotificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.APPOINTMENT_CANCELLED_BY_PATIENT,
          title: 'Cita Cancelada',
        })
      );
    });

    it('should include cancellation reason when provided', async () => {
      const appointment = {
        id: new Types.ObjectId().toString(),
        doctorUserId: mockUserId,
        patientName: 'María López',
        date: '2025-01-20',
        time: '14:00',
        clinicId: mockClinicId,
        reason: 'Viaje de trabajo',
      };

      await service.notifyDoctorAppointmentCancelled(appointment);

      expect(mockNotificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Viaje de trabajo'),
        })
      );
    });
  });

  describe('notifyDoctorUpcomingAppointment', () => {
    it('should notify doctor of upcoming appointment in minutes', async () => {
      const appointment = {
        id: new Types.ObjectId().toString(),
        doctorUserId: mockUserId,
        patientName: 'Carlos García',
        date: '2025-01-20',
        time: '15:00',
        clinicId: mockClinicId,
        minutesBefore: 30,
      };

      await service.notifyDoctorUpcomingAppointment(appointment);

      expect(mockNotificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.UPCOMING_APPOINTMENT_REMINDER,
          message: expect.stringContaining('30 minutos'),
        })
      );
    });

    it('should show hours for large time intervals', async () => {
      const appointment = {
        id: new Types.ObjectId().toString(),
        doctorUserId: mockUserId,
        patientName: 'Carlos García',
        date: '2025-01-20',
        time: '15:00',
        clinicId: mockClinicId,
        minutesBefore: 120,
      };

      await service.notifyDoctorUpcomingAppointment(appointment);

      expect(mockNotificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('2 hora(s)'),
        })
      );
    });
  });

  describe('notifyDoctorNewReview', () => {
    it('should notify doctor when patient leaves review', async () => {
      const review = {
        doctorUserId: mockUserId,
        patientName: 'Ana Martínez',
        rating: 5,
        comment: 'Excelente atención',
        clinicId: mockClinicId,
      };

      await service.notifyDoctorNewReview(review);

      expect(mockNotificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.NEW_PATIENT_REVIEW,
          title: 'Nueva Reseña de Paciente',
        })
      );
    });

    it('should include rating stars in message', async () => {
      const review = {
        doctorUserId: mockUserId,
        patientName: 'Ana Martínez',
        rating: 4,
        clinicId: mockClinicId,
      };

      await service.notifyDoctorNewReview(review);

      expect(mockNotificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('★★★★☆'),
        })
      );
    });

    it('should include comment when provided', async () => {
      const review = {
        doctorUserId: mockUserId,
        patientName: 'Ana Martínez',
        rating: 5,
        comment: 'Muy profesional',
        clinicId: mockClinicId,
      };

      await service.notifyDoctorNewReview(review);

      expect(mockNotificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Muy profesional'),
        })
      );
    });
  });
});
