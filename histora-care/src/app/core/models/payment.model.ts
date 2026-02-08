/**
 * Payment Models for NurseLite
 * Integrates with Culqi payment gateway
 */

// Payment method types
export type PaymentMethod = 'card' | 'yape' | 'cash' | 'plin';

// Payment status
export type PaymentStatusType =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

// Card brands
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'diners' | 'unknown';

/**
 * Payment record
 */
export interface Payment {
  _id: string;
  serviceRequestId: string;
  patientId: string;
  nurseId: string;

  // Amount breakdown
  amount: number;           // Total amount in cents
  currency: string;         // PEN
  serviceFee: number;       // Platform fee in cents
  culqiFee: number;         // Culqi fee in cents
  nurseEarnings: number;    // Amount nurse receives in cents

  // Status
  status: PaymentStatusType;
  method: PaymentMethod;

  // Reference
  reference: string;        // PAY-XXXXX unique reference
  description: string;

  // Culqi data
  culqiChargeId?: string;
  culqiToken?: string;
  culqiOrderId?: string;

  // Card info (masked)
  cardBrand?: CardBrand;
  cardLast4?: string;

  // Yape info
  yapeNumber?: string;
  yapeOperationNumber?: string;

  // Customer info
  customerEmail: string;
  customerName: string;
  customerPhone?: string;

  // Timestamps
  createdAt: Date;
  paidAt?: Date;
  refundedAt?: Date;
  failedAt?: Date;

  // Error handling
  errorCode?: string;
  errorMessage?: string;

  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Create payment request
 */
export interface CreatePaymentRequest {
  serviceRequestId: string;
  method: PaymentMethod;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;

  // For card payments
  cardToken?: string;
  saveCard?: boolean;

  // For Yape
  yapeNumber?: string;
}

/**
 * Payment response from backend
 */
export interface PaymentResponse {
  success: boolean;
  payment?: Payment;
  error?: {
    code: string;
    message: string;
    userMessage: string;
  };
}

/**
 * Culqi token data (from CulqiJS)
 */
export interface CulqiToken {
  id: string;
  type: string;
  email: string;
  card_number: string;
  last_four: string;
  active: boolean;
  iin: {
    card_brand: string;
    card_type: string;
    card_category: string;
    issuer: {
      name: string;
      country: string;
    };
  };
}

/**
 * Card form data
 */
export interface CardFormData {
  number: string;
  name: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  email: string;
  saveCard: boolean;
}

/**
 * Saved card for quick payments
 */
export interface SavedCard {
  _id: string;
  cardBrand: CardBrand;
  last4: string;
  expMonth: string;
  expYear: string;
  cardholderName: string;
  isDefault: boolean;
  culqiCardId: string;
}

/**
 * Payment summary for checkout
 */
export interface PaymentSummary {
  subtotal: number;         // Service price in cents
  serviceFee: number;       // Platform fee in cents
  discount: number;         // Discount in cents
  total: number;            // Final total in cents
  currency: string;         // PEN
}

/**
 * Checkout state
 */
export interface CheckoutState {
  serviceRequestId: string;
  serviceRequest: any;      // Full service request data
  summary: PaymentSummary;
  selectedMethod: PaymentMethod | null;
  savedCards: SavedCard[];
  isProcessing: boolean;
  error: string | null;
}

/**
 * Yape payment info
 */
export interface YapePaymentInfo {
  yapeNumber: string;
  accountName: string;
  amount: number;
  reference: string;
  expiresAt: Date;
  qrCodeUrl?: string;
}

/**
 * Payment error codes
 */
export const PaymentErrorCodes = {
  CARD_DECLINED: 'card_declined',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  INVALID_CARD: 'invalid_card',
  EXPIRED_CARD: 'expired_card',
  INVALID_CVV: 'invalid_cvv',
  PROCESSING_ERROR: 'processing_error',
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled',
  UNKNOWN: 'unknown'
} as const;

/**
 * User-friendly error messages (Spanish)
 */
export const PaymentErrorMessages: Record<string, string> = {
  [PaymentErrorCodes.CARD_DECLINED]: 'Tu banco rechazó el pago. Verifica con tu banco o intenta con otra tarjeta.',
  [PaymentErrorCodes.INSUFFICIENT_FUNDS]: 'Tu tarjeta no tiene fondos suficientes.',
  [PaymentErrorCodes.INVALID_CARD]: 'Los datos de la tarjeta son incorrectos. Verifica e intenta nuevamente.',
  [PaymentErrorCodes.EXPIRED_CARD]: 'Tu tarjeta está vencida. Usa otra tarjeta.',
  [PaymentErrorCodes.INVALID_CVV]: 'El código CVV es incorrecto. Verifica los 3 dígitos al reverso de tu tarjeta.',
  [PaymentErrorCodes.PROCESSING_ERROR]: 'Error al procesar el pago. Por favor intenta nuevamente.',
  [PaymentErrorCodes.NETWORK_ERROR]: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
  [PaymentErrorCodes.TIMEOUT]: 'El pago tardó demasiado. Verifica con tu banco antes de reintentar.',
  [PaymentErrorCodes.CANCELLED]: 'El pago fue cancelado.',
  [PaymentErrorCodes.UNKNOWN]: 'Ocurrió un error inesperado. Por favor intenta nuevamente.'
};

/**
 * Get user-friendly error message
 */
export function getPaymentErrorMessage(code: string): string {
  return PaymentErrorMessages[code] || PaymentErrorMessages[PaymentErrorCodes.UNKNOWN];
}
