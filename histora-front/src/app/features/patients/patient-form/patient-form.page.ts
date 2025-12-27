import { Component, inject, OnInit, signal, input, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonText,
  IonNote,
  ToastController,
} from '@ionic/angular/standalone';
import { PatientsService } from '../patients.service';
import { Gender, BloodType, DocumentType } from '../../../core/models';
import { PhoneInputComponent } from '../../../shared/components';

// Tipos de documento en Perú
export const DOCUMENT_TYPES = [
  { value: DocumentType.DNI, label: 'DNI (Documento Nacional de Identidad)', pattern: /^\d{8}$/, maxLength: 8 },
  { value: DocumentType.CE, label: 'CE (Carné de Extranjería)', pattern: /^[A-Za-z0-9]{9,12}$/, maxLength: 12 },
  { value: DocumentType.PASSPORT, label: 'Pasaporte', pattern: /^[A-Za-z0-9]{6,15}$/, maxLength: 15 },
];

// Aseguradoras de Perú
export const PERUVIAN_INSURERS = [
  { id: 'rimac', name: 'RIMAC Seguros' },
  { id: 'pacifico', name: 'Pacífico Seguros' },
  { id: 'mapfre', name: 'MAPFRE' },
  { id: 'la_positiva', name: 'La Positiva' },
  { id: 'sanitas', name: 'Sanitas' },
  { id: 'oncosalud', name: 'Oncosalud' },
  { id: 'essalud', name: 'EsSalud' },
  { id: 'sis', name: 'SIS (Seguro Integral de Salud)' },
  { id: 'interseguro', name: 'Interseguro' },
  { id: 'protecta', name: 'Protecta' },
  { id: 'cardif', name: 'BNP Paribas Cardif' },
  { id: 'ohio', name: 'Ohio National' },
  { id: 'insur', name: 'Insur' },
  { id: 'secrex', name: 'Secrex' },
  { id: 'auna', name: 'AUNA Seguros' },
  { id: 'other', name: 'Otra aseguradora' },
  { id: 'none', name: 'Sin seguro' },
];

@Component({
  selector: 'app-patient-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
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
    IonText,
    IonNote,
    PhoneInputComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/patients"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditing() ? 'Editar' : 'Nuevo' }} Paciente</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <ion-list>
          <ion-list-header>
            <ion-label>Información Personal</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-input
              formControlName="firstName"
              label="Nombre *"
              labelPlacement="floating"
              placeholder="Nombre del paciente"
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-input
              formControlName="lastName"
              label="Apellido *"
              labelPlacement="floating"
              placeholder="Apellido del paciente"
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-select
              formControlName="documentType"
              label="Tipo de Documento"
              labelPlacement="floating"
              placeholder="Seleccionar"
              interface="action-sheet"
              [interfaceOptions]="{ header: 'Tipo de Documento' }"
              (ionChange)="onDocumentTypeChange()"
            >
              @for (docType of documentTypes; track docType.value) {
                <ion-select-option [value]="docType.value">{{ docType.label }}</ion-select-option>
              }
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-input
              formControlName="documentNumber"
              label="Número de Documento"
              labelPlacement="floating"
              [placeholder]="documentPlaceholder()"
              [maxlength]="documentMaxLength()"
              (ionInput)="onDocumentNumberInput($event)"
            ></ion-input>
          </ion-item>
          @if (form.get('documentNumber')?.touched && form.get('documentNumber')?.errors) {
            <ion-text color="danger" class="error-text">
              @if (form.get('documentNumber')?.errors?.['invalidFormat']) {
                {{ form.get('documentNumber')?.errors?.['invalidFormat'] }}
              }
            </ion-text>
          }
          @if (form.get('documentType')?.value) {
            <ion-note class="document-hint">
              {{ getDocumentHint() }}
            </ion-note>
          }

          <ion-item>
            <ion-input
              formControlName="email"
              type="email"
              label="Correo Electrónico"
              labelPlacement="floating"
              placeholder="correo@ejemplo.com"
            ></ion-input>
          </ion-item>

          <ion-item lines="none">
            <app-phone-input
              formControlName="phone"
              label="Teléfono"
              placeholder="999 999 999"
              defaultCountry="PE"
            ></app-phone-input>
          </ion-item>

          <ion-item>
            <ion-input
              formControlName="dateOfBirth"
              type="date"
              label="Fecha de Nacimiento"
              labelPlacement="floating"
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-select
              formControlName="gender"
              label="Género"
              labelPlacement="floating"
              placeholder="Seleccionar"
              interface="action-sheet"
              [interfaceOptions]="{ header: 'Seleccionar Género' }"
            >
              <ion-select-option value="male">Masculino</ion-select-option>
              <ion-select-option value="female">Femenino</ion-select-option>
              <ion-select-option value="other">Otro</ion-select-option>
            </ion-select>
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-list-header>
            <ion-label>Información Médica</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-select
              formControlName="bloodType"
              label="Tipo de Sangre"
              labelPlacement="floating"
              placeholder="Seleccionar"
              interface="action-sheet"
              [interfaceOptions]="{ header: 'Seleccionar Tipo de Sangre' }"
            >
              <ion-select-option value="A+">A+</ion-select-option>
              <ion-select-option value="A-">A-</ion-select-option>
              <ion-select-option value="B+">B+</ion-select-option>
              <ion-select-option value="B-">B-</ion-select-option>
              <ion-select-option value="AB+">AB+</ion-select-option>
              <ion-select-option value="AB-">AB-</ion-select-option>
              <ion-select-option value="O+">O+</ion-select-option>
              <ion-select-option value="O-">O-</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-textarea
              formControlName="allergies"
              label="Alergias"
              labelPlacement="floating"
              placeholder="Separar con comas (ej: Penicilina, Aspirina)"
              [autoGrow]="true"
            ></ion-textarea>
          </ion-item>

          <ion-item>
            <ion-textarea
              formControlName="chronicConditions"
              label="Condiciones Crónicas"
              labelPlacement="floating"
              placeholder="Separar con comas (ej: Diabetes, Hipertensión)"
              [autoGrow]="true"
            ></ion-textarea>
          </ion-item>

          <ion-item>
            <ion-textarea
              formControlName="currentMedications"
              label="Medicamentos Actuales"
              labelPlacement="floating"
              placeholder="Separar con comas"
              [autoGrow]="true"
            ></ion-textarea>
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-list-header>
            <ion-label>Seguro Médico</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-select
              formControlName="insuranceProvider"
              label="Aseguradora"
              labelPlacement="floating"
              placeholder="Seleccionar aseguradora"
              interface="action-sheet"
              [interfaceOptions]="{ header: 'Seleccionar Aseguradora' }"
            >
              @for (insurer of insurers; track insurer.id) {
                <ion-select-option [value]="insurer.name">{{ insurer.name }}</ion-select-option>
              }
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-input
              formControlName="insuranceNumber"
              label="Número de Póliza"
              labelPlacement="floating"
              placeholder="Número de póliza"
            ></ion-input>
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-list-header>
            <ion-label>Notas Adicionales</ion-label>
          </ion-list-header>

          <ion-item>
            <ion-textarea
              formControlName="notes"
              label="Notas"
              labelPlacement="floating"
              placeholder="Notas adicionales sobre el paciente"
              [autoGrow]="true"
            ></ion-textarea>
          </ion-item>
        </ion-list>

        <div class="form-actions">
          <ion-button
            type="submit"
            expand="block"
            [disabled]="form.invalid || isSubmitting()"
          >
            @if (isSubmitting()) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              {{ isEditing() ? 'Guardar Cambios' : 'Crear Paciente' }}
            }
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [
    `
      ion-list-header {
        margin-top: 16px;
      }

      .form-actions {
        padding: 24px 0;
      }

      ion-button {
        --border-radius: 8px;
      }

      .error-text {
        display: block;
        font-size: 12px;
        padding: 4px 16px;
        margin-bottom: 8px;
      }

      .document-hint {
        display: block;
        font-size: 12px;
        padding: 4px 16px;
        margin-bottom: 8px;
        color: var(--ion-color-medium);
      }
    `,
  ],
})
export class PatientFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private patientsService = inject(PatientsService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private destroyRef = inject(DestroyRef);

  id = input<string>();
  isEditing = computed(() => !!this.id());
  isSubmitting = signal(false);
  form: FormGroup;
  insurers = PERUVIAN_INSURERS;
  documentTypes = DOCUMENT_TYPES;

  // Computed signals for document validation
  documentPlaceholder = computed(() => {
    const docType = this.form?.get('documentType')?.value;
    switch (docType) {
      case DocumentType.DNI: return '12345678';
      case DocumentType.CE: return 'ABC123456789';
      case DocumentType.PASSPORT: return 'AB1234567';
      default: return 'Número de documento';
    }
  });

  documentMaxLength = computed(() => {
    const docType = this.form?.get('documentType')?.value;
    const config = DOCUMENT_TYPES.find(d => d.value === docType);
    return config?.maxLength || 15;
  });

  constructor() {
    this.form = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      documentType: [''],
      documentNumber: ['', [this.documentNumberValidator.bind(this)]],
      email: ['', [Validators.email]],
      phone: [''],
      dateOfBirth: [''],
      gender: [''],
      bloodType: [''],
      allergies: [''],
      chronicConditions: [''],
      currentMedications: [''],
      insuranceProvider: [''],
      insuranceNumber: [''],
      notes: [''],
    });
  }

  // Custom validator for document number
  private documentNumberValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const docType = this.form?.get('documentType')?.value;
    if (!docType) return null;

    const config = DOCUMENT_TYPES.find(d => d.value === docType);
    if (!config) return null;

    if (!config.pattern.test(value)) {
      switch (docType) {
        case DocumentType.DNI:
          return { invalidFormat: 'El DNI debe tener exactamente 8 dígitos' };
        case DocumentType.CE:
          return { invalidFormat: 'El CE debe tener entre 9 y 12 caracteres alfanuméricos' };
        case DocumentType.PASSPORT:
          return { invalidFormat: 'El pasaporte debe tener entre 6 y 15 caracteres' };
        default:
          return { invalidFormat: 'Formato de documento inválido' };
      }
    }

    return null;
  }

  onDocumentTypeChange(): void {
    // Re-validate document number when type changes
    this.form.get('documentNumber')?.updateValueAndValidity();
  }

  onDocumentNumberInput(event: CustomEvent): void {
    const docType = this.form.get('documentType')?.value;
    let value = event.detail.value || '';

    // For DNI, only allow numbers
    if (docType === DocumentType.DNI) {
      value = value.replace(/\D/g, '');
      this.form.patchValue({ documentNumber: value }, { emitEvent: false });
    }
    // For CE and passport, allow alphanumeric and convert to uppercase
    else if (docType === DocumentType.CE || docType === DocumentType.PASSPORT) {
      value = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      this.form.patchValue({ documentNumber: value }, { emitEvent: false });
    }
  }

  getDocumentHint(): string {
    const docType = this.form.get('documentType')?.value;
    switch (docType) {
      case DocumentType.DNI:
        return 'DNI: 8 dígitos numéricos (ej: 12345678)';
      case DocumentType.CE:
        return 'CE: 9-12 caracteres alfanuméricos (ej: ABC123456789)';
      case DocumentType.PASSPORT:
        return 'Pasaporte: 6-15 caracteres alfanuméricos';
      default:
        return '';
    }
  }

  ngOnInit(): void {
    if (this.isEditing()) {
      this.loadPatient();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    const data = this.prepareFormData();

    const request = this.isEditing()
      ? this.patientsService.updatePatient(this.id()!, data)
      : this.patientsService.createPatient(data);

    request
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (patient) => {
          const toast = await this.toastController.create({
            message: this.isEditing() ? 'Paciente actualizado' : 'Paciente creado',
            duration: 2000,
            color: 'success',
          });
          await toast.present();
          this.router.navigate(['/patients', patient._id]);
        },
        error: () => {
          this.isSubmitting.set(false);
        },
      });
  }

  private loadPatient(): void {
    this.patientsService.getPatient(this.id()!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (patient) => {
          this.form.patchValue({
            ...patient,
            dateOfBirth: patient.dateOfBirth
              ? new Date(patient.dateOfBirth).toISOString().split('T')[0]
              : '',
            allergies: patient.allergies?.join(', ') || '',
            chronicConditions: patient.chronicConditions?.join(', ') || '',
            currentMedications: patient.currentMedications?.join(', ') || '',
          });
        },
      });
  }

  private prepareFormData(): any {
    const value = this.form.value;
    return {
      ...value,
      allergies: value.allergies
        ? value.allergies.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      chronicConditions: value.chronicConditions
        ? value.chronicConditions.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      currentMedications: value.currentMedications
        ? value.currentMedications.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
    };
  }
}
