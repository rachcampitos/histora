export interface Environment {
  production: boolean;
  apiUrl: string;
  wsUrl: string;
  mapboxToken: string;
  appScheme: string;
}

export const environment: Environment = {
  production: false,
  // Use production API for development (uncomment localhost for local backend)
  apiUrl: 'https://api.historahealth.com/api',
  wsUrl: 'https://api.historahealth.com',
  // apiUrl: 'http://localhost:3000/api',
  // wsUrl: 'http://localhost:3000',
  mapboxToken: 'pk.eyJ1IjoicmFjaGNhbXBpdG9zIiwiYSI6ImNta2FxdDN6ZTI0YWwzY291Nm5ya2ZvbTcifQ.FdliekF2uQU0FC8jPUQFRA', // Get from https://account.mapbox.com/access-tokens/
  // Deep link scheme for OAuth callback
  appScheme: 'historacare'
};
