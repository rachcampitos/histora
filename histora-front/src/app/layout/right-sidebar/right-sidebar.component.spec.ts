import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { BehaviorSubject } from 'rxjs';
import { RightSidebarComponent } from './right-sidebar.component';
import { ConfigService } from '@config';
import { DirectionService, RightSidebarService } from '@core';

describe('RightSidebarComponent', () => {
  let component: RightSidebarComponent;
  let fixture: ComponentFixture<RightSidebarComponent>;

  const mockConfigService = {
    configData: {
      layout: {
        theme_color: 'white',
      },
    },
  };

  const mockRightSidebarService = {
    sidebarState: new BehaviorSubject<boolean>(false),
    setRightSidebar: jasmine.createSpy('setRightSidebar'),
  };

  const mockDirectionService = {
    updateDirection: jasmine.createSpy('updateDirection'),
  };

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          RightSidebarComponent,
          NoopAnimationsModule,
          HttpClientTestingModule,
          RouterTestingModule,
          TranslateModule.forRoot(),
        ],
        providers: [
          importProvidersFrom(FeatherModule.pick(allIcons)),
          { provide: ConfigService, useValue: mockConfigService },
          { provide: RightSidebarService, useValue: mockRightSidebarService },
          { provide: DirectionService, useValue: mockDirectionService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(RightSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
