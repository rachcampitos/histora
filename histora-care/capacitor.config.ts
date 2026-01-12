import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.historahealth.care',
  appName: 'Histora Care',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#667eea',
      showSpinner: true,
      spinnerColor: '#ffffff'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  // Deep link configuration for OAuth callback
  // This enables historacare:// URL scheme
  ios: {
    scheme: 'historacare'
  },
  android: {
    // Android uses intent filters in AndroidManifest.xml
    // But we can set the scheme here for reference
  }
};

export default config;
