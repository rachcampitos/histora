export interface Environment {
  production: boolean;
  apiUrl: string;
  wsUrl: string;
  mapboxToken: string;
  appScheme: string;
  culqiPublicKey: string;
  paymentSimulationMode: boolean; // true = simulate payments without Culqi
}

export const environment: Environment = {
  production: false,
  // Use production API for development (uncomment localhost for local backend)
  apiUrl: 'https://api.historahealth.com/api/v1',
  wsUrl: 'https://api.historahealth.com',
  // apiUrl: 'http://localhost:3000/api/v1',
  // wsUrl: 'http://localhost:3000',
  mapboxToken: 'pk.eyJ1IjoicmFjaGNhbXBpdG9zIiwiYSI6ImNta2FxdDN6ZTI0YWwzY291Nm5ya2ZvbTcifQ.FdliekF2uQU0FC8jPUQFRA',
  appScheme: 'historacare',
  // Culqi payment gateway
  culqiPublicKey: 'pk_test_xxxxxxxxxx',
  // Payment simulation mode - set to false when Culqi is configured
  paymentSimulationMode: true
};
