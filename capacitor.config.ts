import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ustwo.ledger',
  appName: '我們倆的記帳小窩',
  webDir: '.output/public',
  server: {
    url: 'https://pixel-perfect-showcase-3556.vercel.app',
    cleartext: true,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#f8f0e6',
      showSpinner: false,
    },
  },
};

export default config;
