import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  token?: string;
  trackingUrl?: string;
  isActive?: boolean;
}

export interface ShareTrackingResponse {
  tracking: unknown;
  shareUrl: string;
  token: string;
}

export interface ActiveShare {
  name: string;
  phone: string;
  relationship: string;
  trackingUrl: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VirtualEscortService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  private _activeShares = new BehaviorSubject<ActiveShare[]>([]);
  activeShares$ = this._activeShares.asObservable();

  shareTracking(serviceRequestId: string, contact: EmergencyContact): Observable<ShareTrackingResponse> {
    return this.http.post<ShareTrackingResponse>(
      `${this.apiUrl}/tracking/${serviceRequestId}/share`,
      contact
    ).pipe(
      tap(response => {
        const current = this._activeShares.value;
        const existing = current.find(s => s.phone === contact.phone);
        if (!existing) {
          this._activeShares.next([...current, {
            name: contact.name,
            phone: contact.phone,
            relationship: contact.relationship,
            trackingUrl: response.shareUrl,
            isActive: true,
          }]);
        }
      })
    );
  }

  revokeShare(serviceRequestId: string, phone: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/tracking/${serviceRequestId}/share`,
      { params: { phone } }
    ).pipe(
      tap(() => {
        const current = this._activeShares.value;
        this._activeShares.next(current.filter(s => s.phone !== phone));
      })
    );
  }

  generateWhatsAppShareLink(contact: EmergencyContact, trackingUrl: string, nurseName: string): string {
    const message = encodeURIComponent(
      `Hola ${contact.name}, soy ${nurseName} de NurseLite. ` +
      `Estoy realizando un servicio de enfermeria y te comparto mi ubicacion en tiempo real para tu tranquilidad. ` +
      `Puedes seguirme aqui: ${trackingUrl}`
    );

    // Format phone for WhatsApp (remove non-digits, add country code if needed)
    let phone = contact.phone.replace(/\D/g, '');
    if (!phone.startsWith('51') && phone.length === 9) {
      phone = '51' + phone; // Add Peru country code
    }

    return `https://wa.me/${phone}?text=${message}`;
  }

  setActiveShares(shares: ActiveShare[]): void {
    this._activeShares.next(shares.filter(s => s.isActive));
  }

  clearShares(): void {
    this._activeShares.next([]);
  }

  getActiveSharesCount(): number {
    return this._activeShares.value.length;
  }
}
