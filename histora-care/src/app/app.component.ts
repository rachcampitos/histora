// Histora Care - NurseLite v1.0.0
import { Component, OnInit, inject, NgZone } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Platform } from '@ionic/angular';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private platform = inject(Platform);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService); // Initialize theme on app start

  ngOnInit() {
    this.initializeApp();
    this.setupNavigationBlur();
  }

  async initializeApp() {
    await this.platform.ready();

    // Initialize auth service (load stored session)
    await this.authService.initialize();

    // Setup OAuth deep link listener (for mobile Google auth)
    this.authService.setupOAuthListener();
  }

  /**
   * Blur active element before navigation to prevent aria-hidden warnings.
   * This fixes: "Blocked aria-hidden on an element because its descendant retained focus"
   */
  private setupNavigationBlur() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe(() => {
        this.ngZone.runOutsideAngular(() => {
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && typeof activeElement.blur === 'function') {
            activeElement.blur();
          }
        });
      });
  }
}
