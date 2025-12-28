import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/**
 * Custom TitleStrategy that appends the app name to page titles.
 * This improves accessibility and SEO by providing consistent page titles.
 *
 * Example: "Dashboard" becomes "Dashboard | Histora"
 */
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  private readonly appName = 'Histora';

  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot): void {
    const title = this.buildTitle(routerState);

    if (title) {
      this.title.setTitle(`${title} | ${this.appName}`);
    } else {
      this.title.setTitle(this.appName);
    }
  }
}
