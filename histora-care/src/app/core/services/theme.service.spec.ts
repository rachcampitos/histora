import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { ThemeService, ThemeMode } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  // Helper to build the service after configuring mocks
  function createService(): ThemeService {
    return new ThemeService();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Reset body classes and documentElement style
    document.body.classList.remove('ion-palette-dark', 'dark');
    document.documentElement.style.colorScheme = '';

    // Default matchMedia: prefers-color-scheme is false (light)
    (window.matchMedia as any).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    service = createService();
  });

  it('should default to auto theme', () => {
    expect(service.currentTheme()).toBe('auto');
  });

  it('should load saved theme from localStorage', () => {
    // Set before constructing
    localStorage.setItem('histora-care-theme', 'dark');
    const svc = createService();
    expect(svc.currentTheme()).toBe('dark');
  });

  it('should ignore invalid saved theme and default to auto', () => {
    localStorage.setItem('histora-care-theme', 'invalid-value');
    const svc = createService();
    expect(svc.currentTheme()).toBe('auto');
  });

  it('should set dark mode when theme is dark', () => {
    localStorage.setItem('histora-care-theme', 'dark');
    const svc = createService();
    expect(svc.isDarkMode()).toBe(true);
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(document.body.classList.contains('ion-palette-dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('should set light mode when theme is light', () => {
    localStorage.setItem('histora-care-theme', 'light');
    const svc = createService();
    expect(svc.isDarkMode()).toBe(false);
    expect(document.body.classList.contains('dark')).toBe(false);
    expect(document.body.classList.contains('ion-palette-dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('should respect system preference when auto and system prefers dark', () => {
    (window.matchMedia as any).mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const svc = createService();
    expect(svc.currentTheme()).toBe('auto');
    expect(svc.isDarkMode()).toBe(true);
  });

  it('should save theme to localStorage on setTheme', () => {
    service.setTheme('dark');
    expect(localStorage.setItem).toHaveBeenCalledWith('histora-care-theme', 'dark');
    expect(service.currentTheme()).toBe('dark');
    expect(service.isDarkMode()).toBe(true);
  });

  it('should apply light mode when setTheme is called with light', () => {
    service.setTheme('light');
    expect(service.isDarkMode()).toBe(false);
    expect(document.body.classList.contains('dark')).toBe(false);
  });

  it('should return correct label for each theme', () => {
    expect(service.getThemeLabel('light')).toBe('Claro');
    expect(service.getThemeLabel('dark')).toBe('Oscuro');
    expect(service.getThemeLabel('auto')).toBe('Autom\u00e1tico');
  });

  it('should return correct icon for each theme', () => {
    expect(service.getThemeIcon('light')).toBe('sunny-outline');
    expect(service.getThemeIcon('dark')).toBe('moon-outline');
    expect(service.getThemeIcon('auto')).toBe('phone-portrait-outline');
  });
});
