import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { APP_ROUTE } from './app.routes';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { ErrorInterceptor } from '@core/interceptor/error.interceptor';
import { AuthInterceptor } from '@core/interceptor/auth.interceptor';
import { DirectionService, LanguageService } from '@core';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxPermissionsModule } from 'ngx-permissions';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { appInitializerProviders } from '@core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(APP_ROUTE),
    provideAnimations(),
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    DirectionService,
    LanguageService,
    provideTranslateService({
      defaultLanguage: 'es',
      fallbackLang: 'es',
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
      }),
    }),
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
    { provide: DateAdapter, useClass: MomentDateAdapter },
    appInitializerProviders,
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'DD/MM/YYYY',
        },
        display: {
          dateInput: 'DD/MM/YYYY',
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
    importProvidersFrom(FeatherModule.pick(allIcons)),
    importProvidersFrom(NgxPermissionsModule.forRoot()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    provideAnimationsAsync(),
  ],
};
