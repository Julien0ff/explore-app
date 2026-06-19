import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.explore.browser',
  appName: 'Explore Browser',
  webDir: 'dist',
  server: {
    // Allow navigation to all URLs (browser app)
    allowNavigation: ['*'],
    // Cleartext for local dev only — remove for production
    cleartext: true,
  },
  plugins: {
    // Deep Linking for Supabase OAuth
    App: {
      url: 'explore',
      androidScheme: 'explore',
    },
    // Status bar configuration
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#1e1e2e',
    },
    // Keyboard behavior
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  android: {
    // Custom splash screen background
    backgroundColor: '#1e1e2e',
    allowMixedContent: true,
    // Enable hardware acceleration for WebView
    webContentsDebuggingEnabled: true,
  },
  ios: {
    // iOS-specific configuration
    backgroundColor: '#1e1e2e',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'explore',
  },
};

export default config;
