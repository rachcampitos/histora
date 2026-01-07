import { Direction, BidiModule } from '@angular/cdk/bidi';
import { Component, Inject, Renderer2, DOCUMENT, OnInit } from '@angular/core';
import { DirectionService, InConfiguration, ThemeService } from '@core';
import { ConfigService } from '@config';

import { RouterOutlet } from '@angular/router';
import { UnsubscribeOnDestroyAdapter } from '@shared';

@Component({
    selector: 'app-auth-layout',
    templateUrl: './auth-layout.component.html',
    styleUrls: [],
    imports: [BidiModule, RouterOutlet]
})
export class AuthLayoutComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  direction!: Direction;
  public config!: InConfiguration;
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private directoryService: DirectionService,
    private configService: ConfigService,
    private renderer: Renderer2,
    private themeService: ThemeService // Inject to initialize theme on auth pages
  ) {
    super();
    this.config = this.configService.configData;
    this.subs.sink = this.directoryService.currentData.subscribe((currentData) => {
      if (currentData) {
        this.direction = currentData === 'ltr' ? 'ltr' : 'rtl';
      } else {
        if (localStorage.getItem('isRtl')) {
          if (localStorage.getItem('isRtl') === 'true') {
            this.direction = 'rtl';
          } else if (localStorage.getItem('isRtl') === 'false') {
            this.direction = 'ltr';
          }
        } else {
          if (this.config) {
            if (this.config.layout.rtl === true) {
              this.direction = 'rtl';
              localStorage.setItem('isRtl', 'true');
            } else {
              this.direction = 'ltr';
              localStorage.setItem('isRtl', 'false');
            }
          }
        }
      }
    });
    // Theme is now managed by ThemeService - no need for manual setup here
  }

  ngOnInit(): void {
    // Clean up classes from MainLayout that may interfere with auth pages
    this.renderer.removeClass(this.document.body, 'overlay-open');
    this.renderer.removeClass(this.document.body, 'side-closed');
    this.renderer.removeClass(this.document.body, 'submenu-closed');
    this.renderer.removeClass(this.document.body, 'side-closed-hover');
  }
}
