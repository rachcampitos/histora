export interface Environment {
  production: boolean;
  apiUrl: string;
  wsUrl: string;
  mapboxToken: string;
  appScheme: string;
  culqiPublicKey: string;
  paymentSimulationMode: boolean;
  sentryDsn: string;
}

export const environment: Environment = {
  production: true,
  apiUrl: 'https://api.historahealth.com/api',
  wsUrl: 'https://api.historahealth.com',
  mapboxToken: 'pk.eyJ1IjoicmFjaGNhbXBpdG9zIiwiYSI6ImNta2FxdDN6ZTI0YWwzY291Nm5ya2ZvbTcifQ.FdliekF2uQU0FC8jPUQFRA',
  appScheme: 'historacare',
  culqiPublicKey: 'pk_live_xxxxxxxxxx',
  // Payment simulation mode - DISABLED for production
  paymentSimulationMode: false,
  // Sentry error tracking
  sentryDsn: 'https://e114551da090206d25187f5056629d2d@o4510797799751680.ingest.us.sentry.io/4510797807878144',
};
