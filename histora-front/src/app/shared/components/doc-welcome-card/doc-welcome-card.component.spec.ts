import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { BehaviorSubject } from 'rxjs';

import { DocWelcomeCardComponent } from './doc-welcome-card.component';
import { AuthService } from '@core/service/auth.service';

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
});
