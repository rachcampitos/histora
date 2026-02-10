import { Component, OnInit, OnDestroy, inject, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { ChatModalComponent } from '../../shared/components/chat-modal/chat-modal.component';
import { ServiceRequestService } from '../../core/services/service-request.service';
import { NurseApiService } from '../../core/services/nurse.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { VirtualEscortService, ActiveShare } from '../../core/services/virtual-escort.service';
import { ServiceRequest, Nurse } from '../../core/models';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-active-service',
  templateUrl: './active-service.page.html',
  standalone: false,
  styleUrls: ['./active-service.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveServicePage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private requestService = inject(ServiceRequestService);
  private nurseApi = inject(NurseApiService);
  private geoService = inject(GeolocationService);
  private wsService = inject(WebSocketService);
  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private virtualEscortService = inject(VirtualEscortService);
  private alertCtrl = inject(AlertController);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private destroyRef = inject(DestroyRef);

  // State
  request = signal<ServiceRequest | null>(null);
  nurse = signal<Nurse | null>(null);
  isLoading = signal(true);
  elapsedTime = signal('00:00:00');
  activeShares = signal<ActiveShare[]>([]);
  chatUnreadCount = signal(0);
  private chatRoomId: string | null = null;

  // Security code state
  codeDigits = signal<string[]>(['', '', '', '', '', '']);
  isVerifyingCode = signal(false);
  codeVerified = computed(() => !!this.request()?.codeVerifiedAt);

  // Location broadcasting
  private locationBroadcastInterval: ReturnType<typeof setInterval> | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private startTime: Date | null = null;

  // Computed
  patientName = computed(() => {
    const req = this.request();
    if (!req?.patient) return 'Paciente';
    return `${req.patient.firstName || ''} ${req.patient.lastName || ''}`.trim() || 'Paciente';
  });

  patientInitials = computed(() => {
    const patient = this.request()?.patient;
    if (patient) {
      const first = patient.firstName?.charAt(0) || '';
      const last = patient.lastName?.charAt(0) || '';
      if (first || last) return (first + last).toUpperCase();
    }
    return 'P';
  });

  patientAddress = computed(() => {
    const req = this.request();
    return req?.location?.address || 'Direccion no disponible';
  });

  serviceType = computed(() => {
    const req = this.request();
    return this.getServiceTypeLabel(req?.service?.category || '');
  });

  serviceName = computed(() => {
    const req = this.request();
    return req?.service?.name || 'Servicio';
  });

  statusLabel = computed(() => {
    const req = this.request();
    return this.getStatusLabel(req?.status || '');
  });

  statusColor = computed(() => {
    const req = this.request();
    return this.getStatusColor(req?.status || '');
  });

  mapUrl = computed(() => {
    const req = this.request();
    if (!req?.location?.coordinates) return '';

    const [lng, lat] = req.location.coordinates;
    if (!lat || !lng) return '';

    const zoom = 15;
    const width = 400;
    const height = 200;

    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+ef4444(${lng},${lat})/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${environment.mapboxToken}`;
  });

  ngOnInit() {
    const requestId = this.route.snapshot.paramMap.get('requestId');
    if (!requestId) {
      this.router.navigate(['/nurse/dashboard']);
      return;
    }

    this.loadData(requestId);
    this.initializeWebSocket();
  }

  ngOnDestroy() {
    this.stopLocationBroadcast();
    this.stopTimer();
    this.virtualEscortService.clearShares();
  }

  private async loadData(requestId: string) {
    this.isLoading.set(true);

    // Load request details
    this.requestService.getById(requestId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (request) => {
          this.request.set(request);
          this.isLoading.set(false);

          // Load chat unread count
          this.loadChatUnread(request._id);

          // Start timer if service is in progress
          if (['in_progress', 'arrived', 'on_the_way'].includes(request.status)) {
            // Find accepted status in history to get start time
            const acceptedStatus = request.statusHistory?.find(h => h.status === 'accepted');
            this.startTime = acceptedStatus ? new Date(acceptedStatus.changedAt) : new Date();
            this.startTimer();
          }

          // Start location broadcast if on the way
          if (request.status === 'on_the_way') {
            this.startLocationBroadcast(request._id);
          }
        },
        error: (err) => {
          console.error('Error loading request:', err);
          this.isLoading.set(false);
          this.showToast('Error al cargar servicio', 'danger');
          this.router.navigate(['/nurse/dashboard']);
        }
      });

    // Load nurse profile
    this.nurseApi.getMyProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nurse) => this.nurse.set(nurse),
        error: (err) => console.error('Error loading profile:', err)
      });
  }

  private async initializeWebSocket() {
    const token = await this.authService.getToken();
    if (token) {
      this.wsService.connect(token);
    }
  }

  private startTimer() {
    if (this.timerInterval) return;

    this.updateElapsedTime();
    this.timerInterval = setInterval(() => {
      this.updateElapsedTime();
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private updateElapsedTime() {
    if (!this.startTime) return;

    const now = new Date();
    const diff = now.getTime() - this.startTime.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.elapsedTime.set(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
  }

  private async startLocationBroadcast(requestId: string) {
    if (this.locationBroadcastInterval) return;

    this.wsService.joinTrackingRoom(requestId);

    // Broadcast immediately
    await this.broadcastLocation();

    // Then every 5 seconds
    this.locationBroadcastInterval = setInterval(async () => {
      await this.broadcastLocation();
    }, 5000);
  }

  private stopLocationBroadcast() {
    if (this.locationBroadcastInterval) {
      clearInterval(this.locationBroadcastInterval);
      this.locationBroadcastInterval = null;
    }

    const req = this.request();
    if (req) {
      this.wsService.leaveTrackingRoom(req._id);
    }
  }

  private async broadcastLocation() {
    const req = this.request();
    const nurseData = this.nurse();

    if (!req || !nurseData) return;

    try {
      const position = await this.geoService.getCurrentPosition();
      if (position) {
        this.wsService.sendLocationUpdate({
          nurseId: nurseData._id,
          requestId: req._id,
          latitude: position.latitude,
          longitude: position.longitude,
          heading: position.heading ?? undefined,
          speed: position.speed ?? undefined
        });
      }
    } catch (error) {
      console.error('Error broadcasting location:', error);
    }
  }

  // Action handlers
  async startOnTheWay() {
    const req = this.request();
    if (!req) return;

    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-primary',
      header: 'Ir al Paciente',
      message: 'Confirmas que vas en camino al paciente?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => {
            this.requestService.updateStatus(req._id, 'on_the_way')
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (updated) => {
                  this.request.set({ ...updated, patient: updated.patient || req.patient });
                  this.showToast('En camino al paciente', 'success');
                  this.startLocationBroadcast(req._id);
                  this.startTime = new Date();
                  this.startTimer();
                },
                error: () => this.showToast('Error al actualizar estado', 'danger')
              });
          }
        }
      ]
    });
    await alert.present();
  }

  async markArrival() {
    const req = this.request();
    if (!req) return;

    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-primary',
      header: 'Confirmar Llegada',
      message: 'Confirmas que llegaste al domicilio del paciente?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => {
            this.requestService.updateStatus(req._id, 'arrived')
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (updated) => {
                  this.request.set({ ...updated, patient: updated.patient || req.patient });
                  this.wsService.notifyArrival(req._id);
                  this.showToast('Llegada confirmada', 'success');
                  this.stopLocationBroadcast();
                },
                error: () => this.showToast('Error al actualizar estado', 'danger')
              });
          }
        }
      ]
    });
    await alert.present();
  }

  async beginService() {
    const req = this.request();
    if (!req) return;

    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-primary',
      header: 'Iniciar Procedimiento',
      message: 'Confirmas que inicias el procedimiento?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => {
            this.requestService.updateStatus(req._id, 'in_progress')
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (updated) => {
                  this.request.set({ ...updated, patient: updated.patient || req.patient });
                  this.wsService.notifyServiceStarted(req._id);
                  this.showToast('Servicio iniciado', 'success');
                },
                error: () => this.showToast('Error al actualizar estado', 'danger')
              });
          }
        }
      ]
    });
    await alert.present();
  }

  async completeService() {
    const req = this.request();
    if (!req) return;

    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-success',
      header: 'Completar Servicio',
      message: 'Confirmas que completaste el servicio?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Completar',
          handler: () => {
            this.requestService.updateStatus(req._id, 'completed')
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => {
                  this.wsService.notifyServiceCompleted(req._id);
                  this.stopTimer();
                  this.showToast('Servicio completado!', 'success');
                  this.virtualEscortService.clearShares();
                  // Navigate back to dashboard
                  this.router.navigate(['/nurse/dashboard']);
                },
                error: () => this.showToast('Error al completar servicio', 'danger')
              });
          }
        }
      ]
    });
    await alert.present();
  }

  openNavigation() {
    const req = this.request();
    if (!req?.location?.coordinates) return;

    const [lng, lat] = req.location.coordinates;
    if (!lat || !lng) return;

    // Try Google Maps first, fallback to Apple Maps on iOS
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(googleMapsUrl, '_blank');
  }

  callPatient() {
    const req = this.request();
    if (!req?.patient?.phone) {
      this.showToast('Numero no disponible', 'warning');
      return;
    }

    window.open(`tel:${req.patient.phone}`, '_self');
  }

  async openChat() {
    const req = this.request();
    if (!req) return;

    const patientName = this.patientName();

    const modal = await this.modalCtrl.create({
      component: ChatModalComponent,
      componentProps: {
        serviceRequestId: req._id,
        otherUserName: patientName,
        otherUserRole: 'patient'
      },
      cssClass: 'chat-modal-fullscreen',
      canDismiss: true
    });

    await modal.present();
    await modal.onWillDismiss();
    this.chatUnreadCount.set(0);
  }

  private async loadChatUnread(requestId: string) {
    // Ensure chat WebSocket is connected
    await this.chatService.connect();

    try {
      const room = await this.chatService.getRoomByServiceRequest(requestId);
      if (room) {
        this.chatRoomId = room._id;
        const userId = this.authService.user()?.id;
        if (userId && room.unreadCount) {
          this.chatUnreadCount.set(room.unreadCount[userId] || 0);
        }
      }
    } catch {
      // Non-critical, ignore
    }

    // Subscribe to room notifications for new messages (fires when user is NOT in the chat room)
    this.chatService.onRoomNotification()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        if (this.chatRoomId && data.roomId === this.chatRoomId) {
          this.chatUnreadCount.update(c => c + 1);
        } else if (!this.chatRoomId) {
          // Room may have been created - try to fetch it
          this.chatService.getRoomByServiceRequest(requestId).then(room => {
            if (room) {
              this.chatRoomId = room._id;
              if (data.roomId === room._id) {
                this.chatUnreadCount.update(c => c + 1);
              }
            }
          });
        }
      });

    // Subscribe to all-read events (fires when markAllAsRead is called in chat modal)
    this.chatService.onAllRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        if (this.chatRoomId && data.roomId === this.chatRoomId) {
          this.chatUnreadCount.set(0);
        }
      });

  }

  onCodeInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    // Update digit
    const digits = [...this.codeDigits()];
    digits[index] = value.slice(-1);
    this.codeDigits.set(digits);

    if (value && index < 5) {
      // Auto-focus next input
      const nextInput = input.parentElement?.querySelector(`input:nth-child(${index + 2})`) as HTMLInputElement;
      nextInput?.focus();
    }

    // Auto-submit when all 6 digits entered
    const fullCode = digits.join('');
    if (fullCode.length === 6 && digits.every(d => d !== '')) {
      this.verifySecurityCode(fullCode);
    }
  }

  onCodeKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      const digits = [...this.codeDigits()];
      if (!digits[index] && index > 0) {
        // Focus previous input on backspace when current is empty
        const input = event.target as HTMLInputElement;
        const prevInput = input.parentElement?.querySelector(`input:nth-child(${index})`) as HTMLInputElement;
        prevInput?.focus();
      }
      digits[index] = '';
      this.codeDigits.set(digits);
    }
  }

  private async verifySecurityCode(code: string) {
    const req = this.request();
    if (!req) return;

    this.isVerifyingCode.set(true);

    try {
      const updated = await firstValueFrom(this.requestService.verifySecurityCode(req._id, code));
      this.request.set({ ...updated, patient: updated.patient || req.patient });
      this.showToast('Identidad verificada correctamente', 'success');
    } catch (err: any) {
      const msg = err?.error?.message || 'Codigo incorrecto';
      this.showToast(msg, 'danger');
      // Clear input
      this.codeDigits.set(['', '', '', '', '', '']);
      // Re-focus first input
      setTimeout(() => {
        const firstInput = document.querySelector('.code-inputs input') as HTMLInputElement;
        firstInput?.focus();
      }, 100);
    } finally {
      this.isVerifyingCode.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/nurse/dashboard']);
  }

  // Helper methods
  private getServiceTypeLabel(category: string): string {
    const labels: Record<string, string> = {
      injection: 'Inyectable',
      wound_care: 'Curacion',
      catheter: 'Sonda',
      vital_signs: 'Signos Vitales',
      iv_therapy: 'Terapia IV',
      blood_draw: 'Toma de Muestra',
      medication: 'Medicamentos',
      elderly_care: 'Adulto Mayor',
      post_surgery: 'Post-operatorio',
      other: 'Otro',
    };
    return labels[category] || category;
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      accepted: 'Aceptado',
      on_the_way: 'En Camino',
      arrived: 'En el Domicilio',
      in_progress: 'En Servicio',
      completed: 'Completado',
    };
    return labels[status] || status;
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      accepted: 'primary',
      on_the_way: 'warning',
      arrived: 'warning',
      in_progress: 'secondary',
      completed: 'success',
    };
    return colors[status] || 'medium';
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }

  // Get next action based on status
  get nextAction(): { label: string; action: () => void; color: string; disabled?: boolean; icon?: string } | null {
    const req = this.request();
    if (!req) return null;

    switch (req.status) {
      case 'accepted':
        return { label: 'Ir al paciente', action: () => this.startOnTheWay(), color: 'primary' };
      case 'on_the_way':
        return { label: 'Llegue', action: () => this.markArrival(), color: 'secondary' };
      case 'arrived':
        return {
          label: this.codeVerified() ? 'Iniciar Servicio' : 'Verificar codigo para iniciar',
          action: () => this.beginService(),
          color: this.codeVerified() ? 'tertiary' : 'medium',
          disabled: !this.codeVerified(),
          icon: this.codeVerified() ? undefined : 'lock-closed',
        };
      case 'in_progress':
        return { label: 'Completar Servicio', action: () => this.completeService(), color: 'success' };
      default:
        return null;
    }
  }
}
