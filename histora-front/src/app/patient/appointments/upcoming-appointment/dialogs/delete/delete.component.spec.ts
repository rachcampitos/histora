import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UpcomingAppointmentDeleteComponent } from './delete.component';

describe('UpcomingAppointmentDeleteComponent', () => {
  let component: UpcomingAppointmentDeleteComponent;
  let fixture: ComponentFixture<UpcomingAppointmentDeleteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UpcomingAppointmentDeleteComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpcomingAppointmentDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
