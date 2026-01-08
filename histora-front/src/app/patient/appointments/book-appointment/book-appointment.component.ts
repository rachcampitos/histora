import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { FileUploadComponent } from '@shared/components/file-upload/file-upload.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DoctorsService, DoctorProfile } from '../../../doctor/profile/doctors.service';
import { AppointmentsService, TimeSlot } from '@core/service/appointments.service';

@Component({
  standalone: true,
  selector: 'app-book-appointment',
  templateUrl: './book-appointment.component.html',
  styleUrls: ['./book-appointment.component.scss'],
  imports: [
    BreadcrumbComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatButtonToggleModule,
    FileUploadComponent,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslateModule,
  ]
})
export class BookAppointmentComponent implements OnInit, OnDestroy {
  private fb = inject(UntypedFormBuilder);
  private doctorsService = inject(DoctorsService);
  private appointmentsService = inject(AppointmentsService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private router = inject(Router);

  bookingForm: UntypedFormGroup;
  doctors: DoctorProfile[] = [];
  isLoadingDoctors = true;
  isLoadingSlots = false;
  isSubmitting = false;
  availableSlots: TimeSlot[] = [];
  minDate = new Date();

  private subscriptions = new Subscription();

  constructor() {
    this.bookingForm = this.fb.group({
      first: ['', [Validators.required, Validators.pattern('[a-zA-Z]+')]],
      last: [''],
      gender: ['', [Validators.required]],
      mobile: ['', [Validators.required]],
      address: [''],
      email: [
        '',
        [Validators.required, Validators.email, Validators.minLength(5)],
      ],
      dob: ['', [Validators.required]],
      doctor: ['', [Validators.required]],
      doa: ['', [Validators.required]],
      timeSlot: ['', [Validators.required]],
      injury: [''],
      note: [''],
      uploadFile: [''],
    });
  }

  ngOnInit(): void {
    this.loadDoctors();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupFormListeners(): void {
    // Listen to doctor changes
    this.subscriptions.add(
      this.bookingForm.get('doctor')?.valueChanges.subscribe(() => {
        this.loadAvailableSlots();
      })
    );

    // Listen to date changes
    this.subscriptions.add(
      this.bookingForm.get('doa')?.valueChanges.subscribe(() => {
        this.loadAvailableSlots();
      })
    );
  }

  loadDoctors(): void {
    this.isLoadingDoctors = true;
    this.subscriptions.add(
      this.doctorsService.getPublicDoctors().subscribe({
        next: (doctors) => {
          this.doctors = doctors || [];
          this.isLoadingDoctors = false;
        },
        error: (err) => {
          console.error('Error loading doctors:', err);
          this.doctors = [];
          this.isLoadingDoctors = false;
        }
      })
    );
  }

  loadAvailableSlots(): void {
    const doctorId = this.bookingForm.get('doctor')?.value;
    const date = this.bookingForm.get('doa')?.value;

    // Reset slots and timeSlot selection
    this.availableSlots = [];
    this.bookingForm.get('timeSlot')?.setValue('');

    if (!doctorId || !date) {
      return;
    }

    // Format date to YYYY-MM-DD
    const formattedDate = this.formatDate(date);

    this.isLoadingSlots = true;
    this.subscriptions.add(
      this.appointmentsService.getAvailableSlots(doctorId, formattedDate).subscribe({
        next: (slots) => {
          this.availableSlots = slots || [];
          this.isLoadingSlots = false;
        },
        error: (err) => {
          console.error('Error loading available slots:', err);
          this.availableSlots = [];
          this.isLoadingSlots = false;
          this.snackBar.open(
            this.translate.instant('APPOINTMENTS.ERRORS.LOADING_SLOTS_FAILED'),
            this.translate.instant('COMMON.ACTIONS.CLOSE'),
            { duration: 3000 }
          );
        }
      })
    );
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (!this.bookingForm.valid) {
      return;
    }

    const formValue = this.bookingForm.value;
    const selectedSlot = this.availableSlots.find(
      slot => `${slot.startTime}-${slot.endTime}` === formValue.timeSlot
    );

    if (!selectedSlot) {
      this.snackBar.open(
        this.translate.instant('APPOINTMENTS.ERRORS.SELECT_TIME_SLOT'),
        this.translate.instant('COMMON.ACTIONS.CLOSE'),
        { duration: 3000 }
      );
      return;
    }

    this.isSubmitting = true;

    const appointmentData = {
      doctorId: formValue.doctor,
      scheduledDate: this.formatDate(formValue.doa),
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      reasonForVisit: formValue.injury || '',
      notes: formValue.note || '',
    };

    this.subscriptions.add(
      this.appointmentsService.createAppointment(appointmentData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.snackBar.open(
            this.translate.instant('APPOINTMENTS.MESSAGES.APPOINTMENT_CREATED'),
            this.translate.instant('COMMON.ACTIONS.CLOSE'),
            { duration: 3000 }
          );
          this.router.navigate(['/patient/appointments']);
        },
        error: (err) => {
          console.error('Error creating appointment:', err);
          this.isSubmitting = false;
          this.snackBar.open(
            err.error?.message || this.translate.instant('APPOINTMENTS.ERRORS.CREATE_FAILED'),
            this.translate.instant('COMMON.ACTIONS.CLOSE'),
            { duration: 5000 }
          );
        }
      })
    );
  }

  getSlotValue(slot: TimeSlot): string {
    return `${slot.startTime}-${slot.endTime}`;
  }

  get f() {
    return this.bookingForm.controls;
  }
}
