import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';
import { Preferences } from '@capacitor/preferences';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);

    // Mock Capacitor Preferences
    spyOn(Preferences, 'get').and.callFake(async (options: { key: string }) => {
      return { value: null };
    });
    spyOn(Preferences, 'set').and.callFake(async () => {});
    spyOn(Preferences, 'remove').and.callFake(async () => {});
    spyOn(Preferences, 'clear').and.callFake(async () => {});
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('init', () => {
    it('should initialize with token from storage', async () => {
      (Preferences.get as jasmine.Spy).and.returnValue(Promise.resolve({ value: 'test-token' }));

      await service.init();

      expect(Preferences.get).toHaveBeenCalledWith({ key: 'histora_token' });
      expect(service.token()).toBe('test-token');
      expect(service.isReady()).toBe(true);
    });

    it('should initialize with null token when storage is empty', async () => {
      (Preferences.get as jasmine.Spy).and.returnValue(Promise.resolve({ value: null }));

      await service.init();

      expect(service.token()).toBeNull();
      expect(service.isReady()).toBe(true);
    });
  });

  describe('get', () => {
    it('should get value from storage', async () => {
      (Preferences.get as jasmine.Spy).and.returnValue(Promise.resolve({ value: 'test-value' }));

      const result = await service.get('test-key');

      expect(Preferences.get).toHaveBeenCalledWith({ key: 'test-key' });
      expect(result).toBe('test-value');
    });
  });

  describe('set', () => {
    it('should set value in storage', async () => {
      await service.set('test-key', 'test-value');

      expect(Preferences.set).toHaveBeenCalledWith({ key: 'test-key', value: 'test-value' });
    });
  });

  describe('remove', () => {
    it('should remove value from storage', async () => {
      await service.remove('test-key');

      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'test-key' });
    });
  });

  describe('clear', () => {
    it('should clear all storage', async () => {
      await service.clear();

      expect(Preferences.clear).toHaveBeenCalled();
    });
  });

  describe('token management', () => {
    it('should set token', async () => {
      await service.setToken('new-token');

      expect(Preferences.set).toHaveBeenCalledWith({ key: 'histora_token', value: 'new-token' });
      expect(service.token()).toBe('new-token');
    });

    it('should get token', async () => {
      (Preferences.get as jasmine.Spy).and.returnValue(Promise.resolve({ value: 'stored-token' }));

      const result = await service.getToken();

      expect(result).toBe('stored-token');
    });

    it('should remove token', async () => {
      await service.removeToken();

      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'histora_token' });
      expect(service.token()).toBeNull();
    });
  });

  describe('refresh token management', () => {
    it('should set refresh token', async () => {
      await service.setRefreshToken('refresh-token');

      expect(Preferences.set).toHaveBeenCalledWith({ key: 'histora_refresh_token', value: 'refresh-token' });
    });

    it('should get refresh token', async () => {
      (Preferences.get as jasmine.Spy).and.returnValue(Promise.resolve({ value: 'refresh-token' }));

      const result = await service.getRefreshToken();

      expect(result).toBe('refresh-token');
    });

    it('should remove refresh token', async () => {
      await service.removeRefreshToken();

      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'histora_refresh_token' });
    });
  });

  describe('user management', () => {
    it('should set user', async () => {
      const user = { id: '1', email: 'test@test.com' };

      await service.setUser(user);

      expect(Preferences.set).toHaveBeenCalledWith({
        key: 'histora_user',
        value: JSON.stringify(user),
      });
    });

    it('should get user', async () => {
      const user = { id: '1', email: 'test@test.com' };
      (Preferences.get as jasmine.Spy).and.returnValue(Promise.resolve({ value: JSON.stringify(user) }));

      const result = await service.getUser();

      expect(result).toEqual(user);
    });

    it('should return null when user not found', async () => {
      (Preferences.get as jasmine.Spy).and.returnValue(Promise.resolve({ value: null }));

      const result = await service.getUser();

      expect(result).toBeNull();
    });

    it('should remove user', async () => {
      await service.removeUser();

      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'histora_user' });
    });
  });

  describe('theme management', () => {
    it('should set theme', async () => {
      await service.setTheme('dark');

      expect(Preferences.set).toHaveBeenCalledWith({ key: 'histora_theme', value: 'dark' });
    });

    it('should get theme', async () => {
      (Preferences.get as jasmine.Spy).and.returnValue(Promise.resolve({ value: 'dark' }));

      const result = await service.getTheme();

      expect(result).toBe('dark');
    });

    it('should return system as default theme', async () => {
      (Preferences.get as jasmine.Spy).and.returnValue(Promise.resolve({ value: null }));

      const result = await service.getTheme();

      expect(result).toBe('system');
    });
  });
});
