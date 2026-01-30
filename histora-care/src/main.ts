import { provideZoneChangeDetection } from "@angular/core";
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { register as registerSwiper } from 'swiper/element/bundle';
import * as Sentry from '@sentry/angular';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// Initialize Sentry before Angular bootstraps
Sentry.init({
  dsn: environment.sentryDsn,
  environment: environment.production ? 'production' : 'development',
  // Only send errors in production, reduce noise in dev
  enabled: environment.production,
  // Performance monitoring - sample 20% of transactions
  tracesSampleRate: 0.2,
  // Release tracking (update this with your version)
  release: 'histora-care@1.0.0',
  // Don't send PII by default
  sendDefaultPii: false,
  // Ignore common non-actionable errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    'Loading chunk',
    'ChunkLoadError',
  ],
});

// Register Swiper custom elements (swiper-container, swiper-slide)
registerSwiper();

platformBrowserDynamic().bootstrapModule(AppModule, { applicationProviders: [provideZoneChangeDetection()], })
  .catch(err => console.error(err));

// Call the element loader for Capacitor web plugins (Camera, etc.)
defineCustomElements(window);
