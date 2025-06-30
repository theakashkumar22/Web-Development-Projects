import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.studydock.app',
  appName: 'StudyDock',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;