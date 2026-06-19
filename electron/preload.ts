import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // Expose IPC methods here if needed
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
  },
  send: (channel: string, data: unknown) => {
    // Whitelist channels
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel: string, func: (...args: unknown[]) => void) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
  },
  setTheme: (mode: 'dark' | 'light' | 'system') => ipcRenderer.send('set-theme', mode),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  showItemInFolder: (path: string) => ipcRenderer.invoke('open-file-location', path),
  getAdBlockEnabled: () => ipcRenderer.invoke('get-adblock-enabled'),
  setAdBlockEnabled: (enabled: boolean) => ipcRenderer.send('set-adblock-enabled', enabled),
  blockDomain: (domain: string) => ipcRenderer.send('block-domain', domain),
  onDownloadUpdated: (callback: (data: unknown) => void) => ipcRenderer.on('download-updated', (_, data) => callback(data)),
  onDownloadDone: (callback: (data: unknown) => void) => ipcRenderer.on('download-done', (_, data) => callback(data)),
  offDownloadUpdated: () => ipcRenderer.removeAllListeners('download-updated'),
  offDownloadDone: () => ipcRenderer.removeAllListeners('download-done'),
  onNewTab: (callback: (url: string) => void) => ipcRenderer.on('new-tab', (_, url) => callback(url as string)),
  offNewTab: () => ipcRenderer.removeAllListeners('new-tab'),
  onAdBlocked: (callback: (url: string) => void) => ipcRenderer.on('ad-blocked', (_, url) => callback(url as string)),
  offAdBlocked: () => ipcRenderer.removeAllListeners('ad-blocked'),
  importBookmarks: () => ipcRenderer.invoke('import-bookmarks'),
  openAuthWindow: (url: string) => ipcRenderer.invoke('open-auth-window', url),
  clearData: () => ipcRenderer.invoke('clear-data'),
  getSearchSuggestions: (query: string) => ipcRenderer.invoke('get-search-suggestions', query),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  searchWeb: (query: string) => ipcRenderer.invoke('search-web', query),
  searchImages: (query: string) => ipcRenderer.invoke('search-images', query),
  searchVideos: (query: string) => ipcRenderer.invoke('search-videos', query),
  searchNews: (query: string) => ipcRenderer.invoke('search-news', query),
  capturePage: (id: number) => ipcRenderer.invoke('capture-page', id),
  prepareOAuthRedirect: () => ipcRenderer.invoke('prepare-oauth'),
  onContextMenuRequest: (callback: (data: { params: Electron.ContextMenuParams, x: number, y: number }) => void) => 
    ipcRenderer.on('context-menu-request', (_, data) => callback(data)),
  offContextMenuRequest: () => ipcRenderer.removeAllListeners('context-menu-request'),
  onDeepLink: (callback: (url: string) => void) => ipcRenderer.on('deep-link', (_, url) => callback(url as string)),
  offDeepLink: () => ipcRenderer.removeAllListeners('deep-link'),
  onOAuthCallback: (callback: (url: string) => void) => ipcRenderer.on('oauth-callback', (_, url) => callback(url as string)),
  offOAuthCallback: () => ipcRenderer.removeAllListeners('oauth-callback'),
  setProxy: (countryId: string) => ipcRenderer.invoke('set-proxy', countryId),
  disableProxy: () => ipcRenderer.invoke('disable-proxy'),
  onUpdateChecking: (callback: () => void) => ipcRenderer.on('update_checking', () => callback()),
  onUpdateAvailable: (callback: (version?: string) => void) => ipcRenderer.on('update_available', (_, version) => callback(version)),
  onUpdateNotAvailable: (callback: () => void) => ipcRenderer.on('update_not_available', () => callback()),
  onUpdateDownloaded: (callback: (version?: string) => void) => ipcRenderer.on('update_downloaded', (_, version) => callback(version)),
  onDownloadProgress: (callback: (percent: number) => void) => ipcRenderer.on('download_progress', (_, percent) => callback(percent)),
  onUpdateError: (callback: (error: string) => void) => ipcRenderer.on('update_error', (_, error) => callback(error)),
  offUpdateChecking: () => ipcRenderer.removeAllListeners('update_checking'),
  offUpdateAvailable: () => ipcRenderer.removeAllListeners('update_available'),
  offUpdateNotAvailable: () => ipcRenderer.removeAllListeners('update_not_available'),
  offUpdateDownloaded: () => ipcRenderer.removeAllListeners('update_downloaded'),
  offDownloadProgress: () => ipcRenderer.removeAllListeners('download_progress'),
  offUpdateError: () => ipcRenderer.removeAllListeners('update_error'),
  checkForUpdate: () => ipcRenderer.send('check_for_update'),
  restartApp: () => ipcRenderer.send('restart_app'),
  // Extensions
  extensionsLoadAll: () => ipcRenderer.invoke('extensions-load-all'),
  extensionsInstall: (folderPath: string) => ipcRenderer.invoke('extensions-install', folderPath),
  extensionsInstallFromUrl: (url: string) => ipcRenderer.invoke('extensions-install-from-url', url),
  extensionsRemove: (id: string, extPath: string) => ipcRenderer.invoke('extensions-remove', id, extPath),
  extensionsPickFolder: () => ipcRenderer.invoke('extensions-pick-folder'),
  extensionsPickZip: () => ipcRenderer.invoke('extensions-pick-zip'),
  extensionsInstallZip: (zipFilePath: string) => ipcRenderer.invoke('extensions-install-zip', zipFilePath),
});
