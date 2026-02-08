import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { PaymentService } from './payment.service';
import { ApiService } from './api.service';
import { createMockApiService } from '../../../testing';
import { of, firstValueFrom } from 'rxjs';

describe('PaymentService', () => {
  let service: PaymentService;
  let mockApi: ReturnType<typeof createMockApiService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApi = createMockApiService();

    TestBed.configureTestingModule({
      providers: [
        PaymentService,
        { provide: ApiService, useValue: mockApi },
      ],
    });

    service = TestBed.inject(PaymentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should report simulation mode as true (paymentSimulationMode=true in env)', () => {
    expect(service.isSimulationMode()).toBe(true);
  });

  // ============= initCulqi =============

  it('initCulqi() should set culqiLoaded to true in simulation mode', async () => {
    expect(service.isReady()).toBe(false);

    await service.initCulqi();

    expect(service.isReady()).toBe(true);
  });

  it('initCulqi() should not load Culqi script in simulation mode', async () => {
    await service.initCulqi();

    // In simulation mode it just sets the flag, no DOM script loading
    expect(service.isReady()).toBe(true);
    expect(service.isLoading()).toBe(false);
  });

  it('initCulqi() should be idempotent (calling twice does not error)', async () => {
    await service.initCulqi();
    await service.initCulqi();

    expect(service.isReady()).toBe(true);
  });

  // ============= processYapePayment (simulation) =============

  it('processYapePayment() should return mock success in simulation mode', async () => {
    const response = await firstValueFrom(
      service.processYapePayment('sr-1', '987654321', {
        email: 'test@example.com',
        name: 'Maria Torres',
      })
    );
    expect(response.success).toBe(true);
    expect(response.payment).toBeDefined();
    expect(response.payment?.method).toBe('yape');
    expect(response.payment?.serviceRequestId).toBe('sr-1');
  });

  // ============= processDirectPayment (simulation) =============

  it('processDirectPayment() with cash should return mock success with pending status', async () => {
    const response = await firstValueFrom(
      service.processDirectPayment('sr-2', 'cash', {
        email: 'test@example.com',
        name: 'Carlos Perez',
      })
    );
    expect(response.success).toBe(true);
    expect(response.payment).toBeDefined();
    expect(response.payment?.method).toBe('cash');
    expect(response.payment?.status).toBe('pending');
  });

  it('processDirectPayment() with plin should return mock success with completed status', async () => {
    const response = await firstValueFrom(
      service.processDirectPayment('sr-3', 'plin', {
        email: 'test@example.com',
        name: 'Ana Lopez',
      })
    );
    expect(response.success).toBe(true);
    expect(response.payment?.method).toBe('plin');
    expect(response.payment?.status).toBe('completed');
  });

  // ============= getPaymentSummary (simulation) =============

  it('getPaymentSummary() should return mock summary in simulation mode', async () => {
    const summary = await firstValueFrom(service.getPaymentSummary('sr-1'));
    expect(summary.subtotal).toBe(8000);
    expect(summary.total).toBe(8000);
    expect(summary.currency).toBe('PEN');
    expect(summary.serviceFee).toBe(0);
    expect(summary.discount).toBe(0);
  });

  // ============= getPaymentByServiceRequest (simulation) =============

  it('getPaymentByServiceRequest() should return null in simulation mode', async () => {
    const payment = await firstValueFrom(service.getPaymentByServiceRequest('sr-1'));
    expect(payment).toBeNull();
  });

  // ============= getPaymentHistory (simulation) =============

  it('getPaymentHistory() should return empty array in simulation mode', async () => {
    const history = await firstValueFrom(service.getPaymentHistory());
    expect(history).toEqual([]);
  });

  // ============= getSavedCards (simulation) =============

  it('getSavedCards() should return empty array in simulation mode', async () => {
    const cards = await firstValueFrom(service.getSavedCards());
    expect(cards).toEqual([]);
  });

  // ============= deleteSavedCard =============

  it('deleteSavedCard() should call api.delete with correct URL', () => {
    mockApi.delete.mockReturnValue(of({ success: true }));

    service.deleteSavedCard('card-123').subscribe();

    expect(mockApi.delete).toHaveBeenCalledWith('/service-payments/cards/card-123');
  });

  // ============= verifyYapePayment (simulation) =============

  it('verifyYapePayment() should return success in simulation mode', async () => {
    const response = await firstValueFrom(service.verifyYapePayment('pay-1', 'OP-123456'));
    expect(response.success).toBe(true);
  });

  // ============= requestRefund (simulation) =============

  it('requestRefund() should return success in simulation mode', async () => {
    const response = await firstValueFrom(service.requestRefund('pay-1', 'Servicio no realizado'));
    expect(response.success).toBe(true);
  });

  // ============= formatAmount =============

  it('formatAmount() should format cents to currency string for PEN', () => {
    const result = service.formatAmount(8000, 'PEN');
    // Intl.NumberFormat with es-PE and PEN should produce something like "S/ 80.00" or "PEN 80.00"
    expect(result).toContain('80');
    expect(result).toContain('00');
  });

  it('formatAmount() should default to PEN currency', () => {
    const result = service.formatAmount(15050);
    expect(result).toContain('150');
    expect(result).toContain('50');
  });

  it('formatAmount() should handle zero', () => {
    const result = service.formatAmount(0);
    expect(result).toContain('0');
  });

  // ============= solesToCents =============

  it('solesToCents() should convert soles to cents', () => {
    expect(service.solesToCents(80)).toBe(8000);
    expect(service.solesToCents(0)).toBe(0);
    expect(service.solesToCents(1.5)).toBe(150);
    expect(service.solesToCents(0.01)).toBe(1);
  });

  // ============= centsToSoles =============

  it('centsToSoles() should convert cents to soles', () => {
    expect(service.centsToSoles(8000)).toBe(80);
    expect(service.centsToSoles(0)).toBe(0);
    expect(service.centsToSoles(150)).toBe(1.5);
    expect(service.centsToSoles(1)).toBe(0.01);
  });

  // ============= validateCardNumber =============

  it('validateCardNumber() should return true for valid Visa number (Luhn)', () => {
    expect(service.validateCardNumber('4111111111111111')).toBe(true);
  });

  it('validateCardNumber() should return true for valid Mastercard number', () => {
    expect(service.validateCardNumber('5500000000000004')).toBe(true);
  });

  it('validateCardNumber() should return false for invalid number', () => {
    expect(service.validateCardNumber('1234567890')).toBe(false);
  });

  it('validateCardNumber() should return false for non-numeric input', () => {
    expect(service.validateCardNumber('abcdefghijklm')).toBe(false);
  });

  it('validateCardNumber() should handle spaces and dashes in card number', () => {
    expect(service.validateCardNumber('4111 1111 1111 1111')).toBe(true);
    expect(service.validateCardNumber('4111-1111-1111-1111')).toBe(true);
  });

  it('validateCardNumber() should return false for too-short numbers', () => {
    expect(service.validateCardNumber('411111')).toBe(false);
  });

  // ============= detectCardBrand =============

  it('detectCardBrand() should detect Visa (starts with 4)', () => {
    expect(service.detectCardBrand('4111111111111111')).toBe('visa');
  });

  it('detectCardBrand() should detect Mastercard (starts with 51-55)', () => {
    expect(service.detectCardBrand('5111111111111111')).toBe('mastercard');
    expect(service.detectCardBrand('5500000000000004')).toBe('mastercard');
  });

  it('detectCardBrand() should detect Amex (starts with 34 or 37)', () => {
    expect(service.detectCardBrand('340000000000000')).toBe('amex');
    expect(service.detectCardBrand('370000000000000')).toBe('amex');
  });

  it('detectCardBrand() should detect Diners (starts with 300-305, 36, 38)', () => {
    expect(service.detectCardBrand('30000000000000')).toBe('diners');
    expect(service.detectCardBrand('36000000000000')).toBe('diners');
    expect(service.detectCardBrand('38000000000000')).toBe('diners');
  });

  it('detectCardBrand() should return unknown for unrecognized prefixes', () => {
    expect(service.detectCardBrand('9999999999999999')).toBe('unknown');
  });

  // ============= formatCardNumber =============

  it('formatCardNumber() should add spaces every 4 digits for Visa', () => {
    expect(service.formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
  });

  it('formatCardNumber() should format Amex as 4-6-5', () => {
    expect(service.formatCardNumber('340000000000000')).toBe('3400 000000 00000');
  });

  it('formatCardNumber() should handle already-spaced input', () => {
    expect(service.formatCardNumber('4111 1111 1111 1111')).toBe('4111 1111 1111 1111');
  });

  // ============= maskCardNumber =============

  it('maskCardNumber() should mask all but last 4 digits', () => {
    expect(service.maskCardNumber('4111111111111111')).toBe('•••• •••• •••• 1111');
  });

  it('maskCardNumber() should handle short input (4 or fewer digits)', () => {
    expect(service.maskCardNumber('1111')).toBe('•••• •••• •••• 1111');
  });

  it('maskCardNumber() should handle last-4 only input', () => {
    expect(service.maskCardNumber('9876')).toBe('•••• •••• •••• 9876');
  });

  // ============= createCardToken (simulation mode) =============

  it('createCardToken() should return mock token in simulation mode', async () => {
    const cardData = {
      number: '4111111111111111',
      name: 'Test User',
      cvv: '123',
      expMonth: '12',
      expYear: '25',
      email: 'test@example.com',
      saveCard: false
    };

    const token = await service.createCardToken(cardData);

    expect(token).toBeDefined();
    expect(token.id).toContain('tkn_test_');
    expect(token.type).toBe('card');
    expect(token.email).toBe('test@example.com');
    expect(token.last_four).toBe('1111');
    expect(token.iin.card_brand).toBe('visa');
  });

  it('createCardToken() should detect Mastercard brand in mock', async () => {
    const cardData = {
      number: '5500000000000004',
      name: 'Test User',
      cvv: '123',
      expMonth: '12',
      expYear: '25',
      email: 'test@example.com',
      saveCard: false
    };

    const token = await service.createCardToken(cardData);

    expect(token.iin.card_brand).toBe('mastercard');
  });

  // ============= processCardPayment =============

  it('processCardPayment() should process card payment in simulation mode', async () => {
    const cardData = {
      number: '4111111111111111',
      name: 'Test User',
      cvv: '123',
      expMonth: '12',
      expYear: '25',
      email: 'test@example.com',
      saveCard: false
    };

    const customerInfo = {
      email: 'test@example.com',
      name: 'Test User',
      phone: '987654321'
    };

    const response = await firstValueFrom(
      service.processCardPayment('sr-123', cardData, customerInfo)
    );

    expect(response.success).toBe(true);
    expect(response.payment).toBeDefined();
    expect(response.payment?.method).toBe('card');
  });

  it('processCardPayment() should handle token creation errors', async () => {
    const cardData = {
      number: '0000000000000000', // Invalid number
      name: 'Test User',
      cvv: '123',
      expMonth: '12',
      expYear: '25',
      email: 'test@example.com',
      saveCard: false
    };

    const customerInfo = {
      email: 'test@example.com',
      name: 'Test User'
    };

    // Mock createCardToken to throw error
    vi.spyOn(service, 'createCardToken').mockRejectedValue(new Error('Invalid card'));

    const response = await firstValueFrom(
      service.processCardPayment('sr-123', cardData, customerInfo)
    );

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe('processing_error');
  });

  // ============= processPaymentWithSavedCard (simulation mode) =============

  it('processPaymentWithSavedCard() should use createPayment in simulation mode', async () => {
    const customerInfo = {
      email: 'test@example.com',
      name: 'Test User',
      phone: '987654321'
    };

    const response = await firstValueFrom(
      service.processPaymentWithSavedCard('sr-456', 'card-123', customerInfo)
    );

    expect(response.success).toBe(true);
    expect(response.payment).toBeDefined();
  });

  // ============= detectCardBrand - additional cases =============

  it('detectCardBrand() should detect Mastercard with 22-27 prefix', () => {
    expect(service.detectCardBrand('2221000000000000')).toBe('mastercard');
    expect(service.detectCardBrand('2720000000000000')).toBe('mastercard');
  });

  // ============= formatCardNumber - edge cases =============

  it('formatCardNumber() should handle card numbers with dashes', () => {
    expect(service.formatCardNumber('4111-1111-1111-1111')).toBe('4111 1111 1111 1111');
  });

  it('formatCardNumber() should handle partial card numbers', () => {
    expect(service.formatCardNumber('411111')).toBe('4111 11');
  });

  // ============= validateCardNumber - edge cases =============

  it('validateCardNumber() should return false for too-long numbers', () => {
    expect(service.validateCardNumber('41111111111111111111')).toBe(false);
  });

  // ============= utility methods - edge cases =============

  it('formatAmount() should handle negative amounts', () => {
    const result = service.formatAmount(-5000, 'PEN');
    expect(result).toContain('50');
  });

  it('solesToCents() should handle decimal precision', () => {
    expect(service.solesToCents(1.567)).toBe(157);
  });

  it('centsToSoles() should handle large amounts', () => {
    expect(service.centsToSoles(1000000)).toBe(10000);
  });

  it('maskCardNumber() should handle empty string', () => {
    expect(service.maskCardNumber('')).toBe('•••• •••• •••• ');
  });
});
