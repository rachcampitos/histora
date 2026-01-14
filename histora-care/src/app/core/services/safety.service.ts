import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export enum PanicAlertLevel {
  HELP_NEEDED = 'help_needed',
  EMERGENCY = 'emergency',
}

export enum PanicAlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESPONDING = 'responding',
  RESOLVED = 'resolved',
  FALSE_ALARM = 'false_alarm',
}

export interface PanicAlert {
  _id: string;
  nurseId: string;
  serviceRequestId?: string;
  patientId?: string;
  level: PanicAlertLevel;
  status: PanicAlertStatus;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  message?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface TriggerPanicDto {
  level: PanicAlertLevel;
  serviceRequestId?: string;
  patientId?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  message?: string;
  deviceInfo?: {
    platform: string;
    deviceId?: string;
    batteryLevel?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SafetyService {
  private api = inject(ApiService);

  /**
   * Trigger a panic alert
   */
  triggerPanic(dto: TriggerPanicDto): Observable<PanicAlert> {
    return this.api.post<PanicAlert>('/safety/panic', dto);
  }

  /**
   * Get active panic alert for current nurse
   */
  getActivePanicAlert(): Observable<PanicAlert | null> {
    return this.api.get<PanicAlert | null>('/safety/panic/active');
  }

  /**
   * Cancel a panic alert (false alarm)
   */
  cancelPanicAlert(alertId: string): Observable<PanicAlert> {
    return this.api.delete<PanicAlert>(`/safety/panic/${alertId}`);
  }

  /**
   * Get panic alert history for current nurse
   */
  getPanicHistory(): Observable<PanicAlert[]> {
    return this.api.get<PanicAlert[]>('/safety/panic/history');
  }
}
