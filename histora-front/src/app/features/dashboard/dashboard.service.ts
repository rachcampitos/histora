import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingConsultations: number;
  monthlyGrowth: number;
}

export interface TodayAppointment {
  _id: string;
  patientName: string;
  startTime: string;
  status: string;
  reasonForVisit?: string;
}

interface CountResponse {
  count: number;
}

interface AppointmentResponse {
  _id: string;
  patientId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  startTime: string;
  status: string;
  reasonForVisit?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private api = inject(ApiService);

  getStats(): Observable<DashboardStats> {
    return forkJoin({
      patients: this.api.get<CountResponse>('/patients/count').pipe(
        catchError(() => of({ count: 0 }))
      ),
      todayAppointments: this.api.get<CountResponse>('/appointments/count', { date: this.getTodayDate() }).pipe(
        catchError(() => of({ count: 0 }))
      ),
      pendingConsultations: this.api.get<CountResponse>('/consultations/count', { status: 'in_progress' }).pipe(
        catchError(() => of({ count: 0 }))
      ),
      lastMonthPatients: this.api.get<CountResponse>('/patients/count', { beforeDate: this.getLastMonthDate() }).pipe(
        catchError(() => of({ count: 0 }))
      ),
    }).pipe(
      map(({ patients, todayAppointments, pendingConsultations, lastMonthPatients }) => {
        const currentPatients = patients.count;
        const previousPatients = lastMonthPatients.count;
        const growth = previousPatients > 0
          ? Math.round(((currentPatients - previousPatients) / previousPatients) * 100)
          : currentPatients > 0 ? 100 : 0;

        return {
          totalPatients: currentPatients,
          todayAppointments: todayAppointments.count,
          pendingConsultations: pendingConsultations.count,
          monthlyGrowth: growth,
        };
      })
    );
  }

  getTodayAppointments(): Observable<TodayAppointment[]> {
    return this.api.get<AppointmentResponse[]>('/appointments/today').pipe(
      map((appointments) =>
        appointments.map((apt) => ({
          _id: apt._id,
          patientName: apt.patientId
            ? `${apt.patientId.firstName} ${apt.patientId.lastName}`
            : 'Paciente desconocido',
          startTime: apt.startTime,
          status: apt.status,
          reasonForVisit: apt.reasonForVisit,
        }))
      ),
      catchError(() => of([]))
    );
  }

  getMonthAppointmentsCount(): Observable<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.api.get<CountResponse>('/appointments/count', {
      startDate: startOfMonth.toISOString(),
    }).pipe(
      map((response) => response.count),
      catchError(() => of(0))
    );
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getLastMonthDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }
}
