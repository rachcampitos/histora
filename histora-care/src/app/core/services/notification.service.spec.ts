import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { NotificationService, NotificationPreferences, AppNotification } from './notification.service';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import {
  createMockApiService,
  createMockStorageService,
  createMockRouter,
  createMockPlatform,
} from '../../../testing';
import { of, throwError, firstValueFrom } from 'rxjs';
import { Capacitor } from '@capacitor/core';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockApi: ReturnType<typeof createMockApiService>;
  let mockStorage: ReturnType<typeof createMockStorageService>;
  let mockRouter: ReturnType<typeof createMockRouter>;
  let mockPlatform: ReturnType<typeof createMockPlatform>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset TestBed to avoid "already instantiated" error in Vitest
    TestBed.resetTestingModule();

    // Ensure Capacitor.isNativePlatform returns false (web) to skip push setup
    (Capacitor.isNativePlatform as any).mockReturnValue(false);

    mockApi = createMockApiService();
    mockStorage = createMockStorageService();
    mockRouter = createMockRouter();
    mockPlatform = createMockPlatform();

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: ApiService, useValue: mockApi },
        { provide: StorageService, useValue: mockStorage },
        { provide: Router, useValue: mockRouter },
        { provide: Platform, useValue: mockPlatform },
      ],
    });

    service = TestBed.inject(NotificationService);

    // Wait for constructor async init to complete
    await new Promise(r => setTimeout(r, 0));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ======= Initial State =======

  it('should have default preferences', () => {
    const prefs = service.preferences();
    expect(prefs.pushEnabled).toBe(true);
    expect(prefs.serviceRequests).toBe(true);
    expect(prefs.promotions).toBe(false);
  });

  it('should have empty notifications initially', () => {
    expect(service.notifications()).toEqual([]);
  });

  it('should have unreadCount 0 initially', () => {
    expect(service.unreadCount()).toBe(0);
  });

  it('should have permissionGranted false on web', () => {
    expect(service.permissionGranted()).toBe(false);
  });

  it('should have null deviceToken initially', () => {
    expect(service.deviceToken()).toBeNull();
  });

  // ======= requestPermission() =======

  it('should return false on web platform', async () => {
    (Capacitor.isNativePlatform as any).mockReturnValue(false);
    const result = await service.requestPermission();
    expect(result).toBe(false);
  });

  // ======= Preferences =======

  it('should save preferences to storage and backend', async () => {
    const newPrefs: Partial<NotificationPreferences> = { promotions: true };
    await service.savePreferences(newPrefs);

    expect(mockStorage.set).toHaveBeenCalledWith(
      'notification_preferences',
      expect.objectContaining({ promotions: true })
    );
    expect(mockApi.patch).toHaveBeenCalledWith(
      '/notifications/preferences',
      expect.objectContaining({ promotions: true })
    );
  });

  it('should merge preferences with existing values', async () => {
    await service.savePreferences({ promotions: true });

    const prefs = service.preferences();
    expect(prefs.pushEnabled).toBe(true); // Default
    expect(prefs.promotions).toBe(true); // Updated
  });

  it('should handle backend error when saving preferences', async () => {
    mockApi.patch.mockReturnValue(throwError(() => new Error('Network error')));

    // Should not throw
    await expect(service.savePreferences({ promotions: true })).resolves.not.toThrow();

    // Local state should still be updated
    expect(service.preferences().promotions).toBe(true);
  });

  it('should toggle a preference', async () => {
    expect(service.preferences().promotions).toBe(false);
    await service.togglePreference('promotions');
    expect(service.preferences().promotions).toBe(true);
  });

  it('should load stored preferences on init', async () => {
    // The service constructor calls loadPreferences() which reads from storage
    // Verify it was called during beforeEach init
    expect(mockStorage.get).toHaveBeenCalledWith('notification_preferences');
  });

  // ======= Notifications CRUD =======

  it('should mark notification as read', async () => {
    const notifications: AppNotification[] = [
      { id: '1', title: 'Test', body: 'Body', type: 'system', read: false, createdAt: new Date() },
      { id: '2', title: 'Test2', body: 'Body2', type: 'system', read: false, createdAt: new Date() },
    ];
    (service as any)._notifications.set(notifications);
    (service as any)._unreadCount.set(2);

    await service.markAsRead('1');

    const updated = service.notifications();
    expect(updated[0].read).toBe(true);
    expect(updated[1].read).toBe(false);
    expect(service.unreadCount()).toBe(1);
  });

  it('should mark all notifications as read', async () => {
    const notifications: AppNotification[] = [
      { id: '1', title: 'Test', body: 'Body', type: 'system', read: false, createdAt: new Date() },
      { id: '2', title: 'Test2', body: 'Body2', type: 'system', read: false, createdAt: new Date() },
    ];
    (service as any)._notifications.set(notifications);
    (service as any)._unreadCount.set(2);

    await service.markAllAsRead();

    expect(service.notifications().every(n => n.read)).toBe(true);
    expect(service.unreadCount()).toBe(0);
  });

  it('should delete a notification', async () => {
    const notifications: AppNotification[] = [
      { id: '1', title: 'Test', body: 'Body', type: 'system', read: false, createdAt: new Date() },
      { id: '2', title: 'Test2', body: 'Body2', type: 'system', read: true, createdAt: new Date() },
    ];
    (service as any)._notifications.set(notifications);
    (service as any)._unreadCount.set(1);

    await service.deleteNotification('1');

    expect(service.notifications()).toHaveLength(1);
    expect(service.notifications()[0].id).toBe('2');
    expect(service.unreadCount()).toBe(0);
  });

  it('should clear all notifications', async () => {
    (service as any)._notifications.set([
      { id: '1', title: 'Test', body: 'Body', type: 'system', read: false, createdAt: new Date() },
    ]);
    (service as any)._unreadCount.set(1);

    await service.clearAll();

    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
    expect(mockStorage.remove).toHaveBeenCalledWith('app_notifications');
  });

  // ======= fetchFromServer() =======

  it('should fetch notifications from server', async () => {
    const serverNotifications: AppNotification[] = [
      { id: '1', title: 'Server', body: 'Body', type: 'system', read: false, createdAt: new Date() },
      { id: '2', title: 'Server2', body: 'Body2', type: 'system', read: true, createdAt: new Date() },
    ];
    mockApi.get.mockReturnValue(of(serverNotifications));

    const result = await firstValueFrom(service.fetchFromServer());
    expect(result).toEqual(serverNotifications);
    expect(service.notifications()).toEqual(serverNotifications);
    expect(service.unreadCount()).toBe(1);
  });

  it('should return empty array on fetch error', async () => {
    mockApi.get.mockReturnValue(throwError(() => new Error('Server error')));

    const result = await firstValueFrom(service.fetchFromServer());
    expect(result).toEqual([]);
  });

  // ======= onNewNotification() =======

  it('should expose onNewNotification observable', () => {
    const obs = service.onNewNotification();
    expect(obs).toBeDefined();
    expect(typeof obs.subscribe).toBe('function');
  });

  // ======= showLocalNotification() =======

  it('should not show local notification on web', async () => {
    (Capacitor.isNativePlatform as any).mockReturnValue(false);
    const notification: AppNotification = {
      id: '1', title: 'Test', body: 'Body', type: 'system', read: false, createdAt: new Date(),
    };

    // Should not throw
    await service.showLocalNotification(notification);
  });

  // ======= scheduleNotification() =======

  it('should not schedule on web', async () => {
    (Capacitor.isNativePlatform as any).mockReturnValue(false);

    await service.scheduleNotification('Title', 'Body', new Date());
    // Should not throw, just return early
  });

  // ======= unregisterDevice() =======

  it('should unregister device token', async () => {
    (service as any)._deviceToken.set('test-device-token');

    await service.unregisterDevice();

    expect(mockApi.post).toHaveBeenCalledWith('/notifications/unregister-device', {
      token: 'test-device-token',
    });
    expect(mockStorage.remove).toHaveBeenCalledWith('push_device_token');
    expect(service.deviceToken()).toBeNull();
  });

  it('should handle unregister when no device token', async () => {
    await service.unregisterDevice();
    // Should not call API
    expect(mockApi.post).not.toHaveBeenCalledWith(
      '/notifications/unregister-device',
      expect.anything()
    );
    expect(mockStorage.remove).toHaveBeenCalledWith('push_device_token');
  });

  it('should handle backend error during unregister', async () => {
    (service as any)._deviceToken.set('test-token');
    mockApi.post.mockReturnValue(throwError(() => new Error('fail')));

    // Should not throw
    await expect(service.unregisterDevice()).resolves.not.toThrow();
  });

  // ======= handleNotificationAction (private, tested via navigation patterns) =======

  it('should handle service_request notification by navigating', () => {
    const handler = (service as any).handleNotificationAction.bind(service);
    handler({ data: { type: 'service_request', requestId: 'req1' } });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/nurse/requests', 'req1']);
  });

  it('should handle service_accepted notification', () => {
    const handler = (service as any).handleNotificationAction.bind(service);
    handler({ data: { type: 'service_accepted', requestId: 'req1' } });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/patient/tracking', 'req1']);
  });

  it('should handle payment_received notification', () => {
    const handler = (service as any).handleNotificationAction.bind(service);
    handler({ data: { type: 'payment_received' } });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/nurse/earnings']);
  });

  it('should handle verification_approved notification', () => {
    const handler = (service as any).handleNotificationAction.bind(service);
    handler({ data: { type: 'verification_approved' } });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/nurse/verification']);
  });

  it('should handle chat message notification', () => {
    const handler = (service as any).handleNotificationAction.bind(service);
    handler({ data: { type: 'new_message', requestId: 'req1' } });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/nurse/active-service', 'req1']);
  });

  it('should navigate to notifications for unknown type', () => {
    const handler = (service as any).handleNotificationAction.bind(service);
    handler({ data: { type: 'unknown_type' } });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/notifications']);
  });

  it('should not navigate if no data', () => {
    const handler = (service as any).handleNotificationAction.bind(service);
    handler({});
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  // ======= handleIncomingNotification (private) =======

  it('should add incoming notification to list', () => {
    const handler = (service as any).handleIncomingNotification.bind(service);
    handler({
      id: 'push1',
      title: 'New Service',
      body: 'A patient needs you',
      data: { type: 'service_request' },
    });

    expect(service.notifications()).toHaveLength(1);
    expect(service.notifications()[0].title).toBe('New Service');
    expect(service.unreadCount()).toBe(1);
  });

  it('should prepend new notifications', () => {
    (service as any)._notifications.set([
      { id: 'old', title: 'Old', body: 'Old', type: 'system', read: true, createdAt: new Date() },
    ]);

    const handler = (service as any).handleIncomingNotification.bind(service);
    handler({
      id: 'new',
      title: 'New',
      body: 'New notification',
      data: { type: 'system' },
    });

    expect(service.notifications()[0].id).toBe('new');
    expect(service.notifications()).toHaveLength(2);
  });

  it('should generate id from Date.now() if notification has no id', () => {
    const handler = (service as any).handleIncomingNotification.bind(service);
    handler({
      title: 'No ID',
      body: 'Body',
      data: { type: 'system' },
    });

    expect(service.notifications()).toHaveLength(1);
    expect(service.notifications()[0].id).toBeTruthy();
  });

  it('should use "system" type if notification has no type', () => {
    const handler = (service as any).handleIncomingNotification.bind(service);
    handler({
      id: '123',
      title: 'Title',
      body: 'Body',
      data: {},
    });

    expect(service.notifications()[0].type).toBe('system');
  });

  it('should emit notification via observable', async () => {
    const obs = service.onNewNotification();
    const result = new Promise<void>((resolve) => {
      obs.subscribe((notif) => {
        if (notif) {
          expect(notif.title).toBe('Emitted');
          resolve();
        }
      });
    });

    const handler = (service as any).handleIncomingNotification.bind(service);
    handler({
      id: '1',
      title: 'Emitted',
      body: 'Body',
      data: { type: 'system' },
    });
    await result;
  });

  // ======= handleNotificationAction - Additional branches =======

  it('should handle service_started notification', () => {
    const handler = (service as any).handleNotificationAction.bind(service);
    handler({ data: { type: 'service_started', requestId: 'req1' } });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/patient/tracking', 'req1']);
  });

  it('should handle service_completed notification', () => {
    const handler = (service as any).handleNotificationAction.bind(service);
    handler({ data: { type: 'service_completed', requestId: 'req1' } });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/patient/tracking', 'req1']);
  });

  it('should handle payment_pending notification', () => {
    const handler = (service as any).handleNotificationAction.bind(service);
    handler({ data: { type: 'payment_pending' } });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/nurse/earnings']);
  });

  it('should handle verification_rejected notification', () => {
    const handler = (service as any).handleNotificationAction.bind(service);
    handler({ data: { type: 'verification_rejected' } });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/nurse/verification']);
  });

  it('should handle chat_message notification', () => {
    const handler = (service as any).handleNotificationAction.bind(service);
    handler({ data: { type: 'chat_message', requestId: 'req1' } });
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/nurse/active-service', 'req1']);
  });

  it('should not navigate for service_request without requestId', () => {
    const handler = (service as any).handleNotificationAction.bind(service);
    handler({ data: { type: 'service_request' } });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should not navigate for service_accepted without requestId', () => {
    const handler = (service as any).handleNotificationAction.bind(service);
    handler({ data: { type: 'service_accepted' } });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should not navigate for new_message without requestId', () => {
    const handler = (service as any).handleNotificationAction.bind(service);
    handler({ data: { type: 'new_message' } });
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  // ======= loadPreferences with stored data =======

  it('should load stored preferences on init', async () => {
    const storedPrefs = { pushEnabled: false, promotions: true };

    // Reset TestBed and create new service with stored prefs
    TestBed.resetTestingModule();
    const newMockStorage = createMockStorageService();
    newMockStorage.get.mockImplementation((key: string) => {
      if (key === 'notification_preferences') return Promise.resolve(storedPrefs);
      return Promise.resolve(null);
    });

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: ApiService, useValue: mockApi },
        { provide: StorageService, useValue: newMockStorage },
        { provide: Router, useValue: mockRouter },
        { provide: Platform, useValue: mockPlatform },
      ],
    });

    const newService = TestBed.inject(NotificationService);

    // Wait for async init
    await new Promise(r => setTimeout(r, 10));

    expect(newService.preferences().pushEnabled).toBe(false);
    expect(newService.preferences().promotions).toBe(true);
    expect(newService.preferences().serviceRequests).toBe(true); // Default merged
  });

  // ======= loadNotifications with stored data =======

  it('should load stored notifications on init and calculate unread count', async () => {
    const storedNotifications = [
      { id: '1', title: 'Test', body: 'Body', type: 'system', read: false, createdAt: new Date() },
      { id: '2', title: 'Test2', body: 'Body2', type: 'system', read: true, createdAt: new Date() },
      { id: '3', title: 'Test3', body: 'Body3', type: 'system', read: false, createdAt: new Date() },
    ];

    // Reset TestBed and create new service with stored notifications
    TestBed.resetTestingModule();
    const newMockStorage = createMockStorageService();
    newMockStorage.get.mockImplementation((key: string) => {
      if (key === 'app_notifications') return Promise.resolve(storedNotifications);
      return Promise.resolve(null);
    });

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: ApiService, useValue: mockApi },
        { provide: StorageService, useValue: newMockStorage },
        { provide: Router, useValue: mockRouter },
        { provide: Platform, useValue: mockPlatform },
      ],
    });

    const newService = TestBed.inject(NotificationService);

    await new Promise(r => setTimeout(r, 10));

    expect(newService.notifications()).toHaveLength(3);
    expect(newService.unreadCount()).toBe(2);
  });

  it('should handle non-array stored notifications gracefully', async () => {
    // Reset TestBed and create new service with invalid notifications
    TestBed.resetTestingModule();
    const newMockStorage = createMockStorageService();
    newMockStorage.get.mockImplementation((key: string) => {
      if (key === 'app_notifications') return Promise.resolve('invalid');
      return Promise.resolve(null);
    });

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: ApiService, useValue: mockApi },
        { provide: StorageService, useValue: newMockStorage },
        { provide: Router, useValue: mockRouter },
        { provide: Platform, useValue: mockPlatform },
      ],
    });

    const newService = TestBed.inject(NotificationService);

    await new Promise(r => setTimeout(r, 10));

    expect(newService.notifications()).toEqual([]);
    expect(newService.unreadCount()).toBe(0);
  });

  // ======= saveNotifications truncation logic =======

  it('should truncate notifications to 50 when saving', async () => {
    const manyNotifications = Array.from({ length: 60 }, (_, i) => ({
      id: `${i}`,
      title: `Notif ${i}`,
      body: 'Body',
      type: 'system' as const,
      read: false,
      createdAt: new Date(),
    }));

    (service as any)._notifications.set(manyNotifications);
    await (service as any).saveNotifications();

    expect(mockStorage.set).toHaveBeenCalledWith(
      'app_notifications',
      expect.arrayContaining([expect.objectContaining({ id: '0' })])
    );

    // Should only save first 50
    const savedData = mockStorage.set.mock.calls.find(
      (call: any) => call[0] === 'app_notifications'
    )?.[1];
    expect(savedData).toHaveLength(50);
  });

  // ======= Native Platform Tests (PushNotifications) =======

  it('should request permission on native and register if granted', async () => {
    (Capacitor.isNativePlatform as any).mockReturnValue(true);

    const { PushNotifications } = await import('@capacitor/push-notifications');
    (PushNotifications.requestPermissions as any).mockResolvedValue({ receive: 'granted' });
    (PushNotifications.register as any).mockResolvedValue(undefined);

    const result = await service.requestPermission();

    expect(result).toBe(true);
    expect(service.permissionGranted()).toBe(true);
    expect(PushNotifications.register).toHaveBeenCalled();
  });

  it('should request permission on native and return false if denied', async () => {
    (Capacitor.isNativePlatform as any).mockReturnValue(true);

    const { PushNotifications } = await import('@capacitor/push-notifications');
    (PushNotifications.requestPermissions as any).mockResolvedValue({ receive: 'denied' });

    const result = await service.requestPermission();

    expect(result).toBe(false);
    expect(service.permissionGranted()).toBe(false);
    expect(PushNotifications.register).not.toHaveBeenCalled();
  });

  // Note: Native platform PushNotifications setup tests are skipped because
  // @capacitor/push-notifications is mocked at module load time and can't be
  // dynamically re-mocked per test in Vitest. The setup logic is covered by
  // integration tests on actual devices.

  // ======= registerDeviceToken =======

  it('should register device token with backend on iOS', async () => {
    (Capacitor.getPlatform as any).mockReturnValue('ios');
    mockPlatform.is.mockImplementation((platform: string) => platform === 'ios');

    await (service as any).registerDeviceToken('test-token-123');

    expect(mockApi.post).toHaveBeenCalledWith('/notifications/register-device', {
      token: 'test-token-123',
      platform: 'ios',
      deviceInfo: { model: 'iOS' },
    });
  });

  it('should register device token with backend on Android', async () => {
    (Capacitor.getPlatform as any).mockReturnValue('android');
    mockPlatform.is.mockImplementation((platform: string) => platform === 'android');

    await (service as any).registerDeviceToken('test-token-456');

    expect(mockApi.post).toHaveBeenCalledWith('/notifications/register-device', {
      token: 'test-token-456',
      platform: 'android',
      deviceInfo: { model: 'Android' },
    });
  });

  it('should handle backend error when registering device token', async () => {
    mockApi.post.mockReturnValue(throwError(() => new Error('Network error')));

    // Should not throw
    await expect((service as any).registerDeviceToken('test-token')).resolves.not.toThrow();
  });

  // ======= showLocalNotification on native =======

  it('should show local notification on native platform', async () => {
    (Capacitor.isNativePlatform as any).mockReturnValue(true);

    const { LocalNotifications } = await import('@capacitor/local-notifications');
    (LocalNotifications.schedule as any).mockResolvedValue({ notifications: [] });

    const notification: AppNotification = {
      id: '123',
      title: 'Local Notif',
      body: 'Body',
      type: 'system',
      read: false,
      createdAt: new Date(),
      data: { extra: 'data' },
    };

    await service.showLocalNotification(notification);

    expect(LocalNotifications.schedule).toHaveBeenCalledWith({
      notifications: [{
        id: 123,
        title: 'Local Notif',
        body: 'Body',
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#1e3a5f',
        sound: 'default',
        extra: { extra: 'data' },
      }],
    });
  });

  it('should handle non-numeric id in showLocalNotification', async () => {
    (Capacitor.isNativePlatform as any).mockReturnValue(true);

    const { LocalNotifications } = await import('@capacitor/local-notifications');
    (LocalNotifications.schedule as any).mockResolvedValue({ notifications: [] });

    const notification: AppNotification = {
      id: 'abc',
      title: 'Test',
      body: 'Body',
      type: 'system',
      read: false,
      createdAt: new Date(),
    };

    await service.showLocalNotification(notification);

    // Should use Date.now() fallback
    const call = (LocalNotifications.schedule as any).mock.calls[0][0];
    expect(call.notifications[0].id).toBeGreaterThan(0);
  });

  // ======= scheduleNotification on native =======

  it('should schedule notification on native platform', async () => {
    (Capacitor.isNativePlatform as any).mockReturnValue(true);

    const { LocalNotifications } = await import('@capacitor/local-notifications');
    (LocalNotifications.schedule as any).mockResolvedValue({ notifications: [] });

    const triggerDate = new Date(Date.now() + 60000);
    await service.scheduleNotification('Scheduled', 'Body', triggerDate, { custom: 'data' });

    expect(LocalNotifications.schedule).toHaveBeenCalledWith({
      notifications: [{
        id: expect.any(Number),
        title: 'Scheduled',
        body: 'Body',
        schedule: { at: triggerDate },
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#1e3a5f',
        sound: 'default',
        extra: { custom: 'data' },
      }],
    });
  });

  it('should schedule notification without extra data', async () => {
    (Capacitor.isNativePlatform as any).mockReturnValue(true);

    const { LocalNotifications } = await import('@capacitor/local-notifications');
    (LocalNotifications.schedule as any).mockResolvedValue({ notifications: [] });

    const triggerDate = new Date(Date.now() + 60000);
    await service.scheduleNotification('Reminder', 'Body', triggerDate);

    const call = (LocalNotifications.schedule as any).mock.calls[0][0];
    expect(call.notifications[0].extra).toBeUndefined();
  });

  // Note: Registration listener tests are covered by integration tests on actual devices

  // ======= fetchFromServer edge case (null response) =======

  it('should handle null response from fetchFromServer', async () => {
    mockApi.get.mockReturnValue(of(null));

    const result = await firstValueFrom(service.fetchFromServer());

    // Should return null but not crash
    expect(result).toBeNull();
    // Notifications should not be updated
    expect(service.notifications()).toEqual([]);
  });
});
