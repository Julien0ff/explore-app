"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let mainWindow = null;
let splashWindow = null;
// Protocol Handler
const PROTOCOL = 'explore';
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        electron_1.app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path_1.default.resolve(process.argv[1])]);
    }
}
else {
    electron_1.app.setAsDefaultProtocolClient(PROTOCOL);
}
// Single Instance Lock
const gotTheLock = electron_1.app.requestSingleInstanceLock();
if (!gotTheLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', (_event, commandLine) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
        }
        // Protocol handler for Windows/Linux
        // The URL is usually the last argument
        const url = commandLine.find(arg => arg.startsWith(`${PROTOCOL}://`));
        if (url) {
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('deep-link', url);
        }
    });
}
// Ad Blocker State
const defaultBlockedDomains = [
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
    'google-analytics.com'
];
let userBlockedDomains = [];
const blockedDomainsPath = path_1.default.join(electron_1.app.getPath('userData'), 'blocked-domains.json');
try {
    if (fs_1.default.existsSync(blockedDomainsPath)) {
        userBlockedDomains = JSON.parse(fs_1.default.readFileSync(blockedDomainsPath, 'utf-8'));
    }
}
catch (e) {
    console.error('Failed to load blocked domains:', e);
}
function getAllBlockedDomains() {
    return [...defaultBlockedDomains, ...userBlockedDomains];
}
function setupSession() {
    const filter = {
        urls: ['*://*/*']
    };
    try {
        if (electron_1.session && electron_1.session.defaultSession) {
            // Ad Blocker
            electron_1.session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
                const url = details.url.toLowerCase();
                // Whitelist Google Favicons to prevent them from being blocked
                if (url.includes('google.com/s2/favicons') || url.includes('/favicon.ico')) {
                    callback({ cancel: false });
                    return;
                }
                const isAd = getAllBlockedDomains().some(domain => url.includes(domain));
                if (isAd) {
                    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('ad-blocked', url);
                    callback({ cancel: true });
                }
                else {
                    callback({ cancel: false });
                }
            });
            // User Agent Spoofing
            electron_1.session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
                const headers = details.requestHeaders;
                // Force Chrome User Agent
                headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
                // Remove Electron identifiers
                delete headers['Sec-Ch-Ua'];
                delete headers['Sec-Ch-Ua-Mobile'];
                delete headers['Sec-Ch-Ua-Platform'];
                callback({ cancel: false, requestHeaders: headers });
            });
        }
    }
    catch (e) {
        console.error('Failed to setup session:', e);
    }
}
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
electron_1.app.userAgentFallback = userAgent;
// Register IPC listeners once
function setupIPC() {
    // Auto Updater Events
    electron_1.ipcMain.on('restart_app', () => {
        electron_updater_1.autoUpdater.quitAndInstall();
    });
    electron_1.ipcMain.on('check_for_update', () => {
        electron_updater_1.autoUpdater.checkForUpdates();
    });
    electron_updater_1.autoUpdater.on('update-available', () => {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('update_available');
    });
    electron_updater_1.autoUpdater.on('update-downloaded', () => {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('update_downloaded');
    });
    electron_updater_1.autoUpdater.on('download-progress', (progressObj) => {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('download_progress', progressObj.percent);
    });
    // IPC for app version
    electron_1.ipcMain.handle('get-app-version', () => {
        return electron_1.app.getVersion();
    });
    // IPC for window controls
    electron_1.ipcMain.on('window-minimize', () => mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.minimize());
    electron_1.ipcMain.on('window-maximize', () => {
        if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.maximize();
        }
    });
    electron_1.ipcMain.on('window-close', () => mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.close());
    // IPC for theme control
    electron_1.ipcMain.on('set-theme', (_event, mode) => {
        electron_1.nativeTheme.themeSource = mode;
    });
    // IPC for file operations
    electron_1.ipcMain.handle('open-file-location', (_, filePath) => __awaiter(this, void 0, void 0, function* () {
        console.log('Main process received open-file-location request:', filePath);
        if (filePath) {
            const normalizedPath = path_1.default.normalize(filePath);
            console.log('Opening normalized path:', normalizedPath);
            // Check if file exists
            if (!fs_1.default.existsSync(normalizedPath)) {
                console.error('File does not exist:', normalizedPath);
                // Try to open the parent directory instead
                const dirPath = path_1.default.dirname(normalizedPath);
                if (fs_1.default.existsSync(dirPath)) {
                    console.log('File missing, opening parent directory:', dirPath);
                    electron_1.shell.openPath(dirPath);
                    return true;
                }
                return false;
            }
            electron_1.shell.showItemInFolder(normalizedPath);
            return true;
        }
        else {
            console.error('Received empty file path for show-item-in-folder');
            return false;
        }
    }));
    // IPC for blocking domains
    electron_1.ipcMain.on('block-domain', (_event, domain) => {
        if (domain) {
            if (!userBlockedDomains.includes(domain)) {
                userBlockedDomains.push(domain);
                try {
                    fs_1.default.writeFileSync(blockedDomainsPath, JSON.stringify(userBlockedDomains));
                }
                catch (e) {
                    console.error('Failed to save blocked domains:', e);
                }
                setupSession();
            }
        }
    });
    // IPC for importing bookmarks
    electron_1.ipcMain.handle('import-bookmarks', () => __awaiter(this, void 0, void 0, function* () {
        if (!mainWindow)
            return null;
        const { canceled, filePaths } = yield electron_1.dialog.showOpenDialog(mainWindow, {
            title: 'Import Bookmarks',
            properties: ['openFile'],
            filters: [{ name: 'HTML Files', extensions: ['html', 'htm'] }]
        });
        if (canceled || filePaths.length === 0) {
            return null;
        }
        try {
            const content = fs_1.default.readFileSync(filePaths[0], 'utf-8');
            return content;
        }
        catch (error) {
            console.error('Failed to read bookmarks file:', error);
            return null;
        }
    }));
    // IPC for clearing data
    electron_1.ipcMain.handle('clear-data', () => __awaiter(this, void 0, void 0, function* () {
        if (!mainWindow)
            return;
        const sess = mainWindow.webContents.session;
        try {
            // Use specific types for clearStorageData to avoid TS errors
            yield sess.clearStorageData({
                storages: ['cookies', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'serviceworkers', 'cachestorage']
            });
            yield sess.clearCache();
            console.log('Browsing data cleared');
        }
        catch (e) {
            console.error('Failed to clear data:', e);
        }
    }));
    // IPC for search suggestions
    electron_1.ipcMain.handle('get-search-suggestions', (_, query) => __awaiter(this, void 0, void 0, function* () {
        if (!query)
            return [];
        try {
            const response = yield electron_1.net.fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`);
            const data = yield response.json();
            return data[1] || [];
        }
        catch (e) {
            console.error('Failed to fetch suggestions:', e);
            return [];
        }
    }));
    // Handle directory selection
    electron_1.ipcMain.handle('select-dirs', () => __awaiter(this, void 0, void 0, function* () {
        const result = yield electron_1.dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });
        return result.canceled ? null : result.filePaths;
    }));
}
function createSplashWindow() {
    splashWindow = new electron_1.BrowserWindow({
        width: 400,
        height: 400,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    const splashUrl = `file://${path_1.default.join(__dirname, '../splash.html')}`;
    splashWindow.loadURL(splashUrl);
    return splashWindow;
}
function createMainWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        show: false, // Hidden initially
        icon: path_1.default.join(__dirname, '../public/logo.svg'), // Set app icon
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
        },
        frame: false, // Frameless window
        backgroundColor: '#00000000', // Transparent background
        titleBarStyle: 'hidden',
    });
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.webContents.openDevTools();
    }
    // Handle downloads
    mainWindow.webContents.session.on('will-download', (_event, item) => {
        // Ensure we save to the user's Downloads folder by default if no path is set
        if (!item.getSavePath()) {
            item.setSavePath(path_1.default.join(electron_1.app.getPath('downloads'), item.getFilename()));
        }
        item.on('updated', (_event, state) => {
            if (state === 'interrupted') {
                mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('download-updated', {
                    id: item.getStartTime(),
                    state: 'interrupted',
                    filename: item.getFilename(),
                    received: item.getReceivedBytes(),
                    total: item.getTotalBytes()
                });
            }
            else if (state === 'progressing') {
                if (item.isPaused()) {
                    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('download-updated', {
                        id: item.getStartTime(),
                        state: 'paused',
                        filename: item.getFilename(),
                        received: item.getReceivedBytes(),
                        total: item.getTotalBytes()
                    });
                }
                else {
                    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('download-updated', {
                        id: item.getStartTime(),
                        state: 'progressing',
                        filename: item.getFilename(),
                        received: item.getReceivedBytes(),
                        total: item.getTotalBytes(),
                        path: item.getSavePath()
                    });
                }
            }
        });
        item.once('done', (_event, state) => {
            if (state === 'completed') {
                mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('download-done', {
                    id: item.getStartTime(),
                    state: 'completed',
                    filename: item.getFilename(),
                    path: item.getSavePath()
                });
            }
            else {
                mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('download-done', {
                    id: item.getStartTime(),
                    state: 'failed',
                    filename: item.getFilename()
                });
            }
        });
    });
    mainWindow.once('ready-to-show', () => {
        setTimeout(() => {
            if (splashWindow && !splashWindow.isDestroyed()) {
                splashWindow.close();
            }
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.show();
        }, 2000); // Minimum splash time
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// Global User Agent to avoid Google Sign-in issues
electron_1.app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
electron_1.app.whenReady().then(() => {
    setupIPC();
    createSplashWindow();
    createMainWindow();
    // Check for updates
    try {
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
    }
    catch (e) {
        console.error('Failed to check for updates:', e);
    }
    // Handle deep links on macOS
    electron_1.app.on('open-url', (event, url) => {
        event.preventDefault();
        if (url.startsWith(`${PROTOCOL}://`)) {
            if (mainWindow) {
                if (mainWindow.isMinimized())
                    mainWindow.restore();
                mainWindow.focus();
            }
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('deep-link', url);
        }
    });
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createSplashWindow();
            createMainWindow();
        }
    });
    // Setup Session (Ad Blocker & User Agent)
    setupSession();
    // Context Menu & Webview Handling
    electron_1.app.on('web-contents-created', (_e, contents) => {
        if (contents.getType() === 'webview') {
            contents.on('context-menu', (e, params) => {
                e.preventDefault();
                mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('context-menu-request', {
                    params,
                    x: params.x,
                    y: params.y
                });
            });
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
