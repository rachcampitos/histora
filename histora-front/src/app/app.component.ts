import { Component, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Event, Router, NavigationStart, NavigationEnd, RouterModule } from '@angular/router';
import { PageLoaderComponent } from './layout/page-loader/page-loader.component';
import { CommandPaletteService } from './core/service/command-palette.service';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    RouterModule,
    PageLoaderComponent
  ],
  providers: [],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  currentUrl!: string;
  private platformId = inject(PLATFORM_ID);
  private blurHandler: ((event: FocusEvent) => void) | null = null;
  // Inject command palette service to initialize keyboard shortcuts
  private commandPaletteService = inject(CommandPaletteService);

  constructor(public _router: Router) {
    this._router.events.subscribe((routerEvent: Event) => {
      if (routerEvent instanceof NavigationStart) {
        this.currentUrl = routerEvent.url.substring(
          routerEvent.url.lastIndexOf('/') + 1
        );
      }
      if (routerEvent instanceof NavigationEnd) {
        /* empty */
      }
      window.scrollTo(0, 0);
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setupIOSZoomFix();
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.blurHandler) {
      document.removeEventListener('blur', this.blurHandler, true);
    }
  }

  /**
   * Fix for iOS Safari/Chrome auto-zoom on input focus.
   * When an input loses focus, this resets the viewport zoom to 1.
   */
  private setupIOSZoomFix(): void {
    // Only apply on iOS devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (!isIOS) {
      return;
    }

    this.blurHandler = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target && this.isInputElement(target)) {
        // Small delay to allow iOS to process the blur
        setTimeout(() => {
          this.resetViewportZoom();
        }, 100);
      }
    };

    // Use capture phase to catch all blur events
    document.addEventListener('blur', this.blurHandler, true);
  }

  private isInputElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return tagName === 'input' || tagName === 'textarea' || tagName === 'select' ||
      element.getAttribute('contenteditable') === 'true';
  }

  private resetViewportZoom(): void {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      // Temporarily set maximum-scale to force zoom reset
      const originalContent = viewport.getAttribute('content') || '';
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');

      // Restore original viewport after a brief moment
      setTimeout(() => {
        viewport.setAttribute('content', originalContent);
      }, 50);
    }
  }
}
