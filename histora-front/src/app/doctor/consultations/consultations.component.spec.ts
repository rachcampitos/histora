import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { importProvidersFrom } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';
import { provideNativeDateAdapter } from '@angular/material/core';
import { OverlayModule } from '@angular/cdk/overlay';

import { ConsultationsComponent } from './consultations.component';
import { ConsultationsService } from './consultations.service';
import { AuthService } from '@core';
import { Consultation, ConsultationStatus, DiagnosisType } from './consultations.model';

describe('ConsultationsComponent', () => {
  let component: ConsultationsComponent;
  let fixture: ComponentFixture<ConsultationsComponent>;
  let consultationsService: jasmine.SpyObj<ConsultationsService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const mockConsultations: Consultation[] = [
    {
      _id: '1',
      patientId: 'patient1',
      doctorId: 'doctor1',
      clinicId: 'clinic1',
      date: new Date(),
      status: ConsultationStatus.SCHEDULED,
      chiefComplaint: 'Dolor de cabeza',
      diagnoses: [],
      prescriptions: [],
      orderedExams: [],
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      patient: {
        _id: 'patient1',
        firstName: 'Juan',
        lastName: 'Pérez',
        dateOfBirth: new Date('1990-01-15'),
      },
    },
    {
      _id: '2',
      patientId: 'patient2',
      doctorId: 'doctor1',
      clinicId: 'clinic1',
      date: new Date(),
      status: ConsultationStatus.IN_PROGRESS,
      chiefComplaint: 'Fiebre',
      diagnoses: [
        {
          code: 'R50.9',
          description: 'Fiebre no especificada',
          type: DiagnosisType.PRINCIPAL,
        },
      ],
      prescriptions: [],
      orderedExams: [],
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      patient: {
        _id: 'patient2',
        firstName: 'María',
        lastName: 'García',
      },
    },
  ];

  const mockUser = {
    _id: 'user1',
    email: 'doctor@test.com',
    role: 'doctor',
    doctorId: 'doctor1',
  };

  beforeEach(waitForAsync(() => {
    const consultationsServiceSpy = jasmine.createSpyObj('ConsultationsService', ['getAll', 'updateStatus']);
    consultationsServiceSpy.getAll.and.returnValue(of(mockConsultations));
    consultationsServiceSpy.updateStatus.and.returnValue(of(mockConsultations[0]));

    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({ afterClosed: () => of(true) });

    const authServiceMock = {
      currentUserValue: mockUser,
    };

    TestBed.configureTestingModule({
      imports: [
        ConsultationsComponent,
        NoopAnimationsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        MatDialogModule,
        OverlayModule,
      ],
      providers: [
        importProvidersFrom(FeatherModule.pick(allIcons)),
        provideNativeDateAdapter(),
        { provide: ConsultationsService, useValue: consultationsServiceSpy },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    consultationsService = TestBed.inject(ConsultationsService) as jasmine.SpyObj<ConsultationsService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsultationsComponent);
    component = fixture.componentInstance;
    // Spy on dialog.open after component creation to intercept dialog calls
    spyOn(component['dialog'], 'open').and.returnValue({
      afterClosed: () => of(true),
      close: () => {},
    } as MatDialogRef<any>);
    dialog = component['dialog'] as jasmine.SpyObj<MatDialog>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load doctor ID from auth service on init', () => {
    fixture.detectChanges();
    expect(component.doctorId).toBe('doctor1');
  });

  it('should load consultations on init', () => {
    fixture.detectChanges();
    expect(consultationsService.getAll).toHaveBeenCalled();
    expect(component.dataSource.data).toEqual(mockConsultations);
    expect(component.isLoading).toBe(false);
  });

  it('should handle error when loading consultations', () => {
    consultationsService.getAll.and.returnValue(throwError(() => new Error('Error')));
    spyOn(console, 'error');

    fixture.detectChanges();

    expect(component.isLoading).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  describe('loadConsultations', () => {
    it('should call service with correct date range', () => {
      component.selectedDate = new Date('2024-06-15');
      component.selectedStatus = '';
      component.doctorId = 'doctor1';

      component.loadConsultations();

      expect(consultationsService.getAll).toHaveBeenCalledWith(
        jasmine.objectContaining({
          doctorId: 'doctor1',
        })
      );
    });

    it('should include status filter when selected', () => {
      component.selectedStatus = ConsultationStatus.SCHEDULED;
      component.doctorId = 'doctor1';

      component.loadConsultations();

      expect(consultationsService.getAll).toHaveBeenCalledWith(
        jasmine.objectContaining({
          status: ConsultationStatus.SCHEDULED,
        })
      );
    });
  });

  describe('onDateChange', () => {
    it('should reload consultations', () => {
      fixture.detectChanges();
      consultationsService.getAll.calls.reset();

      component.onDateChange();

      expect(consultationsService.getAll).toHaveBeenCalled();
    });
  });

  describe('onStatusChange', () => {
    it('should reload consultations', () => {
      fixture.detectChanges();
      consultationsService.getAll.calls.reset();

      component.onStatusChange();

      expect(consultationsService.getAll).toHaveBeenCalled();
    });
  });

  describe('applyFilter', () => {
    it('should filter data source', () => {
      fixture.detectChanges();
      const event = { target: { value: 'juan' } } as unknown as Event;

      component.applyFilter(event);

      expect(component.dataSource.filter).toBe('juan');
    });
  });

  describe('getStatusColor', () => {
    it('should return primary for scheduled', () => {
      expect(component.getStatusColor(ConsultationStatus.SCHEDULED)).toBe('primary');
    });

    it('should return accent for in_progress', () => {
      expect(component.getStatusColor(ConsultationStatus.IN_PROGRESS)).toBe('accent');
    });

    it('should return completed for completed', () => {
      expect(component.getStatusColor(ConsultationStatus.COMPLETED)).toBe('completed');
    });

    it('should return warn for cancelled', () => {
      expect(component.getStatusColor(ConsultationStatus.CANCELLED)).toBe('warn');
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct translation key for scheduled', () => {
      expect(component.getStatusLabel(ConsultationStatus.SCHEDULED)).toBe(
        'CONSULTATIONS.STATUS.SCHEDULED'
      );
    });

    it('should return correct translation key for in_progress', () => {
      expect(component.getStatusLabel(ConsultationStatus.IN_PROGRESS)).toBe(
        'CONSULTATIONS.STATUS.IN_PROGRESS'
      );
    });

    it('should return correct translation key for completed', () => {
      expect(component.getStatusLabel(ConsultationStatus.COMPLETED)).toBe(
        'CONSULTATIONS.STATUS.COMPLETED'
      );
    });

    it('should return correct translation key for cancelled', () => {
      expect(component.getStatusLabel(ConsultationStatus.CANCELLED)).toBe(
        'CONSULTATIONS.STATUS.CANCELLED'
      );
    });
  });

  describe('startConsultation', () => {
    it('should update status to IN_PROGRESS and open form', fakeAsync(() => {
      fixture.detectChanges();

      component.startConsultation(mockConsultations[0]);
      tick();

      expect(consultationsService.updateStatus).toHaveBeenCalledWith(
        '1',
        ConsultationStatus.IN_PROGRESS
      );
      expect(dialog.open).toHaveBeenCalled();
    }));

    it('should handle error when starting consultation', fakeAsync(() => {
      consultationsService.updateStatus.and.returnValue(throwError(() => new Error('Error')));
      spyOn(console, 'error');

      component.startConsultation(mockConsultations[0]);
      tick();

      expect(console.error).toHaveBeenCalled();
    }));
  });

  describe('openConsultationForm', () => {
    it('should open dialog with consultation data', () => {
      fixture.detectChanges();

      component.openConsultationForm(mockConsultations[0]);

      expect(dialog.open).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.objectContaining({
          data: { consultation: mockConsultations[0] },
          disableClose: true,
        })
      );
    });

    it('should reload consultations after dialog closes with result', fakeAsync(() => {
      fixture.detectChanges();
      consultationsService.getAll.calls.reset();

      component.openConsultationForm(mockConsultations[0]);
      tick();

      expect(consultationsService.getAll).toHaveBeenCalled();
    }));
  });

  describe('viewConsultation', () => {
    it('should open consultation form', () => {
      fixture.detectChanges();

      component.viewConsultation(mockConsultations[0]);

      expect(dialog.open).toHaveBeenCalled();
    });
  });

  describe('getPatientName', () => {
    it('should return full name when patient exists', () => {
      const result = component.getPatientName(mockConsultations[0]);
      expect(result).toBe('Juan Pérez');
    });

    it('should return default when patient is missing', () => {
      const consultation = { ...mockConsultations[0], patient: undefined };
      const result = component.getPatientName(consultation);
      expect(result).toBe('Paciente');
    });
  });

  describe('getPatientAge', () => {
    it('should calculate age correctly', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 30;
      const consultation: Consultation = {
        ...mockConsultations[0],
        patient: {
          _id: 'p1',
          firstName: 'Test',
          lastName: 'User',
          dateOfBirth: new Date(`${birthYear}-01-01`),
        },
      };

      const age = component.getPatientAge(consultation);
      expect(age).toBeGreaterThanOrEqual(29);
      expect(age).toBeLessThanOrEqual(30);
    });

    it('should return null when no birth date', () => {
      const consultation: Consultation = {
        ...mockConsultations[0],
        patient: {
          _id: 'p1',
          firstName: 'Test',
          lastName: 'User',
        },
      };

      const age = component.getPatientAge(consultation);
      expect(age).toBeNull();
    });

    it('should return null when no patient', () => {
      const consultation = { ...mockConsultations[0], patient: undefined };
      const age = component.getPatientAge(consultation);
      expect(age).toBeNull();
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const date = new Date('2024-06-15T14:30:00');
      const result = component.formatTime(date);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });
});
