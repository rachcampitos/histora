/**
 * Session Configuration for Histora Care
 *
 * Based on UX/Security recommendations:
 * - Patients: More permissive (need quick access in emergencies)
 * - Nurses: More restrictive (handle sensitive data of multiple patients)
 * - Admins/Doctors: Similar to nurses
 *
 * @see UX consultation on session management best practices
 */

export interface SessionConfig {
  // Access token expiration (JWT exp)
  accessTokenExpiry: string;
  accessTokenExpiryMs: number;

  // Refresh token expiration (absolute maximum session lifetime)
  refreshTokenDays: number;
  refreshTokenExpiryMs: number;

  // Inactivity timeout (session expires if no activity)
  inactivityTimeoutMs: number;

  // Extended session (with "Remember Me")
  extendedAccessTokenExpiry: string;
  extendedRefreshTokenDays: number;

  // Warning before expiration (show modal)
  warningBeforeExpiryMs: number;
}

// Time constants
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Session configuration by user role
 */
export const SESSION_CONFIG: Record<string, SessionConfig> = {
  // Patients: More permissive for quick emergency access
  patient: {
    accessTokenExpiry: '1d',           // 1 day
    accessTokenExpiryMs: 1 * DAY,
    refreshTokenDays: 30,               // 30 days max
    refreshTokenExpiryMs: 30 * DAY,
    inactivityTimeoutMs: 7 * DAY,       // 7 days without use
    extendedAccessTokenExpiry: '7d',    // 7 days with "Remember Me"
    extendedRefreshTokenDays: 90,       // 90 days with "Remember Me"
    warningBeforeExpiryMs: 2 * MINUTE,  // Warn 2 minutes before
  },

  // Nurses: More restrictive, handle multiple patient data
  nurse: {
    accessTokenExpiry: '4h',            // 4 hours
    accessTokenExpiryMs: 4 * HOUR,
    refreshTokenDays: 7,                // 7 days max
    refreshTokenExpiryMs: 7 * DAY,
    inactivityTimeoutMs: 30 * MINUTE,   // 30 minutes without use
    extendedAccessTokenExpiry: '1d',    // 1 day with "Remember Me"
    extendedRefreshTokenDays: 30,       // 30 days with "Remember Me"
    warningBeforeExpiryMs: 2 * MINUTE,  // Warn 2 minutes before
  },

  // Clinic owners/doctors: Similar to nurses
  clinic_owner: {
    accessTokenExpiry: '4h',
    accessTokenExpiryMs: 4 * HOUR,
    refreshTokenDays: 7,
    refreshTokenExpiryMs: 7 * DAY,
    inactivityTimeoutMs: 30 * MINUTE,
    extendedAccessTokenExpiry: '1d',
    extendedRefreshTokenDays: 30,
    warningBeforeExpiryMs: 2 * MINUTE,
  },

  // Platform admins: Most restrictive
  platform_admin: {
    accessTokenExpiry: '2h',            // 2 hours
    accessTokenExpiryMs: 2 * HOUR,
    refreshTokenDays: 1,                // 1 day max
    refreshTokenExpiryMs: 1 * DAY,
    inactivityTimeoutMs: 15 * MINUTE,   // 15 minutes without use
    extendedAccessTokenExpiry: '4h',    // 4 hours with "Remember Me"
    extendedRefreshTokenDays: 7,        // 7 days with "Remember Me"
    warningBeforeExpiryMs: 2 * MINUTE,
  },

  // Default fallback
  default: {
    accessTokenExpiry: '1h',
    accessTokenExpiryMs: 1 * HOUR,
    refreshTokenDays: 1,
    refreshTokenExpiryMs: 1 * DAY,
    inactivityTimeoutMs: 30 * MINUTE,
    extendedAccessTokenExpiry: '7d',
    extendedRefreshTokenDays: 30,
    warningBeforeExpiryMs: 2 * MINUTE,
  },
};

/**
 * Get session configuration for a specific role
 */
export function getSessionConfig(role: string): SessionConfig {
  const normalizedRole = role.toLowerCase();
  return SESSION_CONFIG[normalizedRole] || SESSION_CONFIG.default;
}

/**
 * Calculate token expiration based on role and remember me option
 */
export function getTokenExpiration(role: string, rememberMe: boolean): {
  accessTokenExpiry: string;
  refreshTokenDays: number;
} {
  const config = getSessionConfig(role);

  return {
    accessTokenExpiry: rememberMe
      ? config.extendedAccessTokenExpiry
      : config.accessTokenExpiry,
    refreshTokenDays: rememberMe
      ? config.extendedRefreshTokenDays
      : config.refreshTokenDays,
  };
}

/**
 * Session info to include in API responses
 */
export interface SessionInfo {
  expiresAt: number;           // Timestamp when access token expires
  refreshExpiresAt: number;    // Timestamp when refresh token expires
  inactivityTimeout: number;   // Milliseconds of inactivity before logout
  warningBefore: number;       // Milliseconds before expiry to show warning
}

/**
 * Generate session info for API response
 */
export function generateSessionInfo(role: string, rememberMe: boolean): SessionInfo {
  const config = getSessionConfig(role);
  const now = Date.now();

  const accessExpiry = rememberMe
    ? config.extendedAccessTokenExpiry
    : config.accessTokenExpiry;

  // Parse expiry string to milliseconds
  const accessExpiryMs = parseExpiryToMs(accessExpiry);

  const refreshDays = rememberMe
    ? config.extendedRefreshTokenDays
    : config.refreshTokenDays;

  return {
    expiresAt: now + accessExpiryMs,
    refreshExpiresAt: now + (refreshDays * DAY),
    inactivityTimeout: config.inactivityTimeoutMs,
    warningBefore: config.warningBeforeExpiryMs,
  };
}

/**
 * Parse expiry string (e.g., '1d', '4h', '30m') to milliseconds
 */
function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([dhms])$/);
  if (!match) {
    return HOUR; // Default to 1 hour
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd':
      return value * DAY;
    case 'h':
      return value * HOUR;
    case 'm':
      return value * MINUTE;
    case 's':
      return value * 1000;
    default:
      return HOUR;
  }
}
