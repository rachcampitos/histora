import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PastAppointmentDeleteComponent } from './delete.component';

describe('PastAppointmentDeleteComponent', () => {
  let component: PastAppointmentDeleteComponent;
  let fixture: ComponentFixture<PastAppointmentDeleteComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [PastAppointmentDeleteComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PastAppointmentDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
