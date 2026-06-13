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
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const adm_zip_1 = __importDefault(require("adm-zip"));
electron_1.app.setName('Explore Browser');
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
let adBlockEnabled = true;
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
// Simple mock proxy array to simulate VPN routing
const openProxies = [
    { id: 'fr', url: 'http://51.15.227.220:3128' }, // Mock IP
    { id: 'us', url: 'http://198.27.74.14:80' },
    { id: 'uk', url: 'http://8.26.94.3:80' },
    { id: 'jp', url: 'http://163.43.24.116:8080' },
    { id: 'de', url: 'http://78.46.200.216:3128' },
    { id: 'ca', url: 'http://104.254.244.14:80' },
    { id: 'au', url: 'http://103.111.53.146:80' }
];
const globalSessionConfig = {
    proxyRules: ''
};
function setupSession(sess = electron_1.session.defaultSession) {
    const filter = {
        urls: ['*://*/*']
    };
    try {
        const bypassRules = '<local>;*.google.com;*.gstatic.com;*.duckduckgo.com;flagcdn.com';
        if (globalSessionConfig.proxyRules) {
            sess.setProxy({ proxyRules: globalSessionConfig.proxyRules, proxyBypassRules: bypassRules });
        }
        else {
            sess.setProxy({ proxyRules: 'direct://' });
        }
        // Initialize real Ad Blocker if installed
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { ElectronBlocker } = require('@cliqz/adblocker-electron');
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const fetch = require('cross-fetch');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((b) => {
                if (adBlockEnabled) {
                    b.enableBlockingInSession(sess);
                }
                // Provide a way to toggle it globally
                electron_1.ipcMain.removeAllListeners('toggle-adblock'); // Prevent duplicate listeners
                electron_1.ipcMain.on('toggle-adblock', (_event, enabled) => {
                    adBlockEnabled = enabled;
                    if (enabled) {
                        b.enableBlockingInSession(sess);
                    }
                    else {
                        b.disableBlockingInSession(sess);
                    }
                });
            });
        }
        catch (_a) {
            // Fallback to basic custom blocker if module not installed yet
            sess.webRequest.onBeforeRequest(filter, (details, callback) => {
                if (!adBlockEnabled) {
                    callback({ cancel: false });
                    return;
                }
                const url = details.url.toLowerCase();
                // Whitelist all main Google domain requests
                const isGoogleMain = (url.startsWith('https://www.google.com') ||
                    url.startsWith('https://www.google.fr') ||
                    url.startsWith('https://google.com') ||
                    url.startsWith('https://google.fr') ||
                    url.startsWith('http://www.google.com') ||
                    url.startsWith('http://www.google.fr'));
                const isGoogleAdSubdomain = (url.includes('ads.google.com') ||
                    url.includes('adservice.google.com'));
                if ((isGoogleMain && !isGoogleAdSubdomain) ||
                    url.includes('gstatic.com') ||
                    url.includes('/favicon.ico') ||
                    url.includes('icons.duckduckgo.com') ||
                    url.includes('flagcdn.com')) {
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
        }
    }
    catch (e) {
        console.error('Failed to setup session:', e);
    }
}
// App listeners for new sessions
electron_1.app.on('session-created', (sess) => {
    setupSession(sess);
});
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
electron_1.app.userAgentFallback = userAgent;
// Register IPC listeners once
function setupIPC() {
    // Auto Updater Events
    electron_1.ipcMain.on('restart_app', () => {
        console.log('Main: quitAndInstall triggered');
        electron_updater_1.autoUpdater.quitAndInstall();
    });
    electron_1.ipcMain.on('check_for_update', () => {
        console.log('Main: checkForUpdates triggered manually');
        electron_updater_1.autoUpdater.checkForUpdates().catch(err => {
            console.error('Failed to check for updates manually:', err);
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('update_error', (err === null || err === void 0 ? void 0 : err.message) || String(err));
        });
    });
    electron_updater_1.autoUpdater.on('checking-for-update', () => {
        console.log('Updater: checking-for-update');
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('update_checking');
    });
    electron_updater_1.autoUpdater.on('update-available', (info) => {
        console.log('Updater: update-available');
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('update_available', info === null || info === void 0 ? void 0 : info.version);
    });
    electron_updater_1.autoUpdater.on('update-not-available', () => {
        console.log('Updater: update-not-available');
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('update_not_available');
    });
    electron_updater_1.autoUpdater.on('error', (err) => {
        console.error('Updater error:', err);
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('update_error', (err === null || err === void 0 ? void 0 : err.message) || String(err));
    });
    electron_updater_1.autoUpdater.on('download-progress', (progressObj) => {
        console.log(`Updater progress: ${progressObj.percent}%`);
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('download_progress', progressObj.percent);
    });
    electron_updater_1.autoUpdater.on('update-downloaded', (info) => {
        console.log('Updater: update-downloaded');
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('update_downloaded', info === null || info === void 0 ? void 0 : info.version);
    });
    // IPC for app version
    electron_1.ipcMain.handle('get-app-version', () => {
        return electron_1.app.getVersion();
    });
    // IPC for Explore Search (DuckDuckGo HTML Proxy)
    electron_1.ipcMain.handle('search-web', (_, query) => __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('https://html.duckduckgo.com/html/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                body: `q=${encodeURIComponent(query)}`
            });
            if (!response.ok)
                throw new Error('Network response was not ok');
            return yield response.text();
        }
        catch (error) {
            console.error('Search failed:', error);
            return null;
        }
    }));
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
    electron_1.ipcMain.handle('open-external', (_, url) => __awaiter(this, void 0, void 0, function* () {
        yield electron_1.shell.openExternal(url);
    }));
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
    electron_1.ipcMain.handle('get-adblock-enabled', () => adBlockEnabled);
    electron_1.ipcMain.on('set-adblock-enabled', (_event, enabled) => {
        adBlockEnabled = enabled;
    });
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
                setupSession(electron_1.session.defaultSession);
                setupSession(electron_1.session.fromPartition('persist:explore'));
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
    // IPC for Auth Window
    electron_1.ipcMain.handle('open-auth-window', (_, url) => __awaiter(this, void 0, void 0, function* () {
        const authWindow = new electron_1.BrowserWindow({
            width: 600,
            height: 700,
            parent: mainWindow || undefined,
            modal: true,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            }
        });
        // Force User Agent for Google Sign In
        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
        authWindow.webContents.setUserAgent(userAgent);
        authWindow.once('ready-to-show', () => {
            authWindow.show();
        });
        // Handle redirects to custom protocol
        authWindow.webContents.on('will-navigate', (event, url) => {
            if (url.startsWith('explore://')) {
                event.preventDefault();
                mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('deep-link', url);
                authWindow.close();
            }
        });
        authWindow.webContents.on('will-redirect', (event, url) => {
            if (url.startsWith('explore://')) {
                event.preventDefault();
                mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('deep-link', url);
                authWindow.close();
            }
        });
        // Also handle new window opening (some auth flows open popups)
        authWindow.webContents.setWindowOpenHandler(({ url }) => {
            if (url.startsWith('explore://')) {
                mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('deep-link', url);
                authWindow.close();
                return { action: 'deny' };
            }
            return { action: 'allow' };
        });
        try {
            yield authWindow.loadURL(url);
        }
        catch (e) {
            console.error('Failed to load auth URL:', e);
            authWindow.close();
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
    // IPC for screenshot capture
    electron_1.ipcMain.handle('capture-page', (_, webContentsId) => __awaiter(this, void 0, void 0, function* () {
        try {
            const wc = electron_1.webContents.fromId(webContentsId);
            if (!wc)
                return null;
            const image = yield wc.capturePage();
            electron_1.clipboard.writeImage(image);
            return image.toDataURL();
        }
        catch (e) {
            console.error('Failed to capture page:', e);
            return null;
        }
    }));
    // Prepare local OAuth redirect server
    let oauthServer = null;
    electron_1.ipcMain.handle('prepare-oauth', () => __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            try {
                if (oauthServer) {
                    oauthServer.close();
                    oauthServer = null;
                }
                oauthServer = http_1.default.createServer((req, res) => {
                    if (!req.url) {
                        res.statusCode = 400;
                        res.end('Bad Request');
                        return;
                    }
                    if (req.url.startsWith('/auth/callback')) {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(`
              <html>
              <head>
                <style>body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f3f4f6; }</style>
              </head>
              <body>
                <h2>Redirection en cours...</h2>
                <p>Veuillez patienter.</p>
                <script>
                  window.location.replace('explore://auth/callback' + window.location.search + window.location.hash);
                  setTimeout(() => {
                    document.body.innerHTML = '<h2>Connexion réussie</h2><p>Vous pouvez fermer cette fenêtre et revenir à Explore.</p>';
                  }, 500);
                </script>
              </body>
              </html>
            `);
                        setTimeout(() => {
                            oauthServer === null || oauthServer === void 0 ? void 0 : oauthServer.close();
                            oauthServer = null;
                        }, 3000);
                    }
                    else {
                        res.statusCode = 404;
                        res.end('Not Found');
                    }
                });
                // Important: use fixed port 36963 for Supabase Redirect URI match!
                oauthServer.listen(36963, '127.0.0.1', () => {
                    const redirectUrl = `http://127.0.0.1:36963/auth/callback`;
                    resolve(redirectUrl);
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }));
    // Handle directory selection
    electron_1.ipcMain.handle('select-dirs', () => __awaiter(this, void 0, void 0, function* () {
        const result = yield electron_1.dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });
        return result.canceled ? null : result.filePaths;
    }));
    // ─── Extensions Management ───────────────────────────────────────────
    const extensionsDir = path_1.default.join(electron_1.app.getPath('userData'), 'extensions');
    if (!fs_1.default.existsSync(extensionsDir)) {
        fs_1.default.mkdirSync(extensionsDir, { recursive: true });
    }
    // Load all saved extensions on startup
    electron_1.ipcMain.handle('extensions-load-all', () => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const loaded = [];
        try {
            const dirs = fs_1.default.readdirSync(extensionsDir, { withFileTypes: true }).filter(d => d.isDirectory());
            for (const dir of dirs) {
                const extPath = path_1.default.join(extensionsDir, dir.name);
                const manifestPath = path_1.default.join(extPath, 'manifest.json');
                if (fs_1.default.existsSync(manifestPath)) {
                    try {
                        const manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
                        const ext = yield electron_1.session.defaultSession.loadExtension(extPath, { allowFileAccess: true });
                        // Resolve icon path
                        let iconDataUrl;
                        const iconKeys = manifest.icons ? Object.keys(manifest.icons).sort((a, b) => Number(b) - Number(a)) : [];
                        if (iconKeys.length > 0) {
                            const iconRelPath = manifest.icons[iconKeys[0]];
                            const iconAbsPath = path_1.default.join(extPath, iconRelPath);
                            if (fs_1.default.existsSync(iconAbsPath)) {
                                const iconBuf = fs_1.default.readFileSync(iconAbsPath);
                                const ext2 = path_1.default.extname(iconAbsPath).toLowerCase();
                                const mime = ext2 === '.svg' ? 'image/svg+xml' : ext2 === '.png' ? 'image/png' : 'image/jpeg';
                                iconDataUrl = `data:${mime};base64,${iconBuf.toString('base64')}`;
                            }
                        }
                        loaded.push({
                            id: ext.id,
                            name: manifest.name || dir.name,
                            version: manifest.version || '1.0',
                            description: manifest.description || '',
                            icon: iconDataUrl,
                            popup: ((_a = manifest.action) === null || _a === void 0 ? void 0 : _a.default_popup) || ((_b = manifest.browser_action) === null || _b === void 0 ? void 0 : _b.default_popup) || undefined,
                            enabled: true,
                            path: extPath
                        });
                    }
                    catch (e) {
                        console.error(`Failed to load extension ${dir.name}:`, e);
                    }
                }
            }
        }
        catch (e) {
            console.error('Failed to scan extensions directory:', e);
        }
        return loaded;
    }));
    // Install a new extension from a folder path
    electron_1.ipcMain.handle('extensions-install', (_, extSourcePath) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const manifestPath = path_1.default.join(extSourcePath, 'manifest.json');
            if (!fs_1.default.existsSync(manifestPath)) {
                return { success: false, error: 'No manifest.json found in folder' };
            }
            const manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
            const folderName = (manifest.name || path_1.default.basename(extSourcePath)).replace(/[^a-zA-Z0-9_-]/g, '_');
            const destPath = path_1.default.join(extensionsDir, folderName);
            // Copy the extension folder
            if (fs_1.default.existsSync(destPath)) {
                fs_1.default.rmSync(destPath, { recursive: true, force: true });
            }
            copyDirSync(extSourcePath, destPath);
            // Load the extension
            const ext = yield electron_1.session.defaultSession.loadExtension(destPath, { allowFileAccess: true });
            // Resolve icon
            let iconDataUrl;
            const iconKeys = manifest.icons ? Object.keys(manifest.icons).sort((a, b) => Number(b) - Number(a)) : [];
            if (iconKeys.length > 0) {
                const iconRelPath = manifest.icons[iconKeys[0]];
                const iconAbsPath = path_1.default.join(destPath, iconRelPath);
                if (fs_1.default.existsSync(iconAbsPath)) {
                    const iconBuf = fs_1.default.readFileSync(iconAbsPath);
                    const ext2 = path_1.default.extname(iconAbsPath).toLowerCase();
                    const mime = ext2 === '.svg' ? 'image/svg+xml' : ext2 === '.png' ? 'image/png' : 'image/jpeg';
                    iconDataUrl = `data:${mime};base64,${iconBuf.toString('base64')}`;
                }
            }
            return {
                success: true,
                extension: {
                    id: ext.id,
                    name: manifest.name || folderName,
                    version: manifest.version || '1.0',
                    description: manifest.description || '',
                    icon: iconDataUrl,
                    popup: ((_a = manifest.action) === null || _a === void 0 ? void 0 : _a.default_popup) || ((_b = manifest.browser_action) === null || _b === void 0 ? void 0 : _b.default_popup) || undefined,
                    enabled: true,
                    path: destPath
                }
            };
        }
        catch (e) {
            console.error('Failed to install extension:', e);
            return { success: false, error: String(e) };
        }
    }));
    // Install a new extension from a direct zip URL
    electron_1.ipcMain.handle('extensions-install-from-url', (_, zipUrl) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const tmpDir = os_1.default.tmpdir();
            const zipPath = path_1.default.join(tmpDir, `ext-${Date.now()}.zip`);
            const extractPath = path_1.default.join(tmpDir, `ext-extract-${Date.now()}`);
            // Download the zip using Electron's net module
            const response = yield electron_1.net.fetch(zipUrl);
            if (!response.ok) {
                return { success: false, error: `Failed to download: ${response.statusText}` };
            }
            const arrayBuffer = yield response.arrayBuffer();
            fs_1.default.writeFileSync(zipPath, Buffer.from(arrayBuffer));
            // Extract the zip
            const zip = new adm_zip_1.default(zipPath);
            zip.extractAllTo(extractPath, true);
            // Find where the manifest.json is
            let extSourcePath = extractPath;
            if (!fs_1.default.existsSync(path_1.default.join(extSourcePath, 'manifest.json'))) {
                // sometimes zips have a root folder inside
                const dirs = fs_1.default.readdirSync(extractPath, { withFileTypes: true }).filter(d => d.isDirectory());
                if (dirs.length > 0 && fs_1.default.existsSync(path_1.default.join(extractPath, dirs[0].name, 'manifest.json'))) {
                    extSourcePath = path_1.default.join(extractPath, dirs[0].name);
                }
                else {
                    return { success: false, error: 'No manifest.json found in downloaded zip' };
                }
            }
            const manifestPath = path_1.default.join(extSourcePath, 'manifest.json');
            const manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
            const folderName = (manifest.name || path_1.default.basename(extSourcePath)).replace(/[^a-zA-Z0-9_-]/g, '_');
            const destPath = path_1.default.join(extensionsDir, folderName);
            // Copy the extension folder
            if (fs_1.default.existsSync(destPath)) {
                fs_1.default.rmSync(destPath, { recursive: true, force: true });
            }
            copyDirSync(extSourcePath, destPath);
            // Cleanup temp
            try {
                fs_1.default.rmSync(zipPath, { force: true });
                fs_1.default.rmSync(extractPath, { recursive: true, force: true });
            }
            catch (e) {
                console.error('Failed to cleanup temp extraction:', e);
            }
            // Load the extension
            const ext = yield electron_1.session.defaultSession.loadExtension(destPath, { allowFileAccess: true });
            // Resolve icon
            let iconDataUrl;
            const iconKeys = manifest.icons ? Object.keys(manifest.icons).sort((a, b) => Number(b) - Number(a)) : [];
            if (iconKeys.length > 0) {
                const iconRelPath = manifest.icons[iconKeys[0]];
                const iconAbsPath = path_1.default.join(destPath, iconRelPath);
                if (fs_1.default.existsSync(iconAbsPath)) {
                    const iconBuf = fs_1.default.readFileSync(iconAbsPath);
                    const ext2 = path_1.default.extname(iconAbsPath).toLowerCase();
                    const mime = ext2 === '.svg' ? 'image/svg+xml' : ext2 === '.png' ? 'image/png' : 'image/jpeg';
                    iconDataUrl = `data:${mime};base64,${iconBuf.toString('base64')}`;
                }
            }
            return {
                success: true,
                extension: {
                    id: ext.id,
                    name: manifest.name || folderName,
                    version: manifest.version || '1.0',
                    description: manifest.description || '',
                    icon: iconDataUrl,
                    popup: ((_a = manifest.action) === null || _a === void 0 ? void 0 : _a.default_popup) || ((_b = manifest.browser_action) === null || _b === void 0 ? void 0 : _b.default_popup) || undefined,
                    enabled: true,
                    path: destPath
                }
            };
        }
        catch (e) {
            console.error('Failed to install extension from url:', e);
            return { success: false, error: String(e) };
        }
    }));
    // Remove an extension
    electron_1.ipcMain.handle('extensions-remove', (_, extId, extPath) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield electron_1.session.defaultSession.removeExtension(extId);
            if (extPath && fs_1.default.existsSync(extPath)) {
                fs_1.default.rmSync(extPath, { recursive: true, force: true });
            }
            return { success: true };
        }
        catch (e) {
            console.error('Failed to remove extension:', e);
            return { success: false, error: String(e) };
        }
    }));
    // Open a file dialog to pick an extension folder
    electron_1.ipcMain.handle('extensions-pick-folder', () => __awaiter(this, void 0, void 0, function* () {
        if (!mainWindow)
            return null;
        const { canceled, filePaths } = yield electron_1.dialog.showOpenDialog(mainWindow, {
            title: 'Select Extension Folder',
            properties: ['openDirectory'],
            buttonLabel: 'Load Extension'
        });
        return canceled || filePaths.length === 0 ? null : filePaths[0];
    }));
}
// Utility: recursively copy a directory
function copyDirSync(src, dest) {
    fs_1.default.mkdirSync(dest, { recursive: true });
    for (const entry of fs_1.default.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path_1.default.join(src, entry.name);
        const destPath = path_1.default.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        }
        else {
            fs_1.default.copyFileSync(srcPath, destPath);
        }
    }
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
    const splashUrl = `file://${path_1.default.join(__dirname, electron_1.app.isPackaged ? '../splash.html' : '../splash.html')}`;
    splashWindow.loadURL(splashUrl);
    return splashWindow;
}
function createMainWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        show: false, // Hidden initially
        transparent: false, // Revert transparency to fix webview rendering on Windows
        icon: path_1.default.join(__dirname, electron_1.app.isPackaged ? '../dist/icon.png' : '../public/icon.png'), // Set app icon
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
        },
        frame: false, // Frameless window
        backgroundColor: '#1e1e2e', // Use solid background for dark mode by default
        titleBarStyle: 'hidden',
    });
    const indexPath = path_1.default.join(__dirname, '../dist/index.html');
    mainWindow.once('ready-to-show', () => {
        setTimeout(() => {
            if (splashWindow && !splashWindow.isDestroyed()) {
                splashWindow.close();
            }
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.show();
        }, 2000); // Minimum splash time
    });
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    }
    else {
        mainWindow.loadFile(indexPath);
    }
    // Only open DevTools in Development Mode for main window
    if (process.env.VITE_DEV_SERVER_URL) {
        // mainWindow.webContents.openDevTools({ mode: 'detach' });
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
    // Removed old ready-to-show listener from here as it was moved up
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// No changes needed here, just removing the redundant User-Agent block above if it exists
// Checked later and it's handled by the single userAgent at the top
electron_1.app.whenReady().then(() => {
    setupIPC();
    setupSession(electron_1.session.defaultSession); // Initialize session before windows
    setupSession(electron_1.session.fromPartition('persist:explore'));
    createSplashWindow();
    createMainWindow();
    // Check for deep link on startup (Windows/Linux)
    if (process.platform !== 'darwin') {
        const url = process.argv.find(arg => arg.startsWith(`${PROTOCOL}://`));
        if (url) {
            setTimeout(() => {
                mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('deep-link', url);
            }, 3000); // Wait for window to be ready
        }
    }
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
    // VPN Handlers
    electron_1.ipcMain.handle('set-proxy', (_, countryId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const proxy = openProxies.find(p => p.id === countryId);
            if (proxy) {
                globalSessionConfig.proxyRules = proxy.url;
            }
            else {
                globalSessionConfig.proxyRules = 'http://127.0.0.1:8080';
            }
            const bypassRules = '<local>;*.google.com;*.gstatic.com;*.duckduckgo.com;flagcdn.com';
            const sessions = [
                electron_1.session.defaultSession,
                electron_1.session.fromPartition('persist:explore'),
                electron_1.session.fromPartition('private')
            ];
            for (const sess of sessions) {
                if (sess) {
                    yield sess.setProxy({ proxyRules: globalSessionConfig.proxyRules, proxyBypassRules: bypassRules });
                }
            }
            return true;
        }
        catch (e) {
            console.error('Failed to set proxy:', e);
            return false;
        }
    }));
    electron_1.ipcMain.handle('disable-proxy', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            globalSessionConfig.proxyRules = '';
            const sessions = [
                electron_1.session.defaultSession,
                electron_1.session.fromPartition('persist:explore'),
                electron_1.session.fromPartition('private')
            ];
            for (const sess of sessions) {
                if (sess) {
                    yield sess.setProxy({ proxyRules: 'direct://' });
                }
            }
            return true;
        }
        catch (e) {
            console.error('Failed to disable proxy:', e);
            return false;
        }
    }));
    // Setup Session (Ad Blocker & User Agent)
    setupSession(electron_1.session.defaultSession);
    setupSession(electron_1.session.fromPartition('persist:explore'));
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
