import { Component, inject, input, OnInit, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, tap } from 'rxjs/operators';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonSpinner,
  ToastController,
  IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  addCircleOutline,
  trashOutline,
  personOutline,
  medkitOutline,
  documentTextOutline,
  bandageOutline,
  flaskOutline,
  cloudDoneOutline,
  cloudOfflineOutline,
  refreshOutline,
} from 'ionicons/icons';
import { ConsultationsService, CreateConsultationDto } from '../consultations.service';
import { PatientsService } from '../../patients/patients.service';
import { Patient } from '../../../core/models';

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBackButton,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonSpinner,
    IonNote,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/consultations"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ isEditing() ? 'Editar Consulta' : 'Nueva Consulta' }}</ion-title>
        <ion-buttons slot="end">
          <!-- Auto-save status indicator -->
          @if (draftStatus() === 'saving') {
            <ion-chip color="light" class="draft-status">
              <ion-spinner name="dots"></ion-spinner>
            </ion-chip>
          } @else if (draftStatus() === 'saved') {
            <ion-chip color="light" class="draft-status">
              <ion-icon name="cloud-done-outline"></ion-icon>
              <ion-label>Borrador</ion-label>
            </ion-chip>
          }
          <ion-button (click)="saveConsultation()" [disabled]="isSaving() || !form.valid">
            @if (isSaving()) {
              <ion-spinner slot="icon-only" name="crescent"></ion-spinner>
            } @else {
              <ion-icon slot="icon-only" name="save-outline"></ion-icon>
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- Draft restoration banner -->
    @if (hasDraft() && !draftRestored()) {
      <ion-toolbar color="warning" class="draft-banner">
        <ion-label class="ion-padding-start">
          Se encontró un borrador guardado
        </ion-label>
        <ion-buttons slot="end">
          <ion-button fill="solid" color="light" (click)="restoreDraft()">
            <ion-icon slot="start" name="refresh-outline"></ion-icon>
            Restaurar
          </ion-button>
          <ion-button fill="clear" color="light" (click)="discardDraft()">
            Descartar
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    }

    <ion-content class="ion-padding">
      <form [formGroup]="form">
        <!-- Patient Selection -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="person-outline" aria-hidden="true"></ion-icon>
              Paciente
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-select
                  label="Seleccionar paciente"
                  labelPlacement="stacked"
                  formControlName="patientId"
                  interface="action-sheet"
                  placeholder="Buscar paciente..."
                  aria-required="true"
                  [attr.aria-invalid]="form.get('patientId')?.invalid && form.get('patientId')?.touched"
                  aria-describedby="patient-error"
                >
                  @for (patient of patients(); track patient._id) {
                    <ion-select-option [value]="patient._id">
                      {{ patient.firstName }} {{ patient.lastName }}
                    </ion-select-option>
                  }
                </ion-select>
                @if (form.get('patientId')?.invalid && form.get('patientId')?.touched) {
                  <ion-note id="patient-error" color="danger" role="alert">
                    Selecciona un paciente
                  </ion-note>
                }
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Chief Complaint -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="medkit-outline" aria-hidden="true"></ion-icon>
              Motivo de Consulta
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-input
                  label="Motivo principal"
                  labelPlacement="stacked"
                  formControlName="chiefComplaint"
                  placeholder="Ej: Dolor abdominal, fiebre..."
                  aria-required="true"
                  [attr.aria-invalid]="form.get('chiefComplaint')?.invalid && form.get('chiefComplaint')?.touched"
                  aria-describedby="chief-complaint-error"
                ></ion-input>
                @if (form.get('chiefComplaint')?.invalid && form.get('chiefComplaint')?.touched) {
                  <ion-note id="chief-complaint-error" color="danger" role="alert">
                    El motivo de consulta es requerido
                  </ion-note>
                }
              </ion-item>
              <ion-item>
                <ion-textarea
                  label="Historia de la enfermedad actual"
                  labelPlacement="stacked"
                  formControlName="historyOfPresentIllness"
                  placeholder="Describe la evolución de los síntomas..."
                  [autoGrow]="true"
                  [rows]="3"
                ></ion-textarea>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Physical Examination -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="document-text-outline" aria-hidden="true"></ion-icon>
              Examen Físico
            </ion-card-title>
          </ion-card-header>
          <ion-card-content formGroupName="physicalExamination">
            <ion-list lines="none">
              <ion-item>
                <ion-textarea
                  label="Aspecto General"
                  labelPlacement="stacked"
                  formControlName="generalAppearance"
                  placeholder="Estado general del paciente..."
                  [autoGrow]="true"
                ></ion-textarea>
              </ion-item>
              <ion-item>
                <ion-textarea
                  label="Cabeza y Cuello"
                  labelPlacement="stacked"
                  formControlName="head"
                  [autoGrow]="true"
                ></ion-textarea>
              </ion-item>
              <ion-item>
                <ion-textarea
                  label="Tórax y Pulmones"
                  labelPlacement="stacked"
                  formControlName="chest"
                  [autoGrow]="true"
                ></ion-textarea>
              </ion-item>
              <ion-item>
                <ion-textarea
                  label="Corazón"
                  labelPlacement="stacked"
                  formControlName="heart"
                  [autoGrow]="true"
                ></ion-textarea>
              </ion-item>
              <ion-item>
                <ion-textarea
                  label="Abdomen"
                  labelPlacement="stacked"
                  formControlName="abdomen"
                  [autoGrow]="true"
                ></ion-textarea>
              </ion-item>
              <ion-item>
                <ion-textarea
                  label="Extremidades"
                  labelPlacement="stacked"
                  formControlName="extremities"
                  [autoGrow]="true"
                ></ion-textarea>
              </ion-item>
              <ion-item>
                <ion-textarea
                  label="Neurológico"
                  labelPlacement="stacked"
                  formControlName="neurological"
                  [autoGrow]="true"
                ></ion-textarea>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Diagnoses -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="medkit-outline" aria-hidden="true"></ion-icon>
              Diagnósticos
              <ion-button fill="clear" size="small" (click)="addDiagnosis()" aria-label="Agregar diagnóstico">
                <ion-icon slot="icon-only" name="add-circle-outline" aria-hidden="true"></ion-icon>
              </ion-button>
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @if (diagnoses.length === 0) {
              <ion-note>No hay diagnósticos agregados</ion-note>
            }
            <ion-list lines="none" formArrayName="diagnoses">
              @for (diagnosis of diagnoses.controls; track $index; let i = $index) {
                <div class="diagnosis-item" [formGroupName]="i">
                  <ion-item>
                    <ion-select
                      label="Tipo"
                      labelPlacement="stacked"
                      formControlName="type"
                    >
                      <ion-select-option value="primary">Principal</ion-select-option>
                      <ion-select-option value="secondary">Secundario</ion-select-option>
                    </ion-select>
                  </ion-item>
                  <ion-item>
                    <ion-input
                      label="Código CIE-10"
                      labelPlacement="stacked"
                      formControlName="code"
                      placeholder="Ej: J06.9"
                    ></ion-input>
                  </ion-item>
                  <ion-item>
                    <ion-input
                      label="Descripción"
                      labelPlacement="stacked"
                      formControlName="description"
                      placeholder="Descripción del diagnóstico"
                    ></ion-input>
                    <ion-button fill="clear" slot="end" color="danger" (click)="removeDiagnosis(i)" aria-label="Eliminar diagnóstico">
                      <ion-icon slot="icon-only" name="trash-outline" aria-hidden="true"></ion-icon>
                    </ion-button>
                  </ion-item>
                </div>
              }
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Treatment Plan -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="document-text-outline" aria-hidden="true"></ion-icon>
              Plan de Tratamiento
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-textarea
                  label="Plan de tratamiento"
                  labelPlacement="stacked"
                  formControlName="treatmentPlan"
                  placeholder="Indicaciones terapéuticas..."
                  [autoGrow]="true"
                  [rows]="3"
                ></ion-textarea>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Prescriptions -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="bandage-outline" aria-hidden="true"></ion-icon>
              Recetas
              <ion-button fill="clear" size="small" (click)="addPrescription()" aria-label="Agregar receta">
                <ion-icon slot="icon-only" name="add-circle-outline" aria-hidden="true"></ion-icon>
              </ion-button>
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @if (prescriptions.length === 0) {
              <ion-note>No hay recetas agregadas</ion-note>
            }
            <ion-list lines="none" formArrayName="prescriptions">
              @for (rx of prescriptions.controls; track $index; let i = $index) {
                <div class="prescription-item" [formGroupName]="i">
                  <ion-item>
                    <ion-input
                      label="Medicamento"
                      labelPlacement="stacked"
                      formControlName="medication"
                      placeholder="Nombre del medicamento"
                    ></ion-input>
                    <ion-button fill="clear" slot="end" color="danger" (click)="removePrescription(i)" aria-label="Eliminar receta">
                      <ion-icon slot="icon-only" name="trash-outline" aria-hidden="true"></ion-icon>
                    </ion-button>
                  </ion-item>
                  <ion-item>
                    <ion-input
                      label="Dosis"
                      labelPlacement="stacked"
                      formControlName="dosage"
                      placeholder="Ej: 500mg"
                    ></ion-input>
                  </ion-item>
                  <ion-item>
                    <ion-input
                      label="Frecuencia"
                      labelPlacement="stacked"
                      formControlName="frequency"
                      placeholder="Ej: Cada 8 horas"
                    ></ion-input>
                  </ion-item>
                  <ion-item>
                    <ion-input
                      label="Duración"
                      labelPlacement="stacked"
                      formControlName="duration"
                      placeholder="Ej: 7 días"
                    ></ion-input>
                  </ion-item>
                  <ion-item>
                    <ion-textarea
                      label="Instrucciones"
                      labelPlacement="stacked"
                      formControlName="instructions"
                      placeholder="Instrucciones adicionales..."
                    ></ion-textarea>
                  </ion-item>
                </div>
              }
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Ordered Exams -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="flask-outline" aria-hidden="true"></ion-icon>
              Exámenes Solicitados
              <ion-button fill="clear" size="small" (click)="addExam()" aria-label="Agregar examen">
                <ion-icon slot="icon-only" name="add-circle-outline" aria-hidden="true"></ion-icon>
              </ion-button>
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @if (orderedExams.length === 0) {
              <ion-note>No hay exámenes solicitados</ion-note>
            }
            <ion-list lines="none" formArrayName="orderedExams">
              @for (exam of orderedExams.controls; track $index; let i = $index) {
                <div class="exam-item" [formGroupName]="i">
                  <ion-item>
                    <ion-input
                      label="Nombre del examen"
                      labelPlacement="stacked"
                      formControlName="name"
                      placeholder="Ej: Hemograma completo"
                    ></ion-input>
                    <ion-button fill="clear" slot="end" color="danger" (click)="removeExam(i)" aria-label="Eliminar examen">
                      <ion-icon slot="icon-only" name="trash-outline" aria-hidden="true"></ion-icon>
                    </ion-button>
                  </ion-item>
                  <ion-item>
                    <ion-select
                      label="Tipo"
                      labelPlacement="stacked"
                      formControlName="type"
                    >
                      <ion-select-option value="laboratory">Laboratorio</ion-select-option>
                      <ion-select-option value="imaging">Imagen</ion-select-option>
                      <ion-select-option value="procedure">Procedimiento</ion-select-option>
                    </ion-select>
                  </ion-item>
                  <ion-item>
                    <ion-select
                      label="Prioridad"
                      labelPlacement="stacked"
                      formControlName="priority"
                    >
                      <ion-select-option value="routine">Rutina</ion-select-option>
                      <ion-select-option value="urgent">Urgente</ion-select-option>
                    </ion-select>
                  </ion-item>
                  <ion-item>
                    <ion-textarea
                      label="Instrucciones"
                      labelPlacement="stacked"
                      formControlName="instructions"
                      placeholder="Instrucciones para el examen..."
                    ></ion-textarea>
                  </ion-item>
                </div>
              }
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Notes -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Notas Adicionales</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-textarea
                  label="Notas"
                  labelPlacement="stacked"
                  formControlName="notes"
                  placeholder="Observaciones adicionales..."
                  [autoGrow]="true"
                  [rows]="2"
                ></ion-textarea>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Submit Button -->
        <ion-button
          expand="block"
          class="submit-btn"
          (click)="saveConsultation()"
          [disabled]="isSaving() || !form.valid"
          [attr.aria-label]="isEditing() ? 'Actualizar consulta médica' : 'Guardar nueva consulta médica'"
          [attr.aria-busy]="isSaving()"
        >
          @if (isSaving()) {
            <ion-spinner name="crescent" aria-hidden="true"></ion-spinner>
            <span class="visually-hidden">Guardando...</span>
          } @else {
            <ion-icon slot="start" name="save-outline" aria-hidden="true"></ion-icon>
            {{ isEditing() ? 'Actualizar Consulta' : 'Guardar Consulta' }}
          }
        </ion-button>
      </form>
    </ion-content>
  `,
  styles: [`
    ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
    }

    ion-card-title ion-icon {
      color: var(--ion-color-primary);
    }

    ion-card-title ion-button {
      margin-left: auto;
    }

    .diagnosis-item,
    .prescription-item,
    .exam-item {
      background: var(--ion-color-light);
      border-radius: 8px;
      margin-bottom: 12px;
      padding: 8px;
    }

    .submit-btn {
      margin-top: 24px;
      margin-bottom: 24px;
    }

    ion-note {
      display: block;
      padding: 12px;
      text-align: center;
      color: var(--ion-color-medium);
    }

    .draft-status {
      --padding-start: 8px;
      --padding-end: 8px;
      height: 28px;
      font-size: 12px;
    }

    .draft-status ion-spinner {
      width: 16px;
      height: 16px;
    }

    .draft-banner {
      --min-height: 48px;
    }

    .draft-banner ion-label {
      font-size: 14px;
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `],
})
export class ConsultationFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private consultationsService = inject(ConsultationsService);
  private patientsService = inject(PatientsService);
  private toastController = inject(ToastController);

  private readonly DRAFT_KEY_PREFIX = 'consultation-draft-';
  private readonly AUTO_SAVE_DELAY = 30000; // 30 seconds

  consultationId = input<string>();
  isEditing = signal(false);
  isSaving = signal(false);
  patients = signal<Patient[]>([]);

  // Auto-save state
  draftStatus = signal<'idle' | 'saving' | 'saved'>('idle');
  hasDraft = signal(false);
  draftRestored = signal(false);
  private draftData: any = null;

  form: FormGroup = this.fb.group({
    patientId: ['', Validators.required],
    chiefComplaint: ['', Validators.required],
    historyOfPresentIllness: [''],
    physicalExamination: this.fb.group({
      generalAppearance: [''],
      head: [''],
      chest: [''],
      heart: [''],
      abdomen: [''],
      extremities: [''],
      neurological: [''],
    }),
    diagnoses: this.fb.array([]),
    treatmentPlan: [''],
    prescriptions: this.fb.array([]),
    orderedExams: this.fb.array([]),
    notes: [''],
  });

  constructor() {
    addIcons({
      saveOutline,
      addCircleOutline,
      trashOutline,
      personOutline,
      medkitOutline,
      documentTextOutline,
      bandageOutline,
      flaskOutline,
      cloudDoneOutline,
      cloudOfflineOutline,
      refreshOutline,
    });
  }

  ngOnInit(): void {
    this.loadPatients();
    this.checkForDraft();
    this.setupAutoSave();

    if (this.consultationId()) {
      this.isEditing.set(true);
      this.loadConsultation();
    }
  }

  private get draftKey(): string {
    return `${this.DRAFT_KEY_PREFIX}${this.consultationId() || 'new'}`;
  }

  private setupAutoSave(): void {
    this.form.valueChanges
      .pipe(
        debounceTime(this.AUTO_SAVE_DELAY),
        tap(() => this.saveDraft()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private checkForDraft(): void {
    try {
      const savedDraft = localStorage.getItem(this.draftKey);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        const age = Date.now() - new Date(draft.timestamp).getTime();
        // Only show draft if less than 24 hours old
        if (age < 86400000) {
          this.draftData = draft.data;
          this.hasDraft.set(true);
        } else {
          // Clear old draft
          localStorage.removeItem(this.draftKey);
        }
      }
    } catch (e) {
      console.error('Error checking for draft:', e);
    }
  }

  private saveDraft(): void {
    if (this.isSaving()) return;

    this.draftStatus.set('saving');

    try {
      const draftData = {
        timestamp: new Date().toISOString(),
        data: this.form.value,
      };
      localStorage.setItem(this.draftKey, JSON.stringify(draftData));
      this.draftStatus.set('saved');

      // Reset status after 3 seconds
      setTimeout(() => {
        if (this.draftStatus() === 'saved') {
          this.draftStatus.set('idle');
        }
      }, 3000);
    } catch (e) {
      console.error('Error saving draft:', e);
      this.draftStatus.set('idle');
    }
  }

  restoreDraft(): void {
    if (!this.draftData) return;

    try {
      this.form.patchValue({
        patientId: this.draftData.patientId,
        chiefComplaint: this.draftData.chiefComplaint,
        historyOfPresentIllness: this.draftData.historyOfPresentIllness,
        physicalExamination: this.draftData.physicalExamination || {},
        treatmentPlan: this.draftData.treatmentPlan,
        notes: this.draftData.notes,
      });

      // Restore diagnoses
      this.draftData.diagnoses?.forEach((dx: any) => {
        this.diagnoses.push(this.fb.group({
          type: [dx.type],
          code: [dx.code],
          description: [dx.description],
        }));
      });

      // Restore prescriptions
      this.draftData.prescriptions?.forEach((rx: any) => {
        this.prescriptions.push(this.fb.group({
          medication: [rx.medication],
          dosage: [rx.dosage],
          frequency: [rx.frequency],
          duration: [rx.duration],
          instructions: [rx.instructions],
        }));
      });

      // Restore exams
      this.draftData.orderedExams?.forEach((exam: any) => {
        this.orderedExams.push(this.fb.group({
          name: [exam.name],
          type: [exam.type],
          priority: [exam.priority],
          instructions: [exam.instructions],
        }));
      });

      this.draftRestored.set(true);
      this.hasDraft.set(false);
      this.showToast('Borrador restaurado', 'success');
    } catch (e) {
      console.error('Error restoring draft:', e);
      this.showToast('Error al restaurar el borrador', 'danger');
    }
  }

  discardDraft(): void {
    try {
      localStorage.removeItem(this.draftKey);
      this.hasDraft.set(false);
      this.draftData = null;
      this.showToast('Borrador descartado', 'medium');
    } catch (e) {
      console.error('Error discarding draft:', e);
    }
  }

  private clearDraft(): void {
    try {
      localStorage.removeItem(this.draftKey);
    } catch (e) {
      console.error('Error clearing draft:', e);
    }
  }

  get diagnoses(): FormArray {
    return this.form.get('diagnoses') as FormArray;
  }

  get prescriptions(): FormArray {
    return this.form.get('prescriptions') as FormArray;
  }

  get orderedExams(): FormArray {
    return this.form.get('orderedExams') as FormArray;
  }

  addDiagnosis(): void {
    this.diagnoses.push(this.fb.group({
      type: ['primary'],
      code: [''],
      description: ['', Validators.required],
    }));
  }

  removeDiagnosis(index: number): void {
    this.diagnoses.removeAt(index);
  }

  addPrescription(): void {
    this.prescriptions.push(this.fb.group({
      medication: ['', Validators.required],
      dosage: ['', Validators.required],
      frequency: ['', Validators.required],
      duration: ['', Validators.required],
      instructions: [''],
    }));
  }

  removePrescription(index: number): void {
    this.prescriptions.removeAt(index);
  }

  addExam(): void {
    this.orderedExams.push(this.fb.group({
      name: ['', Validators.required],
      type: ['laboratory'],
      priority: ['routine'],
      instructions: [''],
    }));
  }

  removeExam(index: number): void {
    this.orderedExams.removeAt(index);
  }

  saveConsultation(): void {
    if (!this.form.valid) {
      this.showToast('Por favor completa los campos requeridos', 'warning');
      return;
    }

    this.isSaving.set(true);

    const formValue = this.form.value;
    const data: CreateConsultationDto = {
      patientId: formValue.patientId,
      doctorId: 'current-doctor-id', // This should come from auth service
      date: new Date().toISOString(),
      chiefComplaint: formValue.chiefComplaint,
      historyOfPresentIllness: formValue.historyOfPresentIllness,
      physicalExamination: formValue.physicalExamination,
      diagnoses: formValue.diagnoses,
      treatmentPlan: formValue.treatmentPlan,
      prescriptions: formValue.prescriptions,
      orderedExams: formValue.orderedExams,
      notes: formValue.notes,
    };

    const request = this.isEditing()
      ? this.consultationsService.updateConsultation(this.consultationId()!, data)
      : this.consultationsService.createConsultation(data);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (consultation) => {
        this.isSaving.set(false);
        this.clearDraft();
        this.showToast(
          this.isEditing() ? 'Consulta actualizada' : 'Consulta creada',
          'success'
        );
        this.router.navigate(['/consultations', consultation._id]);
      },
      error: () => {
        this.isSaving.set(false);
        this.showToast('Error al guardar la consulta', 'danger');
      },
    });
  }

  private loadPatients(): void {
    this.patientsService.getPatients({ limit: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.patients.set(response.data || []);
        },
      });
  }

  private loadConsultation(): void {
    this.consultationsService.getConsultation(this.consultationId()!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (consultation) => {
        this.form.patchValue({
          patientId: consultation.patientId,
          chiefComplaint: consultation.chiefComplaint,
          historyOfPresentIllness: consultation.historyOfPresentIllness,
          physicalExamination: consultation.physicalExamination || {},
          treatmentPlan: consultation.treatmentPlan,
          notes: consultation.notes,
        });

        // Load diagnoses
        consultation.diagnoses?.forEach(dx => {
          this.diagnoses.push(this.fb.group({
            type: [dx.type],
            code: [dx.code],
            description: [dx.description],
          }));
        });

        // Load prescriptions
        consultation.prescriptions?.forEach(rx => {
          this.prescriptions.push(this.fb.group({
            medication: [rx.medication],
            dosage: [rx.dosage],
            frequency: [rx.frequency],
            duration: [rx.duration],
            instructions: [rx.instructions],
          }));
        });

        // Load exams
        consultation.orderedExams?.forEach(exam => {
          this.orderedExams.push(this.fb.group({
            name: [exam.name],
            type: [exam.type],
            priority: [exam.priority],
            instructions: [exam.instructions],
          }));
        });
      },
    });
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
