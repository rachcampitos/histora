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
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { Patient, CreatePatientDto, UpdatePatientDto } from '../../patients.model';
import { PatientsService } from '../../patients.service';

export interface PatientFormDialogData {
  patient?: Patient;
  action: 'add' | 'edit';
}

@Component({
  selector: 'app-patient-form-dialog',
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
    MatTabsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class PatientFormDialogComponent implements OnInit {
  patientForm!: FormGroup;
  action: 'add' | 'edit';
  dialogTitle: string;
  isSubmitting = false;

  genderOptions = [
    { value: 'male', label: 'PATIENTS.FORM.MALE' },
    { value: 'female', label: 'PATIENTS.FORM.FEMALE' },
    { value: 'other', label: 'PATIENTS.FORM.OTHER' },
  ];

  bloodTypeOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  documentTypeOptions = ['DNI', 'Passport', 'CE', 'RUC'];

  constructor(
    public dialogRef: MatDialogRef<PatientFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PatientFormDialogData,
    private fb: FormBuilder,
    private patientsService: PatientsService
  ) {
    this.action = data.action;
    this.dialogTitle =
      this.action === 'add' ? 'PATIENTS.ADD_PATIENT' : 'PATIENTS.EDIT_PATIENT';
  }

  ngOnInit(): void {
    this.initForm();
    if (this.action === 'edit' && this.data.patient) {
      this.patchFormValues(this.data.patient);
    }
  }

  initForm(): void {
    this.patientForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: [''],
      email: ['', [Validators.email]],
      phone: [''],
      dateOfBirth: [null],
      gender: [''],
      documentType: [''],
      documentNumber: [''],
      bloodType: [''],
      occupation: [''],
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        country: [''],
        postalCode: [''],
      }),
      emergencyContactName: [''],
      emergencyContactPhone: [''],
      emergencyContactRelation: [''],
      allergies: [''],
      chronicConditions: [''],
      currentMedications: [''],
      insuranceProvider: [''],
      insuranceNumber: [''],
      notes: [''],
    });
  }

  patchFormValues(patient: Patient): void {
    this.patientForm.patchValue({
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth) : null,
      gender: patient.gender,
      documentType: patient.documentType,
      documentNumber: patient.documentNumber,
      bloodType: patient.bloodType,
      occupation: patient.occupation,
      address: patient.address || {},
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      emergencyContactRelation: patient.emergencyContactRelation,
      allergies: patient.allergies?.join(', '),
      chronicConditions: patient.chronicConditions?.join(', '),
      currentMedications: patient.currentMedications?.join(', '),
      insuranceProvider: patient.insuranceProvider,
      insuranceNumber: patient.insuranceNumber,
      notes: patient.notes,
    });
  }

  onSubmit(): void {
    if (this.patientForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    const formValue = this.patientForm.value;

    // Convert comma-separated strings to arrays
    const patientData: CreatePatientDto | UpdatePatientDto = {
      ...formValue,
      dateOfBirth: formValue.dateOfBirth
        ? new Date(formValue.dateOfBirth).toISOString()
        : undefined,
      allergies: this.stringToArray(formValue.allergies),
      chronicConditions: this.stringToArray(formValue.chronicConditions),
      currentMedications: this.stringToArray(formValue.currentMedications),
    };

    // Remove empty/undefined values
    Object.keys(patientData).forEach((key) => {
      const value = patientData[key as keyof typeof patientData];
      if (value === '' || value === null || value === undefined) {
        delete patientData[key as keyof typeof patientData];
      }
    });

    if (this.action === 'add') {
      this.patientsService.create(patientData as CreatePatientDto).subscribe({
        next: (result) => {
          this.dialogRef.close(result);
        },
        error: (error) => {
          console.error('Error creating patient:', error);
          this.isSubmitting = false;
        },
      });
    } else if (this.data.patient?._id) {
      this.patientsService
        .update(this.data.patient._id, patientData as UpdatePatientDto)
        .subscribe({
          next: (result) => {
            this.dialogRef.close(result);
          },
          error: (error) => {
            console.error('Error updating patient:', error);
            this.isSubmitting = false;
          },
        });
    }
  }

  private stringToArray(value: string): string[] {
    if (!value) return [];
    return value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
