import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../common/cache';

export interface WhatsAppSession {
  waId: string;
  startedAt: Date;
  lastActivityAt: Date;
  capturedData: {
    name?: string;
    district?: string;
    serviceInterest?: string;
    urgency?: string;
  };
  messageCount: number;
  userType?: 'patient' | 'nurse' | 'unknown';
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly SESSION_PREFIX = 'wa_session:';

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Get or create a session for a WhatsApp user
   */
  async getOrCreate(waId: string): Promise<WhatsAppSession> {
    const key = this.getKey(waId);
    let session = this.cacheService.get<WhatsAppSession>(key);

    if (!session) {
      session = {
        waId,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        capturedData: {},
        messageCount: 0,
        userType: 'unknown',
      };
      this.logger.debug(`Created new session for ${waId}`);
    }

    // Update activity
    session.lastActivityAt = new Date();
    session.messageCount++;

    this.cacheService.set(key, session, this.SESSION_TTL_MS);

    return session;
  }

  /**
   * Get existing session (without creating)
   */
  get(waId: string): WhatsAppSession | undefined {
    return this.cacheService.get<WhatsAppSession>(this.getKey(waId));
  }

  /**
   * Update session data
   */
  update(waId: string, data: Partial<WhatsAppSession['capturedData']>): void {
    const key = this.getKey(waId);
    const session = this.cacheService.get<WhatsAppSession>(key);

    if (session) {
      session.capturedData = { ...session.capturedData, ...data };
      session.lastActivityAt = new Date();
      this.cacheService.set(key, session, this.SESSION_TTL_MS);
      this.logger.debug(`Updated session for ${waId}:`, data);
    }
  }

  /**
   * Set user type
   */
  setUserType(waId: string, userType: 'patient' | 'nurse' | 'unknown'): void {
    const key = this.getKey(waId);
    const session = this.cacheService.get<WhatsAppSession>(key);

    if (session) {
      session.userType = userType;
      this.cacheService.set(key, session, this.SESSION_TTL_MS);
    }
  }

  /**
   * Delete a session
   */
  delete(waId: string): void {
    this.cacheService.delete(this.getKey(waId));
    this.logger.debug(`Deleted session for ${waId}`);
  }

  /**
   * Check if session exists
   */
  exists(waId: string): boolean {
    return this.cacheService.has(this.getKey(waId));
  }

  private getKey(waId: string): string {
    return `${this.SESSION_PREFIX}${waId}`;
  }
}
