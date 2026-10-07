import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ustwo.ledger',
  appName: '我們倆的記帳小窩',
  webDir: '.output/public',
  server: {
    // If you run on local Wi-Fi, you can set url to: 'http://192.168.0.105:8080'
    // cleartext: true,
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#f8f0e6',
      showSpinner: false,
    }
  }
};

export default config;
