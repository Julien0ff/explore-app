import { app, BrowserWindow, ipcMain, nativeTheme, session, shell, dialog, net } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import http from 'http';
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
let adBlockEnabled = true;
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

function setupSession(sess: Electron.Session = session.defaultSession) {
  const filter = {
    urls: ['*://*/*']
  };
  
  try {
      const bypassRules = '<local>;*.google.com;*.gstatic.com;*.duckduckgo.com;flagcdn.com';
      if (globalSessionConfig.proxyRules) {
        sess.setProxy({ proxyRules: globalSessionConfig.proxyRules, proxyBypassRules: bypassRules });
      } else {
        sess.setProxy({ proxyRules: 'direct://' });
      }

      // Ad Blocker
      sess.webRequest.onBeforeRequest(filter, (details, callback) => {
        if (!adBlockEnabled) {
          callback({ cancel: false });
          return;
        }

        const url = details.url.toLowerCase();
        
        // Whitelist all main Google domain requests (except ad subdomains) to ensure search never breaks
        const isGoogleMain = (
          url.startsWith('https://www.google.com') ||
          url.startsWith('https://www.google.fr') ||
          url.startsWith('https://google.com') ||
          url.startsWith('https://google.fr') ||
          url.startsWith('http://www.google.com') ||
          url.startsWith('http://www.google.fr')
        );
        const isGoogleAdSubdomain = (
          url.includes('ads.google.com') ||
          url.includes('adservice.google.com')
        );
        if (
          (isGoogleMain && !isGoogleAdSubdomain) ||
          url.includes('gstatic.com') ||
          url.includes('/favicon.ico') ||
          url.includes('icons.duckduckgo.com') ||
          url.includes('flagcdn.com')
        ) {
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


  } catch (e) {
    console.error('Failed to setup session:', e);
  }
}

// App listeners for new sessions
app.on('session-created', (sess) => {
  setupSession(sess);
});

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
  ipcMain.handle('open-external', async (_, url) => {
    await shell.openExternal(url);
  });

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
  ipcMain.handle('get-adblock-enabled', () => adBlockEnabled);
  ipcMain.on('set-adblock-enabled', (_event, enabled: boolean) => {
    adBlockEnabled = enabled;
  });

  ipcMain.on('block-domain', (_event, domain) => {
    if (domain) {
      if (!userBlockedDomains.includes(domain)) {
        userBlockedDomains.push(domain);
        try {
          fs.writeFileSync(blockedDomainsPath, JSON.stringify(userBlockedDomains));
        } catch (e) {
          console.error('Failed to save blocked domains:', e);
        }
        setupSession(session.defaultSession);
        setupSession(session.fromPartition('persist:explore'));
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

  // IPC for Auth Window
  ipcMain.handle('open-auth-window', async (_, url) => {
    const authWindow = new BrowserWindow({
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
        mainWindow?.webContents.send('deep-link', url);
        authWindow.close();
      }
    });

    authWindow.webContents.on('will-redirect', (event, url) => {
      if (url.startsWith('explore://')) {
        event.preventDefault();
        mainWindow?.webContents.send('deep-link', url);
        authWindow.close();
      }
    });

    // Also handle new window opening (some auth flows open popups)
    authWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('explore://')) {
        mainWindow?.webContents.send('deep-link', url);
        authWindow.close();
        return { action: 'deny' };
      }
      return { action: 'allow' };
    });

    try {
      await authWindow.loadURL(url);
    } catch (e) {
      console.error('Failed to load auth URL:', e);
      authWindow.close();
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

  // Prepare local OAuth redirect server
  let oauthServer: http.Server | null = null;
  ipcMain.handle('prepare-oauth', async () => {
    return new Promise<string>((resolve, reject) => {
      try {
        if (oauthServer) {
          oauthServer.close();
          oauthServer = null;
        }
        oauthServer = http.createServer((req, res) => {
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
              oauthServer?.close();
              oauthServer = null;
            }, 3000);
          } else {
            res.statusCode = 404;
            res.end('Not Found');
          }
        });
        // Important: use fixed port 36963 for Supabase Redirect URI match!
        oauthServer.listen(36963, '127.0.0.1', () => {
          const redirectUrl = `http://127.0.0.1:36963/auth/callback`;
          resolve(redirectUrl);
        });
      } catch (e) {
        reject(e);
      }
    });
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

  const splashUrl = `file://${path.join(__dirname, app.isPackaged ? '../splash.html' : '../splash.html')}`;
  splashWindow.loadURL(splashUrl);
  
  return splashWindow;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Hidden initially
    transparent: false, // Revert transparency to fix webview rendering on Windows
    icon: path.join(__dirname, app.isPackaged ? '../dist/icon.png' : '../public/icon.png'), // Set app icon
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
    frame: false, // Frameless window
    backgroundColor: '#1e1e2e', // Use solid background for dark mode by default
    titleBarStyle: 'hidden',
  });

  const indexPath = path.join(__dirname, '../dist/index.html');

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
      mainWindow?.show();
    }, 2000); // Minimum splash time
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(indexPath);
  }

  // FORCE DevTools in Production for debugging v1.5.8
  mainWindow.webContents.openDevTools({ mode: 'detach' });

  // Debug webviews
  mainWindow.webContents.on('did-attach-webview', (_, webContents) => {
    webContents.openDevTools({ mode: 'detach' });
  });

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

  // Removed old ready-to-show listener from here as it was moved up
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// No changes needed here, just removing the redundant User-Agent block above if it exists
// Checked later and it's handled by the single userAgent at the top

app.whenReady().then(() => {
  setupIPC();
  setupSession(session.defaultSession); // Initialize session before windows
  setupSession(session.fromPartition('persist:explore'));
  createSplashWindow();
  createMainWindow();

  // Check for deep link on startup (Windows/Linux)
  if (process.platform !== 'darwin') {
    const url = process.argv.find(arg => arg.startsWith(`${PROTOCOL}://`));
    if (url) {
      setTimeout(() => {
        mainWindow?.webContents.send('deep-link', url);
      }, 3000); // Wait for window to be ready
    }
  }

  // Check for updates
  try {
    autoUpdater.on('update-available', () => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Mise à jour disponible',
        message: 'Une nouvelle version d\'Explore est disponible. Le téléchargement a commencé en arrière-plan...',
        buttons: ['Ok']
      });
    });

    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Mise à jour prête',
        message: 'La mise à jour a été téléchargée avec succès. Voulez-vous redémarrer le navigateur pour l\'installer maintenant ?',
        buttons: ['Redémarrer', 'Plus tard']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });

    autoUpdater.on('error', (err) => {
      console.error('Erreur lors de la mise à jour:', err);
    });

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

  // VPN Handlers
  ipcMain.handle('set-proxy', async (_, countryId: string) => {
    try {
      const proxy = openProxies.find(p => p.id === countryId);
      if (proxy) {
        globalSessionConfig.proxyRules = proxy.url;
      } else {
        globalSessionConfig.proxyRules = 'http://127.0.0.1:8080';
      }
      
      if (session.defaultSession) {
        const bypassRules = '<local>;*.google.com;*.gstatic.com;*.duckduckgo.com;flagcdn.com';
        await session.defaultSession.setProxy({ proxyRules: globalSessionConfig.proxyRules, proxyBypassRules: bypassRules });
      }
      return true;
    } catch (e) {
      console.error('Failed to set proxy:', e);
      return false;
    }
  });

  ipcMain.handle('disable-proxy', async () => {
    try {
      globalSessionConfig.proxyRules = '';
      if (session.defaultSession) {
        await session.defaultSession.setProxy({ proxyRules: 'direct://' });
      }
      return true;
    } catch (e) {
      console.error('Failed to disable proxy:', e);
      return false;
    }
  });

  // Setup Session (Ad Blocker & User Agent)
  setupSession(session.defaultSession);
  setupSession(session.fromPartition('persist:explore'));
  
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
