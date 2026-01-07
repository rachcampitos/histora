import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { UpcomingAppointmentService } from '../../upcoming-appointment.service';
import {
  UntypedFormControl,
  Validators,
  UntypedFormGroup,
  UntypedFormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { UpcomingAppointment } from '../../upcoming-appointment.model';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { formatDate } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

export interface DialogData {
  id: number;
  action: string;
  upcomingAppointment: UpcomingAppointment;
}

@Component({
  standalone: true,
    selector: 'app-upcoming-appointment-form',
    templateUrl: './form-dialog.component.html',
    styleUrls: ['./form-dialog.component.scss'],
    providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
    imports: [
        MatButtonModule,
        MatIconModule,
        MatDialogContent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatOptionModule,
        MatInputModule,
        MatDatepickerModule,
        MatDialogClose,
        TranslateModule,
    ]
})
export class UpcommingAppointmentFormComponent {
  action: string;
  dialogTitle: string;
  appointmentForm: UntypedFormGroup;
  appointment: UpcomingAppointment;

  constructor(
    public dialogRef: MatDialogRef<UpcommingAppointmentFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public appointmentService: UpcomingAppointmentService,
    private fb: UntypedFormBuilder
  ) {
    this.action = data.action;
    this.dialogTitle =
      this.action === 'edit'
        ? `Edit Appointment for Dr. ${data.upcomingAppointment.doctor}`
        : 'New Appointment';

    this.appointment =
      this.action === 'edit'
        ? data.upcomingAppointment
        : new UpcomingAppointment({} as UpcomingAppointment);

    this.appointmentForm = this.createAppointmentForm();
  }

  // Create form group for appointment details
  createAppointmentForm(): UntypedFormGroup {
    return this.fb.group({
      id: [this.appointment.id],
      doctor: [this.appointment.doctor, [Validators.required]],
      date: [
        formatDate(
          this.appointment.date ? new Date(this.appointment.date) : new Date(),
          'yyyy-MM-dd',
          'en'
        ),
        [Validators.required],
      ],
      time: [this.appointment.time, [Validators.required]],
      injury: [this.appointment.injury],
      location: [this.appointment.location],
      status: [this.appointment.status],
      notes: [this.appointment.notes],
    });
  }

  // Dynamic error message retrieval
  getErrorMessage(controlName: string): string {
    const control = this.appointmentForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    return ''; // Return empty if no errors
  }

  // Submit form data
  submit() {
    if (this.appointmentForm.valid) {
      const appointmentData = this.appointmentForm.getRawValue();
      if (this.action === 'edit') {
        this.appointmentService
          .updateUpcomingAppointment(appointmentData)
          .subscribe({
            next: (response) => {
              this.dialogRef.close(response);
            },
            error: (error) => {
              console.error('Update Error:', error);
              // Optionally show an error message to the user
            },
          });
      } else {
        this.appointmentService
          .addUpcomingAppointment(appointmentData)
          .subscribe({
            next: (response) => {
              this.dialogRef.close(response);
            },
            error: (error) => {
              console.error('Add Error:', error);
              // Optionally show an error message to the user
            },
          });
      }
    }
  }

  // Close dialog without action
  onNoClick(): void {
    this.dialogRef.close();
  }
}
