import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { BehaviorSubject, of } from 'rxjs';

import { DocWelcomeCardComponent } from './doc-welcome-card.component';
import { AuthService } from '@core/service/auth.service';
import { DashboardService } from '@core/service/dashboard.service';

describe('DocWelcomeCardComponent', () => {
  let component: DocWelcomeCardComponent;
  let fixture: ComponentFixture<DocWelcomeCardComponent>;

  const mockUser = {
    _id: 'user1',
    email: 'doctor@test.com',
    role: 'doctor',
    firstName: 'Carlos',
    lastName: 'García',
  };

  const mockAuthService = {
    currentUserValue: mockUser,
    user$: new BehaviorSubject(mockUser),
  };

  const mockDashboardService = {
    getStats: jasmine.createSpy('getStats').and.returnValue(of({
      patientsCount: 10,
      appointmentsCount: 5,
      consultationsCount: 3,
      todayAppointments: 2,
      completedConsultations: 8,
    })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DocWelcomeCardComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        importProvidersFrom(FeatherModule.pick(allIcons)),
        { provide: AuthService, useValue: mockAuthService },
        { provide: DashboardService, useValue: mockDashboardService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocWelcomeCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display doctor name from auth service', () => {
    expect(component.doctorName).toBe('Dr. Carlos García');
  });

  it('should load dashboard stats', () => {
    expect(mockDashboardService.getStats).toHaveBeenCalled();
    expect(component.patientsCount).toBe(10);
    expect(component.appointmentsCount).toBe(5);
    expect(component.consultationsCount).toBe(8);
  });
});
