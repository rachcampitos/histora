export interface Environment {
  production: boolean;
  apiUrl: string;
  wsUrl: string;
  mapboxToken: string;
  appScheme: string;
  culqiPublicKey: string;
  paymentSimulationMode: boolean;
}

export const environment: Environment = {
  production: true,
  apiUrl: 'https://api.historahealth.com/api',
  wsUrl: 'https://api.historahealth.com',
  mapboxToken: 'pk.eyJ1IjoicmFjaGNhbXBpdG9zIiwiYSI6ImNta2FxdDN6ZTI0YWwzY291Nm5ya2ZvbTcifQ.FdliekF2uQU0FC8jPUQFRA',
  appScheme: 'historacare',
  culqiPublicKey: 'pk_live_xxxxxxxxxx',
  // Payment simulation mode - set to false when Culqi is configured
  paymentSimulationMode: true // TODO: Set to false when Culqi is ready
};
