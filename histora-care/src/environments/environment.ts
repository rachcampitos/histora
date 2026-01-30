export interface Environment {
  production: boolean;
  apiUrl: string;
  wsUrl: string;
  mapboxToken: string;
  appScheme: string;
  culqiPublicKey: string;
  paymentSimulationMode: boolean; // true = simulate payments without Culqi
  sentryDsn: string;
}

export const environment: Environment = {
  production: false,
  // Use production API for development (uncomment localhost for local backend)
  apiUrl: 'https://api.historahealth.com/api',
  wsUrl: 'https://api.historahealth.com',
  // apiUrl: 'http://localhost:3000/api',
  // wsUrl: 'http://localhost:3000',
  mapboxToken: 'pk.eyJ1IjoicmFjaGNhbXBpdG9zIiwiYSI6ImNta2FxdDN6ZTI0YWwzY291Nm5ya2ZvbTcifQ.FdliekF2uQU0FC8jPUQFRA',
  appScheme: 'historacare',
  // Culqi payment gateway
  culqiPublicKey: 'pk_test_xxxxxxxxxx',
  // Payment simulation mode - set to false when Culqi is configured
  paymentSimulationMode: true,
  // Sentry error tracking
  sentryDsn: 'https://e114551da090206d25187f5056629d2d@o4510797799751680.ingest.us.sentry.io/4510797807878144',
};
