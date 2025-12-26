import { Injectable, signal, computed } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEYS = {
  TOKEN: 'histora_token',
  USER: 'histora_user',
  THEME: 'histora_theme',
} as const;

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private tokenSignal = signal<string | null>(null);
  private isInitialized = signal(false);

  readonly token = computed(() => this.tokenSignal());
  readonly isReady = computed(() => this.isInitialized());

  async init(): Promise<void> {
    const token = await this.get(STORAGE_KEYS.TOKEN);
    this.tokenSignal.set(token);
    this.isInitialized.set(true);
  }

  async get(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  }

  async set(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  async clear(): Promise<void> {
    await Preferences.clear();
  }

  // Token management
  async setToken(token: string): Promise<void> {
    await this.set(STORAGE_KEYS.TOKEN, token);
    this.tokenSignal.set(token);
  }

  async getToken(): Promise<string | null> {
    return this.get(STORAGE_KEYS.TOKEN);
  }

  async removeToken(): Promise<void> {
    await this.remove(STORAGE_KEYS.TOKEN);
    this.tokenSignal.set(null);
  }

  // User management
  async setUser(user: object): Promise<void> {
    await this.set(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  async getUser<T>(): Promise<T | null> {
    const value = await this.get(STORAGE_KEYS.USER);
    return value ? JSON.parse(value) : null;
  }

  async removeUser(): Promise<void> {
    await this.remove(STORAGE_KEYS.USER);
  }

  // Theme management
  async setTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.set(STORAGE_KEYS.THEME, theme);
  }

  async getTheme(): Promise<'light' | 'dark' | 'system'> {
    const value = await this.get(STORAGE_KEYS.THEME);
    return (value as 'light' | 'dark' | 'system') || 'system';
  }
}
