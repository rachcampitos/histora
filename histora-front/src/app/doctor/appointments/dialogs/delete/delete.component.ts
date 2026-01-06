import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { Appointment, AppointmentPatient } from '../../appointments.model';
import { AppointmentsApiService } from '../../appointments-api.service';

export interface AppointmentDeleteDialogData {
  appointment: Appointment;
}

@Component({
  selector: 'app-appointment-delete-dialog',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
    TranslateModule,
    DatePipe,
  ],
})
export class AppointmentDeleteDialogComponent {
  isDeleting = false;

  constructor(
    public dialogRef: MatDialogRef<AppointmentDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AppointmentDeleteDialogData,
    private appointmentsService: AppointmentsApiService
  ) {}

  get patientName(): string {
    const patient = this.data.appointment.patientId;
    if (typeof patient === 'object') {
      const p = patient as AppointmentPatient;
      return `${p.firstName} ${p.lastName || ''}`.trim();
    }
    return 'Paciente';
  }

  get appointmentDate(): Date {
    return new Date(this.data.appointment.scheduledDate);
  }

  get appointmentTime(): string {
    return `${this.data.appointment.startTime} - ${this.data.appointment.endTime}`;
  }

  confirmDelete(): void {
    if (this.isDeleting || !this.data.appointment._id) {
      return;
    }

    this.isDeleting = true;
    this.appointmentsService.delete(this.data.appointment._id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Error deleting appointment:', error);
        this.isDeleting = false;
      },
    });
  }
}
