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
import { Patient } from '../../patients.model';
import { PatientsService } from '../../patients.service';

export interface PatientDeleteDialogData {
  patient: Patient;
}

@Component({
  selector: 'app-patient-delete-dialog',
  templateUrl: './delete.component.html',
  styleUrls: ['./delete.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
    TranslateModule,
  ],
})
export class PatientDeleteDialogComponent {
  isDeleting = false;

  constructor(
    public dialogRef: MatDialogRef<PatientDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PatientDeleteDialogData,
    private patientsService: PatientsService
  ) {}

  get patientName(): string {
    return `${this.data.patient.firstName} ${this.data.patient.lastName || ''}`.trim();
  }

  confirmDelete(): void {
    if (this.isDeleting || !this.data.patient._id) {
      return;
    }

    this.isDeleting = true;
    this.patientsService.delete(this.data.patient._id).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Error deleting patient:', error);
        this.isDeleting = false;
      },
    });
  }
}
