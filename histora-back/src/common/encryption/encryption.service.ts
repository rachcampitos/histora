import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Encryption service for PHI (Protected Health Information)
 * Uses AES-256-GCM for authenticated encryption
 * HIPAA/GDPR compliant encryption at rest
 */
@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly logger = new Logger(EncryptionService.name);
  private encryptionKey: Buffer | null = null;
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16; // 128 bits
  private readonly authTagLength = 16; // 128 bits
  private readonly saltLength = 32;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const keyString = this.configService.get<string>('PHI_ENCRYPTION_KEY');

    if (keyString) {
      // If key is provided, derive a 256-bit key using PBKDF2
      const salt = crypto.createHash('sha256').update('histora-phi-salt').digest();
      this.encryptionKey = crypto.pbkdf2Sync(keyString, salt, 100000, 32, 'sha512');
      this.logger.log('PHI encryption initialized successfully');
    } else {
      this.logger.warn(
        'PHI_ENCRYPTION_KEY not configured. PHI encryption disabled. ' +
        'Set PHI_ENCRYPTION_KEY environment variable for HIPAA compliance.',
      );
    }
  }

  /**
   * Check if encryption is enabled
   */
  isEnabled(): boolean {
    return this.encryptionKey !== null;
  }

  /**
   * Encrypt sensitive data
   * @param plaintext The text to encrypt
   * @returns Encrypted string in format: iv:authTag:ciphertext (base64 encoded)
   */
  encrypt(plaintext: string): string {
    if (!this.encryptionKey) {
      // If encryption is not enabled, return plaintext as-is
      // This allows the system to work without encryption during development
      return plaintext;
    }

    if (!plaintext || plaintext.trim() === '') {
      return plaintext;
    }

    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv, {
        authTagLength: this.authTagLength,
      });

      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:ciphertext (all base64 encoded)
      return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypt sensitive data
   * @param ciphertext The encrypted string in format: iv:authTag:ciphertext
   * @returns Decrypted plaintext
   */
  decrypt(ciphertext: string): string {
    if (!this.encryptionKey) {
      // If encryption is not enabled, return ciphertext as-is
      return ciphertext;
    }

    if (!ciphertext || ciphertext.trim() === '') {
      return ciphertext;
    }

    // Check if the data is in encrypted format (contains colons)
    if (!ciphertext.includes(':')) {
      // Data is not encrypted (legacy or encryption was disabled)
      return ciphertext;
    }

    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        // Not in expected format, return as-is
        return ciphertext;
      }

      const iv = Buffer.from(parts[0], 'base64');
      const authTag = Buffer.from(parts[1], 'base64');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv, {
        authTagLength: this.authTagLength,
      });
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`);
      // If decryption fails, it might be unencrypted legacy data
      return ciphertext;
    }
  }

  /**
   * Encrypt an object's specified fields
   * @param obj The object to encrypt
   * @param fields Array of field names to encrypt
   * @returns Object with encrypted fields
   */
  encryptFields<T extends Record<string, any>>(obj: T, fields: string[]): T {
    if (!this.encryptionKey || !obj) {
      return obj;
    }

    const result: Record<string, any> = { ...obj };
    for (const field of fields) {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = this.encrypt(result[field]);
      }
    }
    return result as T;
  }

  /**
   * Decrypt an object's specified fields
   * @param obj The object to decrypt
   * @param fields Array of field names to decrypt
   * @returns Object with decrypted fields
   */
  decryptFields<T extends Record<string, any>>(obj: T, fields: string[]): T {
    if (!this.encryptionKey || !obj) {
      return obj;
    }

    const result: Record<string, any> = { ...obj };
    for (const field of fields) {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = this.decrypt(result[field]);
      }
    }
    return result as T;
  }

  /**
   * Hash sensitive data for searching (one-way)
   * Useful for searching encrypted fields without decrypting
   * @param value The value to hash
   * @returns Deterministic hash (same input = same output)
   */
  hashForSearch(value: string): string {
    if (!value || value.trim() === '') {
      return value;
    }

    const salt = this.configService.get<string>('PHI_ENCRYPTION_KEY') || 'default-salt';
    return crypto
      .createHmac('sha256', salt)
      .update(value.toLowerCase().trim())
      .digest('hex');
  }

  /**
   * Generate a secure random key for PHI encryption
   * Useful for initial setup
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('base64');
  }
}
