/// <reference types="vite/client" />
/// <reference types="electron" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        autosize?: string;
        plugins?: boolean;
        preload?: string;
        partition?: string;
        allowpopups?: string;
        webpreferences?: string;
      };
    }
  }
}

interface Window {
  electron: {
    windowControls: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
    send: (channel: string, data: unknown) => void;
    receive: (channel: string, func: (...args: unknown[]) => void) => void;
    setTheme: (mode: 'dark' | 'light' | 'system') => void;
    openExternal: (url: string) => Promise<void>;
    openAuthWindow: (url: string) => Promise<void>;
    showItemInFolder: (path: string) => Promise<boolean>;
    getAdBlockEnabled: () => Promise<boolean>;
    setAdBlockEnabled: (enabled: boolean) => void;
    blockDomain: (domain: string) => void;
    setProxy: (countryId: string) => Promise<boolean>;
    disableProxy: () => Promise<boolean>;
    onDownloadUpdated: (callback: (data: unknown) => void) => void;
    onDownloadDone: (callback: (data: unknown) => void) => void;
    offDownloadUpdated: () => void;
    offDownloadDone: () => void;
    onNewTab: (callback: (url: string) => void) => void;
    offNewTab: () => void;
    onAdBlocked: (callback: (url: string) => void) => void;
    offAdBlocked: () => void;
    importBookmarks: () => Promise<string | null>;
    clearData: () => Promise<void>;
    getSearchSuggestions: (query: string) => Promise<string[]>;
    prepareOAuthRedirect: () => Promise<string>;
    onContextMenuRequest: (callback: (data: { params: Electron.ContextMenuParams, x: number, y: number }) => void) => void;
    offContextMenuRequest: () => void;
    onDeepLink: (callback: (url: string) => void) => void;
    offDeepLink: () => void;
    onOAuthCallback: (callback: (url: string) => void) => void;
    offOAuthCallback: () => void;
    getAppVersion: () => Promise<string>;
    onUpdateChecking: (callback: () => void) => void;
    onUpdateAvailable: (callback: () => void) => void;
    onUpdateNotAvailable: (callback: () => void) => void;
    onUpdateDownloaded: (callback: () => void) => void;
    onDownloadProgress: (callback: (percent: number) => void) => void;
    onUpdateError: (callback: (error: string) => void) => void;
    offUpdateChecking: () => void;
    offUpdateAvailable: () => void;
    offUpdateNotAvailable: () => void;
    offUpdateDownloaded: () => void;
    offDownloadProgress: () => void;
    offUpdateError: () => void;
    checkForUpdate: () => void;
    restartApp: () => void;
  };
}
