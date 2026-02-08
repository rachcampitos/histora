/**
 * Reusable mock service factories for Vitest tests
 */
import { vi } from 'vitest';
import { of, EMPTY, Subject, BehaviorSubject } from 'rxjs';
import { signal, computed } from '@angular/core';

// ============= Core Service Mocks =============

export function createMockApiService() {
  return {
    get: vi.fn().mockReturnValue(of({})),
    post: vi.fn().mockReturnValue(of({})),
    patch: vi.fn().mockReturnValue(of({})),
    put: vi.fn().mockReturnValue(of({})),
    delete: vi.fn().mockReturnValue(of({})),
  };
}

export function createMockAuthService(overrides?: Record<string, any>) {
  const userSignal = signal<any>(null);
  const service = {
    user: userSignal.asReadonly(),
    isAuthenticated: computed(() => !!userSignal()),
    isNurse: computed(() => userSignal()?.role === 'nurse'),
    isPatient: computed(() => userSignal()?.role === 'patient'),
    isAdmin: computed(() => userSignal()?.role === 'platform_admin'),
    loading: signal(false).asReadonly(),
    googleAuthPending: signal(false).asReadonly(),
    initialize: vi.fn().mockResolvedValue(undefined),
    login: vi.fn().mockReturnValue(of({ access_token: 'token', refresh_token: 'refresh', user: {} })),
    registerNurse: vi.fn().mockReturnValue(of({})),
    registerPatient: vi.fn().mockReturnValue(of({})),
    logout: vi.fn().mockResolvedValue(undefined),
    refreshToken: vi.fn().mockResolvedValue('new-token'),
    getToken: vi.fn().mockResolvedValue('mock-token'),
    setupOAuthListener: vi.fn(),
    loginWithGoogle: vi.fn().mockResolvedValue(undefined),
    handleOAuthCallback: vi.fn().mockResolvedValue(undefined),
    handleWebOAuthCallback: vi.fn().mockResolvedValue(undefined),
    handleOAuthSuccess: vi.fn().mockResolvedValue(undefined),
    updateUserAvatar: vi.fn().mockResolvedValue(undefined),
    forgotPassword: vi.fn().mockReturnValue(of({ message: 'ok' })),
    resetPassword: vi.fn().mockReturnValue(of({ message: 'ok' })),
    requestPasswordOtp: vi.fn().mockReturnValue(of({ message: 'ok' })),
    verifyPasswordOtp: vi.fn().mockReturnValue(of({ valid: true, message: 'ok' })),
    resetPasswordWithOtp: vi.fn().mockReturnValue(of({ message: 'ok' })),
    // Test helper to set user for tests
    _setUser: (user: any) => userSignal.set(user),
    ...overrides,
  };
  return service;
}

export function createMockStorageService() {
  const store = new Map<string, any>();
  return {
    set: vi.fn().mockImplementation((key: string, value: any) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    get: vi.fn().mockImplementation((key: string) => {
      return Promise.resolve(store.get(key) ?? null);
    }),
    remove: vi.fn().mockImplementation((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    clear: vi.fn().mockImplementation(() => {
      store.clear();
      return Promise.resolve();
    }),
    keys: vi.fn().mockImplementation(() => {
      return Promise.resolve(Array.from(store.keys()));
    }),
    _store: store,
  };
}

export function createMockRouter() {
  return {
    navigate: vi.fn().mockResolvedValue(true),
    navigateByUrl: vi.fn().mockResolvedValue(true),
    events: EMPTY,
    url: '/',
    createUrlTree: vi.fn(),
    serializeUrl: vi.fn().mockReturnValue(''),
    parseUrl: vi.fn(),
    isActive: vi.fn().mockReturnValue(false),
    routerState: { snapshot: { url: '/' } },
  };
}

export function createMockToastService() {
  return {
    show: vi.fn().mockResolvedValue(undefined),
    success: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
    warning: vi.fn().mockResolvedValue(undefined),
    info: vi.fn().mockResolvedValue(undefined),
    networkError: vi.fn().mockResolvedValue(undefined),
    genericError: vi.fn().mockResolvedValue(undefined),
    comingSoon: vi.fn().mockResolvedValue(undefined),
    dismissAll: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMockThemeService() {
  return {
    currentTheme: signal<'light' | 'dark' | 'auto'>('auto'),
    isDarkMode: signal(false),
    setTheme: vi.fn(),
    getThemeLabel: vi.fn().mockReturnValue('Automatico'),
    getThemeIcon: vi.fn().mockReturnValue('phone-portrait-outline'),
  };
}

// ============= Ionic Controller Mocks =============

export function createMockModalController() {
  const modal = {
    present: vi.fn().mockResolvedValue(undefined),
    dismiss: vi.fn().mockResolvedValue(true),
    onWillDismiss: vi.fn().mockResolvedValue({ role: 'cancel' }),
    onDidDismiss: vi.fn().mockResolvedValue({ role: 'cancel' }),
  };
  return {
    create: vi.fn().mockResolvedValue(modal),
    dismiss: vi.fn().mockResolvedValue(true),
    getTop: vi.fn().mockResolvedValue(null),
    _modal: modal,
  };
}

export function createMockToastController() {
  const toast = {
    present: vi.fn().mockResolvedValue(undefined),
    dismiss: vi.fn().mockResolvedValue(true),
    onDidDismiss: vi.fn().mockResolvedValue({ role: 'cancel' }),
  };
  return {
    create: vi.fn().mockResolvedValue(toast),
    dismiss: vi.fn().mockResolvedValue(true),
    getTop: vi.fn().mockResolvedValue(null),
    _toast: toast,
  };
}

export function createMockLoadingController() {
  const loading = {
    present: vi.fn().mockResolvedValue(undefined),
    dismiss: vi.fn().mockResolvedValue(true),
  };
  return {
    create: vi.fn().mockResolvedValue(loading),
    dismiss: vi.fn().mockResolvedValue(true),
    getTop: vi.fn().mockResolvedValue(null),
    _loading: loading,
  };
}

export function createMockAlertController() {
  const alert = {
    present: vi.fn().mockResolvedValue(undefined),
    dismiss: vi.fn().mockResolvedValue(true),
    onDidDismiss: vi.fn().mockResolvedValue({ role: 'cancel' }),
  };
  return {
    create: vi.fn().mockResolvedValue(alert),
    dismiss: vi.fn().mockResolvedValue(true),
    getTop: vi.fn().mockResolvedValue(null),
    _alert: alert,
  };
}

export function createMockActionSheetController() {
  const actionSheet = {
    present: vi.fn().mockResolvedValue(undefined),
    dismiss: vi.fn().mockResolvedValue(true),
    onDidDismiss: vi.fn().mockResolvedValue({ role: 'cancel' }),
  };
  return {
    create: vi.fn().mockResolvedValue(actionSheet),
    dismiss: vi.fn().mockResolvedValue(true),
    getTop: vi.fn().mockResolvedValue(null),
  };
}

// ============= Feature Service Mocks =============

export function createMockChatService() {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    sendMessage: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    getRooms: vi.fn().mockReturnValue(of([])),
    getMessages: vi.fn().mockReturnValue(of([])),
    getOrCreateRoom: vi.fn().mockReturnValue(of({})),
    onNewMessage: vi.fn().mockReturnValue(EMPTY),
    onRoomNotification: vi.fn().mockReturnValue(EMPTY),
    getUnreadCount: vi.fn().mockReturnValue(of(0)),
    chatUnreadCount: signal(0),
    isConnected: signal(false),
  };
}

export function createMockNotificationService() {
  return {
    notifications: signal<any[]>([]),
    unreadCount: signal(0),
    fetchNotifications: vi.fn().mockReturnValue(of([])),
    markAsRead: vi.fn().mockReturnValue(of({})),
    markAllAsRead: vi.fn().mockReturnValue(of({})),
    getPreferences: vi.fn().mockReturnValue(of({})),
    updatePreferences: vi.fn().mockReturnValue(of({})),
    requestPermission: vi.fn().mockResolvedValue('granted'),
  };
}

export function createMockServiceRequestService() {
  return {
    create: vi.fn().mockReturnValue(of({})),
    findByPatient: vi.fn().mockReturnValue(of([])),
    findByNurse: vi.fn().mockReturnValue(of([])),
    findById: vi.fn().mockReturnValue(of({})),
    cancel: vi.fn().mockReturnValue(of({})),
    accept: vi.fn().mockReturnValue(of({})),
    reject: vi.fn().mockReturnValue(of({})),
    complete: vi.fn().mockReturnValue(of({})),
    rate: vi.fn().mockReturnValue(of({})),
    getActiveRequest: vi.fn().mockReturnValue(of(null)),
  };
}

export function createMockPaymentService() {
  return {
    initCulqi: vi.fn(),
    processCardPayment: vi.fn().mockReturnValue(of({})),
    processYapePayment: vi.fn().mockReturnValue(of({})),
    validateCardNumber: vi.fn().mockReturnValue(true),
    getPaymentMethods: vi.fn().mockReturnValue(of([])),
    getPaymentHistory: vi.fn().mockReturnValue(of([])),
  };
}

export function createMockSessionGuardService() {
  return {
    initializeSession: vi.fn().mockResolvedValue(undefined),
    stopMonitoring: vi.fn(),
    setRefreshTokenCallback: vi.fn(),
    checkSessionStatus: vi.fn().mockResolvedValue(true),
    isSessionActive: signal(true),
    sessionExpiresAt: signal<Date | null>(null),
  };
}

export function createMockGeolocationService() {
  return {
    getCurrentPosition: vi.fn().mockResolvedValue({ latitude: -12.046374, longitude: -77.042793 }),
    startWatching: vi.fn().mockResolvedValue(undefined),
    stopWatching: vi.fn(),
    calculateDistance: vi.fn().mockReturnValue(1.5),
    position: signal<any>(null),
    isWatching: signal(false),
  };
}

export function createMockWebSocketService() {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    joinTracking: vi.fn(),
    leaveTracking: vi.fn(),
    sendLocation: vi.fn(),
    onLocationUpdate: vi.fn().mockReturnValue(EMPTY),
    onStatusUpdate: vi.fn().mockReturnValue(EMPTY),
    isConnected: signal(false),
  };
}

export function createMockOnboardingService() {
  return {
    ensureInitialized: vi.fn().mockResolvedValue(undefined),
    hasSeenLanding: vi.fn().mockResolvedValue(false),
    hasSeenTutorial: vi.fn().mockResolvedValue(false),
    markLandingSeen: vi.fn().mockResolvedValue(undefined),
    markTutorialSeen: vi.fn().mockResolvedValue(undefined),
    shouldShowLanding: vi.fn().mockResolvedValue(true),
    shouldShowOnboarding: vi.fn().mockResolvedValue(true),
    checkVersionUpdate: vi.fn().mockResolvedValue(false),
  };
}

export function createMockHapticsService() {
  return {
    impact: vi.fn().mockResolvedValue(undefined),
    notification: vi.fn().mockResolvedValue(undefined),
    vibrate: vi.fn().mockResolvedValue(undefined),
    selectionStart: vi.fn().mockResolvedValue(undefined),
    selectionChanged: vi.fn().mockResolvedValue(undefined),
    selectionEnd: vi.fn().mockResolvedValue(undefined),
  };
}

export function createMockSafetyService() {
  return {
    triggerPanic: vi.fn().mockReturnValue(of({})),
    cancelPanic: vi.fn().mockReturnValue(of({})),
    getHistory: vi.fn().mockReturnValue(of([])),
    isPanicActive: signal(false),
  };
}

export function createMockAdminService() {
  return {
    getStats: vi.fn().mockReturnValue(of({})),
    listVerifications: vi.fn().mockReturnValue(of([])),
    approveVerification: vi.fn().mockReturnValue(of({})),
    rejectVerification: vi.fn().mockReturnValue(of({})),
    getVerificationDetail: vi.fn().mockReturnValue(of({})),
  };
}

export function createMockNurseApiService() {
  return {
    search: vi.fn().mockReturnValue(of([])),
    getProfile: vi.fn().mockReturnValue(of({})),
    getServices: vi.fn().mockReturnValue(of([])),
    updateProfile: vi.fn().mockReturnValue(of({})),
    updateAvailability: vi.fn().mockReturnValue(of({})),
    getEarnings: vi.fn().mockReturnValue(of({})),
    getSubscription: vi.fn().mockReturnValue(of({})),
  };
}

export function createMockLoggerService() {
  return {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  };
}

export function createMockProductTourService() {
  return {
    startTour: vi.fn(),
    markCompleted: vi.fn().mockResolvedValue(undefined),
    hasCompletedTour: vi.fn().mockResolvedValue(false),
    isActive: signal(false),
  };
}

export function createMockUploadsService() {
  return {
    uploadProfilePhoto: vi.fn().mockReturnValue(of({ url: 'https://example.com/photo.jpg' })),
    takePhoto: vi.fn().mockResolvedValue('data:image/png;base64,abc'),
  };
}

export function createMockVirtualEscortService() {
  return {
    share: vi.fn().mockReturnValue(of({})),
    revoke: vi.fn().mockReturnValue(of({})),
    getActiveEscort: vi.fn().mockReturnValue(of(null)),
    generateWhatsAppLink: vi.fn().mockReturnValue('https://wa.me/...'),
  };
}

export function createMockMapboxService() {
  return {
    formatDistance: vi.fn().mockReturnValue('1.5 km'),
    formatDuration: vi.fn().mockReturnValue('10 min'),
  };
}

export function createMockWebPushService() {
  return {
    subscribe: vi.fn().mockResolvedValue(true),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    isSubscribed: signal(false),
  };
}

export function createMockCheckInService() {
  return {
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    checkIn: vi.fn().mockReturnValue(of({})),
    isMonitoring: signal(false),
  };
}

export function createMockImageCompressionService() {
  return {
    compress: vi.fn().mockResolvedValue(new Blob(['compressed'])),
    calculateDimensions: vi.fn().mockReturnValue({ width: 800, height: 600 }),
  };
}

export function createMockPatientVerificationService() {
  return {
    sendPhoneOtp: vi.fn().mockReturnValue(of({})),
    verifyPhoneOtp: vi.fn().mockReturnValue(of({})),
    sendEmailOtp: vi.fn().mockReturnValue(of({})),
    verifyEmailOtp: vi.fn().mockReturnValue(of({})),
    submitDni: vi.fn().mockReturnValue(of({})),
    submitEmergencyContact: vi.fn().mockReturnValue(of({})),
    submitSelfie: vi.fn().mockReturnValue(of({})),
    getStatus: vi.fn().mockReturnValue(of({})),
    canRequestService: vi.fn().mockReturnValue(of({ allowed: true })),
    getNextStep: vi.fn().mockReturnValue('phone'),
    formatPhone: vi.fn().mockImplementation((phone: string) => phone),
  };
}

export function createMockVerificationContextService() {
  return {
    saveContext: vi.fn(),
    getContext: vi.fn().mockReturnValue(null),
    clearContext: vi.fn(),
    hasContext: vi.fn().mockReturnValue(false),
    getReturnUrl: vi.fn().mockReturnValue(null),
    // Legacy aliases
    save: vi.fn(),
    get: vi.fn().mockReturnValue(null),
    clear: vi.fn(),
  };
}

export function createMockPeruLocationsService() {
  return {
    getDepartamentos: vi.fn().mockReturnValue([]),
    getProvincias: vi.fn().mockReturnValue([]),
    getDistritos: vi.fn().mockReturnValue([]),
    buscarDistritos: vi.fn().mockReturnValue([]),
  };
}

export function createMockNurseOnboardingService() {
  return {
    init: vi.fn().mockReturnValue(of({})),
    complete: vi.fn().mockReturnValue(of({})),
    getChecklist: vi.fn().mockReturnValue(of([])),
    getProgress: vi.fn().mockReturnValue(of({})),
  };
}

// ============= Angular Platform Mocks =============

export function createMockActivatedRoute(params = {}, queryParams = {}, data = {}) {
  return {
    snapshot: {
      params,
      queryParams,
      data,
      paramMap: {
        get: vi.fn((key: string) => (params as any)[key] || null),
        has: vi.fn((key: string) => key in params),
      },
      queryParamMap: {
        get: vi.fn((key: string) => (queryParams as any)[key] || null),
        has: vi.fn((key: string) => key in queryParams),
      },
    },
    params: of(params),
    queryParams: of(queryParams),
    data: of(data),
    paramMap: of({
      get: (key: string) => (params as any)[key] || null,
      has: (key: string) => key in params,
    }),
  };
}

export function createMockNavController() {
  return {
    navigateForward: vi.fn().mockResolvedValue(true),
    navigateBack: vi.fn().mockResolvedValue(true),
    navigateRoot: vi.fn().mockResolvedValue(true),
    pop: vi.fn().mockResolvedValue(true),
    setDirection: vi.fn(),
  };
}

export function createMockPlatform() {
  return {
    is: vi.fn().mockReturnValue(false),
    ready: vi.fn().mockResolvedValue('dom'),
    width: vi.fn().mockReturnValue(375),
    height: vi.fn().mockReturnValue(812),
    isLandscape: vi.fn().mockReturnValue(false),
    isPortrait: vi.fn().mockReturnValue(true),
    backButton: { subscribeWithPriority: vi.fn() },
    resize: new Subject<void>(),
  };
}
