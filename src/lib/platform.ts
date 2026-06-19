/**
 * Platform Detection Utility for Explore Browser
 * Detects whether the app is running on Desktop (Electron), iOS, or Android (Capacitor).
 */

export type Platform = 'desktop' | 'ios' | 'android';

/**
 * Detects the current platform based on environment context.
 */
export function detectPlatform(): Platform {
  // Check if running inside Electron
  if (typeof window !== 'undefined' && window.electron) {
    return 'desktop';
  }

  // Check Capacitor native platform
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const capacitor = (window as any)?.Capacitor;
  if (capacitor?.isNativePlatform?.()) {
    const platform = capacitor.getPlatform?.();
    if (platform === 'ios') return 'ios';
    if (platform === 'android') return 'android';
  }

  // Fallback: use User-Agent sniffing for web preview
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';

  return 'desktop';
}

/**
 * Returns true if the app is running on a mobile platform (iOS or Android).
 */
export function isMobile(): boolean {
  const platform = detectPlatform();
  return platform === 'ios' || platform === 'android';
}

/**
 * Returns true if the app is running inside Electron (desktop).
 */
export function isDesktop(): boolean {
  return detectPlatform() === 'desktop';
}

/**
 * Returns true if the app is running on iOS.
 */
export function isIOS(): boolean {
  return detectPlatform() === 'ios';
}

/**
 * Returns true if the app is running on Android.
 */
export function isAndroid(): boolean {
  return detectPlatform() === 'android';
}

/**
 * Ad blocker domains list — shared between desktop and mobile.
 * On desktop, this is handled by Electron's session filters.
 * On mobile, this is used for in-app request interception.
 */
export const BLOCKED_AD_DOMAINS: string[] = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'adnxs.com',
  'rubiconproject.com',
  'criteo.com',
  'pubmatic.com',
  'outbrain.com',
  'taboola.com',
  'adservice.google.com',
  'ads.google.com',
  'analytics.google.com',
  'facebook.com/tr/',
  'google-analytics.com',
  'quantserve.com',
  'scorecardresearch.com',
  'zedo.com',
  'adroll.com',
  'carbonads.net',
  'buysellads.com',
  'moatads.com',
  'adform.net',
  'advertising.com',
  'casalemedia.com',
  'yieldmo.com',
  'openx.net',
  'smartadserver.com',
  'popads.net',
  'popcash.net',
  'onclickads.net'
];
