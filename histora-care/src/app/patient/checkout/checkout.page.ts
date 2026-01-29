import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { PaymentService } from '../../core/services/payment.service';
import { environment } from '../../../environments/environment';
import { ServiceRequestService } from '../../core/services/service-request.service';
import { AuthService } from '../../core/services/auth.service';
import {
  PaymentMethod,
  PaymentSummary,
  SavedCard,
  CardBrand,
  getPaymentErrorMessage
} from '../../core/models';
import { ServiceRequest } from '../../core/models/service-request.model';

type CheckoutStep = 'method' | 'card' | 'yape' | 'processing' | 'success' | 'confirmed' | 'error';
type PaymentFlow = 'online' | 'cash';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  standalone: false,
  styleUrls: ['./checkout.page.scss'],
})
export class CheckoutPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private paymentService = inject(PaymentService);
  private serviceRequestService = inject(ServiceRequestService);
  private authService = inject(AuthService);

  // State signals
  serviceRequest = signal<ServiceRequest | null>(null);
  paymentSummary = signal<PaymentSummary | null>(null);
  savedCards = signal<SavedCard[]>([]);
  isLoading = signal(true);
  currentStep = signal<CheckoutStep>('method');
  selectedMethod = signal<PaymentMethod | null>(null);
  selectedSavedCard = signal<SavedCard | null>(null);
  error = signal<string | null>(null);
  isProcessing = signal(false);
  paymentFlow = signal<PaymentFlow>('online');

  // Form for card payment
  cardForm: FormGroup;

  // User info
  user = this.authService.user;

  // Simulation mode indicator
  isSimulationMode = signal(environment.paymentSimulationMode);

  // Beta mode - only cash payments enabled
  betaMode = signal(true);

  // Computed signals
  canProceed = computed(() => {
    const method = this.selectedMethod();
    if (!method) return false;

    if (method === 'card') {
      // Either selected saved card or valid form
      return !!this.selectedSavedCard() || this.cardForm?.valid;
    }

    if (method === 'yape') {
      return this.yapeNumber().length >= 9;
    }

    if (method === 'cash') {
      return true;
    }

    return false;
  });

  formattedTotal = computed(() => {
    const summary = this.paymentSummary();
    if (!summary) return 'S/. 0.00';
    return this.paymentService.formatAmount(summary.total);
  });

  // Yape phone number
  yapeNumber = signal('');

  constructor() {
    // Initialize card form
    this.cardForm = this.fb.group({
      number: ['', [Validators.required, Validators.minLength(13)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      expMonth: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
      expYear: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(4)]],
      cvv: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      saveCard: [false]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const requestId = params['requestId'];
      if (requestId) {
        this.loadCheckoutData(requestId);
      } else {
        this.error.set('No se encontro la solicitud');
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  async loadCheckoutData(requestId: string) {
    this.isLoading.set(true);
    this.error.set(null);

    const loading = await this.loadingCtrl.create({
      message: 'Cargando...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Load service request
      const request = await this.serviceRequestService.getById(requestId).toPromise();
      if (!request) {
        throw new Error('Solicitud no encontrada');
      }
      this.serviceRequest.set(request);

      // Initialize Culqi
      await this.paymentService.initCulqi();

      // Load payment summary
      if (this.isSimulationMode() && request.service?.price) {
        // In simulation mode, calculate from service request
        const subtotal = Math.round(request.service.price * 100); // Convert to cents
        this.paymentSummary.set({
          subtotal,
          serviceFee: 0,
          discount: 0,
          total: subtotal,
          currency: request.service.currency || 'PEN'
        });
      } else {
        const summary = await this.paymentService.getPaymentSummary(requestId).toPromise();
        if (summary) {
          this.paymentSummary.set(summary);
        }
      }

      // Load saved cards
      try {
        const cards = await this.paymentService.getSavedCards().toPromise();
        this.savedCards.set(cards || []);
      } catch {
        // Ignore saved cards error
        this.savedCards.set([]);
      }

      // Pre-fill email from user
      const user = this.user();
      if (user?.email) {
        this.cardForm.patchValue({ email: user.email });
      }

    } catch (err: any) {
      console.error('Error loading checkout data:', err);
      this.error.set(err?.message || 'Error al cargar los datos');
      await this.showToast('Error al cargar los datos de pago', 'danger');
    } finally {
      this.isLoading.set(false);
      await loading.dismiss();
    }
  }

  // Payment method selection
  selectMethod(method: PaymentMethod) {
    this.selectedMethod.set(method);
    this.selectedSavedCard.set(null);

    if (method === 'card') {
      this.currentStep.set('card');
    } else if (method === 'yape') {
      this.currentStep.set('yape');
    } else if (method === 'cash') {
      // Cash doesn't need extra info
      this.confirmCashPayment();
    }
  }

  // Select saved card
  selectSavedCard(card: SavedCard) {
    this.selectedSavedCard.set(card);
    this.selectedMethod.set('card');
  }

  // Update yape number
  onYapeNumberChange(event: CustomEvent) {
    const value = event.detail.value || '';
    // Only keep digits and limit to 9
    const cleaned = value.replace(/\D/g, '').slice(0, 9);
    this.yapeNumber.set(cleaned);
  }

  // Card number formatting
  formatCardNumber(event: CustomEvent) {
    const value = event.detail.value || '';
    const cleaned = value.replace(/\D/g, '');
    const formatted = this.paymentService.formatCardNumber(cleaned);
    this.cardForm.patchValue({ number: formatted }, { emitEvent: false });
  }

  // Detect card brand for icon
  getCardBrand(): CardBrand {
    const number = this.cardForm.get('number')?.value || '';
    return this.paymentService.detectCardBrand(number);
  }

  // Go back to method selection
  backToMethodSelection() {
    this.currentStep.set('method');
    this.selectedMethod.set(null);
    this.selectedSavedCard.set(null);
    this.yapeNumber.set('');
  }

  // Process payment
  async processPayment() {
    const method = this.selectedMethod();
    if (!method || this.isProcessing()) return;

    if (method === 'card') {
      await this.processCardPayment();
    } else if (method === 'yape') {
      await this.processYapePayment();
    }
  }

  private async processCardPayment() {
    this.isProcessing.set(true);
    this.currentStep.set('processing');

    const request = this.serviceRequest();
    const user = this.user();
    if (!request || !user) {
      this.handlePaymentError('Datos incompletos');
      return;
    }

    const customerInfo = {
      email: this.cardForm.get('email')?.value || user.email || '',
      name: `${user.firstName} ${user.lastName}`,
      phone: undefined
    };

    try {
      let response;

      if (this.selectedSavedCard()) {
        // Pay with saved card
        const card = this.selectedSavedCard()!;
        response = await this.paymentService.processPaymentWithSavedCard(
          request._id,
          card._id,
          customerInfo
        ).toPromise();
      } else {
        // Pay with new card
        const cardData = {
          number: this.cardForm.get('number')?.value.replace(/\s/g, ''),
          name: this.cardForm.get('name')?.value,
          expMonth: this.cardForm.get('expMonth')?.value,
          expYear: this.cardForm.get('expYear')?.value,
          cvv: this.cardForm.get('cvv')?.value,
          email: this.cardForm.get('email')?.value,
          saveCard: this.cardForm.get('saveCard')?.value || false
        };

        response = await this.paymentService.processCardPayment(
          request._id,
          cardData,
          customerInfo
        ).toPromise();
      }

      if (response?.success) {
        this.handlePaymentSuccess();
      } else {
        this.handlePaymentError(response?.error?.userMessage || 'Error al procesar el pago');
      }
    } catch (err: any) {
      console.error('Card payment error:', err);
      this.handlePaymentError(err?.message || 'Error al procesar el pago');
    }
  }

  private async processYapePayment() {
    this.isProcessing.set(true);
    this.currentStep.set('processing');

    const request = this.serviceRequest();
    const user = this.user();
    if (!request || !user) {
      this.handlePaymentError('Datos incompletos');
      return;
    }

    const customerInfo = {
      email: user.email || '',
      name: `${user.firstName} ${user.lastName}`,
      phone: this.yapeNumber()
    };

    try {
      const response = await this.paymentService.processYapePayment(
        request._id,
        this.yapeNumber(),
        customerInfo
      ).toPromise();

      if (response?.success) {
        this.handlePaymentSuccess();
      } else {
        this.handlePaymentError(response?.error?.userMessage || 'Error al procesar el pago');
      }
    } catch (err: any) {
      console.error('Yape payment error:', err);
      this.handlePaymentError(err?.message || 'Error al procesar el pago');
    }
  }

  private async confirmCashPayment() {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-primary',
      header: 'Pago en Efectivo',
      message: 'Pagara al finalizar el servicio. La enfermera confirmara el pago en persona.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: () => this.processCashPayment()
        }
      ]
    });
    await alert.present();
  }

  private async processCashPayment() {
    this.isProcessing.set(true);
    this.currentStep.set('processing');
    this.paymentFlow.set('cash');

    const request = this.serviceRequest();
    const user = this.user();
    if (!request || !user) {
      this.handlePaymentError('Datos incompletos');
      return;
    }

    const customerInfo = {
      email: user.email || '',
      name: `${user.firstName} ${user.lastName}`,
      phone: undefined
    };

    try {
      const response = await this.paymentService.processCashPayment(
        request._id,
        customerInfo
      ).toPromise();

      if (response?.success) {
        this.handleCashConfirmation();
      } else {
        this.handlePaymentError(response?.error?.userMessage || 'Error al registrar la solicitud');
      }
    } catch (err: any) {
      console.error('Cash payment error:', err);
      this.handlePaymentError(err?.message || 'Error al registrar la solicitud');
    }
  }

  private handleCashConfirmation() {
    this.isProcessing.set(false);
    this.currentStep.set('confirmed');

    // Navigate to tracking after brief delay
    setTimeout(() => {
      const request = this.serviceRequest();
      if (request) {
        this.router.navigate(['/patient/tracking', request._id]);
      } else {
        this.router.navigate(['/patient/tabs/home']);
      }
    }, 3000);
  }

  private handlePaymentSuccess() {
    this.isProcessing.set(false);
    this.currentStep.set('success');

    // Navigate to tracking after brief delay
    setTimeout(() => {
      const request = this.serviceRequest();
      if (request) {
        this.router.navigate(['/patient/tracking', request._id]);
      } else {
        this.router.navigate(['/patient/tabs/home']);
      }
    }, 2000);
  }

  private handlePaymentError(message: string) {
    this.isProcessing.set(false);
    this.error.set(message);
    this.currentStep.set('error');
  }

  // Retry payment
  retryPayment() {
    this.error.set(null);
    this.currentStep.set('method');
    this.selectedMethod.set(null);
    this.selectedSavedCard.set(null);
  }

  // Cancel checkout
  async cancelCheckout() {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-danger',
      header: 'Cancelar Pago',
      message: 'Esta seguro que desea cancelar? Su solicitud quedara pendiente de pago.',
      buttons: [
        {
          text: 'Continuar Pagando',
          role: 'cancel'
        },
        {
          text: 'Cancelar',
          role: 'destructive',
          handler: () => {
            this.router.navigate(['/patient/tabs/home']);
          }
        }
      ]
    });
    await alert.present();
  }

  // Get card brand icon
  getCardBrandIcon(brand: CardBrand): string {
    const icons: Record<CardBrand, string> = {
      visa: 'card-outline',
      mastercard: 'card-outline',
      amex: 'card-outline',
      diners: 'card-outline',
      unknown: 'card-outline'
    };
    return icons[brand] || 'card-outline';
  }

  // Format summary item
  formatAmount(cents: number): string {
    return this.paymentService.formatAmount(cents);
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
