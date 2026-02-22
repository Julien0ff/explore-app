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
  showItemInFolder: (path: string) => ipcRenderer.invoke('open-file-location', path),
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
  clearData: () => ipcRenderer.invoke('clear-data'),
  getSearchSuggestions: (query: string) => ipcRenderer.invoke('get-search-suggestions', query),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onContextMenuRequest: (callback: (data: { params: Electron.ContextMenuParams, x: number, y: number }) => void) => 
    ipcRenderer.on('context-menu-request', (_, data) => callback(data)),
  offContextMenuRequest: () => ipcRenderer.removeAllListeners('context-menu-request'),
  onDeepLink: (callback: (url: string) => void) => ipcRenderer.on('deep-link', (_, url) => callback(url as string)),
  offDeepLink: () => ipcRenderer.removeAllListeners('deep-link'),
});
