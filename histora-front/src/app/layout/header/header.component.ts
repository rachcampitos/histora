import { MatToolbarModule } from '@angular/material/toolbar';
import { NgClass } from '@angular/common';
import {
  Component,
  Inject,
  ElementRef,
  OnInit,
  Renderer2,
  DOCUMENT,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ConfigService } from '@config';
import {
  AuthService,
  InConfiguration,
  LanguageService,
  Role,
  ThemeService,
} from '@core';
import { UnsubscribeOnDestroyAdapter } from '@shared';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationListComponent, Notifications } from '../components/notification-list/notification-list.component';
import { MatMenuModule } from '@angular/material/menu';
import { LanguageListComponent } from '../components/language-list/language-list.component';
import { UserProfileMenuComponent } from '../components/user-profile-menu/user-profile-menu.component';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsService } from '@core/service/notifications.service';

@Component({
  standalone: true,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    RouterLink,
    NgClass,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    NotificationListComponent,
    MatMenuModule,
    LanguageListComponent,
    UserProfileMenuComponent,
    TranslateModule,
  ],
})
export class HeaderComponent
  extends UnsubscribeOnDestroyAdapter
  implements OnInit
{
  public config!: InConfiguration;
  userImg?: string;
  userName?: string;
  homePage?: string;
  flagvalue: string | string[] | undefined;
  countryName: string | string[] = [];
  langStoreValue?: string;
  defaultFlag?: string;
  isOpenSidebar?: boolean;
  docElement?: HTMLElement;
  isFullScreen = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    public elementRef: ElementRef,
    private configService: ConfigService,
    private authService: AuthService,
    private router: Router,
    public languageService: LanguageService,
    private notificationsService: NotificationsService,
    public themeService: ThemeService
  ) {
    super();
  }

  listLang = [
    { text: 'Español', flag: 'assets/images/flags/spain.svg', lang: 'es' },
    { text: 'English', flag: 'assets/images/flags/us.svg', lang: 'en' },
  ];
  notifications: Notifications[] = [];
  ngOnInit() {
    this.config = this.configService.configData;
    this.docElement = document.documentElement;

    // Subscribe to user changes to update avatar in real-time
    this.subs.sink = this.authService.user$.subscribe((user) => {
      if (user && Object.keys(user).length > 0) {
        this.updateUserInfo(user);
      }
    });

    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.updateUserInfo(currentUser);
      // Load notifications for authenticated users
      this.loadNotifications();
      // Start polling for new notifications
      this.subs.sink = this.notificationsService.startPolling(30000).subscribe();
    }

    this.langStoreValue = localStorage.getItem('lang') as string;
    const val = this.listLang.filter((x) => x.lang === this.langStoreValue);
    this.countryName = val.map((element) => element.text);
    if (val.length === 0) {
      if (this.flagvalue === undefined) {
        this.defaultFlag = 'assets/images/flags/us.svg';
      }
    } else {
      this.flagvalue = val.map((element) => element.flag);
    }
  }

  private loadNotifications(): void {
    this.subs.sink = this.notificationsService.getNotifications({ limit: 10 }).subscribe({
      next: (response) => {
        this.notifications = response.data.map(n => this.notificationsService.toUiNotification(n));
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
      }
    });
  }

  private updateUserInfo(currentUser: any): void {
    const userRole = currentUser.roles?.[0]?.name;

    // Set user name from current user
    const firstName = currentUser.firstName || '';
    const lastName = currentUser.lastName || '';
    this.userName = `${firstName} ${lastName}`.trim() || currentUser.name || 'Usuario';

    // Use avatar URL directly if it's a full URL, otherwise use assets path
    // Note: 'user.jpg' doesn't exist, so we fall back to role-based defaults
    if (currentUser.avatar && currentUser.avatar !== 'user.jpg') {
      this.userImg = currentUser.avatar.startsWith('http')
        ? currentUser.avatar
        : './assets/images/user/' + currentUser.avatar;
    } else {
      // Set default avatar based on role
      if (userRole === Role.PlatformAdmin || userRole === Role.PlatformAdminUI || userRole === Role.Admin || userRole === Role.ClinicOwner) {
        this.userImg = './assets/images/user/admin.jpg';
      } else if (userRole === Role.Doctor || userRole === Role.ClinicDoctor) {
        this.userImg = './assets/images/user/doctor.jpg';
      } else if (userRole === Role.Patient) {
        this.userImg = './assets/images/user/patient.jpg';
      } else {
        this.userImg = './assets/images/user/new.jpg';
      }
    }

    if (userRole === Role.PlatformAdmin || userRole === Role.PlatformAdminUI) {
      this.homePage = 'admin/dashboard';
    } else if (userRole === Role.Patient) {
      this.homePage = 'patient/dashboard';
    } else if (userRole === Role.Doctor || userRole === Role.Admin) {
      this.homePage = 'doctor/dashboard';
    } else {
      this.homePage = 'doctor/dashboard';
    }
  }

  onMarkAllNotificationsRead() {
    this.subs.sink = this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => ({
          ...n,
          status: 'msg-read',
        }));
      },
      error: (err) => {
        console.error('Error marking all as read:', err);
      }
    });
  }

  onReadAllNotifications() {
    // Navigate to a notifications page or reload all
    this.loadNotifications();
  }

  onRemoveNotification(notification: Notifications) {
    // Mark as read when removing
    if (notification.id) {
      this.subs.sink = this.notificationsService.markAsRead(notification.id).subscribe();
    }
    this.notifications = this.notifications.filter((n) => n !== notification);
  }

  onNotificationActionClick(event: {
    notification: Notifications;
    actionType: string;
  }) {
    const { notification, actionType } = event;
    const currentUser = this.authService.currentUserValue;
    const userRole = currentUser?.roles?.[0]?.name;

    // Mark as read when action is clicked
    if (notification.id) {
      this.subs.sink = this.notificationsService.markAsRead(notification.id).subscribe();
    }

    // Handle different action types
    switch (actionType) {
      case 'view-appointment':
        const appointmentId = (notification as any).data?.appointmentId;
        if (appointmentId) {
          if (userRole === Role.Doctor || userRole === Role.Admin) {
            this.router.navigate(['/doctor/appointments', appointmentId]);
          } else if (userRole === Role.Patient) {
            this.router.navigate(['/patient/appointments', appointmentId]);
          }
        }
        break;
      case 'view-review':
        // Navigate to reviews page
        if (userRole === Role.Doctor || userRole === Role.Admin) {
          this.router.navigate(['/doctor/reviews']);
        }
        break;
      case 'view-user':
        // Navigate to admin users page (for admin notifications)
        if (userRole === Role.PlatformAdmin || userRole === Role.PlatformAdminUI) {
          this.router.navigate(['/admin/users']);
        }
        break;
      default:
        console.log('Default action for notification:', notification);
    }
  }

  callFullscreen() {
    if (!this.isFullScreen) {
      if (this.docElement?.requestFullscreen != null) {
        this.docElement?.requestFullscreen();
      }
    } else {
      document.exitFullscreen();
    }
    this.isFullScreen = !this.isFullScreen;
  }
  setLanguage(text: string, lang: string, flag: string) {
    this.countryName = text;
    this.flagvalue = flag;
    this.langStoreValue = lang;
    this.languageService.setLanguage(lang);
  }
  mobileMenuSidebarOpen(event: Event, className: string) {
    const hasClass = (event.target as HTMLInputElement).classList.contains(
      className
    );
    if (hasClass) {
      this.renderer.removeClass(this.document.body, className);
    } else {
      this.renderer.addClass(this.document.body, className);
    }
  }
  callSidemenuCollapse() {
    const hasClass = this.document.body.classList.contains('side-closed');
    if (hasClass) {
      this.renderer.removeClass(this.document.body, 'side-closed');
      this.renderer.removeClass(this.document.body, 'submenu-closed');
      localStorage.setItem('collapsed_menu', 'false');
    } else {
      this.renderer.addClass(this.document.body, 'side-closed');
      this.renderer.addClass(this.document.body, 'submenu-closed');
      localStorage.setItem('collapsed_menu', 'true');
    }
  }
  logout() {
    this.subs.sink = this.authService.logout().subscribe((res) => {
      if (res.success) {
        this.router.navigate(['/authentication/signin']);
      }
    });
  }

  onLanguageChange(item: { text: string; flag: string; lang: string }) {
    this.countryName = item.text;
    this.flagvalue = item.flag;
    this.langStoreValue = item.lang;
    this.languageService.setLanguage(item.lang);
  }

  onAccountClicked() {
    this.router.navigate(['/extra-pages/profile']);
  }

  onInboxClicked() {
    this.router.navigate(['/email/inbox']);
  }

  onSettingsClicked() {
    const currentUser = this.authService.currentUserValue;
    const userRole = currentUser.roles?.[0]?.name;

    if (userRole === Role.PlatformAdmin || userRole === Role.PlatformAdminUI) {
      this.router.navigate(['/admin/settings']);
    } else if (userRole === Role.Patient) {
      this.router.navigate(['/patient/settings']);
    } else {
      this.router.navigate(['/doctor/settings']);
    }
  }
}
