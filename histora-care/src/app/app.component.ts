// Histora Care - NurseLite v1.0.0
import { Component, OnInit, OnDestroy, inject, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Platform, ToastController } from '@ionic/angular';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { ChatService } from './core/services/chat.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
  private platform = inject(Platform);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService); // Initialize theme on app start
  private chatService = inject(ChatService);
  private toastController = inject(ToastController);
  private notificationSub?: Subscription;

  ngOnInit() {
    this.initializeApp();
    this.setupNavigationBlur();
  }

  ngOnDestroy() {
    this.notificationSub?.unsubscribe();
  }

  async initializeApp() {
    await this.platform.ready();

    // Initialize auth service (load stored session)
    await this.authService.initialize();

    // Setup OAuth deep link listener (for mobile Google auth)
    this.authService.setupOAuthListener();

    // Connect chat WebSocket if user is authenticated
    if (this.authService.user()) {
      this.initializeChatNotifications();
    }
  }

  private async initializeChatNotifications() {
    await this.chatService.connect();
    this.chatService.fetchUnreadCount();

    this.notificationSub = this.chatService.onRoomNotification().subscribe(async (data) => {
      const toast = await this.toastController.create({
        message: `${data.senderName}: ${data.preview}`,
        duration: 4000,
        position: 'top',
        color: 'primary',
      });
      await toast.present();
    });
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
