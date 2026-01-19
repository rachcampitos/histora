import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, of, delay } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import {
  Payment,
  PaymentResponse,
  CreatePaymentRequest,
  PaymentSummary,
  SavedCard,
  CardFormData,
  CulqiToken,
  getPaymentErrorMessage
} from '../models';

// Culqi global type declaration
declare global {
  interface Window {
    Culqi: any;
    culqi: () => void;
  }
}

// Culqi script URL
const CULQI_JS_URL = 'https://checkout.culqi.com/js/v4';

// Check if simulation mode is enabled
const SIMULATION_MODE = environment.paymentSimulationMode;

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private api = inject(ApiService);

  // State signals
  private culqiLoaded = signal(false);
  private culqiLoading = signal(false);

  // Expose loading state and simulation mode
  isLoading = this.culqiLoading.asReadonly();
  isReady = this.culqiLoaded.asReadonly();
  isSimulationMode = signal(SIMULATION_MODE);

  /**
   * Initialize Culqi by loading the script and configuring
   * In simulation mode, just marks as ready without loading Culqi
   */
  async initCulqi(): Promise<void> {
    if (this.culqiLoaded()) {
      return;
    }

    // In simulation mode, skip loading Culqi
    if (SIMULATION_MODE) {
      console.log('[SIMULATION] Payment simulation mode enabled - Culqi not loaded');
      this.culqiLoaded.set(true);
      return;
    }

    if (this.culqiLoading()) {
      return new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          if (this.culqiLoaded()) {
            clearInterval(checkLoaded);
            resolve();
          }
        }, 100);
      });
    }

    this.culqiLoading.set(true);

    try {
      await this.loadCulqiScript();
      this.configureCulqi();
      this.culqiLoaded.set(true);
    } catch (error) {
      console.error('Error loading Culqi:', error);
      throw error;
    } finally {
      this.culqiLoading.set(false);
    }
  }

  private loadCulqiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Culqi) {
        resolve();
        return;
      }

      const existingScript = document.querySelector(`script[src="${CULQI_JS_URL}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        return;
      }

      const script = document.createElement('script');
      script.src = CULQI_JS_URL;
      script.async = true;
      script.onload = () => {
        console.log('CulqiJS loaded successfully');
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load CulqiJS'));
      document.head.appendChild(script);
    });
  }

  private configureCulqi(): void {
    if (!window.Culqi) {
      throw new Error('Culqi not loaded');
    }
    window.Culqi.publicKey = environment.culqiPublicKey;
    window.Culqi.options({
      lang: 'es',
      installments: false,
      paymentMethods: { card: true, yape: true, pagoefectivo: false }
    });
    console.log('Culqi configured successfully');
  }

  /**
   * Create a card token using Culqi
   * In simulation mode, returns a mock token
   */
  createCardToken(cardData: CardFormData): Promise<CulqiToken> {
    // Simulation mode - return mock token
    if (SIMULATION_MODE) {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('[SIMULATION] Mock card token created');
          resolve({
            id: `tkn_test_${Date.now()}`,
            type: 'card',
            email: cardData.email,
            card_number: cardData.number,
            last_four: cardData.number.slice(-4),
            active: true,
            iin: {
              card_brand: this.detectCardBrand(cardData.number),
              card_type: 'credit',
              card_category: 'classic',
              issuer: { name: 'Test Bank', country: 'PE' }
            }
          });
        }, 800); // Simulate network delay
      });
    }

    // Real Culqi integration
    return new Promise((resolve, reject) => {
      if (!window.Culqi) {
        reject(new Error('Culqi no está inicializado'));
        return;
      }

      window.culqi = () => {
        if (window.Culqi.token) {
          resolve(window.Culqi.token);
        } else if (window.Culqi.error) {
          reject(new Error(window.Culqi.error.user_message || 'Error al procesar la tarjeta'));
        }
      };

      window.Culqi.createToken({
        card_number: cardData.number.replace(/\s/g, ''),
        cvv: cardData.cvv,
        expiration_month: cardData.expMonth,
        expiration_year: cardData.expYear.length === 2 ? `20${cardData.expYear}` : cardData.expYear,
        email: cardData.email
      });
    });
  }

  /**
   * Process a card payment
   */
  processCardPayment(
    serviceRequestId: string,
    cardData: CardFormData,
    customerInfo: { email: string; name: string; phone?: string }
  ): Observable<PaymentResponse> {
    return from(this.createCardToken(cardData)).pipe(
      switchMap((token) => {
        const request: CreatePaymentRequest = {
          serviceRequestId,
          method: 'card',
          customerEmail: customerInfo.email,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          cardToken: token.id,
          saveCard: cardData.saveCard
        };
        return this.createPayment(request);
      }),
      catchError((error) => {
        console.error('Card payment error:', error);
        return of({
          success: false,
          error: {
            code: 'processing_error',
            message: error.message || 'Error processing card',
            userMessage: getPaymentErrorMessage('processing_error')
          }
        });
      })
    );
  }

  /**
   * Process a Yape payment
   */
  processYapePayment(
    serviceRequestId: string,
    yapeNumber: string,
    customerInfo: { email: string; name: string; phone?: string }
  ): Observable<PaymentResponse> {
    const request: CreatePaymentRequest = {
      serviceRequestId,
      method: 'yape',
      customerEmail: customerInfo.email,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      yapeNumber
    };
    return this.createPayment(request);
  }

  /**
   * Process cash payment
   */
  processCashPayment(
    serviceRequestId: string,
    customerInfo: { email: string; name: string; phone?: string }
  ): Observable<PaymentResponse> {
    const request: CreatePaymentRequest = {
      serviceRequestId,
      method: 'cash',
      customerEmail: customerInfo.email,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone
    };
    return this.createPayment(request);
  }

  /**
   * Create payment via backend API
   * In simulation mode, returns mock success response
   */
  private createPayment(request: CreatePaymentRequest): Observable<PaymentResponse> {
    // Simulation mode - return mock successful payment
    if (SIMULATION_MODE) {
      console.log('[SIMULATION] Processing payment:', request.method);
      const mockPayment: Payment = {
        _id: `pay_sim_${Date.now()}`,
        serviceRequestId: request.serviceRequestId,
        patientId: 'sim_patient',
        nurseId: 'sim_nurse',
        amount: 8000, // S/. 80.00 mock
        currency: 'PEN',
        serviceFee: 1200,
        culqiFee: 350,
        nurseEarnings: 6450,
        status: request.method === 'cash' ? 'pending' : 'completed',
        method: request.method,
        reference: `PAY-SIM-${Date.now().toString(36).toUpperCase()}`,
        description: 'Pago simulado',
        customerEmail: request.customerEmail,
        customerName: request.customerName,
        createdAt: new Date(),
        paidAt: request.method !== 'cash' ? new Date() : undefined
      };

      return of({ success: true, payment: mockPayment }).pipe(
        delay(1500), // Simulate processing time
        tap(() => console.log('[SIMULATION] Payment completed:', mockPayment.reference))
      );
    }

    // Real API call
    return this.api.post<PaymentResponse>('/service-payments/create', request).pipe(
      tap((response) => {
        if (response.success) {
          console.log('Payment created:', response.payment?.reference);
        } else {
          console.error('Payment failed:', response.error);
        }
      }),
      catchError((error) => {
        console.error('Payment API error:', error);
        return of({
          success: false,
          error: {
            code: error?.error?.code || 'network_error',
            message: error?.error?.message || 'Network error',
            userMessage: getPaymentErrorMessage(error?.error?.code || 'network_error')
          }
        });
      })
    );
  }

  /**
   * Get payment summary for a service request
   * In simulation mode, returns mock summary
   */
  getPaymentSummary(serviceRequestId: string): Observable<PaymentSummary> {
    if (SIMULATION_MODE) {
      // Return mock summary (will be replaced with real data from service request)
      const mockSummary: PaymentSummary = {
        subtotal: 8000, // S/. 80.00
        serviceFee: 0, // No fee shown to patient in MVP
        discount: 0,
        total: 8000,
        currency: 'PEN'
      };
      return of(mockSummary).pipe(delay(300));
    }

    return this.api.get<PaymentSummary>(`/service-payments/summary/${serviceRequestId}`);
  }

  /**
   * Get payment by service request ID
   */
  getPaymentByServiceRequest(serviceRequestId: string): Observable<Payment | null> {
    if (SIMULATION_MODE) {
      return of(null);
    }
    return this.api.get<Payment | null>(`/service-payments/by-request/${serviceRequestId}`).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Get payment history for current user
   */
  getPaymentHistory(): Observable<Payment[]> {
    if (SIMULATION_MODE) {
      return of([]);
    }
    return this.api.get<Payment[]>('/service-payments/history');
  }

  /**
   * Get saved cards for current user
   */
  getSavedCards(): Observable<SavedCard[]> {
    if (SIMULATION_MODE) {
      return of([]);
    }
    return this.api.get<SavedCard[]>('/service-payments/cards');
  }

  /**
   * Delete a saved card
   */
  deleteSavedCard(cardId: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`/service-payments/cards/${cardId}`);
  }

  /**
   * Process payment with a saved card
   */
  processPaymentWithSavedCard(
    serviceRequestId: string,
    cardId: string,
    customerInfo: { email: string; name: string; phone?: string }
  ): Observable<PaymentResponse> {
    if (SIMULATION_MODE) {
      return this.createPayment({
        serviceRequestId,
        method: 'card',
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone
      });
    }

    return this.api.post<PaymentResponse>('/service-payments/charge-saved-card', {
      serviceRequestId,
      cardId,
      customerEmail: customerInfo.email,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone
    }).pipe(
      catchError((error) => of({
        success: false,
        error: {
          code: error?.error?.code || 'processing_error',
          message: error?.error?.message || 'Error processing payment',
          userMessage: getPaymentErrorMessage(error?.error?.code || 'processing_error')
        }
      }))
    );
  }

  /**
   * Verify Yape payment with operation number
   */
  verifyYapePayment(paymentId: string, operationNumber: string): Observable<PaymentResponse> {
    if (SIMULATION_MODE) {
      return of({ success: true }).pipe(delay(500));
    }
    return this.api.post<PaymentResponse>(`/service-payments/${paymentId}/verify-yape`, { operationNumber });
  }

  /**
   * Request refund for a payment
   */
  requestRefund(paymentId: string, reason: string): Observable<PaymentResponse> {
    if (SIMULATION_MODE) {
      return of({ success: true }).pipe(delay(500));
    }
    return this.api.post<PaymentResponse>(`/service-payments/${paymentId}/refund`, { reason });
  }

  // ========== Utility methods ==========

  formatAmount(cents: number, currency: string = 'PEN'): string {
    const amount = cents / 100;
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount);
  }

  solesToCents(soles: number): number {
    return Math.round(soles * 100);
  }

  centsToSoles(cents: number): number {
    return cents / 100;
  }

  validateCardNumber(cardNumber: string): boolean {
    const sanitized = cardNumber.replace(/\s|-/g, '');
    if (!/^\d{13,19}$/.test(sanitized)) return false;

    let sum = 0;
    let isEven = false;
    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  }

  detectCardBrand(cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'diners' | 'unknown' {
    const sanitized = cardNumber.replace(/\s|-/g, '');
    if (/^4/.test(sanitized)) return 'visa';
    if (/^5[1-5]/.test(sanitized) || /^2[2-7]/.test(sanitized)) return 'mastercard';
    if (/^3[47]/.test(sanitized)) return 'amex';
    if (/^3(?:0[0-5]|[68])/.test(sanitized)) return 'diners';
    return 'unknown';
  }

  formatCardNumber(cardNumber: string): string {
    const sanitized = cardNumber.replace(/\s|-/g, '');
    const brand = this.detectCardBrand(sanitized);
    if (brand === 'amex') {
      return sanitized.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').trim();
    }
    return sanitized.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }

  maskCardNumber(cardNumber: string): string {
    if (cardNumber.length <= 4) return `•••• •••• •••• ${cardNumber}`;
    return `•••• •••• •••• ${cardNumber.slice(-4)}`;
  }
}
