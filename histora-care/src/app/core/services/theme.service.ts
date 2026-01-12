import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'histora-care-theme';

  currentTheme = signal<ThemeMode>('auto');
  isDarkMode = signal(false);

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    // Load saved preference
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;

    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      this.currentTheme.set(savedTheme);
    } else {
      this.currentTheme.set('auto');
    }

    // Apply the theme
    this.applyTheme(this.currentTheme());

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.currentTheme() === 'auto') {
        this.setDarkMode(e.matches);
      }
    });
  }

  setTheme(theme: ThemeMode) {
    this.currentTheme.set(theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: ThemeMode) {
    let shouldBeDark: boolean;

    if (theme === 'auto') {
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      shouldBeDark = theme === 'dark';
    }

    this.setDarkMode(shouldBeDark);
  }

  private setDarkMode(isDark: boolean) {
    this.isDarkMode.set(isDark);

    // Toggle Ionic's dark palette class on document body
    document.body.classList.toggle('ion-palette-dark', isDark);
    document.body.classList.toggle('dark', isDark); // Also add 'dark' for custom styles

    // Also set the color-scheme for native elements
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }

  getThemeLabel(theme: ThemeMode): string {
    const labels: Record<ThemeMode, string> = {
      light: 'Claro',
      dark: 'Oscuro',
      auto: 'Automático'
    };
    return labels[theme];
  }

  getThemeIcon(theme: ThemeMode): string {
    const icons: Record<ThemeMode, string> = {
      light: 'sunny-outline',
      dark: 'moon-outline',
      auto: 'phone-portrait-outline'
    };
    return icons[theme];
  }
}
