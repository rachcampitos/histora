import { Component, OnInit, inject } from '@angular/core';
import { Platform } from '@ionic/angular';
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
  private authService = inject(AuthService);
  private themeService = inject(ThemeService); // Initialize theme on app start

  ngOnInit() {
    this.initializeApp();
  }

  async initializeApp() {
    await this.platform.ready();

    // Initialize auth service (load stored session)
    await this.authService.initialize();

    // Setup OAuth deep link listener (for mobile Google auth)
    this.authService.setupOAuthListener();
  }
}
