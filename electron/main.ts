import { app, BrowserWindow, ipcMain, nativeTheme, session, shell, dialog, net } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

// Protocol Handler
const PROTOCOL = 'explore';

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    
    // Protocol handler for Windows/Linux
    // The URL is usually the last argument
    const url = commandLine.find(arg => arg.startsWith(`${PROTOCOL}://`));
    if (url) {
        mainWindow?.webContents.send('deep-link', url);
    }
  });
}

// Ad Blocker State
const defaultBlockedDomains: string[] = [
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

let userBlockedDomains: string[] = [];
const blockedDomainsPath = path.join(app.getPath('userData'), 'blocked-domains.json');

try {
  if (fs.existsSync(blockedDomainsPath)) {
    userBlockedDomains = JSON.parse(fs.readFileSync(blockedDomainsPath, 'utf-8'));
  }
} catch (e) {
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
    if (session && session.defaultSession) {
      // Ad Blocker
      session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
        const url = details.url.toLowerCase();
        
        // Whitelist Google Favicons to prevent them from being blocked
        if (url.includes('google.com/s2/favicons') || url.includes('/favicon.ico')) {
          callback({ cancel: false });
          return;
        }

        const isAd = getAllBlockedDomains().some(domain => url.includes(domain));
        
        if (isAd) {
          mainWindow?.webContents.send('ad-blocked', url);
          callback({ cancel: true });
        } else {
          callback({ cancel: false });
        }
      });

      // User Agent Spoofing
      session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        const headers = details.requestHeaders;
        // Force Chrome User Agent
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
        
        // Mock Client Hints to match Chrome
        headers['Sec-Ch-Ua'] = '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"';
        headers['Sec-Ch-Ua-Mobile'] = '?0';
        headers['Sec-Ch-Ua-Platform'] = '"Windows"';

        callback({ cancel: false, requestHeaders: headers });
      });
    }
  } catch (e) {
    console.error('Failed to setup session:', e);
  }
}

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
app.userAgentFallback = userAgent;

// Register IPC listeners once
function setupIPC() {
  // Auto Updater Events
  ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.on('check_for_update', () => {
    autoUpdater.checkForUpdates();
  });

  autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('update_available');
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update_downloaded');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('download_progress', progressObj.percent);
  });

  // IPC for app version
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // IPC for window controls
  ipcMain.on('window-minimize', () => mainWindow?.minimize());
  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window-close', () => mainWindow?.close());
  
  // IPC for theme control
  ipcMain.on('set-theme', (_event, mode: 'dark' | 'light' | 'system') => {
    nativeTheme.themeSource = mode;
  });

  // IPC for file operations
  ipcMain.handle('open-file-location', async (_, filePath) => {
    console.log('Main process received open-file-location request:', filePath);
    if (filePath) {
      const normalizedPath = path.normalize(filePath);
      console.log('Opening normalized path:', normalizedPath);
      // Check if file exists
      if (!fs.existsSync(normalizedPath)) {
        console.error('File does not exist:', normalizedPath);
        // Try to open the parent directory instead
        const dirPath = path.dirname(normalizedPath);
        if (fs.existsSync(dirPath)) {
          console.log('File missing, opening parent directory:', dirPath);
          shell.openPath(dirPath);
          return true;
        }
        return false;
      }
      shell.showItemInFolder(normalizedPath);
      return true;
    } else {
      console.error('Received empty file path for show-item-in-folder');
      return false;
    }
  });

  // IPC for blocking domains
  ipcMain.on('block-domain', (_event, domain) => {
    if (domain) {
      if (!userBlockedDomains.includes(domain)) {
        userBlockedDomains.push(domain);
        try {
          fs.writeFileSync(blockedDomainsPath, JSON.stringify(userBlockedDomains));
        } catch (e) {
          console.error('Failed to save blocked domains:', e);
        }
        setupSession();
      }
    }
  });

  // IPC for importing bookmarks
  ipcMain.handle('import-bookmarks', async () => {
    if (!mainWindow) return null;
    
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Bookmarks',
      properties: ['openFile'],
      filters: [{ name: 'HTML Files', extensions: ['html', 'htm'] }]
    });

    if (canceled || filePaths.length === 0) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePaths[0], 'utf-8');
      return content;
    } catch (error) {
      console.error('Failed to read bookmarks file:', error);
      return null;
    }
  });

  // IPC for clearing data
  ipcMain.handle('clear-data', async () => {
    if (!mainWindow) return;
    const sess = mainWindow.webContents.session;
    try {
      // Use specific types for clearStorageData to avoid TS errors
      await sess.clearStorageData({
        storages: ['cookies', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'serviceworkers', 'cachestorage']
      });
      await sess.clearCache();
      console.log('Browsing data cleared');
    } catch (e) {
      console.error('Failed to clear data:', e);
    }
  });

  // IPC for search suggestions
  ipcMain.handle('get-search-suggestions', async (_, query) => {
    if (!query) return [];
    try {
      const response = await net.fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`);
      const data = await response.json() as [string, string[]];
      return data[1] || [];
    } catch (e) {
      console.error('Failed to fetch suggestions:', e);
      return [];
    }
  });

  // Handle directory selection
  ipcMain.handle('select-dirs', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths;
  });
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
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

  const splashUrl = `file://${path.join(__dirname, '../splash.html')}`;
  splashWindow.loadURL(splashUrl);
  
  return splashWindow;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Hidden initially
    icon: path.join(__dirname, '../public/logo.svg'), // Set app icon
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }

  // Handle downloads
  mainWindow.webContents.session.on('will-download', (_event, item) => {
    // Ensure we save to the user's Downloads folder by default if no path is set
    if (!item.getSavePath()) {
      item.setSavePath(path.join(app.getPath('downloads'), item.getFilename()));
    }

    item.on('updated', (_event, state) => {
      if (state === 'interrupted') {
        mainWindow?.webContents.send('download-updated', {
          id: item.getStartTime(),
          state: 'interrupted',
          filename: item.getFilename(),
          received: item.getReceivedBytes(),
          total: item.getTotalBytes()
        });
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          mainWindow?.webContents.send('download-updated', {
            id: item.getStartTime(),
            state: 'paused',
            filename: item.getFilename(),
            received: item.getReceivedBytes(),
            total: item.getTotalBytes()
          });
        } else {
          mainWindow?.webContents.send('download-updated', {
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
        mainWindow?.webContents.send('download-done', {
          id: item.getStartTime(),
          state: 'completed',
          filename: item.getFilename(),
          path: item.getSavePath()
        });
      } else {
        mainWindow?.webContents.send('download-done', {
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
      mainWindow?.show();
    }, 2000); // Minimum splash time
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Global User Agent to avoid Google Sign-in issues
app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

app.whenReady().then(() => {
  setupIPC();
  createSplashWindow();
  createMainWindow();

  // Check for updates
  try {
    autoUpdater.checkForUpdatesAndNotify();
  } catch (e) {
    console.error('Failed to check for updates:', e);
  }

  // Handle deep links on macOS
  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (url.startsWith(`${PROTOCOL}://`)) {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
        mainWindow?.webContents.send('deep-link', url);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createSplashWindow();
      createMainWindow();
    }
  });

  // Setup Session (Ad Blocker & User Agent)
  setupSession();
  
  // Context Menu & Webview Handling
  app.on('web-contents-created', (_e, contents) => {
    if (contents.getType() === 'webview') {
      contents.on('context-menu', (e, params) => {
        e.preventDefault();
        mainWindow?.webContents.send('context-menu-request', {
          params,
          x: params.x,
          y: params.y
        });
      });
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
