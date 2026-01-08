import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface VitalStat {
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DashboardVitals {
  heartRate: VitalStat;
  bloodPressure: {
    systolic: VitalStat;
    diastolic: number;
  };
  bloodGlucose: VitalStat;
  oxygenSaturation: number;
  temperature: number;
  weight: number;
  bmi: number;
  lastRecordedAt?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  instructions?: string;
}

export interface UpcomingAppointment {
  id: string;
  date: string;
  time: string;
  doctor: {
    firstName: string;
    lastName: string;
    specialty: string;
  };
  reason?: string;
  status: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface DashboardData {
  vitals: DashboardVitals;
  medications: Medication[];
  upcomingAppointments: UpcomingAppointment[];
  charts: {
    heartRateHistory: ChartDataPoint[];
  };
}

export interface VitalsHistoryPoint {
  date: string;
  value?: number;
  systolic?: number;
  diastolic?: number;
  weight?: number;
  bmi?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PatientPortalService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/patient-portal`;

  /**
   * Get complete dashboard data including vitals, medications, and appointments
   */
  getDashboardData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`);
  }

  /**
   * Get vitals history for a specific vital type
   * @param vitalType - heartRate, bloodPressure, weight, temperature, bloodGlucose, oxygenSaturation
   * @param limit - Number of records to retrieve (default 7)
   */
  getVitalsHistory(vitalType: string, limit: number = 7): Observable<VitalsHistoryPoint[]> {
    return this.http.get<VitalsHistoryPoint[]>(
      `${this.apiUrl}/vitals/history/${vitalType}?limit=${limit}`
    );
  }

  /**
   * Get latest vitals
   */
  getLatestVitals(): Observable<any> {
    return this.http.get(`${this.apiUrl}/vitals/latest`);
  }

  /**
   * Get patient's prescriptions
   * @param activeOnly - If true, only return active prescriptions
   */
  getPrescriptions(activeOnly: boolean = true): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/prescriptions?active=${activeOnly}`);
  }

  /**
   * Get patient's medical summary
   */
  getMedicalSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/medical-summary`);
  }

  /**
   * Get icon class for medication based on route/type
   * @param medication - Medication object
   */
  getMedicationIcon(medication: Medication): { icon: string; colorClass: string } {
    const route = medication.route?.toLowerCase() || 'oral';
    const name = medication.name?.toLowerCase() || '';

    // Check route first
    if (route.includes('injection') || route.includes('iv') || route.includes('im') || route.includes('subcutaneous')) {
      return { icon: 'fas fa-syringe', colorClass: 'col-blue' };
    }
    if (route.includes('topical') || route.includes('cream') || route.includes('ointment')) {
      return { icon: 'fas fa-prescription-bottle', colorClass: 'col-purple' };
    }
    if (route.includes('inhalation') || route.includes('nebulizer')) {
      return { icon: 'fas fa-lungs', colorClass: 'col-teal' };
    }
    if (route.includes('ophthalmic') || route.includes('eye')) {
      return { icon: 'fas fa-eye-dropper', colorClass: 'col-indigo' };
    }

    // Check medication name patterns
    if (name.includes('tablet') || name.includes('tab')) {
      return { icon: 'fas fa-tablets', colorClass: 'col-green' };
    }
    if (name.includes('capsule') || name.includes('cap')) {
      return { icon: 'fas fa-capsules', colorClass: 'col-red' };
    }
    if (name.includes('syrup') || name.includes('liquid') || name.includes('suspension')) {
      return { icon: 'fas fa-prescription-bottle-medical', colorClass: 'col-orange' };
    }
    if (name.includes('insulin')) {
      return { icon: 'fas fa-syringe', colorClass: 'col-blue' };
    }
    if (name.includes('antibiotic') || name.includes('amoxicillin') || name.includes('azithromycin')) {
      return { icon: 'fas fa-capsules', colorClass: 'col-red' };
    }
    if (name.includes('vitamin') || name.includes('supplement')) {
      return { icon: 'fas fa-tablets', colorClass: 'col-orange' };
    }
    if (name.includes('pain') || name.includes('ibuprofen') || name.includes('paracetamol') || name.includes('acetaminophen')) {
      return { icon: 'fas fa-pills', colorClass: 'col-purple' };
    }

    // Default based on common oral medications
    return { icon: 'fas fa-pills', colorClass: 'col-green' };
  }

  /**
   * Format dosage for display
   */
  formatDosage(medication: Medication): string {
    const parts = [];
    if (medication.dosage) {
      parts.push(medication.dosage);
    }
    if (medication.frequency) {
      // Convert frequency to short format
      const freq = medication.frequency.toLowerCase();
      if (freq.includes('once') || freq.includes('1 vez')) {
        parts.push('1 vez/día');
      } else if (freq.includes('twice') || freq.includes('2 veces') || freq.includes('bid')) {
        parts.push('2 veces/día');
      } else if (freq.includes('three') || freq.includes('3 veces') || freq.includes('tid')) {
        parts.push('3 veces/día');
      } else if (freq.includes('every 8') || freq.includes('cada 8')) {
        parts.push('c/8h');
      } else if (freq.includes('every 12') || freq.includes('cada 12')) {
        parts.push('c/12h');
      } else {
        parts.push(medication.frequency);
      }
    }
    return parts.join(' - ');
  }
}
