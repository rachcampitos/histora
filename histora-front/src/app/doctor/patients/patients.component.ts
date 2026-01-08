import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { Patient } from './patients.model';
import { PatientsService } from './patients.service';
import { rowsAnimation, TableExportUtil } from '@shared';
import { formatDate, DatePipe } from '@angular/common';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { PatientFormDialogComponent, PatientFormDialogData } from './dialogs/form/form.component';
import { PatientDeleteDialogComponent, PatientDeleteDialogData } from './dialogs/delete/delete.component';

@Component({
  standalone: true,
  selector: 'app-patients',
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.scss'],
  animations: [rowsAnimation],
  imports: [
    BreadcrumbComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
    MatOptionModule,
    MatCheckboxModule,
    MatTableModule,
    MatSortModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatPaginatorModule,
    DatePipe,
    TranslateModule,
  ],
})
export class PatientsComponent implements OnInit, OnDestroy {
  columnDefinitions = [
    { def: '_id', label: 'ID', type: 'string', visible: false },
    { def: 'name', label: 'PATIENTS.TABLE.NAME', type: 'name', visible: true },
    { def: 'email', label: 'PATIENTS.TABLE.EMAIL', type: 'email', visible: true },
    { def: 'phone', label: 'PATIENTS.TABLE.PHONE', type: 'phone', visible: true },
    { def: 'gender', label: 'PATIENTS.TABLE.GENDER', type: 'gender', visible: true },
    { def: 'dateOfBirth', label: 'PATIENTS.TABLE.DATE_OF_BIRTH', type: 'date', visible: true },
    { def: 'bloodType', label: 'PATIENTS.TABLE.BLOOD_TYPE', type: 'text', visible: true },
    { def: 'actions', label: 'PATIENTS.TABLE.ACTIONS', type: 'actionBtn', visible: true },
  ];

  dataSource = new MatTableDataSource<Patient>([]);
  isLoading = true;
  totalRecords = 0;
  pageSize = 10;
  pageIndex = 0;
  searchControl = new FormControl('');

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('filter') filter!: ElementRef;
  @ViewChild(MatMenuTrigger) contextMenu?: MatMenuTrigger;

  constructor(
    public dialog: MatDialog,
    public patientsService: PatientsService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupSearch(): void {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.pageIndex = 0;
        this.loadData(searchTerm);
      });
  }

  getDisplayedColumns(): string[] {
    return this.columnDefinitions
      .filter((cd) => cd.visible)
      .map((cd) => cd.def);
  }

  loadData(search?: string) {
    this.isLoading = true;
    const offset = this.pageIndex * this.pageSize;

    this.patientsService.getAll(search, this.pageSize, offset).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.totalRecords = response.total;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        this.isLoading = false;
        this.showNotification(
          'snackbar-danger',
          'Error al cargar pacientes',
          'bottom',
          'center'
        );
      },
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim();
    this.searchSubject.next(filterValue);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData(this.searchControl.value || undefined);
  }

  getFullName(patient: Patient): string {
    return `${patient.firstName} ${patient.lastName || ''}`.trim();
  }

  calculateAge(dateOfBirth: Date | string | undefined): number | null {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  addNew() {
    const dialogRef = this.dialog.open(PatientFormDialogComponent, {
      data: { action: 'add' } as PatientFormDialogData,
      width: '800px',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadData(this.searchControl.value || undefined);
        this.showNotification(
          'snackbar-success',
          'Paciente agregado exitosamente',
          'bottom',
          'center'
        );
      }
    });
  }

  editPatient(patient: Patient) {
    const dialogRef = this.dialog.open(PatientFormDialogComponent, {
      data: { patient, action: 'edit' } as PatientFormDialogData,
      width: '800px',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadData(this.searchControl.value || undefined);
        this.showNotification(
          'snackbar-success',
          'Paciente actualizado exitosamente',
          'bottom',
          'center'
        );
      }
    });
  }

  deletePatient(patient: Patient) {
    const dialogRef = this.dialog.open(PatientDeleteDialogComponent, {
      data: { patient } as PatientDeleteDialogData,
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadData(this.searchControl.value || undefined);
        this.showNotification(
          'snackbar-success',
          'Paciente eliminado exitosamente',
          'bottom',
          'center'
        );
      }
    });
  }

  viewDetails(patient: Patient) {
    this.router.navigate(['/doctor/patients', patient._id]);
  }

  showNotification(
    colorName: string,
    text: string,
    placementFrom: MatSnackBarVerticalPosition,
    placementAlign: MatSnackBarHorizontalPosition
  ) {
    this.snackBar.open(text, '', {
      duration: 3000,
      verticalPosition: placementFrom,
      horizontalPosition: placementAlign,
      panelClass: colorName,
    });
  }

  exportExcel() {
    const exportData = this.dataSource.data.map((x) => ({
      Nombre: this.getFullName(x),
      Email: x.email || '',
      Telefono: x.phone || '',
      Genero: x.gender || '',
      'Fecha de Nacimiento':
        x.dateOfBirth
          ? formatDate(new Date(x.dateOfBirth), 'yyyy-MM-dd', 'en')
          : '',
      'Tipo de Sangre': x.bloodType || '',
      Direccion: x.address
        ? `${x.address.street || ''}, ${x.address.city || ''}`
        : '',
    }));

    TableExportUtil.exportToExcel(exportData, 'patients_export');
  }

  refresh() {
    this.searchControl.setValue('');
    this.pageIndex = 0;
    this.loadData();
  }
}
