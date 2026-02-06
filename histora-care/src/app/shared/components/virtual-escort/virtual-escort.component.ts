import { Component, Input, inject, signal, DestroyRef, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { VirtualEscortService, EmergencyContact, ActiveShare } from '../../../core/services/virtual-escort.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-virtual-escort',
  templateUrl: './virtual-escort.component.html',
  styleUrls: ['./virtual-escort.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualEscortComponent implements OnInit {
  private virtualEscortService = inject(VirtualEscortService);
  private authService = inject(AuthService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private destroyRef = inject(DestroyRef);

  @Input() serviceRequestId!: string;
  @Input() initialShares: ActiveShare[] = [];

  // State
  isLoading = signal(false);
  isExpanded = signal(false);
  activeShares = signal<ActiveShare[]>([]);

  // Relationships for selection
  readonly relationships = [
    'Familiar',
    'Pareja',
    'Amigo/a',
    'Compañero/a de trabajo',
    'Vecino/a',
    'Otro'
  ];

  ngOnInit() {
    // Subscribe to active shares
    this.virtualEscortService.activeShares$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(shares => {
        this.activeShares.set(shares);
      });

    // Set initial shares if provided
    if (this.initialShares.length > 0) {
      this.virtualEscortService.setActiveShares(this.initialShares);
    }
  }

  toggleExpanded() {
    this.isExpanded.set(!this.isExpanded());
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  }

  async addContact() {
    if (this.activeShares().length >= 3) {
      this.showToast('Maximo 3 contactos de emergencia', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Agregar Contacto de Emergencia',
      cssClass: 'histora-alert histora-alert-primary',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nombre',
        },
        {
          name: 'phone',
          type: 'tel',
          placeholder: 'Telefono (ej: 987654321)',
        },
        {
          name: 'relationship',
          type: 'text',
          placeholder: 'Relacion (ej: Familiar, Pareja)',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Compartir',
          handler: (data) => {
            if (!data.name || !data.phone || !data.relationship) {
              this.showToast('Completa todos los campos', 'warning');
              return false;
            }

            // Validate phone format
            const phoneClean = data.phone.replace(/\D/g, '');
            if (phoneClean.length < 9) {
              this.showToast('Telefono invalido', 'warning');
              return false;
            }

            this.shareWithContact({
              name: data.name.trim(),
              phone: phoneClean,
              relationship: data.relationship.trim(),
            });
            return true;
          }
        },
      ],
    });

    await alert.present();
  }

  private shareWithContact(contact: EmergencyContact) {
    this.isLoading.set(true);

    this.virtualEscortService.shareTracking(this.serviceRequestId, contact)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});

          // Open WhatsApp with pre-filled message
          const user = this.authService.user();
          const nurseName = user?.firstName || 'una enfermera';
          const whatsappUrl = this.virtualEscortService.generateWhatsAppShareLink(
            contact,
            response.shareUrl,
            nurseName
          );

          window.open(whatsappUrl, '_blank');
          this.showToast(`Enlace compartido con ${contact.name}`, 'success');
        },
        error: (err) => {
          console.error('Error sharing tracking:', err);
          this.isLoading.set(false);
          this.showToast(err.error?.message || 'Error al compartir', 'danger');
        }
      });
  }

  async reshareWithContact(share: ActiveShare) {
    const user = this.authService.user();
    const nurseName = user?.firstName || 'una enfermera';

    const whatsappUrl = this.virtualEscortService.generateWhatsAppShareLink(
      { name: share.name, phone: share.phone, relationship: share.relationship },
      share.trackingUrl,
      nurseName
    );

    window.open(whatsappUrl, '_blank');
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  }

  async removeContact(share: ActiveShare) {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-danger',
      header: 'Revocar Acceso',
      message: `¿Dejar de compartir tu ubicacion con ${share.name}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Si, revocar',
          handler: () => {
            this.revokeAccess(share);
          }
        },
      ],
    });

    await alert.present();
  }

  private revokeAccess(share: ActiveShare) {
    this.isLoading.set(true);

    this.virtualEscortService.revokeShare(this.serviceRequestId, share.phone)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.showToast(`Acceso revocado para ${share.name}`, 'success');
        },
        error: (err) => {
          console.error('Error revoking share:', err);
          this.isLoading.set(false);
          this.showToast('Error al revocar acceso', 'danger');
        }
      });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color,
    });
    await toast.present();
  }

  get canAddMore(): boolean {
    return this.activeShares().length < 3;
  }
}
