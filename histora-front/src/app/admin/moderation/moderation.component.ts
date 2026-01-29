import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { AdminService, AtRiskUser, LowRatedReview } from '@core/service/admin.service';
import { ConfirmDialogComponent } from '../users/dialogs/confirm-dialog.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface ModerationStats {
  totalAtRisk: number;
  nursesAtRisk: number;
  patientsAtRisk: number;
  pendingReviews: number;
  recentComplaints: number;
  suspendedUsers: number;
}

@Component({
  standalone: true,
  selector: 'app-admin-moderation',
  templateUrl: './moderation.component.html',
  styleUrls: ['./moderation.component.scss'],
  imports: [
    CommonModule,
    BreadcrumbComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
  ],
})
export class ModerationComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  isLoading = true;
  selectedTabIndex = 0;

  // Data
  atRiskUsers: AtRiskUser[] = [];
  lowRatedReviews: LowRatedReview[] = [];

  // Stats
  stats: ModerationStats = {
    totalAtRisk: 0,
    nursesAtRisk: 0,
    patientsAtRisk: 0,
    pendingReviews: 0,
    recentComplaints: 0,
    suspendedUsers: 0,
  };

  // Filtered lists
  atRiskNurses: AtRiskUser[] = [];
  atRiskPatients: AtRiskUser[] = [];

  ngOnInit(): void {
    this.loadModerationData();
  }

  loadModerationData(): void {
    this.isLoading = true;

    forkJoin({
      atRisk: this.adminService.getAtRiskUsers(50).pipe(catchError(() => of([]))),
      reviews: this.adminService.getLowRatedReviews().pipe(catchError(() => of([]))),
    }).subscribe({
      next: (data) => {
        this.atRiskUsers = data.atRisk;
        this.lowRatedReviews = data.reviews;

        this.atRiskNurses = this.atRiskUsers.filter(u => u.type === 'nurse');
        this.atRiskPatients = this.atRiskUsers.filter(u => u.type === 'patient');

        this.stats = {
          totalAtRisk: this.atRiskUsers.length,
          nursesAtRisk: this.atRiskNurses.length,
          patientsAtRisk: this.atRiskPatients.length,
          pendingReviews: this.lowRatedReviews.filter(r => !r.hasResponse).length,
          recentComplaints: this.atRiskUsers.reduce((sum, u) => sum + u.totalComplaints, 0),
          suspendedUsers: 0,
        };

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading moderation data:', err);
        this.snackBar.open('Error al cargar datos de moderacion', 'Cerrar', { duration: 3000 });
        this.isLoading = false;
      },
    });
  }

  getRiskScoreClass(score: number): string {
    if (score >= 70) return 'risk-high';
    if (score >= 40) return 'risk-medium';
    return 'risk-low';
  }

  getRiskLabel(score: number): string {
    if (score >= 70) return 'Alto';
    if (score >= 40) return 'Medio';
    return 'Bajo';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  viewUserProfile(user: AtRiskUser): void {
    const route = user.type === 'nurse' ? '/admin/nurses' : '/admin/patients';
    this.snackBar.open(`Navegando a perfil de ${user.name}`, 'Ver', {
      duration: 3000,
    });
  }

  warnUser(user: AtRiskUser): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Enviar Advertencia',
        message: `¿Enviar una advertencia a ${user.name}? Se le notificara sobre su comportamiento.`,
        confirmText: 'Enviar Advertencia',
        confirmColor: 'accent',
        icon: 'warning',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.snackBar.open(`Advertencia enviada a ${user.name}`, 'Cerrar', { duration: 3000 });
      }
    });
  }

  suspendUser(user: AtRiskUser): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      data: {
        title: 'Suspender Usuario',
        message: `¿Suspender a ${user.name}? No podra usar la plataforma hasta ser rehabilitado.`,
        confirmText: 'Suspender',
        confirmColor: 'warn',
        icon: 'block',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        if (user.type === 'nurse') {
          this.adminService.toggleNurseStatus(user.id).subscribe({
            next: () => {
              this.loadModerationData();
              this.snackBar.open(`${user.name} ha sido suspendido`, 'Cerrar', { duration: 3000 });
            },
            error: () => {
              this.snackBar.open('Error al suspender usuario', 'Cerrar', { duration: 3000 });
            },
          });
        } else {
          this.adminService.togglePatientStatus(user.id).subscribe({
            next: () => {
              this.loadModerationData();
              this.snackBar.open(`${user.name} ha sido suspendido`, 'Cerrar', { duration: 3000 });
            },
            error: () => {
              this.snackBar.open('Error al suspender usuario', 'Cerrar', { duration: 3000 });
            },
          });
        }
      }
    });
  }

  banUser(user: AtRiskUser): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '480px',
      data: {
        title: 'Bloquear Permanentemente',
        message: `¿Bloquear permanentemente a ${user.name}? Esta accion eliminara su cuenta de la plataforma.`,
        confirmText: 'Bloquear Permanentemente',
        confirmColor: 'warn',
        icon: 'delete_forever',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        if (user.type === 'nurse') {
          this.adminService.deleteNurse(user.id).subscribe({
            next: () => {
              this.loadModerationData();
              this.snackBar.open(`${user.name} ha sido bloqueado permanentemente`, 'Cerrar', { duration: 3000 });
            },
            error: () => {
              this.snackBar.open('Error al bloquear usuario', 'Cerrar', { duration: 3000 });
            },
          });
        } else {
          this.adminService.deletePatient(user.id).subscribe({
            next: () => {
              this.loadModerationData();
              this.snackBar.open(`${user.name} ha sido bloqueado permanentemente`, 'Cerrar', { duration: 3000 });
            },
            error: () => {
              this.snackBar.open('Error al bloquear usuario', 'Cerrar', { duration: 3000 });
            },
          });
        }
      }
    });
  }

  dismissReview(review: LowRatedReview): void {
    this.snackBar.open(`Resena marcada como revisada`, 'Cerrar', { duration: 3000 });
    this.lowRatedReviews = this.lowRatedReviews.filter(r => r.id !== review.id);
    this.stats.pendingReviews = this.lowRatedReviews.filter(r => !r.hasResponse).length;
  }

  investigateReview(review: LowRatedReview): void {
    this.snackBar.open(`Investigando resena de ${review.patientName}`, 'Ver', { duration: 3000 });
  }
}
