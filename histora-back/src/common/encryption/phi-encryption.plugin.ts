import { Schema, Document } from 'mongoose';
import * as crypto from 'crypto';

/**
 * PHI (Protected Health Information) fields that should be encrypted
 * Based on HIPAA safe harbor de-identification requirements
 */
export const PHI_FIELDS = [
  // Patient identifiers
  'documentNumber',
  'insuranceNumber',
  // Medical information
  'allergies',
  'chronicConditions',
  'currentMedications',
  'bloodType',
  'notes',
  // Clinical history specific
  'diagnosis',
  'treatment',
  'clinicalNotes',
  'symptoms',
  'prescriptions',
  'labResults',
  'medicalHistory',
  'familyHistory',
  'surgicalHistory',
  // Vitals
  'vitalNotes',
  // Service requests
  'serviceNotes',
  'careInstructions',
  'medicalConditions',
  'medications',
  'mobilityNotes',
];

/**
 * Get encryption key from environment
 * Uses PBKDF2 to derive a secure key from the provided secret
 */
function getEncryptionKey(): Buffer | null {
  const keyString = process.env.PHI_ENCRYPTION_KEY;
  if (!keyString) {
    return null;
  }
  const salt = crypto.createHash('sha256').update('histora-phi-salt').digest();
  return crypto.pbkdf2Sync(keyString, salt, 100000, 32, 'sha512');
}

/**
 * Encrypt a string value using AES-256-GCM
 */
function encryptValue(value: string, key: Buffer): string {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return value;
  }

  // Check if already encrypted (contains colons in expected format)
  if (value.includes(':') && value.split(':').length === 3) {
    return value;
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });

  let encrypted = cipher.update(value, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypt a string value using AES-256-GCM
 */
function decryptValue(value: string, key: Buffer): string {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return value;
  }

  // Check if the value is encrypted
  if (!value.includes(':')) {
    return value; // Not encrypted (legacy data)
  }

  const parts = value.split(':');
  if (parts.length !== 3) {
    return value; // Not in expected format
  }

  try {
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    // Decryption failed, might be unencrypted data
    return value;
  }
}

/**
 * Encrypt or decrypt an array of strings
 */
function processArray(arr: any[], key: Buffer, operation: 'encrypt' | 'decrypt'): any[] {
  const processFunc = operation === 'encrypt' ? encryptValue : decryptValue;
  return arr.map((item) => {
    if (typeof item === 'string') {
      return processFunc(item, key);
    }
    return item;
  });
}

/**
 * Process a document's PHI fields for encryption or decryption
 */
function processPHIFields(
  doc: any,
  phiFields: string[],
  key: Buffer,
  operation: 'encrypt' | 'decrypt',
): void {
  const processFunc = operation === 'encrypt' ? encryptValue : decryptValue;

  for (const field of phiFields) {
    if (doc[field] !== undefined && doc[field] !== null) {
      if (Array.isArray(doc[field])) {
        doc[field] = processArray(doc[field], key, operation);
      } else if (typeof doc[field] === 'string') {
        doc[field] = processFunc(doc[field], key);
      }
    }
  }
}

/**
 * Mongoose plugin for automatic PHI encryption/decryption
 *
 * Usage:
 * schema.plugin(phiEncryptionPlugin, { fields: ['notes', 'diagnosis'] });
 *
 * Or use default PHI_FIELDS:
 * schema.plugin(phiEncryptionPlugin);
 */
export function phiEncryptionPlugin(
  schema: Schema,
  options: { fields?: string[] } = {},
): void {
  const fieldsToEncrypt = options.fields || PHI_FIELDS;

  // Pre-save hook: encrypt PHI fields before saving
  schema.pre('save', function (next) {
    const key = getEncryptionKey();
    if (!key) {
      return next();
    }

    const doc = this as any;
    processPHIFields(doc, fieldsToEncrypt, key, 'encrypt');
    next();
  });

  // Pre-findOneAndUpdate hook: encrypt PHI fields in update operations
  schema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'] as any, function (next) {
    const key = getEncryptionKey();
    if (!key) {
      return next();
    }

    const update = (this as any).getUpdate();
    if (!update) {
      return next();
    }

    // Handle $set operations
    if (update.$set) {
      for (const field of fieldsToEncrypt) {
        if (update.$set[field] !== undefined) {
          if (Array.isArray(update.$set[field])) {
            update.$set[field] = processArray(update.$set[field], key, 'encrypt');
          } else if (typeof update.$set[field] === 'string') {
            update.$set[field] = encryptValue(update.$set[field], key);
          }
        }
      }
    }

    // Handle direct field updates
    for (const field of fieldsToEncrypt) {
      if (update[field] !== undefined && !field.startsWith('$')) {
        if (Array.isArray(update[field])) {
          update[field] = processArray(update[field], key, 'encrypt');
        } else if (typeof update[field] === 'string') {
          update[field] = encryptValue(update[field], key);
        }
      }
    }

    next();
  });

  // Post-find hooks: decrypt PHI fields after retrieval
  const decryptDocument = (doc: Document | null) => {
    if (!doc) return;

    const key = getEncryptionKey();
    if (!key) return;

    const docObj = doc.toObject ? doc.toObject() : doc;
    processPHIFields(doc as any, fieldsToEncrypt, key, 'decrypt');
  };

  schema.post('find', function (docs: Document[]) {
    if (!Array.isArray(docs)) return;
    for (const doc of docs) {
      decryptDocument(doc);
    }
  });

  schema.post('findOne', function (doc: Document | null) {
    decryptDocument(doc);
  });

  schema.post('findOneAndUpdate', function (doc: Document | null) {
    decryptDocument(doc);
  });
}
