import { provideZoneChangeDetection } from "@angular/core";
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { register as registerSwiper } from 'swiper/element/bundle';

import { AppModule } from './app/app.module';

// Register Swiper custom elements (swiper-container, swiper-slide)
registerSwiper();

platformBrowserDynamic().bootstrapModule(AppModule, { applicationProviders: [provideZoneChangeDetection()], })
  .catch(err => console.error(err));

// Call the element loader for Capacitor web plugins (Camera, etc.)
defineCustomElements(window);
