import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';

import { ChartCard4Component } from './chart-card4.component';

// Register Chart.js components
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

describe('ChartCard4Component', () => {
  let component: ChartCard4Component;
  let fixture: ComponentFixture<ChartCard4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ChartCard4Component,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        importProvidersFrom(FeatherModule.pick(allIcons)),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChartCard4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
