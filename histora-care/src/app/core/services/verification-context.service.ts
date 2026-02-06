import { Injectable } from '@angular/core';

/**
 * Context saved before redirecting to verification.
 * Used to return the user to their original destination after verification.
 */
export interface VerificationContext {
  returnUrl: string;
  nurseId?: string;
  nurseName?: string;
  serviceType?: string;
  timestamp: number;
}

const STORAGE_KEY = 'verification_context';
const CONTEXT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

@Injectable({
  providedIn: 'root'
})
export class VerificationContextService {

  /**
   * Save context before redirecting to verification
   */
  saveContext(context: Omit<VerificationContext, 'timestamp'>): void {
    const fullContext: VerificationContext = {
      ...context,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullContext));
  }

  /**
   * Get saved context if it exists and hasn't expired
   */
  getContext(): VerificationContext | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      const context: VerificationContext = JSON.parse(stored);

      // Check if context has expired
      if (Date.now() - context.timestamp > CONTEXT_EXPIRY_MS) {
        this.clearContext();
        return null;
      }

      return context;
    } catch {
      this.clearContext();
      return null;
    }
  }

  /**
   * Clear saved context
   */
  clearContext(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Check if there's a valid context
   */
  hasContext(): boolean {
    return this.getContext() !== null;
  }

  /**
   * Get CTA text based on context
   */
  getCTAText(): string {
    const context = this.getContext();
    if (context?.nurseName) {
      return `Continuar con ${context.nurseName}`;
    }
    if (context?.returnUrl) {
      return 'Continuar';
    }
    return 'Buscar enfermeras';
  }
}
