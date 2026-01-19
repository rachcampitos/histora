import { Component, OnInit, inject, signal } from '@angular/core';
import { Platform } from '@ionic/angular';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

// Splash screen configuration
const SPLASH_CONFIG = {
  logoDisplayDuration: 800,    // Logo centered visible
  repositionDuration: 400,     // Animation to move up
  fadeOutDelay: 200,           // Delay before hiding
  minimumSplashTime: 1300,     // Minimum total time for branding
};

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private platform = inject(Platform);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService); // Initialize theme on app start

  // Splash screen state
  showSplash = signal(true);
  splashExiting = signal(false);

  ngOnInit() {
    this.initializeApp();
  }

  async initializeApp() {
    const startTime = Date.now();

    await this.platform.ready();

    // Initialize auth service (load stored session)
    await this.authService.initialize();

    // Setup OAuth deep link listener (for mobile Google auth)
    this.authService.setupOAuthListener();

    // Calculate remaining time to meet minimum splash duration
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, SPLASH_CONFIG.logoDisplayDuration - elapsed);

    // Wait for minimum logo display time
    await this.delay(remainingTime);

    // Start exit animation
    this.splashExiting.set(true);

    // Wait for animation to complete then hide splash
    await this.delay(SPLASH_CONFIG.repositionDuration + SPLASH_CONFIG.fadeOutDelay);
    this.showSplash.set(false);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
