import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.historahealth.nurselite',
  appName: 'NurseLite',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e3a5f',
      showSpinner: true,
      spinnerColor: '#ffffff'
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    Camera: {
      // Force using file input on web instead of getUserMedia (which may open video)
      webUseInput: true
    }
  },
  // Deep link configuration for OAuth callback
  // This enables nurselite:// URL scheme
  ios: {
    scheme: 'nurselite'
  },
  android: {
    // Android uses intent filters in AndroidManifest.xml
    // But we can set the scheme here for reference
  }
};

export default config;
