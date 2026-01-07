import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { provideNativeDateAdapter } from '@angular/material/core';
import { of, throwError } from 'rxjs';

import { MedicalRecordsComponent } from './medical-records.component';
import { MedicalRecordsService, Consultation, PatientMedicalSummary } from './medical-records.service';
import { AuthService } from '@core';

describe('MedicalRecordsComponent', () => {
  let component: MedicalRecordsComponent;
  let fixture: ComponentFixture<MedicalRecordsComponent>;
  let medicalRecordsService: jasmine.SpyObj<MedicalRecordsService>;

  const mockConsultations: Consultation[] = [
    {
      _id: '1',
      patientId: 'patient1',
      doctorId: 'doctor1',
      clinicId: 'clinic1',
      date: new Date('2024-06-15T10:00:00'),
      status: 'completed',
      chiefComplaint: 'Dolor de cabeza',
      diagnoses: [
        { code: 'R51', description: 'Cefalea', type: 'principal' },
      ],
      prescriptions: [
        {
          medication: 'Paracetamol',
          dosage: '500mg',
          frequency: 'Cada 8 horas',
          duration: '5 días',
        },
      ],
      treatmentPlan: 'Reposo y medicación',
      followUpDate: new Date('2024-06-22'),
      createdAt: new Date(),
      doctor: {
        _id: 'doctor1',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
      },
    },
    {
      _id: '2',
      patientId: 'patient1',
      doctorId: 'doctor1',
      clinicId: 'clinic1',
      date: new Date('2024-06-10T14:30:00'),
      status: 'completed',
      chiefComplaint: 'Control rutinario',
      diagnoses: [],
      prescriptions: [],
      createdAt: new Date(),
      doctor: {
        _id: 'doctor1',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
      },
    },
  ];

  const mockMedicalSummary: PatientMedicalSummary = {
    allergies: [
      { allergen: 'Penicilina', reaction: 'Urticaria' },
    ],
    chronicConditions: [
      { condition: 'Hipertensión', icdCode: 'I10' },
    ],
    currentMedications: [
      { medication: 'Losartán', dosage: '50mg', frequency: 'Diario' },
    ],
    surgicalHistory: [
      { procedure: 'Apendicectomía', date: new Date('2015-03-20') },
    ],
    familyHistory: [
      { relationship: 'Padre', condition: 'Diabetes' },
    ],
    vaccinations: [
      { vaccine: 'COVID-19', date: new Date('2023-01-15') },
    ],
  };

  const mockUser = {
    _id: 'user1',
    email: 'patient@test.com',
    role: 'patient',
    patientId: 'patient1',
  };

  beforeEach(waitForAsync(() => {
    const medicalRecordsServiceSpy = jasmine.createSpyObj('MedicalRecordsService', [
      'getConsultations',
      'getMedicalSummary',
    ]);
    medicalRecordsServiceSpy.getConsultations.and.returnValue(of(mockConsultations));
    medicalRecordsServiceSpy.getMedicalSummary.and.returnValue(of(mockMedicalSummary));

    const authServiceMock = {
      currentUserValue: mockUser,
    };

    TestBed.configureTestingModule({
      imports: [
        MedicalRecordsComponent,
        NoopAnimationsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: MedicalRecordsService, useValue: medicalRecordsServiceSpy },
        { provide: AuthService, useValue: authServiceMock },
        importProvidersFrom(FeatherModule.pick(allIcons)),
        provideNativeDateAdapter(),
      ],
    }).compileComponents();

    medicalRecordsService = TestBed.inject(MedicalRecordsService) as jasmine.SpyObj<MedicalRecordsService>;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MedicalRecordsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load patient ID from auth service on init', () => {
    fixture.detectChanges();
    expect(component.patientId).toBe('patient1');
  });

  it('should load consultations and medical summary on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(medicalRecordsService.getConsultations).toHaveBeenCalledWith('patient1', 20);
    expect(medicalRecordsService.getMedicalSummary).toHaveBeenCalledWith('patient1');
    expect(component.consultations).toEqual(mockConsultations);
    expect(component.medicalSummary).toEqual(mockMedicalSummary);
    expect(component.isLoading).toBe(false);
  }));

  it('should handle error when loading consultations', fakeAsync(() => {
    medicalRecordsService.getConsultations.and.returnValue(throwError(() => new Error('Error')));
    spyOn(console, 'error');

    fixture.detectChanges();
    tick();

    expect(console.error).toHaveBeenCalled();
    // Should still try to load medical summary
    expect(medicalRecordsService.getMedicalSummary).toHaveBeenCalled();
  }));

  it('should handle error when loading medical summary', fakeAsync(() => {
    medicalRecordsService.getMedicalSummary.and.returnValue(throwError(() => new Error('Error')));
    spyOn(console, 'error');

    fixture.detectChanges();
    tick();

    expect(console.error).toHaveBeenCalled();
    expect(component.isLoading).toBe(false);
  }));

  describe('getDoctorName', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return doctor full name', () => {
      const result = component.getDoctorName(mockConsultations[0]);
      expect(result).toBe('Dr. Carlos Rodríguez');
    });

    it('should return default when no doctor', () => {
      const consultation = { ...mockConsultations[0], doctor: undefined };
      const result = component.getDoctorName(consultation);
      expect(result).toBe('Médico');
    });
  });

  describe('formatDate', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format date correctly', () => {
      const date = new Date('2024-06-15');
      const result = component.formatDate(date);
      expect(result).toMatch(/\d{1,2}/);
      expect(result).toMatch(/2024/);
    });

    it('should handle string dates', () => {
      const result = component.formatDate('2024-06-15');
      expect(result).toBeTruthy();
    });
  });

  describe('formatTime', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format time correctly', () => {
      const date = new Date('2024-06-15T14:30:00');
      const result = component.formatTime(date);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('getStatusColor', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return completed for completed status', () => {
      expect(component.getStatusColor('completed')).toBe('completed');
    });

    it('should return in-progress for in_progress status', () => {
      expect(component.getStatusColor('in_progress')).toBe('in-progress');
    });

    it('should return scheduled for scheduled status', () => {
      expect(component.getStatusColor('scheduled')).toBe('scheduled');
    });

    it('should return cancelled for cancelled status', () => {
      expect(component.getStatusColor('cancelled')).toBe('cancelled');
    });

    it('should return empty string for unknown status', () => {
      expect(component.getStatusColor('unknown')).toBe('');
    });
  });

  describe('getStatusLabel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return correct translation key for completed', () => {
      expect(component.getStatusLabel('completed')).toBe('CLINICAL_HISTORY.STATUS.COMPLETED');
    });

    it('should return correct translation key for in_progress', () => {
      expect(component.getStatusLabel('in_progress')).toBe('CLINICAL_HISTORY.STATUS.IN_PROGRESS');
    });

    it('should return correct translation key for scheduled', () => {
      expect(component.getStatusLabel('scheduled')).toBe('CLINICAL_HISTORY.STATUS.SCHEDULED');
    });

    it('should return correct translation key for cancelled', () => {
      expect(component.getStatusLabel('cancelled')).toBe('CLINICAL_HISTORY.STATUS.CANCELLED');
    });

    it('should return status as-is for unknown status', () => {
      expect(component.getStatusLabel('unknown')).toBe('unknown');
    });
  });

  describe('getSeverityColor', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return warn for severe', () => {
      expect(component.getSeverityColor('severe')).toBe('warn');
      expect(component.getSeverityColor('severa')).toBe('warn');
    });

    it('should return accent for moderate', () => {
      expect(component.getSeverityColor('moderate')).toBe('accent');
      expect(component.getSeverityColor('moderada')).toBe('accent');
    });

    it('should return primary for mild', () => {
      expect(component.getSeverityColor('mild')).toBe('primary');
      expect(component.getSeverityColor('leve')).toBe('primary');
    });

    it('should return empty string for undefined', () => {
      expect(component.getSeverityColor(undefined)).toBe('');
    });
  });

  describe('Template rendering', () => {
    it('should have isLoading property that controls loading state', () => {
      // Verify component has isLoading property
      expect(component.isLoading).toBeDefined();

      // Initially loading should be false after data loads
      fixture.detectChanges();
      expect(typeof component.isLoading).toBe('boolean');
    });

    it('should show error message when error exists', () => {
      component.isLoading = false;
      component.error = 'Test error';
      fixture.detectChanges();

      const errorContainer = fixture.nativeElement.querySelector('.error-container');
      expect(errorContainer).toBeTruthy();
    });

    it('should show content when not loading and no error', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector('.cardWithShadow');
      expect(content).toBeTruthy();
    }));
  });
});
