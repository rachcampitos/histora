/**
 * Security utilities for input sanitization
 * Prevents NoSQL injection, XSS, and other common attack vectors
 */

/**
 * Sanitize a string for safe use in MongoDB $regex queries
 * Escapes special regex characters to prevent ReDoS attacks
 */
export function sanitizeRegex(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Escape special regex characters
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize MongoDB query operators from user input
 * Prevents NoSQL injection attacks like { $gt: "" } or { $ne: null }
 */
export function sanitizeMongoQuery(input: Record<string, unknown>): Record<string, unknown> {
  if (input === null || typeof input !== 'object') {
    return input;
  }

  const sanitized: Record<string, unknown> = {};

  for (const key of Object.keys(input)) {
    const value = input[key];

    // Remove keys starting with $ (MongoDB operators)
    if (key.startsWith('$')) {
      continue;
    }

    // Recursively sanitize nested objects
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeMongoQuery(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      // Sanitize arrays
      sanitized[key] = value.map((item) =>
        item !== null && typeof item === 'object'
          ? sanitizeMongoQuery(item as Record<string, unknown>)
          : item,
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Basic HTML/XSS sanitization
 * Escapes HTML special characters to prevent XSS attacks
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * Strip potentially dangerous HTML tags from input
 * Allows only safe text content
 */
export function stripHtmlTags(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Remove script tags and their content
  let clean = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove style tags and their content
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  // Remove all remaining HTML tags
  clean = clean.replace(/<[^>]+>/g, '');
  // Decode common HTML entities
  clean = clean.replace(/&nbsp;/g, ' ');
  return clean.trim();
}

/**
 * Validate that an ObjectId string is properly formatted
 * Prevents injection via malformed IDs
 */
export function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  return /^[a-fA-F0-9]{24}$/.test(id);
}

/**
 * Sanitize file path to prevent path traversal attacks
 */
export function sanitizeFilePath(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Remove path traversal sequences
  return input
    .replace(/\.\./g, '')
    .replace(/\/\//g, '/')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
}
