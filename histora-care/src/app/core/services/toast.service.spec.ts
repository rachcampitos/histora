import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@stencil/core/internal/client', () => ({
  registerInstance: vi.fn(),
  getElement: vi.fn(),
  Host: vi.fn(),
  h: vi.fn(),
  proxyCustomElement: vi.fn((Cstr: any) => Cstr),
  HTMLElement: typeof HTMLElement !== 'undefined' ? HTMLElement : class {},
  defineCustomElement: vi.fn(),
  attachShadow: vi.fn(),
  createEvent: vi.fn(),
  setPlatformHelpers: vi.fn(),
  Build: { isBrowser: true, isDev: true },
}));

vi.mock('@ionic/core/components', () => ({
  isPlatform: vi.fn().mockReturnValue(false),
  getPlatforms: vi.fn().mockReturnValue(['desktop']),
  LIFECYCLE_WILL_ENTER: 'ionViewWillEnter',
  LIFECYCLE_DID_ENTER: 'ionViewDidEnter',
  LIFECYCLE_WILL_LEAVE: 'ionViewWillLeave',
  LIFECYCLE_DID_LEAVE: 'ionViewDidLeave',
  LIFECYCLE_WILL_UNLOAD: 'ionViewWillUnload',
  componentOnReady: vi.fn().mockResolvedValue(undefined),
  initialize: vi.fn(),
}));

vi.mock('@ionic/core/loader', () => ({
  defineCustomElements: vi.fn().mockResolvedValue(undefined),
  setNonce: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn().mockReturnValue(false),
    getPlatform: vi.fn().mockReturnValue('web'),
    isPluginAvailable: vi.fn().mockReturnValue(false),
    convertFileSrc: vi.fn((src: string) => src),
  },
  registerPlugin: vi.fn(),
  WebPlugin: class WebPlugin {},
}));

import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let mockToastCtrl: {
    create: ReturnType<typeof vi.fn>;
    getTop: ReturnType<typeof vi.fn>;
  };
  let mockToastElement: { present: ReturnType<typeof vi.fn>; dismiss: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();

    mockToastElement = {
      present: vi.fn().mockResolvedValue(undefined),
      dismiss: vi.fn().mockResolvedValue(undefined),
    };

    mockToastCtrl = {
      create: vi.fn().mockResolvedValue(mockToastElement),
      getTop: vi.fn().mockResolvedValue(null),
    };

    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: ToastController, useValue: mockToastCtrl },
      ],
    });

    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('show() should create and present a toast with correct options', async () => {
    await service.show({ message: 'Hola', type: 'success', duration: 2000 });

    expect(mockToastCtrl.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Hola',
        duration: 2000,
        color: 'success',
        icon: 'checkmark-circle-outline',
        cssClass: 'toast-success',
      })
    );
    expect(mockToastElement.present).toHaveBeenCalled();
  });

  it('show() should default to info type and 3000ms duration', async () => {
    await service.show({ message: 'Default test' });

    expect(mockToastCtrl.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Default test',
        duration: 3000,
        position: 'bottom',
        color: 'primary',
        icon: 'information-circle-outline',
        cssClass: 'toast-info',
      })
    );
  });

  it('show() should include close button when showCloseButton is true', async () => {
    await service.show({ message: 'Close me', showCloseButton: true });

    expect(mockToastCtrl.create).toHaveBeenCalledWith(
      expect.objectContaining({
        buttons: [{ icon: 'close-outline', role: 'cancel' }],
      })
    );
  });

  it('success() should call show with type success', async () => {
    await service.success('Operacion exitosa');

    expect(mockToastCtrl.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Operacion exitosa',
        color: 'success',
      })
    );
  });

  it('error() should call show with type error and 4000ms default duration', async () => {
    await service.error('Algo fallo');

    expect(mockToastCtrl.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Algo fallo',
        color: 'danger',
        duration: 4000,
      })
    );
  });

  it('error() should use custom duration when provided', async () => {
    await service.error('Fallo', 6000);

    expect(mockToastCtrl.create).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: 6000,
      })
    );
  });

  it('warning() should call show with type warning', async () => {
    await service.warning('Cuidado');

    expect(mockToastCtrl.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Cuidado',
        color: 'warning',
        icon: 'warning-outline',
      })
    );
  });

  it('info() should call show with type info', async () => {
    await service.info('Informacion');

    expect(mockToastCtrl.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Informacion',
        color: 'primary',
      })
    );
  });

  it('networkError() should show specific network message', async () => {
    await service.networkError();

    expect(mockToastCtrl.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error de conexion. Verifica tu internet.',
        color: 'danger',
      })
    );
  });

  it('genericError() should show specific generic message', async () => {
    await service.genericError();

    expect(mockToastCtrl.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Ocurrio un error. Intenta de nuevo.',
        color: 'danger',
      })
    );
  });

  it('comingSoon() should show feature name when provided', async () => {
    await service.comingSoon('Chat');

    expect(mockToastCtrl.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Chat estara disponible proximamente',
      })
    );
  });

  it('comingSoon() should show default message when no feature', async () => {
    await service.comingSoon();

    expect(mockToastCtrl.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Esta funcion estara disponible proximamente',
      })
    );
  });

  it('dismissAll() should get top toast and dismiss it', async () => {
    mockToastCtrl.getTop.mockResolvedValueOnce(mockToastElement);

    await service.dismissAll();

    expect(mockToastCtrl.getTop).toHaveBeenCalled();
    expect(mockToastElement.dismiss).toHaveBeenCalled();
  });

  it('dismissAll() should not throw when no toast is present', async () => {
    mockToastCtrl.getTop.mockResolvedValueOnce(null);

    await expect(service.dismissAll()).resolves.toBeUndefined();
  });

  it('dismissAll() should not throw when getTop rejects', async () => {
    mockToastCtrl.getTop.mockRejectedValueOnce(new Error('no toast'));

    await expect(service.dismissAll()).resolves.toBeUndefined();
  });
});
