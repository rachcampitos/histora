import {
  Router,
  NavigationEnd,
  RouterLinkActive,
  RouterLink,
} from '@angular/router';
import { NgClass } from '@angular/common';
import {
  Component,
  Inject,
  ElementRef,
  OnInit,
  Renderer2,
  HostListener,
  OnDestroy,
  DOCUMENT
} from '@angular/core';
import { RouteInfo } from './sidebar.metadata';
import { AuthService, Role } from '@core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgScrollbar } from 'ngx-scrollbar';
import { UnsubscribeOnDestroyAdapter } from '@shared';
import { SidebarService } from './sidebar.service';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [
    NgScrollbar,
    RouterLinkActive,
    RouterLink,
    NgClass,
    TranslateModule,
    NgxPermissionsModule,
    MatIconModule,
  ],
})
export class SidebarComponent
  extends UnsubscribeOnDestroyAdapter
  implements OnInit, OnDestroy
{
  public sidebarItems!: RouteInfo[];
  public innerHeight?: number;
  public bodyTag!: HTMLElement;
  listMaxHeight?: string;
  listMaxWidth?: string;
  userFullName?: string;
  userImg?: string;
  userType?: string;
  headerHeight = 60;
  currentRoute?: string;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    public elementRef: ElementRef,
    private authService: AuthService,
    private router: Router,
    private sidebarService: SidebarService,
    private translate: TranslateService
  ) {
    super();
    this.elementRef.nativeElement.closest('body');
    this.subs.sink = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // close sidebar on mobile screen after menu select
        this.renderer.removeClass(this.document.body, 'overlay-open');
      }
    });
  }
  @HostListener('window:resize')
  windowResizecall(): void {
    this.setMenuHeight();
    this.checkStatuForResize(false);
  }
  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.renderer.removeClass(this.document.body, 'overlay-open');
    }
  }

  callToggleMenu(event: Event, length: number) {
    if (length > 0) {
      const parentElement = (event.target as HTMLInputElement).closest('li');
      const activeClass = parentElement?.classList.contains('active');

      if (activeClass) {
        this.renderer.removeClass(parentElement, 'active');
      } else {
        this.renderer.addClass(parentElement, 'active');
      }
    }
  }
  ngOnInit() {
    // Subscribe to user changes to update avatar in real-time
    this.subs.sink = this.authService.user$.subscribe((user) => {
      if (user && Object.keys(user).length > 0) {
        this.updateUserInfo(user);
      }
    });

    if (this.authService.currentUserValue) {
      this.updateUserInfo(this.authService.currentUserValue);

      this.subs.sink = this.sidebarService
        .getRouteInfo()
        .subscribe((routes: RouteInfo[]) => {
          this.sidebarItems = routes;
        });
    }

    this.initLeftSidebar();
    this.bodyTag = this.document.body;
  }

  private updateUserInfo(currentUser: any): void {
    const userRole = currentUser.roles?.[0]?.name;

    // Build user full name from firstName and lastName if available
    const firstName = currentUser.firstName || '';
    const lastName = currentUser.lastName || '';
    this.userFullName = `${firstName} ${lastName}`.trim() || currentUser.name || 'Usuario';

    // Use avatar URL directly if it's a full URL, otherwise use assets path
    if (currentUser.avatar) {
      this.userImg = currentUser.avatar.startsWith('http')
        ? currentUser.avatar
        : './assets/images/user/' + currentUser.avatar;
    } else {
      this.userImg = undefined;
    }

    // Translate role label
    if (userRole === Role.Admin || userRole === Role.PlatformAdmin || userRole === Role.ClinicOwner) {
      this.userType = this.translate.instant('ROLES.ADMIN');
    } else if (userRole === Role.Patient || userRole === Role.PatientRole) {
      this.userType = this.translate.instant('ROLES.PATIENT');
    } else if (userRole === Role.Doctor || userRole === Role.ClinicDoctor) {
      this.userType = this.translate.instant('ROLES.DOCTOR');
    } else if (userRole === Role.ClinicStaff) {
      this.userType = this.translate.instant('ROLES.STAFF');
    } else {
      this.userType = this.translate.instant('ROLES.USER');
    }
  }
  initLeftSidebar() {
    const _this = this;
    // Set menu height
    _this.setMenuHeight();
    _this.checkStatuForResize(true);
  }
  setMenuHeight() {
    this.innerHeight = window.innerHeight;
    const height = this.innerHeight - this.headerHeight;
    this.listMaxHeight = height + '';
    this.listMaxWidth = '500px';
  }
  isOpen() {
    return this.bodyTag.classList.contains('overlay-open');
  }

  checkStatuForResize(firstTime: boolean) {
    if (window.innerWidth < 1025) {
      this.renderer.addClass(this.document.body, 'ls-closed');
    } else {
      this.renderer.removeClass(this.document.body, 'ls-closed');
    }
  }
  mouseHover() {
    const body = this.elementRef.nativeElement.closest('body');
    if (body.classList.contains('submenu-closed')) {
      this.renderer.addClass(this.document.body, 'side-closed-hover');
      this.renderer.removeClass(this.document.body, 'submenu-closed');
    }
  }
  mouseOut() {
    const body = this.elementRef.nativeElement.closest('body');
    if (body.classList.contains('side-closed-hover')) {
      this.renderer.removeClass(this.document.body, 'side-closed-hover');
      this.renderer.addClass(this.document.body, 'submenu-closed');
    }
  }
  logout() {
    this.subs.sink = this.authService.logout().subscribe((res) => {
      if (res.success) {
        this.router.navigate(['/authentication/signin']);
      }
    });
  }
}
