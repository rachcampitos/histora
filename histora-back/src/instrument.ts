// Sentry instrumentation - must be imported before any other imports
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const isProduction = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: 'https://e114551da090206d25187f5056629d2d@o4510797799751680.ingest.us.sentry.io/4510797807878144',
  environment: isProduction ? 'production' : 'development',
  // Only send errors in production
  enabled: isProduction,
  // Performance monitoring - sample 20% of transactions
  tracesSampleRate: 0.2,
  // Profiling - sample 10% of transactions for performance profiling
  profilesSampleRate: 0.1,
  // Release tracking
  release: 'histora-back@1.0.0',
  // Don't send PII by default
  sendDefaultPii: false,
  // Integrations
  integrations: [
    nodeProfilingIntegration(),
  ],
  // Ignore common non-actionable errors
  ignoreErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'socket hang up',
  ],
});

export { Sentry };
