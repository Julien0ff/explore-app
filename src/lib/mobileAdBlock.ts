/**
 * Mobile Ad Blocker for Explore Browser
 * 
 * On mobile (Capacitor), we cannot use Electron session filters.
 * Instead, we provide:
 *   1. A content-script injection approach (inject CSS/JS to hide ad elements)
 *   2. A URL checker for iframe-based browsing or navigation interception
 * 
 * On native Android, the WebViewClient.shouldInterceptRequest() handles real blocking,
 * but this module provides the shared domain list and UI state management.
 */

import { BLOCKED_AD_DOMAINS } from './platform';

/**
 * Check if a URL belongs to a known ad/tracking domain.
 */
export function isAdUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();

  // Whitelist essential Google services
  const isGoogleMain =
    lowerUrl.startsWith('https://www.google.com') ||
    lowerUrl.startsWith('https://www.google.fr') ||
    lowerUrl.startsWith('https://google.com') ||
    lowerUrl.startsWith('https://google.fr');
  const isGoogleAdSubdomain =
    lowerUrl.includes('ads.google.com') ||
    lowerUrl.includes('adservice.google.com');

  if (
    (isGoogleMain && !isGoogleAdSubdomain) ||
    lowerUrl.includes('gstatic.com') ||
    lowerUrl.includes('/favicon.ico') ||
    lowerUrl.includes('icons.duckduckgo.com') ||
    lowerUrl.includes('flagcdn.com')
  ) {
    return false;
  }

  return BLOCKED_AD_DOMAINS.some((domain) => lowerUrl.includes(domain));
}

/**
 * CSS injection rules to hide common ad containers on web pages.
 * Used when injecting content scripts into WebView pages.
 */
export const AD_HIDE_CSS = `
  /* Google Ads */
  ins.adsbygoogle,
  .adsbygoogle,
  [id^="google_ads_"],
  [class*="GoogleAd"],
  /* Generic ad containers */
  [class*="ad-container"],
  [class*="ad-wrapper"],
  [class*="ad-slot"],
  [id*="ad-slot"],
  [data-ad],
  [data-ad-slot],
  .advertisement,
  .ad-banner,
  #ads,
  .sidebar-ad,
  /* Common sponsored content */
  [class*="sponsored"],
  [data-testid*="ad"],
  /* Taboola / Outbrain widgets */
  .trc_related_container,
  .OUTBRAIN,
  .ob-widget,
  .taboola-widget,
  /* Cookie banners (aggressive mode) */
  [class*="cookie-banner"],
  [id*="cookie-consent"],
  [class*="consent-banner"] {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    min-height: 0 !important;
    max-height: 0 !important;
    overflow: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
`;

/**
 * JavaScript injection to remove ad iframes and scripts from a loaded page.
 * Call this after page load in the WebView.
 */
export const AD_REMOVE_JS = `
  (function() {
    try {
      // Remove ad iframes
      document.querySelectorAll('iframe').forEach(function(iframe) {
        var src = (iframe.src || '').toLowerCase();
        var blockedDomains = ${JSON.stringify(BLOCKED_AD_DOMAINS)};
        for (var i = 0; i < blockedDomains.length; i++) {
          if (src.includes(blockedDomains[i])) {
            iframe.remove();
            break;
          }
        }
      });

      // Inject hiding CSS
      var style = document.createElement('style');
      style.textContent = ${JSON.stringify(AD_HIDE_CSS)};
      document.head.appendChild(style);
    } catch(e) {
      // Silent fail
    }
  })();
`;

/**
 * Manage the mobile ad blocker state.
 */
export class MobileAdBlocker {
  private enabled: boolean;
  private blockedCount: number;
  private onCountChange?: (count: number) => void;

  constructor(enabled = true) {
    this.enabled = enabled;
    this.blockedCount = 0;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
  }

  getBlockedCount(): number {
    return this.blockedCount;
  }

  onBlockedCountChange(callback: (count: number) => void): void {
    this.onCountChange = callback;
  }

  /**
   * Check a URL and increment the blocked counter if it's an ad.
   * Returns true if the URL should be blocked.
   */
  shouldBlock(url: string): boolean {
    if (!this.enabled) return false;
    if (isAdUrl(url)) {
      this.blockedCount++;
      this.onCountChange?.(this.blockedCount);
      return true;
    }
    return false;
  }

  /**
   * Returns the JS code to inject into a WebView after page load.
   */
  getInjectionScript(): string | null {
    if (!this.enabled) return null;
    return AD_REMOVE_JS;
  }
}
