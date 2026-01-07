import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';

import { ChartCard6Component } from './chart-card6.component';

describe('ChartCard6Component', () => {
  let component: ChartCard6Component;
  let fixture: ComponentFixture<ChartCard6Component>;

  const mockChartOptions = {
    series: [{ name: 'Test', data: [10, 20, 30] }],
    chart: { type: 'area', height: 80, sparkline: { enabled: true } },
    stroke: { curve: 'smooth', width: 2 },
    fill: { opacity: 0.3 },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ChartCard6Component,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        importProvidersFrom(FeatherModule.pick(allIcons)),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChartCard6Component);
    component = fixture.componentInstance;
    // Set required input before detecting changes
    component.chartOptions = mockChartOptions;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
