import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonSpinner,
  IonList,
  IonListHeader,
  IonSearchbar,
  IonChip,
  IonIcon,
  IonText,
  IonNote,
  IonSegment,
  IonSegmentButton,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  timeOutline,
  personOutline,
  medkitOutline,
  checkmarkCircle,
  closeCircle,
} from 'ionicons/icons';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { AppointmentsService, CreateAppointmentDto } from '../appointments.service';
import { PatientsService } from '../../patients/patients.service';
import { DoctorsService } from '../../doctors/doctors.service';
import { Patient, Doctor } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';

// Duraciones de cita comunes
const APPOINTMENT_DURATIONS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora 30 min' },
  { value: 120, label: '2 horas' },
];

// Motivos de consulta comunes en Perú
const COMMON_REASONS = [
  'Consulta general',
  'Control / Seguimiento',
  'Dolor o malestar',
  'Exámenes de laboratorio',
  'Vacunación',
  'Certificado médico',
  'Segunda opinión',
  'Emergencia',
];

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonSpinner,
    IonList,
    IonListHeader,
    IonSearchbar,
    IonChip,
    IonIcon,
    IonText,
    IonNote,
    IonSegment,
    IonSegmentButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/appointments"></ion-back-button>
        </ion-buttons>
        <ion-title>Nueva Cita</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <!-- Selección de Paciente -->
        <ion-list>
          <ion-list-header>
            <ion-label>
              <ion-icon name="person-outline"></ion-icon>
              Paciente
            </ion-label>
          </ion-list-header>

          @if (!selectedPatient()) {
            <ion-searchbar
              placeholder="Buscar paciente por nombre..."
              [debounce]="300"
              (ionInput)="onPatientSearch($event)"
              class="patient-search"
            ></ion-searchbar>

            @if (isSearchingPatients()) {
              <div class="search-loading">
                <ion-spinner name="crescent"></ion-spinner>
                <span>Buscando...</span>
              </div>
            }

            @if (patientResults().length > 0) {
              <div class="search-results">
                @for (patient of patientResults(); track patient._id) {
                  <ion-item button (click)="selectPatient(patient)">
                    <ion-label>
                      <h2>{{ patient.firstName }} {{ patient.lastName }}</h2>
                      <p>{{ patient.email || patient.phone || 'Sin contacto' }}</p>
                    </ion-label>
                  </ion-item>
                }
              </div>
            }

            @if (patientSearchQuery() && !isSearchingPatients() && patientResults().length === 0) {
              <ion-item>
                <ion-label color="medium">
                  No se encontraron pacientes
                </ion-label>
                <ion-button slot="end" fill="clear" routerLink="/patients/new">
                  Crear nuevo
                </ion-button>
              </ion-item>
            }
          } @else {
            <ion-item>
              <ion-chip color="primary" class="selected-patient">
                <ion-icon name="person-outline"></ion-icon>
                <ion-label>{{ selectedPatient()!.firstName }} {{ selectedPatient()!.lastName }}</ion-label>
              </ion-chip>
              <ion-button slot="end" fill="clear" color="medium" (click)="clearPatient()">
                <ion-icon name="close-circle"></ion-icon>
              </ion-button>
            </ion-item>
          }

          @if (form.get('patientId')?.touched && form.get('patientId')?.errors?.['required']) {
            <ion-text color="danger" class="error-text">
              Debe seleccionar un paciente
            </ion-text>
          }
        </ion-list>

        <!-- Selección de Doctor -->
        <ion-list>
          <ion-list-header>
            <ion-label>
              <ion-icon name="medkit-outline"></ion-icon>
              Doctor
            </ion-label>
          </ion-list-header>

          @if (isLoadingDoctors()) {
            <ion-item>
              <ion-spinner name="crescent"></ion-spinner>
              <ion-label>Cargando doctores...</ion-label>
            </ion-item>
          } @else if (doctors().length === 0) {
            <ion-item>
              <ion-label color="medium">
                No hay doctores disponibles
              </ion-label>
            </ion-item>
          } @else if (doctors().length === 1) {
            <ion-item>
              <ion-label>
                <h2>{{ doctors()[0].firstName }} {{ doctors()[0].lastName }}</h2>
                <p>{{ doctors()[0].specialty }}</p>
              </ion-label>
              <ion-icon name="checkmark-circle" color="success" slot="end"></ion-icon>
            </ion-item>
          } @else {
            <ion-item>
              <ion-select
                formControlName="doctorId"
                label="Seleccionar Doctor"
                labelPlacement="floating"
                interface="action-sheet"
                [interfaceOptions]="{ header: 'Seleccionar Doctor' }"
              >
                @for (doctor of doctors(); track doctor._id) {
                  <ion-select-option [value]="doctor._id">
                    {{ doctor.firstName }} {{ doctor.lastName }} - {{ doctor.specialty }}
                  </ion-select-option>
                }
              </ion-select>
            </ion-item>
          }
        </ion-list>

        <!-- Fecha y Hora -->
        <ion-list>
          <ion-list-header>
            <ion-label>
              <ion-icon name="calendar-outline"></ion-icon>
              Fecha y Hora
            </ion-label>
          </ion-list-header>

          <ion-item>
            <ion-input
              formControlName="scheduledDate"
              type="date"
              label="Fecha de la cita *"
              labelPlacement="floating"
              [min]="minDate"
              (ionChange)="onDateChange()"
            ></ion-input>
          </ion-item>

          @if (form.get('scheduledDate')?.touched && form.get('scheduledDate')?.errors?.['required']) {
            <ion-text color="danger" class="error-text">
              Debe seleccionar una fecha
            </ion-text>
          }

          <ion-item>
            <ion-select
              formControlName="duration"
              label="Duración"
              labelPlacement="floating"
              interface="action-sheet"
              [interfaceOptions]="{ header: 'Duración de la cita' }"
            >
              @for (duration of durations; track duration.value) {
                <ion-select-option [value]="duration.value">
                  {{ duration.label }}
                </ion-select-option>
              }
            </ion-select>
          </ion-item>

          @if (isLoadingSlots()) {
            <ion-item>
              <ion-spinner name="crescent"></ion-spinner>
              <ion-label>Buscando horarios disponibles...</ion-label>
            </ion-item>
          } @else if (availableSlots().length > 0) {
            <div class="time-slots">
              <ion-note class="slots-label">Horarios disponibles:</ion-note>
              <div class="slots-grid">
                @for (slot of availableSlots(); track slot.startTime) {
                  <ion-chip
                    [color]="form.get('startTime')?.value === slot.startTime ? 'primary' : 'medium'"
                    [outline]="form.get('startTime')?.value !== slot.startTime"
                    (click)="selectTimeSlot(slot)"
                  >
                    <ion-icon name="time-outline"></ion-icon>
                    <ion-label>{{ slot.startTime }}</ion-label>
                  </ion-chip>
                }
              </div>
            </div>
          } @else if (form.get('scheduledDate')?.value && form.get('doctorId')?.value) {
            <ion-item>
              <ion-label color="warning">
                No hay horarios disponibles para esta fecha
              </ion-label>
            </ion-item>
          }

          @if (form.get('startTime')?.touched && form.get('startTime')?.errors?.['required']) {
            <ion-text color="danger" class="error-text">
              Debe seleccionar un horario
            </ion-text>
          }

          @if (selectedTimeSlot()) {
            <ion-item lines="none" class="selected-time">
              <ion-label>
                <ion-text color="primary">
                  <strong>Horario seleccionado:</strong> {{ selectedTimeSlot()!.startTime }} - {{ selectedTimeSlot()!.endTime }}
                </ion-text>
              </ion-label>
            </ion-item>
          }
        </ion-list>

        <!-- Motivo de la cita -->
        <ion-list>
          <ion-list-header>
            <ion-label>Motivo de la Consulta</ion-label>
          </ion-list-header>

          <div class="quick-reasons">
            @for (reason of commonReasons; track reason) {
              <ion-chip
                [color]="form.get('reasonForVisit')?.value === reason ? 'primary' : 'light'"
                [outline]="form.get('reasonForVisit')?.value !== reason"
                (click)="selectReason(reason)"
              >
                {{ reason }}
              </ion-chip>
            }
          </div>

          <ion-item>
            <ion-textarea
              formControlName="reasonForVisit"
              label="Descripción del motivo"
              labelPlacement="floating"
              placeholder="Describa brevemente el motivo de la consulta"
              [autoGrow]="true"
              [rows]="2"
            ></ion-textarea>
          </ion-item>
        </ion-list>

        <!-- Notas adicionales -->
        <ion-list>
          <ion-list-header>
            <ion-label>Notas Adicionales</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-textarea
              formControlName="notes"
              label="Notas (opcional)"
              labelPlacement="floating"
              placeholder="Información adicional relevante"
              [autoGrow]="true"
              [rows]="2"
            ></ion-textarea>
          </ion-item>
        </ion-list>

        <!-- Resumen -->
        @if (canShowSummary()) {
          <ion-list>
            <ion-list-header>
              <ion-label color="success">Resumen de la Cita</ion-label>
            </ion-list-header>
            <ion-item>
              <ion-label>
                <p><strong>Paciente:</strong> {{ selectedPatient()?.firstName }} {{ selectedPatient()?.lastName }}</p>
                <p><strong>Doctor:</strong> {{ selectedDoctor()?.firstName }} {{ selectedDoctor()?.lastName }}</p>
                <p><strong>Fecha:</strong> {{ form.get('scheduledDate')?.value | date:'fullDate':'':'es-PE' }}</p>
                <p><strong>Hora:</strong> {{ selectedTimeSlot()?.startTime }} - {{ selectedTimeSlot()?.endTime }}</p>
                @if (form.get('reasonForVisit')?.value) {
                  <p><strong>Motivo:</strong> {{ form.get('reasonForVisit')?.value }}</p>
                }
              </ion-label>
            </ion-item>
          </ion-list>
        }

        <!-- Botón de envío -->
        <div class="form-actions">
          <ion-button
            type="submit"
            expand="block"
            [disabled]="form.invalid || isSubmitting()"
          >
            @if (isSubmitting()) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              Agendar Cita
            }
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    ion-list-header ion-icon {
      margin-right: 8px;
    }

    .patient-search {
      --background: var(--ion-color-light);
      --border-radius: 8px;
      margin: 8px 0;
    }

    .search-loading {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      color: var(--ion-color-medium);
    }

    .search-results {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid var(--ion-color-light);
      border-radius: 8px;
      margin: 8px 0;
    }

    .selected-patient {
      --padding-start: 12px;
      --padding-end: 12px;
    }

    .error-text {
      display: block;
      font-size: 12px;
      padding: 4px 16px;
      margin-bottom: 8px;
    }

    .time-slots {
      padding: 12px 16px;
    }

    .slots-label {
      display: block;
      margin-bottom: 12px;
      font-size: 14px;
    }

    .slots-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .slots-grid ion-chip {
      cursor: pointer;
    }

    .selected-time {
      --background: var(--ion-color-primary-tint);
      margin: 8px 0;
      border-radius: 8px;
    }

    .quick-reasons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 16px;
    }

    .quick-reasons ion-chip {
      cursor: pointer;
      font-size: 13px;
    }

    .form-actions {
      padding: 24px 0;
    }

    ion-button {
      --border-radius: 8px;
    }
  `],
})
export class AppointmentFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private toastController = inject(ToastController);
  private appointmentsService = inject(AppointmentsService);
  private patientsService = inject(PatientsService);
  private doctorsService = inject(DoctorsService);
  private authService = inject(AuthService);

  form: FormGroup;
  durations = APPOINTMENT_DURATIONS;
  commonReasons = COMMON_REASONS;
  minDate = new Date().toISOString().split('T')[0];

  // State signals
  doctors = signal<Doctor[]>([]);
  isLoadingDoctors = signal(false);
  selectedPatient = signal<Patient | null>(null);
  patientResults = signal<Patient[]>([]);
  isSearchingPatients = signal(false);
  patientSearchQuery = signal('');
  availableSlots = signal<{ startTime: string; endTime: string }[]>([]);
  isLoadingSlots = signal(false);
  selectedTimeSlot = signal<{ startTime: string; endTime: string } | null>(null);
  isSubmitting = signal(false);

  // Computed
  selectedDoctor = computed(() => {
    const doctorId = this.form?.get('doctorId')?.value;
    return this.doctors().find(d => d._id === doctorId) || null;
  });

  canShowSummary = computed(() => {
    return this.selectedPatient() &&
           this.selectedDoctor() &&
           this.form?.get('scheduledDate')?.value &&
           this.selectedTimeSlot();
  });

  private patientSearchSubject = new Subject<string>();

  constructor() {
    addIcons({
      calendarOutline,
      timeOutline,
      personOutline,
      medkitOutline,
      checkmarkCircle,
      closeCircle,
    });

    this.form = this.fb.group({
      patientId: ['', [Validators.required]],
      doctorId: ['', [Validators.required]],
      scheduledDate: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      endTime: [''],
      duration: [30],
      reasonForVisit: [''],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadDoctors();
    this.setupPatientSearch();
    this.setDefaultDate();
  }

  private loadDoctors(): void {
    this.isLoadingDoctors.set(true);
    this.doctorsService.getClinicDoctors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (doctors) => {
          this.doctors.set(doctors);
          this.isLoadingDoctors.set(false);

          // Si solo hay un doctor, seleccionarlo automáticamente
          if (doctors.length === 1) {
            this.form.patchValue({ doctorId: doctors[0]._id });
          }

          // Si el usuario actual es doctor, seleccionarlo
          const currentUser = this.authService.user();
          if (currentUser?.doctorProfileId) {
            const userDoctor = doctors.find(d => d._id === currentUser.doctorProfileId);
            if (userDoctor) {
              this.form.patchValue({ doctorId: userDoctor._id });
            }
          }
        },
        error: () => {
          this.isLoadingDoctors.set(false);
        }
      });
  }

  private setupPatientSearch(): void {
    this.patientSearchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((query) => {
        this.patientSearchQuery.set(query);
        if (query.length >= 2) {
          this.searchPatients(query);
        } else {
          this.patientResults.set([]);
        }
      });
  }

  private setDefaultDate(): void {
    const today = new Date().toISOString().split('T')[0];
    this.form.patchValue({ scheduledDate: today });
  }

  onPatientSearch(event: CustomEvent): void {
    const query = event.detail.value?.trim() || '';
    this.patientSearchSubject.next(query);
  }

  private searchPatients(query: string): void {
    this.isSearchingPatients.set(true);
    this.patientsService.getPatients({ search: query, limit: 10 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.patientResults.set(response.data);
          this.isSearchingPatients.set(false);
        },
        error: () => {
          this.isSearchingPatients.set(false);
        }
      });
  }

  selectPatient(patient: Patient): void {
    this.selectedPatient.set(patient);
    this.form.patchValue({ patientId: patient._id });
    this.patientResults.set([]);
    this.patientSearchQuery.set('');
  }

  clearPatient(): void {
    this.selectedPatient.set(null);
    this.form.patchValue({ patientId: '' });
  }

  onDateChange(): void {
    this.selectedTimeSlot.set(null);
    this.form.patchValue({ startTime: '', endTime: '' });
    this.loadAvailableSlots();
  }

  private loadAvailableSlots(): void {
    const doctorId = this.form.get('doctorId')?.value;
    const date = this.form.get('scheduledDate')?.value;

    if (!doctorId || !date) {
      this.availableSlots.set([]);
      return;
    }

    this.isLoadingSlots.set(true);
    this.appointmentsService.getAvailableSlots(doctorId, date)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (slots) => {
          this.availableSlots.set(slots);
          this.isLoadingSlots.set(false);
        },
        error: () => {
          // Si el endpoint no existe, generar slots por defecto
          this.generateDefaultSlots();
          this.isLoadingSlots.set(false);
        }
      });
  }

  private generateDefaultSlots(): void {
    const slots: { startTime: string; endTime: string }[] = [];
    const duration = this.form.get('duration')?.value || 30;

    // Horario de trabajo típico: 8:00 - 18:00
    for (let hour = 8; hour < 18; hour++) {
      for (let min = 0; min < 60; min += duration) {
        const startHour = hour.toString().padStart(2, '0');
        const startMin = min.toString().padStart(2, '0');
        const startTime = `${startHour}:${startMin}`;

        const endDate = new Date();
        endDate.setHours(hour, min + duration, 0, 0);
        const endHour = endDate.getHours().toString().padStart(2, '0');
        const endMin = endDate.getMinutes().toString().padStart(2, '0');
        const endTime = `${endHour}:${endMin}`;

        if (endDate.getHours() < 19) {
          slots.push({ startTime, endTime });
        }
      }
    }

    this.availableSlots.set(slots);
  }

  selectTimeSlot(slot: { startTime: string; endTime: string }): void {
    this.selectedTimeSlot.set(slot);
    this.form.patchValue({
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
  }

  selectReason(reason: string): void {
    const current = this.form.get('reasonForVisit')?.value;
    if (current === reason) {
      this.form.patchValue({ reasonForVisit: '' });
    } else {
      this.form.patchValue({ reasonForVisit: reason });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.form.value;
    const appointmentData: CreateAppointmentDto = {
      patientId: formValue.patientId,
      doctorId: formValue.doctorId,
      scheduledDate: formValue.scheduledDate,
      startTime: formValue.startTime,
      endTime: formValue.endTime,
      reasonForVisit: formValue.reasonForVisit || undefined,
      notes: formValue.notes || undefined,
    };

    this.appointmentsService.createAppointment(appointmentData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (appointment) => {
          const toast = await this.toastController.create({
            message: 'Cita agendada exitosamente',
            duration: 2000,
            color: 'success',
            position: 'bottom',
          });
          await toast.present();
          this.router.navigate(['/appointments', appointment._id]);
        },
        error: async (error) => {
          this.isSubmitting.set(false);
          const toast = await this.toastController.create({
            message: error.message || 'Error al agendar la cita',
            duration: 3000,
            color: 'danger',
            position: 'bottom',
          });
          await toast.present();
        }
      });
  }
}
