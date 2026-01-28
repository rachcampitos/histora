import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginAttempt, LoginAttemptDocument } from '../schema/login-attempt.schema';

/**
 * Account lockout service to prevent brute force attacks
 * Implements progressive lockout based on failed login attempts
 *
 * SECURITY: Uses MongoDB for persistence to:
 * - Survive server restarts
 * - Support horizontal scaling (multiple instances)
 * - Maintain lockout state across deployments
 */
@Injectable()
export class AccountLockoutService {
  private readonly logger = new Logger(AccountLockoutService.name);

  // Configuration
  private readonly MAX_ATTEMPTS = 5; // Lock after 5 failed attempts
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly ATTEMPT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window for counting attempts
  private readonly PROGRESSIVE_LOCKOUT = true; // Enable progressive lockout
  private readonly MAX_LOCKOUT_MS = 24 * 60 * 60 * 1000; // Cap at 24 hours

  constructor(
    @InjectModel(LoginAttempt.name)
    private loginAttemptModel: Model<LoginAttemptDocument>,
  ) {}

  /**
   * Check if an account is currently locked
   * @param identifier - Email or IP address
   * @returns Object with isLocked status and remainingTime in seconds
   */
  async isLocked(identifier: string): Promise<{ isLocked: boolean; remainingTime: number }> {
    const key = identifier.toLowerCase();
    const attempt = await this.loginAttemptModel.findOne({ identifier: key }).exec();

    if (!attempt || !attempt.lockedUntil) {
      return { isLocked: false, remainingTime: 0 };
    }

    const now = new Date();
    if (now < attempt.lockedUntil) {
      const remainingTime = Math.ceil((attempt.lockedUntil.getTime() - now.getTime()) / 1000);
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
  async recordFailedAttempt(identifier: string): Promise<{
    isLocked: boolean;
    attemptsRemaining: number;
    lockoutDuration: number;
  }> {
    const key = identifier.toLowerCase();
    const now = new Date();

    let attempt = await this.loginAttemptModel.findOne({ identifier: key }).exec();

    if (!attempt) {
      attempt = new this.loginAttemptModel({
        identifier: key,
        attempts: 0,
        lastAttempt: now,
        lockedUntil: null,
      });
    }

    // Reset count if outside the attempt window
    const timeSinceLastAttempt = now.getTime() - attempt.lastAttempt.getTime();
    if (timeSinceLastAttempt > this.ATTEMPT_WINDOW_MS) {
      attempt.attempts = 0;
      attempt.lockedUntil = undefined;
    }

    // Increment attempt counter
    attempt.attempts++;
    attempt.lastAttempt = now;

    // Check if we should lock the account
    if (attempt.attempts >= this.MAX_ATTEMPTS) {
      // Calculate lockout duration (progressive if enabled)
      let lockoutDuration = this.LOCKOUT_DURATION_MS;
      if (this.PROGRESSIVE_LOCKOUT) {
        // Double the lockout time for each set of MAX_ATTEMPTS
        const multiplier = Math.floor(attempt.attempts / this.MAX_ATTEMPTS);
        lockoutDuration = this.LOCKOUT_DURATION_MS * Math.pow(2, multiplier - 1);
        // Cap at max lockout
        lockoutDuration = Math.min(lockoutDuration, this.MAX_LOCKOUT_MS);
      }

      attempt.lockedUntil = new Date(now.getTime() + lockoutDuration);

      this.logger.warn(
        `Account locked: ${this.maskIdentifier(key)} after ${attempt.attempts} failed attempts. ` +
          `Locked for ${Math.ceil(lockoutDuration / 1000 / 60)} minutes`,
      );

      await attempt.save();

      return {
        isLocked: true,
        attemptsRemaining: 0,
        lockoutDuration: Math.ceil(lockoutDuration / 1000),
      };
    }

    await attempt.save();

    const attemptsRemaining = this.MAX_ATTEMPTS - attempt.attempts;

    this.logger.debug(
      `Failed login attempt for ${this.maskIdentifier(key)}: ${attempt.attempts}/${this.MAX_ATTEMPTS}`,
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
  async recordSuccessfulLogin(identifier: string): Promise<void> {
    const key = identifier.toLowerCase();
    await this.loginAttemptModel.deleteOne({ identifier: key }).exec();
    this.logger.debug(`Successful login for ${this.maskIdentifier(key)}, attempts reset`);
  }

  /**
   * Manually unlock an account (admin function)
   * @param identifier - Email or IP address
   */
  async unlock(identifier: string): Promise<void> {
    const key = identifier.toLowerCase();
    await this.loginAttemptModel.deleteOne({ identifier: key }).exec();
    this.logger.log(`Account ${this.maskIdentifier(key)} manually unlocked`);
  }

  /**
   * Get current attempt info for an identifier
   * @param identifier - Email or IP address
   */
  async getAttemptInfo(identifier: string): Promise<{
    attempts: number;
    maxAttempts: number;
    isLocked: boolean;
    lockedUntil: Date | null;
  }> {
    const key = identifier.toLowerCase();
    const attempt = await this.loginAttemptModel.findOne({ identifier: key }).exec();
    const lockStatus = await this.isLocked(key);

    return {
      attempts: attempt?.attempts || 0,
      maxAttempts: this.MAX_ATTEMPTS,
      isLocked: lockStatus.isLocked,
      lockedUntil: attempt?.lockedUntil || null,
    };
  }

  /**
   * Mask identifier for logging (GDPR compliance)
   * @param identifier - Email or IP address
   */
  private maskIdentifier(identifier: string): string {
    if (identifier.includes('@')) {
      const [local, domain] = identifier.split('@');
      return `${local.slice(0, 2)}***@${domain}`;
    }
    // For IP addresses, mask last two octets
    const parts = identifier.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
    return identifier.slice(0, 4) + '***';
  }
}
