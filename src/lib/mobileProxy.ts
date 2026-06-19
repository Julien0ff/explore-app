/**
 * Mobile VPN/Proxy Service for Explore Browser
 * 
 * On mobile, we implement browser-only proxying (not system-wide).
 * This works by intercepting WebView navigation and routing through proxy servers.
 * 
 * For the MVP, the same open proxy list as the desktop version is used.
 * In a future version, this can be replaced with a proper VPN tunnel (WireGuard/OpenVPN).
 */

export interface ProxyLocation {
  id: string;
  name: string;
  flag: string;
  url: string;
}

/**
 * Available proxy locations (same as desktop Electron version).
 */
export const PROXY_LOCATIONS: ProxyLocation[] = [
  { id: 'fr', name: 'France', flag: '🇫🇷', url: 'http://51.15.227.220:3128' },
  { id: 'us', name: 'United States', flag: '🇺🇸', url: 'http://198.27.74.14:80' },
  { id: 'uk', name: 'United Kingdom', flag: '🇬🇧', url: 'http://8.26.94.3:80' },
  { id: 'jp', name: 'Japan', flag: '🇯🇵', url: 'http://163.43.24.116:8080' },
  { id: 'de', name: 'Germany', flag: '🇩🇪', url: 'http://78.46.200.216:3128' },
  { id: 'ca', name: 'Canada', flag: '🇨🇦', url: 'http://104.254.244.14:80' },
  { id: 'au', name: 'Australia', flag: '🇦🇺', url: 'http://103.111.53.146:80' },
];

/**
 * Mobile proxy manager.
 * Manages connection state and provides proxy configuration for WebView.
 */
export class MobileProxyManager {
  private connected: boolean;
  private currentLocationId: string;
  private onStateChange?: (connected: boolean, locationId: string) => void;

  constructor() {
    // Restore state from localStorage
    this.connected = localStorage.getItem('vpn_connected') === 'true';
    this.currentLocationId = localStorage.getItem('vpn_location_id') || 'fr';
  }

  isConnected(): boolean {
    return this.connected;
  }

  getCurrentLocation(): ProxyLocation | undefined {
    return PROXY_LOCATIONS.find(p => p.id === this.currentLocationId);
  }

  getCurrentLocationId(): string {
    return this.currentLocationId;
  }

  onConnectionChange(callback: (connected: boolean, locationId: string) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Connect to a proxy location.
   * On mobile, this updates the state and localStorage.
   * The actual proxy routing is handled by the Capacitor native layer or URL rewriting.
   */
  connect(locationId: string): boolean {
    const location = PROXY_LOCATIONS.find(p => p.id === locationId);
    if (!location) return false;

    this.connected = true;
    this.currentLocationId = locationId;

    localStorage.setItem('vpn_connected', 'true');
    localStorage.setItem('vpn_location_id', locationId);
    localStorage.setItem('vpn_location', location.name);

    this.onStateChange?.(true, locationId);
    window.dispatchEvent(new Event('vpn-state-change'));

    return true;
  }

  /**
   * Disconnect from the proxy.
   */
  disconnect(): void {
    this.connected = false;

    localStorage.setItem('vpn_connected', 'false');

    this.onStateChange?.(false, this.currentLocationId);
    window.dispatchEvent(new Event('vpn-state-change'));
  }

  /**
   * Toggle connection state.
   */
  toggle(): boolean {
    if (this.connected) {
      this.disconnect();
      return false;
    } else {
      return this.connect(this.currentLocationId);
    }
  }

  /**
   * Get the PAC (Proxy Auto-Configuration) script for the current proxy.
   * This can be used to configure native WebView proxy settings.
   */
  getPacScript(): string | null {
    if (!this.connected) return null;

    const location = this.getCurrentLocation();
    if (!location) return null;

    // Parse the proxy URL
    const proxyUrl = new URL(location.url);
    const proxyHost = proxyUrl.hostname;
    const proxyPort = proxyUrl.port || '80';

    return `
      function FindProxyForURL(url, host) {
        // Bypass local addresses
        if (isPlainHostName(host) || 
            shExpMatch(host, "*.local") || 
            isInNet(host, "127.0.0.0", "255.0.0.0") ||
            isInNet(host, "10.0.0.0", "255.0.0.0") ||
            isInNet(host, "172.16.0.0", "255.240.0.0") ||
            isInNet(host, "192.168.0.0", "255.255.0.0")) {
          return "DIRECT";
        }
        
        // Bypass search engines for performance
        if (shExpMatch(host, "*.google.com") || 
            shExpMatch(host, "*.gstatic.com") || 
            shExpMatch(host, "*.duckduckgo.com") ||
            shExpMatch(host, "*.flagcdn.com")) {
          return "DIRECT";
        }
        
        return "PROXY ${proxyHost}:${proxyPort}; DIRECT";
      }
    `;
  }
}
