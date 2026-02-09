import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, AlertController, ActionSheetController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { NurseApiService } from '../../core/services/nurse.service';
import { UploadsService } from '../../core/services/uploads.service';

export type SubscriptionPlan = 'free' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'pending' | 'expired' | 'rejected';

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  expiresAt?: Date;
  paymentProof?: string;
  paymentDate?: Date;
  rejectionReason?: string;
}

interface PlanInfo {
  id: SubscriptionPlan;
  name: string;
  price: number;
  popular?: boolean;
  features: string[];
  highlight?: string;
}

type FlowStep = 'plans' | 'payment' | 'proof' | 'pending' | 'success';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.page.html',
  standalone: false,
  styleUrls: ['./subscription.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionPage implements OnInit {
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private actionSheetCtrl = inject(ActionSheetController);
  private nurseApi = inject(NurseApiService);
  private uploadsService = inject(UploadsService);

  // State
  isLoading = signal(true);
  currentStep = signal<FlowStep>('plans');
  selectedPlan = signal<SubscriptionPlan | null>(null);
  isUploading = signal(false);
  proofImage = signal<string | null>(null);
  isCopied = signal<'number' | 'amount' | 'message' | null>(null);

  // Current subscription
  subscription = signal<Subscription>({
    plan: 'free',
    status: 'active'
  });

  // Code Media Yape number
  readonly yapeNumber = '923018997';
  readonly yapeName = 'Code Media EIRL';

  // Plans configuration
  readonly plans: PlanInfo[] = [
    {
      id: 'free',
      name: 'Basico',
      price: 0,
      features: [
        'Hasta 10 solicitudes al mes',
        'Perfil verificado con CEP',
        'Notificaciones en tiempo real',
        'Visibilidad estandar en busquedas',
        'Soporte por chat (48h)'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 39,
      popular: true,
      features: [
        'Solicitudes ilimitadas',
        'Badge "Profesional Verificado"',
        '2x mas visible en busquedas',
        'Estadisticas avanzadas de rendimiento',
        'Soporte prioritario (4h)'
      ],
      highlight: 'Se paga solo con 1 servicio al mes'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 79,
      features: [
        'Todo del Plan Pro',
        'Perfil destacado en resultados',
        '5x mas visible en busquedas',
        'Dashboard profesional con analytics',
        'WhatsApp directo con soporte',
        'Agenda integrada con calendario'
      ],
      highlight: 'Enfermeras Premium generan S/ 2,500-3,500/mes promedio'
    }
  ];

  // Computed
  currentPlan = computed(() => this.subscription().plan);
  isPending = computed(() => this.subscription().status === 'pending');
  isRejected = computed(() => this.subscription().status === 'rejected');

  selectedPlanInfo = computed(() => {
    const planId = this.selectedPlan();
    return this.plans.find(p => p.id === planId) || null;
  });

  formattedExpiryDate = computed(() => {
    const sub = this.subscription();
    if (sub.expiresAt) {
      return new Date(sub.expiresAt).toLocaleDateString('es-PE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return null;
  });

  ngOnInit() {
    this.loadSubscription();
  }

  loadSubscription() {
    this.isLoading.set(true);
    // TODO: Load from API
    // For now, simulate loading
    setTimeout(() => {
      // Check if there's a pending subscription
      const savedSub = localStorage.getItem('nurse_subscription');
      if (savedSub) {
        try {
          const sub = JSON.parse(savedSub);
          this.subscription.set(sub);
          if (sub.status === 'pending') {
            this.currentStep.set('pending');
          }
        } catch (e) {
          console.error('Error parsing subscription:', e);
        }
      }
      this.isLoading.set(false);
    }, 500);
  }

  selectPlan(planId: SubscriptionPlan) {
    if (planId === 'free' || planId === this.currentPlan()) {
      return;
    }
    this.selectedPlan.set(planId);
    this.currentStep.set('payment');
  }

  async copyToClipboard(text: string, type: 'number' | 'amount' | 'message') {
    try {
      await navigator.clipboard.writeText(text);
      this.isCopied.set(type);
      setTimeout(() => this.isCopied.set(null), 2000);
      this.showToast('Copiado al portapapeles', 'success');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.showToast('Error al copiar', 'danger');
    }
  }

  getPaymentMessage(): string {
    const plan = this.selectedPlanInfo();
    return `Suscripcion Plan ${plan?.name || ''} - NurseLite`;
  }

  goToProofUpload() {
    this.currentStep.set('proof');
  }

  async selectProofImage() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar comprobante',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera-outline',
          handler: () => this.captureImage(CameraSource.Camera)
        },
        {
          text: 'Elegir de galeria',
          icon: 'image-outline',
          handler: () => this.captureImage(CameraSource.Photos)
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  private async captureImage(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source
      });

      if (image.dataUrl) {
        this.proofImage.set(image.dataUrl);
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        console.error('Error capturing image:', error);
        this.showToast('Error al capturar imagen', 'danger');
      }
    }
  }

  removeProofImage() {
    this.proofImage.set(null);
  }

  async submitProof() {
    const proof = this.proofImage();
    const plan = this.selectedPlan();

    if (!proof || !plan) {
      this.showToast('Por favor sube el comprobante de pago', 'warning');
      return;
    }

    this.isUploading.set(true);

    try {
      // TODO: Upload proof image to server and create subscription request
      // For now, simulate the upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Save pending subscription locally (for demo)
      const pendingSubscription: Subscription = {
        plan,
        status: 'pending',
        paymentProof: proof,
        paymentDate: new Date()
      };

      localStorage.setItem('nurse_subscription', JSON.stringify(pendingSubscription));
      this.subscription.set(pendingSubscription);
      this.currentStep.set('pending');

      this.showToast('Comprobante enviado correctamente', 'success');
    } catch (error) {
      console.error('Error submitting proof:', error);
      this.showToast('Error al enviar comprobante', 'danger');
    } finally {
      this.isUploading.set(false);
    }
  }

  async confirmPaymentSubmission() {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-primary',
      header: 'Confirmar envio',
      message: 'Al enviar, confirmas que realizaste el pago por Yape y que el comprobante es autentico.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar y enviar',
          handler: () => this.submitProof()
        }
      ]
    });
    await alert.present();
  }

  goBackToPlans() {
    this.selectedPlan.set(null);
    this.proofImage.set(null);
    this.currentStep.set('plans');
  }

  goBackToPayment() {
    this.currentStep.set('payment');
  }

  goToProfile() {
    this.router.navigate(['/nurse/profile']);
  }

  goBack() {
    const step = this.currentStep();
    if (step === 'payment') {
      this.goBackToPlans();
    } else if (step === 'proof') {
      this.goBackToPayment();
    } else {
      this.router.navigate(['/nurse/profile']);
    }
  }

  async contactSupport() {
    window.open('https://wa.me/51923018997?text=Hola, tengo una consulta sobre mi suscripcion en NurseLite', '_system');
  }

  async retrySubscription() {
    // Clear pending subscription and start over
    localStorage.removeItem('nurse_subscription');
    this.subscription.set({ plan: 'free', status: 'active' });
    this.selectedPlan.set(null);
    this.proofImage.set(null);
    this.currentStep.set('plans');
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
