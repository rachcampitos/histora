import { Injectable, Logger } from '@nestjs/common';

interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

/**
 * Account lockout service to prevent brute force attacks
 * Implements progressive lockout based on failed login attempts
 */
@Injectable()
export class AccountLockoutService {
  private readonly logger = new Logger(AccountLockoutService.name);

  // In-memory store for login attempts (consider Redis for production scaling)
  private readonly attempts = new Map<string, LoginAttempt>();

  // Configuration
  private readonly MAX_ATTEMPTS = 5; // Lock after 5 failed attempts
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly ATTEMPT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window for counting attempts
  private readonly PROGRESSIVE_LOCKOUT = true; // Enable progressive lockout

  /**
   * Check if an account is currently locked
   * @param identifier - Email or IP address
   * @returns Object with isLocked status and remainingTime in seconds
   */
  isLocked(identifier: string): { isLocked: boolean; remainingTime: number } {
    const attempt = this.attempts.get(identifier.toLowerCase());

    if (!attempt || !attempt.lockedUntil) {
      return { isLocked: false, remainingTime: 0 };
    }

    const now = Date.now();
    if (now < attempt.lockedUntil) {
      const remainingTime = Math.ceil((attempt.lockedUntil - now) / 1000);
      return { isLocked: true, remainingTime };
    }

    // Lockout expired, but keep the attempt count for progressive lockout
    return { isLocked: false, remainingTime: 0 };
  }

  /**
   * Record a failed login attempt
   * @param identifier - Email or IP address
   * @returns Object with isLocked status and details
   */
  recordFailedAttempt(identifier: string): {
    isLocked: boolean;
    attemptsRemaining: number;
    lockoutDuration: number;
  } {
    const key = identifier.toLowerCase();
    const now = Date.now();

    let attempt = this.attempts.get(key);

    if (!attempt) {
      attempt = {
        count: 0,
        lastAttempt: now,
        lockedUntil: null,
      };
    }

    // Reset count if outside the attempt window
    if (now - attempt.lastAttempt > this.ATTEMPT_WINDOW_MS) {
      attempt.count = 0;
      attempt.lockedUntil = null;
    }

    // Increment attempt counter
    attempt.count++;
    attempt.lastAttempt = now;

    // Check if we should lock the account
    if (attempt.count >= this.MAX_ATTEMPTS) {
      // Calculate lockout duration (progressive if enabled)
      let lockoutDuration = this.LOCKOUT_DURATION_MS;
      if (this.PROGRESSIVE_LOCKOUT) {
        // Double the lockout time for each set of MAX_ATTEMPTS
        const multiplier = Math.floor(attempt.count / this.MAX_ATTEMPTS);
        lockoutDuration = this.LOCKOUT_DURATION_MS * Math.pow(2, multiplier - 1);
        // Cap at 24 hours
        lockoutDuration = Math.min(lockoutDuration, 24 * 60 * 60 * 1000);
      }

      attempt.lockedUntil = now + lockoutDuration;

      this.logger.warn(
        `Account locked: ${key} after ${attempt.count} failed attempts. ` +
          `Locked for ${Math.ceil(lockoutDuration / 1000 / 60)} minutes`,
      );

      this.attempts.set(key, attempt);

      return {
        isLocked: true,
        attemptsRemaining: 0,
        lockoutDuration: Math.ceil(lockoutDuration / 1000),
      };
    }

    this.attempts.set(key, attempt);

    const attemptsRemaining = this.MAX_ATTEMPTS - attempt.count;

    this.logger.debug(
      `Failed login attempt for ${key}: ${attempt.count}/${this.MAX_ATTEMPTS}`,
    );

    return {
      isLocked: false,
      attemptsRemaining,
      lockoutDuration: 0,
    };
  }

  /**
   * Record a successful login - resets the attempt counter
   * @param identifier - Email or IP address
   */
  recordSuccessfulLogin(identifier: string): void {
    const key = identifier.toLowerCase();
    this.attempts.delete(key);
    this.logger.debug(`Successful login for ${key}, attempts reset`);
  }

  /**
   * Manually unlock an account (admin function)
   * @param identifier - Email or IP address
   */
  unlock(identifier: string): void {
    const key = identifier.toLowerCase();
    this.attempts.delete(key);
    this.logger.log(`Account ${key} manually unlocked`);
  }

  /**
   * Get current attempt info for an identifier
   * @param identifier - Email or IP address
   */
  getAttemptInfo(identifier: string): {
    attempts: number;
    maxAttempts: number;
    isLocked: boolean;
    lockedUntil: Date | null;
  } {
    const key = identifier.toLowerCase();
    const attempt = this.attempts.get(key);
    const lockStatus = this.isLocked(key);

    return {
      attempts: attempt?.count || 0,
      maxAttempts: this.MAX_ATTEMPTS,
      isLocked: lockStatus.isLocked,
      lockedUntil: attempt?.lockedUntil ? new Date(attempt.lockedUntil) : null,
    };
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, attempt] of this.attempts.entries()) {
      // Remove entries that are beyond the attempt window and not locked
      if (
        now - attempt.lastAttempt > this.ATTEMPT_WINDOW_MS &&
        (!attempt.lockedUntil || now > attempt.lockedUntil)
      ) {
        this.attempts.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired lockout entries`);
    }
  }
}
