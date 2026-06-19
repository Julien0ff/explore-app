"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    // Expose IPC methods here if needed
    windowControls: {
        minimize: () => electron_1.ipcRenderer.send('window-minimize'),
        maximize: () => electron_1.ipcRenderer.send('window-maximize'),
        close: () => electron_1.ipcRenderer.send('window-close'),
    },
    send: (channel, data) => {
        // Whitelist channels
        const validChannels = ['toMain'];
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.send(channel, data);
        }
    },
    receive: (channel, func) => {
        const validChannels = ['fromMain'];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender` 
            electron_1.ipcRenderer.on(channel, (_event, ...args) => func(...args));
        }
    },
    setTheme: (mode) => electron_1.ipcRenderer.send('set-theme', mode),
    openExternal: (url) => electron_1.ipcRenderer.invoke('open-external', url),
    showItemInFolder: (path) => electron_1.ipcRenderer.invoke('open-file-location', path),
    getAdBlockEnabled: () => electron_1.ipcRenderer.invoke('get-adblock-enabled'),
    setAdBlockEnabled: (enabled) => electron_1.ipcRenderer.send('set-adblock-enabled', enabled),
    blockDomain: (domain) => electron_1.ipcRenderer.send('block-domain', domain),
    onDownloadUpdated: (callback) => electron_1.ipcRenderer.on('download-updated', (_, data) => callback(data)),
    onDownloadDone: (callback) => electron_1.ipcRenderer.on('download-done', (_, data) => callback(data)),
    offDownloadUpdated: () => electron_1.ipcRenderer.removeAllListeners('download-updated'),
    offDownloadDone: () => electron_1.ipcRenderer.removeAllListeners('download-done'),
    onNewTab: (callback) => electron_1.ipcRenderer.on('new-tab', (_, url) => callback(url)),
    offNewTab: () => electron_1.ipcRenderer.removeAllListeners('new-tab'),
    onAdBlocked: (callback) => electron_1.ipcRenderer.on('ad-blocked', (_, url) => callback(url)),
    offAdBlocked: () => electron_1.ipcRenderer.removeAllListeners('ad-blocked'),
    importBookmarks: () => electron_1.ipcRenderer.invoke('import-bookmarks'),
    openAuthWindow: (url) => electron_1.ipcRenderer.invoke('open-auth-window', url),
    clearData: () => electron_1.ipcRenderer.invoke('clear-data'),
    getSearchSuggestions: (query) => electron_1.ipcRenderer.invoke('get-search-suggestions', query),
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'),
    searchWeb: (query) => electron_1.ipcRenderer.invoke('search-web', query),
    searchImages: (query) => electron_1.ipcRenderer.invoke('search-images', query),
    searchVideos: (query) => electron_1.ipcRenderer.invoke('search-videos', query),
    searchNews: (query) => electron_1.ipcRenderer.invoke('search-news', query),
    capturePage: (id) => electron_1.ipcRenderer.invoke('capture-page', id),
    prepareOAuthRedirect: () => electron_1.ipcRenderer.invoke('prepare-oauth'),
    onContextMenuRequest: (callback) => electron_1.ipcRenderer.on('context-menu-request', (_, data) => callback(data)),
    offContextMenuRequest: () => electron_1.ipcRenderer.removeAllListeners('context-menu-request'),
    onDeepLink: (callback) => electron_1.ipcRenderer.on('deep-link', (_, url) => callback(url)),
    offDeepLink: () => electron_1.ipcRenderer.removeAllListeners('deep-link'),
    onOAuthCallback: (callback) => electron_1.ipcRenderer.on('oauth-callback', (_, url) => callback(url)),
    offOAuthCallback: () => electron_1.ipcRenderer.removeAllListeners('oauth-callback'),
    setProxy: (countryId) => electron_1.ipcRenderer.invoke('set-proxy', countryId),
    disableProxy: () => electron_1.ipcRenderer.invoke('disable-proxy'),
    onUpdateChecking: (callback) => electron_1.ipcRenderer.on('update_checking', () => callback()),
    onUpdateAvailable: (callback) => electron_1.ipcRenderer.on('update_available', (_, version) => callback(version)),
    onUpdateNotAvailable: (callback) => electron_1.ipcRenderer.on('update_not_available', () => callback()),
    onUpdateDownloaded: (callback) => electron_1.ipcRenderer.on('update_downloaded', (_, version) => callback(version)),
    onDownloadProgress: (callback) => electron_1.ipcRenderer.on('download_progress', (_, percent) => callback(percent)),
    onUpdateError: (callback) => electron_1.ipcRenderer.on('update_error', (_, error) => callback(error)),
    offUpdateChecking: () => electron_1.ipcRenderer.removeAllListeners('update_checking'),
    offUpdateAvailable: () => electron_1.ipcRenderer.removeAllListeners('update_available'),
    offUpdateNotAvailable: () => electron_1.ipcRenderer.removeAllListeners('update_not_available'),
    offUpdateDownloaded: () => electron_1.ipcRenderer.removeAllListeners('update_downloaded'),
    offDownloadProgress: () => electron_1.ipcRenderer.removeAllListeners('download_progress'),
    offUpdateError: () => electron_1.ipcRenderer.removeAllListeners('update_error'),
    checkForUpdate: () => electron_1.ipcRenderer.send('check_for_update'),
    restartApp: () => electron_1.ipcRenderer.send('restart_app'),
    // Extensions
    extensionsLoadAll: () => electron_1.ipcRenderer.invoke('extensions-load-all'),
    extensionsInstall: (folderPath) => electron_1.ipcRenderer.invoke('extensions-install', folderPath),
    extensionsInstallFromUrl: (url) => electron_1.ipcRenderer.invoke('extensions-install-from-url', url),
    extensionsRemove: (id, extPath) => electron_1.ipcRenderer.invoke('extensions-remove', id, extPath),
    extensionsPickFolder: () => electron_1.ipcRenderer.invoke('extensions-pick-folder'),
});
