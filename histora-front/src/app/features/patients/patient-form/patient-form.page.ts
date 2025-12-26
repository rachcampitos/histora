import { Component, inject, OnInit, signal, input, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  ToastController,
} from '@ionic/angular/standalone';
import { PatientsService } from '../patients.service';
import { Gender, BloodType } from '../../../core/models';

@Component({
  selector: 'app-patient-form',
  standalone: true,
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
            <ion-input
              formControlName="email"
              type="email"
              label="Correo Electrónico"
              labelPlacement="floating"
              placeholder="correo@ejemplo.com"
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-input
              formControlName="phone"
              type="tel"
              label="Teléfono"
              labelPlacement="floating"
              placeholder="+52 555 123 4567"
            ></ion-input>
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
            <ion-input
              formControlName="insuranceProvider"
              label="Aseguradora"
              labelPlacement="floating"
              placeholder="Nombre de la aseguradora"
            ></ion-input>
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
    `,
  ],
})
export class PatientFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private patientsService = inject(PatientsService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  id = input<string>();
  isEditing = computed(() => !!this.id());
  isSubmitting = signal(false);
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
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

    request.subscribe({
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
    this.patientsService.getPatient(this.id()!).subscribe({
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
