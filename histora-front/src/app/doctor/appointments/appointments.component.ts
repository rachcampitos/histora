import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { Appointment, AppointmentStatus, AppointmentPatient } from './appointments.model';
import { AppointmentsApiService } from './appointments-api.service';
import { rowsAnimation, TableExportUtil } from '@shared';
import { formatDate, DatePipe, NgClass } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
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
import { AppointmentFormDialogComponent, AppointmentFormDialogData } from './dialogs/form/form.component';
import { AppointmentDeleteDialogComponent, AppointmentDeleteDialogData } from './dialogs/delete/delete.component';
import { TableSkeletonComponent } from '@shared/components/skeleton-loader/table-skeleton.component';

@Component({
  standalone: true,
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss'],
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
    NgClass,
    MatDividerModule,
    TranslateModule,
    TableSkeletonComponent,
  ],
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'patient',
    'scheduledDate',
    'time',
    'status',
    'reasonForVisit',
    'actions',
  ];

  dataSource = new MatTableDataSource<Appointment>([]);
  isLoading = true;
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('filter') filter!: ElementRef;
  @ViewChild(MatMenuTrigger) contextMenu?: MatMenuTrigger;

  constructor(
    public dialog: MatDialog,
    public appointmentsService: AppointmentsApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.isLoading = true;
    this.appointmentsService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.refreshTable();
      },
      error: (err) => {
        console.error('Error loading appointments:', err);
        this.isLoading = false;
        this.showNotification(
          'snackbar-danger',
          'Error al cargar citas',
          'bottom',
          'center'
        );
      },
    });
  }

  private refreshTable() {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    // Custom filter predicate
    this.dataSource.filterPredicate = (data: Appointment, filter: string) => {
      const patientName = this.getPatientName(data).toLowerCase();
      const reason = (data.reasonForVisit || '').toLowerCase();
      const status = data.status.toLowerCase();
      return (
        patientName.includes(filter) ||
        reason.includes(filter) ||
        status.includes(filter)
      );
    };
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = filterValue;
  }

  getPatientName(appointment: Appointment): string {
    if (typeof appointment.patientId === 'object') {
      const patient = appointment.patientId as AppointmentPatient;
      return `${patient.firstName} ${patient.lastName || ''}`.trim();
    }
    return 'Paciente';
  }

  getStatusClass(status: AppointmentStatus): string {
    const statusClasses: Record<AppointmentStatus, string> = {
      [AppointmentStatus.SCHEDULED]: 'badge-solid-blue',
      [AppointmentStatus.CONFIRMED]: 'badge-solid-green',
      [AppointmentStatus.IN_PROGRESS]: 'badge-solid-orange',
      [AppointmentStatus.COMPLETED]: 'badge-solid-purple',
      [AppointmentStatus.CANCELLED]: 'badge-solid-red',
      [AppointmentStatus.NO_SHOW]: 'badge-solid-gray',
    };
    return statusClasses[status] || 'badge-solid-blue';
  }

  addNew() {
    const dialogRef = this.dialog.open(AppointmentFormDialogComponent, {
      data: { action: 'add' } as AppointmentFormDialogData,
      width: '700px',
      maxHeight: '90vh',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadData();
        this.showNotification(
          'snackbar-success',
          'Cita agendada exitosamente',
          'bottom',
          'center'
        );
      }
    });
  }

  editAppointment(appointment: Appointment) {
    const dialogRef = this.dialog.open(AppointmentFormDialogComponent, {
      data: { appointment, action: 'edit' } as AppointmentFormDialogData,
      width: '700px',
      maxHeight: '90vh',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadData();
        this.showNotification(
          'snackbar-success',
          'Cita actualizada exitosamente',
          'bottom',
          'center'
        );
      }
    });
  }

  deleteAppointment(appointment: Appointment) {
    const dialogRef = this.dialog.open(AppointmentDeleteDialogComponent, {
      data: { appointment } as AppointmentDeleteDialogData,
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadData();
        this.showNotification(
          'snackbar-success',
          'Cita eliminada exitosamente',
          'bottom',
          'center'
        );
      }
    });
  }

  updateStatus(appointment: Appointment, status: string) {
    const appointmentStatus = status as AppointmentStatus;
    this.appointmentsService.updateStatus(appointment._id, appointmentStatus).subscribe({
      next: () => {
        this.loadData();
        this.showNotification(
          'snackbar-success',
          'Estado actualizado',
          'bottom',
          'center'
        );
      },
      error: (err) => {
        console.error('Error updating status:', err);
        this.showNotification(
          'snackbar-danger',
          'Error al actualizar estado',
          'bottom',
          'center'
        );
      },
    });
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
    const exportData = this.dataSource.filteredData.map((x) => ({
      Paciente: this.getPatientName(x),
      Fecha: formatDate(new Date(x.scheduledDate), 'yyyy-MM-dd', 'en') || '',
      'Hora Inicio': x.startTime,
      'Hora Fin': x.endTime,
      Estado: x.status,
      Motivo: x.reasonForVisit || '',
      Notas: x.notes || '',
    }));

    TableExportUtil.exportToExcel(exportData, 'appointments_export');
  }

  refresh() {
    this.loadData();
  }
}
