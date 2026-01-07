import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { BehaviorSubject, of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { ConfigService } from '@config';
import { AuthService, LanguageService, RightSidebarService, ThemeService } from '@core';
import { NotificationsService } from '@core/service/notifications.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  const mockConfigService = {
    configData: {
      layout: {
        logo: 'assets/logo.png',
        theme_color: 'white',
      },
    },
  };

  const mockAuthService = {
    currentUserValue: {
      _id: 'user1',
      email: 'test@test.com',
      role: 'doctor',
      firstName: 'Test',
      lastName: 'User',
    },
    user$: new BehaviorSubject({
      _id: 'user1',
      email: 'test@test.com',
      role: 'doctor',
      firstName: 'Test',
      lastName: 'User',
    }),
    logout: jasmine.createSpy('logout'),
  };

  const mockLanguageService = {
    languages: [
      { name: 'English', code: 'en', flag: 'en' },
      { name: 'Spanish', code: 'es', flag: 'es' },
    ],
    setLanguage: jasmine.createSpy('setLanguage'),
  };

  const mockRightSidebarService = {
    sidebarState: new BehaviorSubject<boolean>(false),
    setRightSidebar: jasmine.createSpy('setRightSidebar'),
  };

  const mockThemeService = {
    isDark: jasmine.createSpy('isDark').and.returnValue(false),
    isDarkMode: jasmine.createSpy('isDarkMode').and.returnValue(false),
    setDarkMode: jasmine.createSpy('setDarkMode'),
    toggleDarkMode: jasmine.createSpy('toggleDarkMode'),
  };

  const mockNotificationsService = {
    getUnread: jasmine.createSpy('getUnread').and.returnValue(of({ data: [], total: 0 })),
    getNotifications: jasmine.createSpy('getNotifications').and.returnValue(of({ data: [], total: 0 })),
    markAsRead: jasmine.createSpy('markAsRead').and.returnValue(of({})),
    markAllAsRead: jasmine.createSpy('markAllAsRead').and.returnValue(of({})),
    startPolling: jasmine.createSpy('startPolling').and.returnValue(of([])),
  };

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          HeaderComponent,
          NoopAnimationsModule,
          HttpClientTestingModule,
          RouterTestingModule,
          TranslateModule.forRoot(),
        ],
        providers: [
          importProvidersFrom(FeatherModule.pick(allIcons)),
          { provide: ConfigService, useValue: mockConfigService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: LanguageService, useValue: mockLanguageService },
          { provide: RightSidebarService, useValue: mockRightSidebarService },
          { provide: ThemeService, useValue: mockThemeService },
          { provide: NotificationsService, useValue: mockNotificationsService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
