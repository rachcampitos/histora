import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { PastAppointmentComponent } from "./past-appointment.component";

describe("PastAppointmentComponent", () => {
  let component: PastAppointmentComponent;
  let fixture: ComponentFixture<PastAppointmentComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
    imports: [PastAppointmentComponent],
}).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PastAppointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
