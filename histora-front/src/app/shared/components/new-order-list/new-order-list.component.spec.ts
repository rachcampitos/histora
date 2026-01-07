import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';

import { NewOrderListComponent } from './new-order-list.component';

describe('NewOrderListComponent', () => {
  let component: NewOrderListComponent;
  let fixture: ComponentFixture<NewOrderListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NewOrderListComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        importProvidersFrom(FeatherModule.pick(allIcons)),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewOrderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
