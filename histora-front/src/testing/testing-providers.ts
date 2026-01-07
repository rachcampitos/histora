import { importProvidersFrom } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { NgxPermissionsModule } from 'ngx-permissions';

/**
 * Common imports for component tests
 */
export const testingImports = [
  NoopAnimationsModule,
  HttpClientTestingModule,
  RouterTestingModule,
  TranslateModule.forRoot(),
];

/**
 * Common providers for component tests
 */
export const testingProviders = [
  importProvidersFrom(FeatherModule.pick(allIcons)),
  importProvidersFrom(NgxPermissionsModule.forRoot()),
  provideNativeDateAdapter(),
];

/**
 * Providers for dialog components
 */
export const dialogTestingProviders = [
  ...testingProviders,
  { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
  { provide: MAT_DIALOG_DATA, useValue: {} },
];

/**
 * Creates a mock MatDialogRef with customizable behavior
 */
export function createMockDialogRef(): jasmine.SpyObj<MatDialogRef<unknown>> {
  return jasmine.createSpyObj('MatDialogRef', ['close', 'afterClosed']);
}

/**
 * Creates a mock AuthService
 */
export function createMockAuthService(overrides = {}) {
  return {
    currentUserValue: {
      _id: 'test-user-id',
      email: 'test@example.com',
      role: 'doctor',
      doctorId: 'test-doctor-id',
      patientId: 'test-patient-id',
    },
    ...overrides,
  };
}
