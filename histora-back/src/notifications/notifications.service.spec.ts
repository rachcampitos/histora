import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType, NotificationChannel, NotificationStatus } from './schema/notification.schema';
import { NotificationPreferences } from './schema/notification-preferences.schema';
import { DeviceToken } from './schema/device-token.schema';
import { User } from '../users/schema/user.schema';
import { EmailProvider } from './providers/email.provider';
import { SmsProvider } from './providers/sms.provider';
import { WhatsAppProvider } from './providers/whatsapp.provider';
import { PushProvider } from './providers/push.provider';
import { Types } from 'mongoose';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockUserId = new Types.ObjectId().toString();

  const mockNotification = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(mockUserId),
    type: NotificationType.GENERAL,
    channel: NotificationChannel.EMAIL,
    status: NotificationStatus.PENDING,
    title: 'Notificación',
    message: 'Mensaje de prueba',
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

  const mockDeviceTokenModel = {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ token: 'fcm_token_123' }),
    findOneAndUpdate: jest.fn().mockResolvedValue({ token: 'fcm_token_123' }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    find: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    }),
  };

  const mockUserModel = {
    findById: jest.fn().mockResolvedValue({
      _id: new Types.ObjectId(mockUserId),
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'platform_admin',
    }),
    find: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    }),
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
          provide: getModelToken(DeviceToken.name),
          useValue: mockDeviceTokenModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
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
        type: NotificationType.GENERAL,
        title: 'Notificación',
        message: 'Mensaje de prueba',
        channels: [NotificationChannel.EMAIL],
      };

      const result = await service.send(dto);

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
        type: NotificationType.GENERAL,
        title: 'Notificación',
        message: 'Mensaje de prueba',
        channels: [NotificationChannel.EMAIL],
      };

      const result = await service.send(dto);

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
      expect(mockDeviceTokenModel.findOne).toHaveBeenCalled();
    });
  });

  describe('sendWelcomeNotification', () => {
    it('should send welcome notification', async () => {
      const user = {
        id: mockUserId,
        email: 'test@example.com',
        firstName: 'Juan',
      };

      await service.sendWelcomeNotification(user);

      expect(mockEmailProvider.getWelcomeTemplate).toHaveBeenCalledWith({
        userName: 'Juan',
      });
    });
  });
});
