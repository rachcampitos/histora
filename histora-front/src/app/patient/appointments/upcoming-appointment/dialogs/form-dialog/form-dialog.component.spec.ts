import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { TranslateModule } from "@ngx-translate/core";

import { UpcommingAppointmentFormComponent } from "./form-dialog.component";
import { UpcomingAppointment } from "../../upcoming-appointment.model";

describe("UpcommingAppointmentFormComponent", () => {
  let component: UpcommingAppointmentFormComponent;
  let fixture: ComponentFixture<UpcommingAppointmentFormComponent>;

  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };

  const mockDialogData = {
    action: 'add',
    upcomingAppointment: new UpcomingAppointment({} as UpcomingAppointment)
  };

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [
          UpcommingAppointmentFormComponent,
          NoopAnimationsModule,
          TranslateModule.forRoot(),
        ],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(UpcommingAppointmentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
