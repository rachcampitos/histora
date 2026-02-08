import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { WebPushService } from './web-push.service';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { of } from 'rxjs';

// Ensure navigator.serviceWorker is available for jsdom
beforeAll(() => {
  if (!('serviceWorker' in navigator)) {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(null),
            subscribe: vi.fn().mockResolvedValue(null),
          },
        }),
      },
      writable: true,
      configurable: true,
    });
  }

  if (!('PushManager' in window)) {
    (window as any).PushManager = vi.fn();
  }

  if (!('Notification' in window)) {
    (window as any).Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    };
  }
});

describe('WebPushService', () => {
  let service: WebPushService;
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
    navigateByUrl: ReturnType<typeof vi.fn>;
  };
  let apiMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let storageMock: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    keys: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };

    apiMock = {
      get: vi.fn().mockReturnValue(of(null)),
      post: vi.fn().mockReturnValue(of({})),
      patch: vi.fn().mockReturnValue(of({})),
      put: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
    };

    storageMock = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      keys: vi.fn().mockResolvedValue([]),
    };

    TestBed.configureTestingModule({
      providers: [
        WebPushService,
        { provide: Router, useValue: routerMock },
        { provide: ApiService, useValue: apiMock },
        { provide: StorageService, useValue: storageMock },
      ],
    });

    service = TestBed.inject(WebPushService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= Signals initial state =============

  it('isSubscribed should initially be false', () => {
    expect(service.isSubscribed()).toBe(false);
  });

  it('permissionState should have an initial value', () => {
    const state = service.permissionState();
    expect(['default', 'granted', 'denied']).toContain(state);
  });

  // ============= handleNotificationClick =============

  it('handleNotificationClick() should navigate to url if provided', () => {
    service.handleNotificationClick({ url: '/custom/path' });
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/custom/path');
  });

  it('handleNotificationClick() should navigate to nurse dashboard for ACCOUNT_VERIFIED', () => {
    service.handleNotificationClick({ type: 'ACCOUNT_VERIFIED' });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/nurse/dashboard']);
  });

  it('handleNotificationClick() should navigate to nurse verification for ACCOUNT_REJECTED', () => {
    service.handleNotificationClick({ type: 'ACCOUNT_REJECTED' });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/nurse/verification']);
  });

  it('handleNotificationClick() should navigate to nurse requests with id for NEW_SERVICE_REQUEST', () => {
    service.handleNotificationClick({ type: 'NEW_SERVICE_REQUEST', requestId: 'req-1' });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/nurse/requests', 'req-1']);
  });

  it('handleNotificationClick() should navigate to nurse requests without id for NEW_SERVICE_REQUEST', () => {
    service.handleNotificationClick({ type: 'NEW_SERVICE_REQUEST' });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/nurse/requests']);
  });

  it('handleNotificationClick() should navigate to patient tracking for SERVICE_ACCEPTED', () => {
    service.handleNotificationClick({ type: 'SERVICE_ACCEPTED', requestId: 'req-1' });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/patient/tracking', 'req-1']);
  });

  it('handleNotificationClick() should navigate to patient tracking for NURSE_ARRIVED', () => {
    service.handleNotificationClick({ type: 'NURSE_ARRIVED', requestId: 'req-1' });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/patient/tracking', 'req-1']);
  });

  it('handleNotificationClick() should navigate to review for SERVICE_COMPLETED', () => {
    service.handleNotificationClick({ type: 'SERVICE_COMPLETED', requestId: 'req-1' });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/patient/requests', 'req-1', 'review']);
  });

  it('handleNotificationClick() should navigate to nurse earnings for PAYMENT_RECEIVED', () => {
    service.handleNotificationClick({ type: 'PAYMENT_RECEIVED' });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/nurse/earnings']);
  });

  it('handleNotificationClick() should navigate to active service for chat message', () => {
    service.handleNotificationClick({ type: 'new_message', requestId: 'req-1' });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/nurse/active-service', 'req-1']);
  });

  it('handleNotificationClick() should navigate to home for unknown type', () => {
    service.handleNotificationClick({ type: 'UNKNOWN_TYPE' });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('handleNotificationClick() should not navigate for TEST type', () => {
    service.handleNotificationClick({ type: 'TEST' });
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
  });

  it('handleNotificationClick() should navigate to patient tracking for NURSE_ON_THE_WAY', () => {
    service.handleNotificationClick({ type: 'NURSE_ON_THE_WAY', requestId: 'req-2' });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/patient/tracking', 'req-2']);
  });

  it('handleNotificationClick() should navigate to active service for chat_message', () => {
    service.handleNotificationClick({ type: 'chat_message', requestId: 'req-3' });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/nurse/active-service', 'req-3']);
  });

  it('handleNotificationClick() should navigate to active service for NEW_MESSAGE', () => {
    service.handleNotificationClick({ type: 'NEW_MESSAGE', requestId: 'req-4' });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/nurse/active-service', 'req-4']);
  });

  it('handleNotificationClick() should not navigate for SERVICE_ACCEPTED without requestId', () => {
    service.handleNotificationClick({ type: 'SERVICE_ACCEPTED' });
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('handleNotificationClick() should not navigate for SERVICE_COMPLETED without requestId', () => {
    service.handleNotificationClick({ type: 'SERVICE_COMPLETED' });
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('handleNotificationClick() should not navigate for chat messages without requestId', () => {
    service.handleNotificationClick({ type: 'new_message' });
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  // ============= subscribe =============

  it('subscribe() should return false if not supported', async () => {
    // Create new service on native platform (not supported)
    const { Capacitor } = await import('@capacitor/core');
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);

    const nativeService = TestBed.inject(WebPushService);
    const result = await nativeService.subscribe();

    expect(result).toBe(false);
  });

  it('subscribe() should load VAPID key if not already loaded', async () => {
    // Mark as supported and set VAPID key
    (service as any)._isSupported.set(true);
    (service as any)._vapidPublicKey.set('BH5m_test_key_already_loaded');

    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      toJSON: () => ({
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
        keys: { p256dh: 'test-p256dh', auth: 'test-auth' }
      }),
      unsubscribe: vi.fn().mockResolvedValue(true)
    };

    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue(mockSubscription)
      }
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve(mockRegistration) },
      writable: true,
      configurable: true
    });

    (window as any).Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted')
    };

    apiMock.post.mockReturnValue(of({ success: true }));
    storageMock.set.mockResolvedValue(undefined);

    const result = await service.subscribe();

    expect(result).toBe(true);
    expect(apiMock.post).toHaveBeenCalledWith('/notifications/web-push/subscribe', expect.objectContaining({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123'
    }));
  });

  it('subscribe() should return false if permission denied', async () => {
    (service as any)._isSupported.set(true);
    apiMock.get.mockReturnValue(of({ publicKey: 'BH5m...test-key', enabled: true }));

    (window as any).Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('denied')
    };

    const result = await service.subscribe();

    expect(result).toBe(false);
    expect(service.permissionState()).toBe('denied');
  });

  it('subscribe() should return false if VAPID key not available', async () => {
    apiMock.get.mockReturnValue(of({ publicKey: null, enabled: false }));

    const result = await service.subscribe();

    expect(result).toBe(false);
  });

  it('subscribe() should handle subscription errors gracefully', async () => {
    apiMock.get.mockReturnValue(of({ publicKey: 'BH5m...test-key', enabled: true }));

    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockRejectedValue(new Error('Subscription failed'))
      }
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve(mockRegistration) },
      writable: true,
      configurable: true
    });

    (window as any).Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted')
    };

    const result = await service.subscribe();

    expect(result).toBe(false);
  });

  it('subscribe() should return false if backend subscription fails', async () => {
    apiMock.get.mockReturnValue(of({ publicKey: 'BH5m...test-key', enabled: true }));

    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      toJSON: () => ({
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
        keys: { p256dh: 'test-p256dh', auth: 'test-auth' }
      }),
      unsubscribe: vi.fn().mockResolvedValue(true)
    };

    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue(mockSubscription)
      }
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve(mockRegistration) },
      writable: true,
      configurable: true
    });

    (window as any).Notification = {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('granted')
    };

    // Backend returns error
    apiMock.post.mockReturnValue(of({ success: false }));

    const result = await service.subscribe();

    expect(result).toBe(false);
  });

  // ============= unsubscribe =============

  it('unsubscribe() should return false if not supported', async () => {
    const { Capacitor } = await import('@capacitor/core');
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);

    const nativeService = TestBed.inject(WebPushService);
    const result = await nativeService.unsubscribe();

    expect(result).toBe(false);
  });

  it('unsubscribe() should unsubscribe and notify backend', async () => {
    (service as any)._isSupported.set(true);
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      unsubscribe: vi.fn().mockResolvedValue(true)
    };

    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(mockSubscription)
      }
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve(mockRegistration) },
      writable: true,
      configurable: true
    });

    apiMock.post.mockReturnValue(of({ success: true }));
    storageMock.remove.mockResolvedValue(undefined);

    const result = await service.unsubscribe();

    expect(result).toBe(true);
    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    expect(apiMock.post).toHaveBeenCalledWith('/notifications/web-push/unsubscribe', {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123'
    });
    expect(storageMock.remove).toHaveBeenCalledWith('web_push_subscription');
  });

  it('unsubscribe() should return false if no subscription exists', async () => {
    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null)
      }
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve(mockRegistration) },
      writable: true,
      configurable: true
    });

    const result = await service.unsubscribe();

    expect(result).toBe(false);
  });

  it('unsubscribe() should ignore backend errors', async () => {
    (service as any)._isSupported.set(true);
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      unsubscribe: vi.fn().mockResolvedValue(true)
    };

    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(mockSubscription)
      }
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve(mockRegistration) },
      writable: true,
      configurable: true
    });

    // Backend fails but should not prevent unsubscribe
    apiMock.post.mockReturnValue(of({ success: false }));
    storageMock.remove.mockResolvedValue(undefined);

    const result = await service.unsubscribe();

    expect(result).toBe(true);
  });

  it('unsubscribe() should handle errors gracefully', async () => {
    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockRejectedValue(new Error('Failed to get subscription'))
      }
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { ready: Promise.resolve(mockRegistration) },
      writable: true,
      configurable: true
    });

    const result = await service.unsubscribe();

    expect(result).toBe(false);
  });

  // ============= sendTestNotification =============

  it('sendTestNotification() should return false if not subscribed', async () => {
    const result = await service.sendTestNotification();
    expect(result).toBe(false);
  });

  it('sendTestNotification() should call backend API when subscribed', async () => {
    // Mark as subscribed
    (service as any)._isSubscribed.set(true);

    apiMock.post.mockReturnValue(of({ success: true, sent: 1 }));

    const result = await service.sendTestNotification();

    expect(result).toBe(true);
    expect(apiMock.post).toHaveBeenCalledWith('/notifications/web-push/test', {});
  });

  it('sendTestNotification() should handle API errors', async () => {
    (service as any)._isSubscribed.set(true);

    apiMock.post.mockReturnValue(of({ success: false, sent: 0 }));

    const result = await service.sendTestNotification();

    expect(result).toBe(false);
  });

  it('sendTestNotification() should handle missing success field', async () => {
    (service as any)._isSubscribed.set(true);

    apiMock.post.mockReturnValue(of({ sent: 1 }));

    const result = await service.sendTestNotification();

    expect(result).toBe(false);
  });
});
