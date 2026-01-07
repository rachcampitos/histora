import { Injectable } from '@angular/core';
import { LanguageService } from './language.service';

export interface ExchangeRates {
  [key: string]: number; // Rate relative to USD
}

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  // Exchange rates relative to USD (update periodically or integrate API)
  private exchangeRates: ExchangeRates = {
    USD: 1,
    PEN: 3.75,  // 1 USD = 3.75 PEN
    EUR: 0.92,  // 1 USD = 0.92 EUR
    GBP: 0.79,  // 1 USD = 0.79 GBP
    MXN: 17.20, // 1 USD = 17.20 MXN
  };

  // Currency symbols
  private currencySymbols: { [key: string]: string } = {
    USD: '$',
    PEN: 'S/',
    EUR: '€',
    GBP: '£',
    MXN: '$',
  };

  // Language to preferred currency mapping
  private languageCurrency: { [key: string]: string } = {
    en: 'USD',
    es: 'PEN', // For Peru, could also be MXN for Mexico
    de: 'EUR',
    fr: 'EUR',
  };

  constructor(private languageService: LanguageService) {}

  /**
   * Get the preferred currency based on current language
   */
  getPreferredCurrency(): string {
    const lang = this.languageService.translate.currentLang || 'es';
    return this.languageCurrency[lang] || 'USD';
  }

  /**
   * Convert amount from one currency to another
   */
  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = this.exchangeRates[fromCurrency.toUpperCase()] || 1;
    const toRate = this.exchangeRates[toCurrency.toUpperCase()] || 1;

    // Convert to USD first, then to target currency
    const amountInUsd = amount / fromRate;
    return amountInUsd * toRate;
  }

  /**
   * Format currency with proper symbol and locale
   */
  formatCurrency(amount: number, currency: string): string {
    const lang = this.languageService.translate.currentLang || 'es';
    const locale = lang === 'es' ? 'es-PE' : lang === 'de' ? 'de-DE' : 'en-US';

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      // Fallback if currency code is not supported
      const symbol = this.currencySymbols[currency.toUpperCase()] || currency;
      return `${symbol} ${amount.toFixed(2)}`;
    }
  }

  /**
   * Format amount with automatic conversion based on user's language
   * Shows original and converted amounts if different
   */
  formatWithConversion(amount: number, originalCurrency: string, showBoth = true): string {
    const preferredCurrency = this.getPreferredCurrency();
    const originalFormatted = this.formatCurrency(amount, originalCurrency);

    if (originalCurrency.toUpperCase() === preferredCurrency.toUpperCase()) {
      return originalFormatted;
    }

    const convertedAmount = this.convert(amount, originalCurrency, preferredCurrency);
    const convertedFormatted = this.formatCurrency(convertedAmount, preferredCurrency);

    if (showBoth) {
      return `${originalFormatted} (~${convertedFormatted})`;
    }

    return convertedFormatted;
  }

  /**
   * Get exchange rate between two currencies
   */
  getExchangeRate(fromCurrency: string, toCurrency: string): number {
    const fromRate = this.exchangeRates[fromCurrency.toUpperCase()] || 1;
    const toRate = this.exchangeRates[toCurrency.toUpperCase()] || 1;
    return toRate / fromRate;
  }

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies(): string[] {
    return Object.keys(this.exchangeRates);
  }

  /**
   * Update exchange rates (can be called from an API)
   */
  updateExchangeRates(rates: ExchangeRates): void {
    this.exchangeRates = { ...this.exchangeRates, ...rates };
  }
}
