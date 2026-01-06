import { UpcomingAppointment } from './../../upcoming-appointment.model';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import { UpcomingAppointmentService } from '../../upcoming-appointment.service';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

export interface DialogData {
  id: number;
  doctor: string;
  date: string;
  location: string;
}

@Component({
    selector: 'app-upcomming-appointment-delete',
    templateUrl: './delete.component.html',
    styleUrls: ['./delete.component.scss'],
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatButtonModule,
        MatDialogClose,
        TranslateModule,
    ]
})
export class UpcomingAppointmentDeleteComponent {
  constructor(
    public dialogRef: MatDialogRef<UpcomingAppointmentDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public appointmentService: UpcomingAppointmentService
  ) {}
  confirmDelete(): void {
    this.appointmentService.deleteUpcomingAppointment(this.data.id).subscribe({
      next: (response) => {
        // console.log('Delete Response:', response);
        this.dialogRef.close(response); // Close with the response data
        // Handle successful deletion, e.g., refresh the table or show a notification
      },
      error: (error) => {
        console.error('Delete Error:', error);
        // Handle the error appropriately
      },
    });
  }
}
