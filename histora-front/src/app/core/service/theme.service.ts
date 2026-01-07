import { Injectable, Inject, Renderer2, RendererFactory2, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private renderer: Renderer2;
  private readonly THEME_KEY = 'histora_theme';

  // Signal for reactive theme state
  currentTheme = signal<Theme>('light');

  constructor(
    @Inject(DOCUMENT) private document: Document,
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.initializeTheme();

    // Effect to apply theme changes
    effect(() => {
      this.applyTheme(this.currentTheme());
    });
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      this.currentTheme.set(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme.set(prefersDark ? 'dark' : 'light');
    }
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    localStorage.setItem(this.THEME_KEY, theme);
  }

  isDark(): boolean {
    return this.currentTheme() === 'dark';
  }

  private applyTheme(theme: Theme): void {
    const body = this.document.body;

    if (theme === 'dark') {
      // Add dark mode classes
      this.renderer.addClass(body, 'dark');
      this.renderer.addClass(body, 'theme-black');
      this.renderer.addClass(body, 'menu_dark');
      this.renderer.addClass(body, 'logo-black');

      // Remove light mode classes
      this.renderer.removeClass(body, 'light');
      this.renderer.removeClass(body, 'theme-white');
      this.renderer.removeClass(body, 'menu_light');
      this.renderer.removeClass(body, 'logo-white');

      // Update localStorage for compatibility with existing system
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('menuOption', 'menu_dark');
      localStorage.setItem('choose_skin', 'theme-black');
      localStorage.setItem('choose_logoheader', 'logo-black');
    } else {
      // Add light mode classes
      this.renderer.addClass(body, 'light');
      this.renderer.addClass(body, 'theme-white');
      this.renderer.addClass(body, 'menu_light');
      this.renderer.addClass(body, 'logo-white');

      // Remove dark mode classes
      this.renderer.removeClass(body, 'dark');
      this.renderer.removeClass(body, 'theme-black');
      this.renderer.removeClass(body, 'menu_dark');
      this.renderer.removeClass(body, 'logo-black');

      // Update localStorage for compatibility with existing system
      localStorage.setItem('theme', 'light');
      localStorage.setItem('menuOption', 'menu_light');
      localStorage.setItem('choose_skin', 'theme-white');
      localStorage.setItem('choose_logoheader', 'logo-white');
    }
  }
}
