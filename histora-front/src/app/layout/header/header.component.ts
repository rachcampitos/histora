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
  RightSidebarService,
  Role,
} from '@core';
import { UnsubscribeOnDestroyAdapter } from '@shared';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationListComponent } from '../components/notification-list/notification-list.component';
import { MatMenuModule } from '@angular/material/menu';
import { LanguageListComponent } from '../components/language-list/language-list.component';
import { UserProfileMenuComponent } from '../components/user-profile-menu/user-profile-menu.component';
import { TranslateModule } from '@ngx-translate/core';

interface Notifications {
  message: string;
  time: string;
  userImg?: string;
  actionLabel?: string;
  actionType?: string;
  icon?: string;
  color: string;
  status: string;
}

@Component({
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
  isNavbarCollapsed = true;
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
    private rightSidebarService: RightSidebarService,
    private configService: ConfigService,
    private authService: AuthService,
    private router: Router,
    public languageService: LanguageService
  ) {
    super();
  }

  listLang = [
    { text: 'English', flag: 'assets/images/flags/us.svg', lang: 'en' },
    { text: 'Spanish', flag: 'assets/images/flags/spain.svg', lang: 'es' },
  ];
  notifications: Notifications[] = [
    {
      message: 'Please check your mail',
      time: '14 mins ago',
      icon: 'mail',
      color: 'notification-green',
      status: 'msg-unread',
      actionLabel: 'View',
      actionType: 'view',
    },
    {
      message: 'New Patient Added..',
      time: '22 mins ago',
      userImg: 'assets/images/user/user1.jpg',
      color: 'notification-blue',
      status: 'msg-unread',
    },
    {
      message: 'Your leave is approved!! ',
      time: '3 hours ago',
      icon: 'event_available',
      color: 'notification-orange',
      status: 'msg-read',
    },
    {
      message: 'Lets break for lunch...',
      time: '5 hours ago',
      userImg: 'assets/images/user/user2.jpg',
      color: 'notification-blue',
      status: 'msg-unread',
      actionLabel: 'Reply',
      actionType: 'reply',
    },
    {
      message: 'Patient report generated',
      time: '14 mins ago',
      icon: 'description',
      color: 'notification-green',
      status: 'msg-read',
      actionLabel: 'Download',
      actionType: 'download',
    },
    {
      message: 'Please check your mail',
      time: '22 mins ago',
      icon: 'mail',
      color: 'notification-red',
      status: 'msg-read',
    },
    {
      message: 'Salary credited...',
      time: '3 hours ago',
      userImg: 'assets/images/user/user3.jpg',
      color: 'notification-purple',
      status: 'msg-read',
      actionLabel: 'Important',
      actionType: 'mark-important',
    },
  ];
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

  private updateUserInfo(currentUser: any): void {
    const userRole = currentUser.roles?.[0]?.name;

    // Set user name from current user
    const firstName = currentUser.firstName || '';
    const lastName = currentUser.lastName || '';
    this.userName = `${firstName} ${lastName}`.trim() || currentUser.name || 'Usuario';

    // Use avatar URL directly if it's a full URL, otherwise use assets path
    if (currentUser.avatar) {
      this.userImg = currentUser.avatar.startsWith('http')
        ? currentUser.avatar
        : './assets/images/user/' + currentUser.avatar;
    } else {
      this.userImg = undefined;
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
    this.notifications = this.notifications.map((n) => ({
      ...n,
      status: 'msg-read',
    }));
  }

  onReadAllNotifications() {
    alert('Navigating to notifications page to read all'); // Replace with router if needed
  }

  onRemoveNotification(notification: Notifications) {
    this.notifications = this.notifications.filter((n) => n !== notification);
  }

  onNotificationActionClick(event: {
    notification: Notifications;
    actionType: string;
  }) {
    const { notification, actionType } = event;

    // Handle different action types
    switch (actionType) {
      case 'view':
        console.log('Viewing notification:', notification);
        // Implement view logic
        break;
      case 'profile':
        console.log('Opening profile from notification:', notification);
        // Implement profile navigation
        break;
      case 'reply':
        console.log('Replying to notification:', notification);
        // Implement reply logic
        break;
      case 'download':
        console.log('Downloading from notification:', notification);
        // Implement download logic
        break;
      case 'mark-important':
        console.log('Marking notification as important:', notification);
        // Implement importance marking
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
    localStorage.setItem('lang', item.lang);
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
