// Histora Care - NurseLite v1.0.0
import { Component, OnInit, OnDestroy, inject, NgZone, DestroyRef, ChangeDetectionStrategy, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private destroyRef = inject(DestroyRef);
  private notificationSub?: Subscription;

  constructor() {
    // Reactively initialize/teardown chat notifications when user logs in/out
    effect(() => {
      const user = this.authService.user();
      if (user && !this.notificationSub) {
        this.initializeChatNotifications();
      } else if (!user && this.notificationSub) {
        this.notificationSub.unsubscribe();
        this.notificationSub = undefined;
        this.chatService.disconnect();
      }
    });
  }

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

    // Chat initialization is handled reactively by the effect in constructor
  }

  private async initializeChatNotifications() {
    await this.chatService.connect();
    this.chatService.fetchUnreadCount();

    this.notificationSub = this.chatService.onRoomNotification().subscribe(async (data) => {
      // Play notification sound
      this.playNotificationSound();

      const toast = await this.toastController.create({
        header: data.senderName,
        message: data.preview,
        duration: 5000,
        position: 'top',
        cssClass: 'chat-notification-toast',
        icon: data.senderAvatar ? undefined : 'chatbubble-ellipses',
        buttons: [
          {
            text: 'Ver',
            handler: () => {
              this.navigateToChat(data.roomId);
            }
          },
          { icon: 'close', role: 'cancel' },
        ],
      });
      await toast.present();
    });
  }

  private async navigateToChat(roomId: string) {
    try {
      const room = await this.chatService.getRoom(roomId);
      const user = this.authService.user();
      if (room.serviceRequestId && user) {
        if (user.role === 'nurse') {
          this.router.navigate(['/nurse/active-service', room.serviceRequestId]);
        } else {
          this.router.navigate(['/patient/tracking', room.serviceRequestId]);
        }
      }
    } catch {
      // Fallback: ignore navigation errors
    }
  }

  private playNotificationSound() {
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      // Short pleasant two-tone notification
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(830, ctx.currentTime);
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);

      oscillator.onended = () => ctx.close();
    } catch {
      // Audio not available, skip silently
    }
  }

  /**
   * Blur active element before navigation to prevent aria-hidden warnings.
   * This fixes: "Blocked aria-hidden on an element because its descendant retained focus"
   */
  private setupNavigationBlur() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef)
      )
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
