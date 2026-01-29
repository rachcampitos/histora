import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationType, NotificationChannel } from './schema/notification.schema';
import { Types } from 'mongoose';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  const mockUserId = new Types.ObjectId().toString();

  const mockUser = {
    userId: mockUserId,
    role: 'platform_admin',
  };

  const mockNotification = {
    _id: new Types.ObjectId(),
    userId: mockUserId,
    type: NotificationType.GENERAL,
    channel: NotificationChannel.EMAIL,
    title: 'Test',
    message: 'Test message',
  };

  const mockPreferences = {
    _id: new Types.ObjectId(),
    userId: mockUserId,
    email: { enabled: true },
  };

  const mockNotificationsService = {
    getUserNotifications: jest.fn().mockResolvedValue({
      data: [mockNotification],
      total: 1,
    }),
    getUnreadCount: jest.fn().mockResolvedValue(5),
    markAsRead: jest.fn().mockResolvedValue(mockNotification),
    markAllAsRead: jest.fn().mockResolvedValue({ modified: 3 }),
    getOrCreatePreferences: jest.fn().mockResolvedValue(mockPreferences),
    updatePreferences: jest.fn().mockResolvedValue(mockPreferences),
    registerDevice: jest.fn().mockResolvedValue(mockPreferences),
    send: jest.fn().mockResolvedValue([mockNotification]),
    sendBulk: jest.fn().mockResolvedValue({ sent: 5, failed: 0 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyNotifications', () => {
    it('should return user notifications', async () => {
      const result = await controller.getMyNotifications(mockUser as any, 20, 0, 'false');

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockNotificationsService.getUserNotifications).toHaveBeenCalledWith(
        mockUserId,
        { limit: 20, offset: 0, unreadOnly: false }
      );
    });

    it('should filter unread only', async () => {
      await controller.getMyNotifications(mockUser as any, 10, 0, 'true');

      expect(mockNotificationsService.getUserNotifications).toHaveBeenCalledWith(
        mockUserId,
        { limit: 10, offset: 0, unreadOnly: true }
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const result = await controller.getUnreadCount(mockUser as any);

      expect(result.count).toBe(5);
      expect(mockNotificationsService.getUnreadCount).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = new Types.ObjectId().toString();

      const result = await controller.markAsRead(notificationId, mockUser as any);

      expect(result).toBeDefined();
      expect(mockNotificationsService.markAsRead).toHaveBeenCalledWith(
        notificationId,
        mockUserId
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const result = await controller.markAllAsRead(mockUser as any);

      expect(result.modified).toBe(3);
      expect(mockNotificationsService.markAllAsRead).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const result = await controller.getPreferences(mockUser as any);

      expect(result).toBeDefined();
      expect(mockNotificationsService.getOrCreatePreferences).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences', async () => {
      const dto = { email: { enabled: false } };

      const result = await controller.updatePreferences(mockUser as any, dto);

      expect(result).toBeDefined();
      expect(mockNotificationsService.updatePreferences).toHaveBeenCalledWith(mockUserId, dto);
    });
  });

  describe('registerDevice', () => {
    it('should register device token', async () => {
      const dto = { deviceToken: 'fcm_token_123', platform: 'android' };

      const result = await controller.registerDevice(mockUser as any, dto);

      expect(result).toBeDefined();
      expect(mockNotificationsService.registerDevice).toHaveBeenCalledWith(
        mockUserId,
        'fcm_token_123',
        'android'
      );
    });
  });

  describe('sendNotification', () => {
    it('should send notification as admin', async () => {
      const dto = {
        userId: new Types.ObjectId().toString(),
        type: NotificationType.GENERAL,
        title: 'Test',
        message: 'Test message',
      };

      const result = await controller.sendNotification(dto);

      expect(result).toHaveLength(1);
      expect(mockNotificationsService.send).toHaveBeenCalledWith(dto);
    });
  });

  describe('sendBulkNotification', () => {
    it('should send bulk notifications', async () => {
      const dto = {
        userIds: [
          new Types.ObjectId().toString(),
          new Types.ObjectId().toString(),
        ],
        type: NotificationType.GENERAL,
        title: 'Test',
        message: 'Test message',
      };

      const result = await controller.sendBulkNotification(dto);

      expect(result.sent).toBe(5);
      expect(result.failed).toBe(0);
      expect(mockNotificationsService.sendBulk).toHaveBeenCalledWith(dto);
    });
  });
});
