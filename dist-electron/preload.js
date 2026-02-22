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
    showItemInFolder: (path) => electron_1.ipcRenderer.invoke('open-file-location', path),
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
    clearData: () => electron_1.ipcRenderer.invoke('clear-data'),
    getSearchSuggestions: (query) => electron_1.ipcRenderer.invoke('get-search-suggestions', query),
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'),
    onContextMenuRequest: (callback) => electron_1.ipcRenderer.on('context-menu-request', (_, data) => callback(data)),
    offContextMenuRequest: () => electron_1.ipcRenderer.removeAllListeners('context-menu-request'),
    onDeepLink: (callback) => electron_1.ipcRenderer.on('deep-link', (_, url) => callback(url)),
    offDeepLink: () => electron_1.ipcRenderer.removeAllListeners('deep-link'),
});
