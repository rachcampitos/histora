/**
 * Test configuration helpers for Angular TestBed
 */
import { TestBed, TestModuleMetadata } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, Type, Provider } from '@angular/core';
import { of } from 'rxjs';

/**
 * Configure TestBed for service testing with HttpClient
 */
export function configureServiceTestBed(providers: Provider[] = []) {
  return TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      ...providers,
    ],
  });
}

/**
 * Configure TestBed for component testing with Ionic
 */
export async function configureComponentTestBed(
  component: Type<any>,
  config: {
    imports?: any[];
    providers?: Provider[];
    declarations?: any[];
    standalone?: boolean;
  } = {}
) {
  const { IonicModule } = await import('@ionic/angular');
  const isStandalone = config.standalone ?? false;

  const testConfig: TestModuleMetadata = {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: config.providers || [],
  };

  if (isStandalone) {
    testConfig.imports = [component, IonicModule.forRoot(), ...(config.imports || [])];
  } else {
    testConfig.imports = [IonicModule.forRoot(), ...(config.imports || [])];
    testConfig.declarations = [component, ...(config.declarations || [])];
  }

  return TestBed.configureTestingModule(testConfig);
}

/**
 * Create a mock Angular ActivatedRoute with configurable params
 */
export function mockActivatedRoute(params = {}, queryParams = {}) {
  return {
    snapshot: {
      params,
      queryParams,
      paramMap: {
        get: (key: string) => (params as any)[key] || null,
        has: (key: string) => key in params,
        getAll: (key: string) => [(params as any)[key]].filter(Boolean),
        keys: Object.keys(params),
      },
      queryParamMap: {
        get: (key: string) => (queryParams as any)[key] || null,
        has: (key: string) => key in queryParams,
        getAll: (key: string) => [(queryParams as any)[key]].filter(Boolean),
        keys: Object.keys(queryParams),
      },
    },
    params: of(params),
    queryParams: of(queryParams),
  };
}
