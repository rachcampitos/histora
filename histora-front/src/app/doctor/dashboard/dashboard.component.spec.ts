import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { provideNativeDateAdapter } from '@angular/material/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '@core';

import { DashboardComponent } from './dashboard.component';

describe('DoctorDashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  const mockUser = {
    _id: 'user1',
    email: 'doctor@test.com',
    role: 'doctor',
    firstName: 'Test',
    lastName: 'Doctor',
    avatar: '',
  };

  const mockAuthService = {
    currentUserValue: mockUser,
    user$: new BehaviorSubject(mockUser),
  };

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          DashboardComponent,
          NoopAnimationsModule,
          HttpClientTestingModule,
          RouterTestingModule,
          TranslateModule.forRoot(),
        ],
        providers: [
          importProvidersFrom(FeatherModule.pick(allIcons)),
          provideNativeDateAdapter(),
          { provide: AuthService, useValue: mockAuthService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
