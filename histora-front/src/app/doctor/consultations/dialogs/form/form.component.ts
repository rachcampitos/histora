import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConsultationsService } from '../../consultations.service';
import {
  Consultation,
  ConsultationStatus,
  DiagnosisType,
  UpdateConsultationDto,
} from '../../consultations.model';

export interface DialogData {
  consultation: Consultation;
}

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatTabsModule,
    MatExpansionModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormDialogComponent implements OnInit {
  consultationForm!: FormGroup;
  consultation: Consultation;
  isLoading = false;
  isSaving = false;
  isReadOnly = false;

  diagnosisTypes = [
    { value: DiagnosisType.PRINCIPAL, label: 'CONSULTATIONS.DIAGNOSIS.PRINCIPAL' },
    { value: DiagnosisType.SECONDARY, label: 'CONSULTATIONS.DIAGNOSIS.SECONDARY' },
    { value: DiagnosisType.DIFFERENTIAL, label: 'CONSULTATIONS.DIAGNOSIS.DIFFERENTIAL' },
  ];

  medicationRoutes = [
    'Oral',
    'Intravenoso (IV)',
    'Intramuscular (IM)',
    'Subcutáneo',
    'Tópico',
    'Inhalado',
    'Sublingual',
    'Rectal',
    'Oftálmico',
    'Ótico',
  ];

  examTypes = [
    'Laboratorio',
    'Imagen',
    'Procedimiento',
    'Otro',
  ];

  constructor(
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private fb: FormBuilder,
    private consultationsService: ConsultationsService,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {
    this.consultation = data.consultation;
    this.isReadOnly = this.consultation.status === ConsultationStatus.COMPLETED;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadConsultationData();
  }

  initForm(): void {
    this.consultationForm = this.fb.group({
      // Motivo de consulta - REQUIRED by MINSA
      chiefComplaint: [
        { value: '', disabled: this.isReadOnly },
        Validators.required,
      ],
      // Enfermedad actual - REQUIRED by MINSA
      historyOfPresentIllness: [
        { value: '', disabled: this.isReadOnly },
        Validators.required,
      ],
      // Antecedentes
      pastMedicalHistory: [{ value: '', disabled: this.isReadOnly }],
      familyHistory: [{ value: '', disabled: this.isReadOnly }],
      socialHistory: [{ value: '', disabled: this.isReadOnly }],
      allergies: [{ value: '', disabled: this.isReadOnly }],
      currentMedications: [{ value: '', disabled: this.isReadOnly }],
      // Examen físico
      physicalExamination: this.fb.group({
        generalAppearance: [{ value: '', disabled: this.isReadOnly }],
        head: [{ value: '', disabled: this.isReadOnly }],
        eyes: [{ value: '', disabled: this.isReadOnly }],
        ears: [{ value: '', disabled: this.isReadOnly }],
        nose: [{ value: '', disabled: this.isReadOnly }],
        throat: [{ value: '', disabled: this.isReadOnly }],
        neck: [{ value: '', disabled: this.isReadOnly }],
        chest: [{ value: '', disabled: this.isReadOnly }],
        lungs: [{ value: '', disabled: this.isReadOnly }],
        heart: [{ value: '', disabled: this.isReadOnly }],
        abdomen: [{ value: '', disabled: this.isReadOnly }],
        extremities: [{ value: '', disabled: this.isReadOnly }],
        skin: [{ value: '', disabled: this.isReadOnly }],
        neurological: [{ value: '', disabled: this.isReadOnly }],
        musculoskeletal: [{ value: '', disabled: this.isReadOnly }],
        other: [{ value: '', disabled: this.isReadOnly }],
      }),
      // Diagnósticos - REQUIRED by MINSA (at least one)
      diagnoses: this.fb.array([], Validators.required),
      // Plan de tratamiento
      treatmentPlan: [{ value: '', disabled: this.isReadOnly }],
      // Recetas
      prescriptions: this.fb.array([]),
      // Exámenes ordenados
      orderedExams: this.fb.array([]),
      // Notas clínicas
      clinicalNotes: [{ value: '', disabled: this.isReadOnly }],
      // Seguimiento
      followUpDate: [{ value: null, disabled: this.isReadOnly }],
      followUpInstructions: [{ value: '', disabled: this.isReadOnly }],
    });
  }

  loadConsultationData(): void {
    if (this.consultation) {
      // Patch basic fields
      this.consultationForm.patchValue({
        chiefComplaint: this.consultation.chiefComplaint,
        historyOfPresentIllness: this.consultation.historyOfPresentIllness,
        pastMedicalHistory: this.consultation.pastMedicalHistory,
        familyHistory: this.consultation.familyHistory,
        socialHistory: this.consultation.socialHistory,
        allergies: this.consultation.allergies,
        currentMedications: this.consultation.currentMedications,
        physicalExamination: this.consultation.physicalExamination || {},
        treatmentPlan: this.consultation.treatmentPlan,
        clinicalNotes: this.consultation.clinicalNotes,
        followUpDate: this.consultation.followUpDate
          ? new Date(this.consultation.followUpDate)
          : null,
        followUpInstructions: this.consultation.followUpInstructions,
      });

      // Load diagnoses
      if (this.consultation.diagnoses?.length) {
        this.consultation.diagnoses.forEach((d) => this.addDiagnosis(d));
      }

      // Load prescriptions
      if (this.consultation.prescriptions?.length) {
        this.consultation.prescriptions.forEach((p) => this.addPrescription(p));
      }

      // Load ordered exams
      if (this.consultation.orderedExams?.length) {
        this.consultation.orderedExams.forEach((e) => this.addOrderedExam(e));
      }
    }
  }

  // Diagnoses FormArray
  get diagnoses(): FormArray {
    return this.consultationForm.get('diagnoses') as FormArray;
  }

  addDiagnosis(data?: any): void {
    const diagnosis = this.fb.group({
      code: [
        { value: data?.code || '', disabled: this.isReadOnly },
        Validators.required,
      ],
      description: [
        { value: data?.description || '', disabled: this.isReadOnly },
        Validators.required,
      ],
      type: [
        { value: data?.type || DiagnosisType.PRINCIPAL, disabled: this.isReadOnly },
      ],
      notes: [{ value: data?.notes || '', disabled: this.isReadOnly }],
    });
    this.diagnoses.push(diagnosis);
  }

  removeDiagnosis(index: number): void {
    this.diagnoses.removeAt(index);
  }

  // Prescriptions FormArray
  get prescriptions(): FormArray {
    return this.consultationForm.get('prescriptions') as FormArray;
  }

  addPrescription(data?: any): void {
    const prescription = this.fb.group({
      medication: [
        { value: data?.medication || '', disabled: this.isReadOnly },
        Validators.required,
      ],
      dosage: [
        { value: data?.dosage || '', disabled: this.isReadOnly },
        Validators.required,
      ],
      frequency: [
        { value: data?.frequency || '', disabled: this.isReadOnly },
        Validators.required,
      ],
      duration: [
        { value: data?.duration || '', disabled: this.isReadOnly },
        Validators.required,
      ],
      route: [{ value: data?.route || 'Oral', disabled: this.isReadOnly }],
      instructions: [{ value: data?.instructions || '', disabled: this.isReadOnly }],
      isControlled: [{ value: data?.isControlled || false, disabled: this.isReadOnly }],
    });
    this.prescriptions.push(prescription);
  }

  removePrescription(index: number): void {
    this.prescriptions.removeAt(index);
  }

  // Ordered Exams FormArray
  get orderedExams(): FormArray {
    return this.consultationForm.get('orderedExams') as FormArray;
  }

  addOrderedExam(data?: any): void {
    const exam = this.fb.group({
      name: [
        { value: data?.name || '', disabled: this.isReadOnly },
        Validators.required,
      ],
      type: [{ value: data?.type || 'Laboratorio', disabled: this.isReadOnly }],
      instructions: [{ value: data?.instructions || '', disabled: this.isReadOnly }],
      isUrgent: [{ value: data?.isUrgent || false, disabled: this.isReadOnly }],
    });
    this.orderedExams.push(exam);
  }

  removeOrderedExam(index: number): void {
    this.orderedExams.removeAt(index);
  }

  getPatientName(): string {
    if (this.consultation.patient) {
      return `${this.consultation.patient.firstName} ${this.consultation.patient.lastName}`;
    }
    return 'Paciente';
  }

  getPatientAge(): number | null {
    if (this.consultation.patient?.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(this.consultation.patient.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age;
    }
    return null;
  }

  saveAndContinue(): void {
    if (this.consultationForm.invalid) {
      this.markAllAsTouched();
      this.showError('CONSULTATIONS.ERRORS.FILL_REQUIRED');
      return;
    }
    this.save(false);
  }

  saveAndComplete(): void {
    // Validate required fields for MINSA compliance
    if (this.consultationForm.invalid) {
      this.markAllAsTouched();
      this.showError('CONSULTATIONS.ERRORS.FILL_REQUIRED');
      return;
    }

    if (this.diagnoses.length === 0) {
      this.showError('CONSULTATIONS.ERRORS.DIAGNOSIS_REQUIRED');
      return;
    }

    this.save(true);
  }

  private save(complete: boolean): void {
    this.isSaving = true;
    const formValue = this.consultationForm.getRawValue();

    const dto: UpdateConsultationDto = {
      chiefComplaint: formValue.chiefComplaint,
      historyOfPresentIllness: formValue.historyOfPresentIllness,
      pastMedicalHistory: formValue.pastMedicalHistory,
      familyHistory: formValue.familyHistory,
      socialHistory: formValue.socialHistory,
      allergies: formValue.allergies,
      currentMedications: formValue.currentMedications,
      physicalExamination: formValue.physicalExamination,
      diagnoses: formValue.diagnoses,
      treatmentPlan: formValue.treatmentPlan,
      prescriptions: formValue.prescriptions,
      orderedExams: formValue.orderedExams,
      clinicalNotes: formValue.clinicalNotes,
      followUpDate: formValue.followUpDate,
      followUpInstructions: formValue.followUpInstructions,
    };

    this.consultationsService.update(this.consultation._id, dto).subscribe({
      next: () => {
        if (complete) {
          this.completeConsultation();
        } else {
          this.isSaving = false;
          this.showSuccess('CONSULTATIONS.SAVED');
        }
      },
      error: (err) => {
        console.error('Error saving consultation:', err);
        this.isSaving = false;
        this.showError('CONSULTATIONS.ERRORS.SAVE_FAILED');
      },
    });
  }

  private completeConsultation(): void {
    const formValue = this.consultationForm.getRawValue();

    this.consultationsService
      .complete(this.consultation._id, {
        treatmentPlan: formValue.treatmentPlan,
        clinicalNotes: formValue.clinicalNotes,
        followUpDate: formValue.followUpDate,
        followUpInstructions: formValue.followUpInstructions,
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.showSuccess('CONSULTATIONS.COMPLETED');
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error completing consultation:', err);
          this.isSaving = false;
          this.showError('CONSULTATIONS.ERRORS.COMPLETE_FAILED');
        },
      });
  }

  private markAllAsTouched(): void {
    Object.keys(this.consultationForm.controls).forEach((key) => {
      const control = this.consultationForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccess(messageKey: string): void {
    const message = this.translate.instant(messageKey);
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private showError(messageKey: string): void {
    const message = this.translate.instant(messageKey);
    this.snackBar.open(message, 'OK', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
