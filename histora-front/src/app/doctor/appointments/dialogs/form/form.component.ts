import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AsyncPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  Appointment,
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentStatus,
} from '../../appointments.model';
import { AppointmentsApiService } from '../../appointments-api.service';
import { PatientsService } from '../../../patients/patients.service';
import { Patient } from '../../../patients/patients.model';
import { AuthService } from '../../../../core/service/auth.service';
import { Observable, of, debounceTime, switchMap, startWith, map } from 'rxjs';
import { FormControl } from '@angular/forms';

export interface AppointmentFormDialogData {
  appointment?: Appointment;
  action: 'add' | 'edit';
}

@Component({
  selector: 'app-appointment-form-dialog',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    TranslateModule,
    AsyncPipe,
  ],
})
export class AppointmentFormDialogComponent implements OnInit {
  appointmentForm!: FormGroup;
  action: 'add' | 'edit';
  dialogTitle: string;
  isSubmitting = false;
  minDate = new Date();

  // Patient autocomplete
  patientControl = new FormControl('');
  filteredPatients$: Observable<Patient[]> = of([]);
  selectedPatient: Patient | null = null;
  isLoadingPatients = false;

  // Time slots
  timeSlots: string[] = [];

  statusOptions = [
    { value: AppointmentStatus.SCHEDULED, label: 'APPOINTMENTS.STATUS.SCHEDULED' },
    { value: AppointmentStatus.CONFIRMED, label: 'APPOINTMENTS.STATUS.CONFIRMED' },
    { value: AppointmentStatus.COMPLETED, label: 'APPOINTMENTS.STATUS.COMPLETED' },
    { value: AppointmentStatus.CANCELLED, label: 'APPOINTMENTS.STATUS.CANCELLED' },
  ];

  constructor(
    public dialogRef: MatDialogRef<AppointmentFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AppointmentFormDialogData,
    private fb: FormBuilder,
    private appointmentsService: AppointmentsApiService,
    private patientsService: PatientsService,
    private authService: AuthService
  ) {
    this.action = data.action;
    this.dialogTitle =
      this.action === 'add'
        ? 'APPOINTMENTS.NEW_APPOINTMENT'
        : 'APPOINTMENTS.EDIT_APPOINTMENT';
    this.generateTimeSlots();
  }

  ngOnInit(): void {
    this.initForm();
    this.setupPatientAutocomplete();

    if (this.action === 'edit' && this.data.appointment) {
      this.patchFormValues(this.data.appointment);
    }
  }

  initForm(): void {
    this.appointmentForm = this.fb.group({
      patientId: ['', Validators.required],
      scheduledDate: [null, Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      reasonForVisit: [''],
      notes: [''],
      status: [AppointmentStatus.SCHEDULED],
    });
  }

  setupPatientAutocomplete(): void {
    this.filteredPatients$ = this.patientControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((value) => {
        if (typeof value === 'string' && value.length >= 2) {
          this.isLoadingPatients = true;
          return this.patientsService.search(value).pipe(
            map((patients) => {
              this.isLoadingPatients = false;
              return patients;
            })
          );
        }
        this.isLoadingPatients = false;
        return of([]);
      })
    );
  }

  displayPatient(patient: Patient): string {
    return patient ? `${patient.firstName} ${patient.lastName || ''}`.trim() : '';
  }

  onPatientSelected(patient: Patient): void {
    this.selectedPatient = patient;
    this.appointmentForm.patchValue({ patientId: patient._id });
  }

  generateTimeSlots(): void {
    this.timeSlots = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        this.timeSlots.push(time);
      }
    }
  }

  onStartTimeChange(): void {
    const startTime = this.appointmentForm.get('startTime')?.value;
    if (startTime) {
      // Auto-set end time to 30 minutes after start time
      const [hours, mins] = startTime.split(':').map(Number);
      let endHours = hours;
      let endMins = mins + 30;
      if (endMins >= 60) {
        endMins = 0;
        endHours++;
      }
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      this.appointmentForm.patchValue({ endTime });
    }
  }

  patchFormValues(appointment: Appointment): void {
    // Handle populated patient
    if (typeof appointment.patientId === 'object') {
      this.selectedPatient = appointment.patientId as unknown as Patient;
      this.patientControl.setValue(this.displayPatient(this.selectedPatient));
      this.appointmentForm.patchValue({ patientId: appointment.patientId._id });
    } else {
      this.appointmentForm.patchValue({ patientId: appointment.patientId });
    }

    this.appointmentForm.patchValue({
      scheduledDate: appointment.scheduledDate
        ? new Date(appointment.scheduledDate)
        : null,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      reasonForVisit: appointment.reasonForVisit,
      notes: appointment.notes,
      status: appointment.status,
    });
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const formValue = this.appointmentForm.value;

    // Format date to ISO string
    const scheduledDate = formValue.scheduledDate
      ? new Date(formValue.scheduledDate).toISOString().split('T')[0]
      : '';

    if (this.action === 'add') {
      const currentUser = this.authService.currentUserValue;
      const doctorId = (currentUser?.['_id'] as string) || (currentUser?.id as string) || '';
      const createDto: CreateAppointmentDto = {
        patientId: formValue.patientId,
        doctorId,
        scheduledDate,
        startTime: formValue.startTime,
        endTime: formValue.endTime,
        reasonForVisit: formValue.reasonForVisit,
        notes: formValue.notes,
      };

      this.appointmentsService.create(createDto).subscribe({
        next: (result) => {
          this.dialogRef.close(result);
        },
        error: (error) => {
          console.error('Error creating appointment:', error);
          this.isSubmitting = false;
        },
      });
    } else if (this.data.appointment?._id) {
      const updateDto: UpdateAppointmentDto = {
        scheduledDate,
        startTime: formValue.startTime,
        endTime: formValue.endTime,
        reasonForVisit: formValue.reasonForVisit,
        notes: formValue.notes,
        status: formValue.status,
      };

      this.appointmentsService.update(this.data.appointment._id, updateDto).subscribe({
        next: (result) => {
          this.dialogRef.close(result);
        },
        error: (error) => {
          console.error('Error updating appointment:', error);
          this.isSubmitting = false;
        },
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
