import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Minus,
  Square,
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  Search,
  Settings,
  Star,
  Shield,
  User as UserIcon,
  Tv,
  BookOpen,
  Volume2,
  Terminal,
  Key,
  Globe,
  FolderPlus,
  Trash2,
  Camera,
  SplitSquareHorizontal,
  SplitSquareVertical,
  Puzzle,
  Pin
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Reorder, AnimatePresence, motion } from 'framer-motion';

import { Logo } from './components/Logo';
import { IncognitoIcon } from './components/IncognitoIcon';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmModal } from './components/ConfirmModal';
import { PasswordManager } from './components/PasswordManager';
import { VPN } from './components/VPN';

import { AuthModal } from './components/AuthModal';
import type { User } from './components/AuthModal';

import { BookmarksBar } from './components/BookmarksBar';
import { BookmarkList } from './components/BookmarkList';
import { supabase } from './lib/supabase';
import type { HistoryItem, Bookmark } from './types';
import { Onboarding } from './components/Onboarding';
import { NewTabPage } from './components/NewTabPage';
import { DownloadsPopup } from './components/DownloadsPopup';
import type { DownloadItem } from './components/DownloadsPopup';
import { RegionCropper } from './components/RegionCropper';
import { CommandPalette } from './components/CommandPalette';
import { ContextMenu } from './components/ContextMenu';
import { ExtensionsPage } from './components/ExtensionsPage';
import ExtensionStore from './components/ExtensionStore';
import { ThemesPage } from './components/ThemesPage';
import { SearchPage } from './components/SearchPage';
import { FileDown } from 'lucide-react';
import { getAccentColorClass } from './lib/theme';
import { getActiveTheme, applyTheme } from './lib/themes';
import { detectPlatform } from './lib/platform';
import { IOSLayout } from './components/mobile/IOSLayout';
import { AndroidLayout } from './components/mobile/AndroidLayout';
import { Capacitor } from '@capacitor/core';
import { Xframe } from 'capacitor-plugin-xframe';

interface Tab {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  themeColor?: string;
  isReaderMode?: boolean;
  isPrivate?: boolean;
  isMediaPlaying?: boolean;
  isAudioPlaying?: boolean;
  splitTabId?: string | null;
  splitDirection?: 'horizontal' | 'vertical';
}

function App() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', url: 'explore://newtab', title: 'Nouvel onglet', isLoading: false }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [urlInput, setUrlInput] = useState<string>('https://www.google.com');

  // Start xframe interceptor on native mobile platforms
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      console.log('[Xframe] Starting header interception bypass...');
      Xframe.start()
        .then(() => console.log('[Xframe] Header interceptor started successfully'))
        .catch((err: unknown) => console.error('[Xframe] Failed to start header interceptor:', err));
    }
  }, []);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot-password' | 'reset-password'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showPasswordManager, setShowPasswordManager] = useState(false);
  const [showVPN, setShowVPN] = useState(false);
  const [adBlockEnabled, setAdBlockEnabled] = useState(true);
  const [showAdBlockMenu, setShowAdBlockMenu] = useState(false);
  const [showSplitMenu, setShowSplitMenu] = useState(false);
  const [showScreenshotMenu, setShowScreenshotMenu] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  const [installedExtensions, setInstalledExtensions] = useState<ElectronExtensionInfo[]>([]);
  const [activeExtensionPopup, setActiveExtensionPopup] = useState<string | null>(null);
  const [showExtensionsMenu, setShowExtensionsMenu] = useState(false);
  const [pinnedExtensions, setPinnedExtensions] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('explore-pinned-extensions') || '[]');
    } catch {
      return [];
    }
  });

  const [openedPopups, setOpenedPopups] = useState<string[]>([]);
  useEffect(() => {
    if (activeExtensionPopup && !openedPopups.includes(activeExtensionPopup)) {
      setOpenedPopups(prev => [...prev, activeExtensionPopup]);
    }
  }, [activeExtensionPopup, openedPopups]);

  useEffect(() => {
    localStorage.setItem('explore-pinned-extensions', JSON.stringify(pinnedExtensions));
  }, [pinnedExtensions]);

  useEffect(() => {
    const loadExtensions = async () => {
      if (window.electron?.extensionsLoadAll) {
        const loaded = await window.electron.extensionsLoadAll();
        setInstalledExtensions(loaded);
      }
    };
    loadExtensions();

    const handleExtensionsChanged = () => {
      loadExtensions();
    };

    window.addEventListener('extensions-changed', handleExtensionsChanged);
    return () => window.removeEventListener('extensions-changed', handleExtensionsChanged);
  }, []);

  const hasCheckedExtensionUpdates = useRef(false);
  
  useEffect(() => {
    if (hasCheckedExtensionUpdates.current) return;
    if (installedExtensions.length === 0) return;
    
    const checkForUpdates = async () => {
      try {
        const response = await fetch('https://api.github.com/search/repositories?q=topic:explore-extension');
        if (!response.ok) return;
        const data = await response.json();
        const officialExts = data.items || [];

        for (const installed of installedExtensions) {
          const official = officialExts.find((ext: { name: string }) => ext.name === installed.name || ext.name === installed.id);
          if (!official) continue;

          const releaseRes = await fetch(`https://api.github.com/repos/${official.owner.login}/${official.name}/releases/latest`);
          if (!releaseRes.ok) continue;
          
          const release = await releaseRes.json();
          const latestVersion = release.tag_name.replace('v', '');
          const currentVersion = installed.version.replace('v', '');

          if (latestVersion !== currentVersion && latestVersion > currentVersion) {
            console.log(`Updating extension ${installed.name} from ${currentVersion} to ${latestVersion}`);
            
            const zipAsset = release.assets?.find((a: { name: string; browser_download_url: string }) => a.name.endsWith('.zip'));
            if (zipAsset && window.electron?.extensionsInstallFromUrl) {
              const result = await window.electron.extensionsInstallFromUrl(zipAsset.browser_download_url);
              if (result.success) {
                window.dispatchEvent(new Event('extensions-changed'));
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to check for extension updates:', err);
      }
    };

    hasCheckedExtensionUpdates.current = true;
    setTimeout(checkForUpdates, 5000);
  }, [installedExtensions]);

  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [bookmarkSearchQuery, setBookmarkSearchQuery] = useState('');
  const [bookmarkContextMenu, setBookmarkContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    bookmarkId: string;
    bookmarkUrl?: string;
  } | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (bookmarkContextMenu?.isOpen) {
        setBookmarkContextMenu(null);
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [bookmarkContextMenu]);
  
  const [showBookmarksBar, setShowBookmarksBar] = useState(() => {
    return localStorage.getItem('showBookmarksBar') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('showBookmarksBar', String(showBookmarksBar));
  }, [showBookmarksBar]);

  const [windowStyle, setWindowStyle] = useState<'mac' | 'windows'>(() => {
    return (localStorage.getItem('explore_window_style') as 'mac' | 'windows') || 'mac';
  });

  useEffect(() => {
    localStorage.setItem('explore_window_style', windowStyle);
  }, [windowStyle]);

  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tabPosition, setTabPosition] = useState<'left' | 'top' | 'bottom' | 'right'>('left');
  const [theme, setTheme] = useState("dark" as "light" | "dark" | "system");
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboardingCompleted');
  });
  const [ambientMode, setAmbientMode] = useState(() => {
    return localStorage.getItem('ambientMode') !== 'false';
  });
  useEffect(() => {
    localStorage.setItem('ambientMode', ambientMode.toString());
  }, [ambientMode]);

  const [autoCloudSync, setAutoCloudSync] = useState(() => {
    return localStorage.getItem('explore_auto_cloud_sync') === 'true';
  });
  useEffect(() => {
    localStorage.setItem('explore_auto_cloud_sync', String(autoCloudSync));
  }, [autoCloudSync]);
  const [searchEngine, setSearchEngine] = useState(() => {
    return localStorage.getItem('searchEngine') || 'google';
  });
  
  const [earlyTesting, setEarlyTesting] = useState(() => {
    const saved = localStorage.getItem('explore_early_testing');
    return saved ? JSON.parse(saved) : { screenshot: false, splitView: false, exploreSearch: false };
  });
  useEffect(() => {
    localStorage.setItem('explore_early_testing', JSON.stringify(earlyTesting));
  }, [earlyTesting]);
  
  const [accentColor, setAccentColor] = useState('blue');
  const [activeExploreTheme, setActiveExploreTheme] = useState<string | null>(() => getActiveTheme() ? getActiveTheme()!.id : null);
  const colors = getAccentColorClass(activeExploreTheme ? 'theme' : accentColor, theme === 'dark');

  // Language state must be declared before it is used in initial state
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const languageRef = useRef(language);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [shortcuts, setShortcuts] = useState(() => {
    const saved = localStorage.getItem('explore_shortcuts_v1');
    return saved ? JSON.parse(saved) : {
      newTab: 'Ctrl+T',
      closeTab: 'Ctrl+W',
      focusUrl: 'Ctrl+L',
      reloadTab: 'Ctrl+R',
      togglePrivate: 'Ctrl+Shift+P',
      saveSession: 'Ctrl+Shift+S',
      restoreSession: 'Ctrl+Shift+R',
      enablePiP: 'Ctrl+Shift+E',
      toggleHistory: 'Ctrl+H',
      toggleBookmarks: 'Ctrl+B',
      openSettings: 'Ctrl+,',
    };
  });

  useEffect(() => {
    languageRef.current = language;
    // Update initial tab title if it's the default one
    setTabs(prev => prev.map(t => 
      (t.title === 'Nouvel onglet' || t.title === 'New Tab') 
        ? { ...t, title: language === 'fr' ? 'Nouvel onglet' : 'New Tab' }
        : t
    ));
  }, [language]);
  useEffect(() => {
    if (window.electron) {
      window.electron.setTheme(theme);
    }
    // Set scrollbar color RGB values for CSS usage
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `${r}, ${g}, ${b}`;
    };
    
    document.documentElement.style.setProperty('--scrollbar-rgb', hexToRgb(colors.hex));
  }, [theme, colors.hex]);

  // Apply saved explore theme on startup
  useEffect(() => {
    const savedTheme = getActiveTheme();
    if (savedTheme) {
      applyTheme(savedTheme);
    }

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<string | null>;
      setActiveExploreTheme(customEvent.detail);
    };

    window.addEventListener('explore-theme-changed', handleThemeChange);
    return () => window.removeEventListener('explore-theme-changed', handleThemeChange);
  }, []);

  const [updateState, setUpdateState] = useState<{
    status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error';
    progress?: number;
    error?: string;
    showModal: boolean;
    version?: string;
  }>({
    status: 'idle',
    showModal: false,
  });

  useEffect(() => {
    if (!window.electron) return;

    const onChecking = () => {
      console.log('Renderer: update_checking received');
      setUpdateState(prev => ({ ...prev, status: 'checking', showModal: true, error: undefined }));
    };

    const onAvailable = (version?: string) => {
      console.log('Renderer: update_available received', version);
      setUpdateState(prev => ({ ...prev, status: 'available', showModal: true, version }));
    };

    const onNotAvailable = () => {
      console.log('Renderer: update_not_available received');
      setUpdateState(prev => {
        if (prev.status === 'checking') {
          return { ...prev, status: 'not-available' };
        }
        return prev;
      });
      // Auto hide after 3 seconds if not-available
      setTimeout(() => {
        setUpdateState(prev => prev.status === 'not-available' ? { ...prev, showModal: false, status: 'idle' } : prev);
      }, 3000);
    };

    const onDownloaded = (version?: string) => {
      console.log('Renderer: update_downloaded received', version);
      setUpdateState(prev => ({ ...prev, status: 'downloaded', showModal: true, version }));
    };

    const onProgress = (percent: number) => {
      console.log('Renderer: download_progress received', percent);
      setUpdateState(prev => ({ ...prev, status: 'downloading', progress: percent, showModal: true }));
    };

    const onError = (error: string) => {
      console.error('Renderer: update_error received', error);
      setUpdateState(prev => ({ ...prev, status: 'error', error, showModal: true }));
    };

    window.electron.onUpdateChecking(onChecking);
    window.electron.onUpdateAvailable(onAvailable);
    window.electron.onUpdateNotAvailable(onNotAvailable);
    window.electron.onUpdateDownloaded(onDownloaded);
    window.electron.onDownloadProgress(onProgress);
    window.electron.onUpdateError(onError);

    return () => {
      if (window.electron) {
        window.electron.offUpdateChecking();
        window.electron.offUpdateAvailable();
        window.electron.offUpdateNotAvailable();
        window.electron.offUpdateDownloaded();
        window.electron.offDownloadProgress();
        window.electron.offUpdateError();
      }
    };
  }, []);

  const handleCheckForUpdates = () => {
    if (window.electron?.checkForUpdate) {
      window.electron.checkForUpdate();
    }
  };

  useEffect(() => {
    localStorage.setItem('searchEngine', searchEngine);
  }, [searchEngine]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (value?: string) => void;
    isInput?: boolean;
    inputPlaceholder?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isInput: false
  });
  const [modalInputValue, setModalInputValue] = useState('');

  const [blockedAdsCount, setBlockedAdsCount] = useState(0);

  // Downloads State
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [screenshotToCrop, setScreenshotToCrop] = useState<string | null>(null);
  
  const webviewRefs = useRef<{ [key: string]: Electron.WebviewTag }>({});

  function enableZenMode() {
    const webview = webviewRefs.current[activeTabId];
    if (!webview) return;
    
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab?.isReaderMode) {
      webview.reload();
      updateTab(activeTabId, { isReaderMode: false });
      return;
    }

    updateTab(activeTabId, { isReaderMode: true });
    webview.executeJavaScript(`
      (() => {
        try {
          const contents = document.body.innerHTML; // basic fallback
          const article = document.querySelector('article') || 
                          document.querySelector('[role="main"]') || 
                          document.querySelector('.main-content');
          
          let readerContent = article ? article.innerHTML : contents;
          const readerTitle = document.title;
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          
          document.body.innerHTML = \`
            <div id="reader-mode-container" style="
              padding: 60px 24px; max-width: 720px; margin: 0 auto; 
              font-family: sans-serif; line-height: 1.6; font-size: 19px;
              color: \${isDark ? '#e2e8f0' : '#1a202c'};
              background: \${isDark ? '#1a1b26' : '#ffffff'};
            ">
              <h1 style="margin-bottom: 32px; font-size: 36px;">\${readerTitle}</h1>
              <div class="content-body">\${readerContent}</div>
            </div>
          \`;
        } catch(e) { console.error('Reader Mode Error:', e); }
      })();
    `);
  }

  const enablePiP = React.useCallback(() => {
    const webview = webviewRefs.current[activeTabId];
    if (!webview) return;
    webview.executeJavaScript(`
      (async () => {
        try {
          const video = document.querySelector('video');
          if (video) {
            if (document.pictureInPictureElement) await document.exitPictureInPicture();
            else await video.requestPictureInPicture();
          }
        } catch(e) {}
      })();
    `);
  }, [activeTabId]);


  const toggleMute = () => {
    const webview = webviewRefs.current[activeTabId];
    if (!webview) return;
    const isMuted = webview.isAudioMuted();
    webview.setAudioMuted(!isMuted);
  };

  const openDevTools = () => {
    const webview = webviewRefs.current[activeTabId];
    if (webview) {
      webview.openDevTools();
    }
  };

  function addTab(url = 'explore://newtab', focus = true, isPrivate = false) {
    const newId = crypto.randomUUID();
    const newTab: Tab = {
      id: newId,
      url,
      title: url === 'explore://newtab' ? (languageRef.current === 'fr' ? 'Nouvel onglet' : 'New Tab') : url,
      isLoading: false,
      isPrivate
    };
    setTabs(prev => [...prev, newTab]);
    if (focus) {
      setActiveTabId(newId);
    }
  }

  function closeTab(e: React.MouseEvent | { stopPropagation: () => void }, id: string) {
    if (e) e.stopPropagation();
    setTabs(prev => {
      if (prev.length <= 1) return prev;
      const idx = prev.findIndex(t => t.id === id);
      const nextTabs = prev.filter(t => t.id !== id);
      if (id === activeTabId) {
        const nextActive = nextTabs[Math.max(0, idx - 1)]?.id || nextTabs[0].id;
        setActiveTabId(nextActive);
      }
      return nextTabs;
    });
  }

  function updateTab(id: string, updates: Partial<Tab>) {
    if (updates.url && updates.url.toLowerCase() === 'explore://onboarding') {
      setShowOnboarding(true);
      return;
    }
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }

  function getSearchUrl(query: string) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return '';
    const firstWord = trimmedQuery.split(' ')[0].toLowerCase();
    
    const bangs: { [key: string]: string } = {
      '!yt': 'https://www.youtube.com/results?search_query=',
      '!w': 'https://fr.wikipedia.org/wiki/Sp%C3%A9cial:Recherche?search=',
      '!gmap': 'https://www.google.com/maps/search/',
      '!r': 'https://www.reddit.com/search/?q=',
      '!t': 'https://twitter.com/search?q=',
      '!a': 'https://www.amazon.fr/s?k=',
      '!g': 'https://github.com/search?q=',
      '!so': 'https://stackoverflow.com/search?q=',
      '!imdb': 'https://www.imdb.com/find?q=',
      '!tr': 'https://translate.google.com/?sl=auto&tl=fr&text=',
      '!maps': 'https://www.google.com/maps/search/',
      '!ebay': 'https://www.ebay.com/sch/i.html?_nkw=',
      '!medium': 'https://medium.com/search?q=',
      '!gpt': 'https://chat.openai.com/?q='
    };

    if (bangs[firstWord]) {
      const remainingQuery = trimmedQuery.slice(firstWord.length).trim();
      if (remainingQuery) {
        return `${bangs[firstWord]}${encodeURIComponent(remainingQuery)}`;
      }
    }

    if (trimmedQuery.includes('.') && !trimmedQuery.includes(' ')) {
      return trimmedQuery.startsWith('http') ? trimmedQuery : 'https://' + trimmedQuery;
    }
    
    const engines: { [key: string]: string } = {
      google: 'https://www.google.com/search?q=',
      explore: 'explore://search?q=',
      bing: 'https://www.bing.com/search?q=',
      duckduckgo: 'https://duckduckgo.com/?q=',
      ecosia: 'https://www.ecosia.org/search?q=',
      qwant: 'https://www.qwant.com/?q=',
      perplexity: 'https://www.perplexity.ai/search?q='
    };

    const engineKey = searchEngine?.trim().toLowerCase();
    console.log('Using engine key:', engineKey);
    const baseUrl = engines[engineKey] || engines.google;
    console.log('Base URL:', baseUrl);
    return `${baseUrl}${encodeURIComponent(trimmedQuery)}`;
  }


  const handleCreateFolder = async (title?: string) => {
    if (!title) return;

    const newFolder: Bookmark = {
      id: crypto.randomUUID(),
      user_id: user?.id || 'guest',
      url: '',
      title,
      created_at: new Date().toISOString(),
      type: 'folder'
    };
    
    setBookmarks(prev => [newFolder, ...prev]);

    if (user) {
      await supabase.from('bookmarks').insert({
        user_id: user.id,
        url: '', // Empty URL for folder
        title,
        type: 'folder'
      });
    }
  };

  const createFolder = () => {
    setModalInputValue('');
    setConfirmModal({
      isOpen: true,
      title: language === 'fr' ? 'Nouveau dossier' : 'New Folder',
      message: language === 'fr' ? 'Entrez le nom du nouveau dossier :' : 'Enter the name for the new folder:',
      isInput: true,
      inputPlaceholder: language === 'fr' ? 'Nom du dossier' : 'Folder Name',
      onConfirm: handleCreateFolder
    });
  };

  const moveBookmark = async (id: string, parentId: string | undefined) => {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, parent_id: parentId } : b));
    if (user) {
      await supabase.from('bookmarks').update({ parent_id: parentId || null }).eq('id', id);
    }
  };

  const deleteBookmark = async (id: string) => {
    // If folder, delete children too? Or move them to root?
    // Let's recursively delete for now
    const toDelete = [id];
    const findChildren = (parentId: string) => {
      bookmarks.filter(b => b.parent_id === parentId).forEach(b => {
        toDelete.push(b.id);
        if (b.type === 'folder') findChildren(b.id);
      });
    };
    findChildren(id);

    setBookmarks(prev => prev.filter(b => !toDelete.includes(b.id)));
    if (user) {
      await supabase.from('bookmarks').delete().in('id', toDelete);
    }
  };

  const confirmDeleteBookmark = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: language === 'fr' ? 'Supprimer le favori' : 'Delete Bookmark',
      message: language === 'fr' 
        ? 'Êtes-vous sûr de vouloir supprimer ce favori ? Cette action est irréversible.' 
        : 'Are you sure you want to delete this bookmark? This action cannot be undone.',
      onConfirm: () => deleteBookmark(id)
    });
  };

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    params: Electron.ContextMenuParams;
  } | null>(null);

  useEffect(() => {
    if (!window.electron) return;

    // Listen for download updates
    const handleDownloadUpdate = (data: unknown) => {
      const downloadData = data as DownloadItem;
      setDownloads(prev => {
        const index = prev.findIndex(d => d.id === downloadData.id);
        if (index >= 0) {
          const newDownloads = [...prev];
          newDownloads[index] = { ...newDownloads[index], ...downloadData };
          return newDownloads;
        }
        return [{ ...downloadData, id: downloadData.id }, ...prev];
      });
      // Auto open downloads popup on start
      if (downloadData.state === 'progressing' && downloadData.received === 0) {
        setIsDownloadsOpen(true);
      }
    };

    const handleDownloadDone = (data: unknown) => {
      const downloadData = data as DownloadItem;
      setDownloads(prev => {
        const index = prev.findIndex(d => d.id === downloadData.id);
        if (index >= 0) {
          const newDownloads = [...prev];
          newDownloads[index] = { ...newDownloads[index], ...downloadData };
          return newDownloads;
        }
        return prev;
      });
    };

    const handleContextMenuRequest = (data: { params: Electron.ContextMenuParams, x: number, y: number }) => {
      setContextMenu({
        isOpen: true,
        x: data.x,
        y: data.y,
        params: data.params
      });
    };

    window.electron.onDownloadUpdated(handleDownloadUpdate);
    window.electron.onDownloadDone(handleDownloadDone);
    
    if (window.electron.onContextMenuRequest) {
      window.electron.onContextMenuRequest(handleContextMenuRequest);
    }
    
    // Handle new tab requests from main process
    window.electron.onNewTab((url: string) => {
      const newId = crypto.randomUUID();
      const newTab: Tab = {
        id: newId,
        url: url,
        title: languageRef.current === 'fr' ? 'Chargement...' : 'Loading...',
        isLoading: true
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newId);
    });

    // Listen for blocked ads
    const handleAdBlocked = () => {
      setBlockedAdsCount(prev => prev + 1);
    };
    
    if (window.electron.onAdBlocked) {
      window.electron.onAdBlocked(handleAdBlocked);
    }

    // Listen for deep links (Google Auth)
    if (window.electron.onDeepLink) {
      window.electron.onDeepLink(async (url: string) => {
        console.log('Received deep link:', url);
        try {
          const urlObj = new URL(url);
          let params = new URLSearchParams(urlObj.hash.substring(1));
          let accessToken = params.get('access_token');
          let refreshToken = params.get('refresh_token');
          
          if (!accessToken) {
             params = new URLSearchParams(urlObj.search);
             accessToken = params.get('access_token');
             refreshToken = params.get('refresh_token');
          }

          const code = params.get('code');
          if (code && !accessToken) {
             console.log('Received PKCE code, exchanging for session...');
             const { data, error } = await supabase.auth.exchangeCodeForSession(code);
             if (error) {
                console.error('Error exchanging code for session:', error);
             } else if (data.session) {
                const type = params.get('type');
                if (type === 'recovery') {
                  setAuthModalMode('reset-password');
                  setIsAuthModalOpen(true);
                } else {
                  setIsAuthModalOpen(false);
                }
                if (data.user) {
                   const { user } = data;
                   const metadata = user.user_metadata || {};
                   setUser({
                      id: user.id,
                      email: user.email!,
                      name: metadata.full_name || metadata.name || user.email!.split('@')[0],
                      avatar: metadata.avatar_url || metadata.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                   });
                }
                return;
             }
          }
          
          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error) {
              console.error('Error setting session:', error);
            } else if (data.user) {
              const type = params.get('type');
              if (type === 'recovery') {
                setAuthModalMode('reset-password');
                setIsAuthModalOpen(true);
              } else {
                setIsAuthModalOpen(false);
              }
              const { user } = data;
              const metadata = user.user_metadata || {};
              setUser({
                id: user.id,
                email: user.email!,
                name: metadata.full_name || metadata.name || user.email!.split('@')[0],
                avatar: metadata.avatar_url || metadata.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
              });
            }
          }
        } catch (e) {
          console.error('Error parsing deep link:', e);
        }
      });
    }

    if (window.electron.onOAuthCallback) {
      window.electron.onOAuthCallback(async (url: string) => {
        try {
          const u = new URL(url);
          const params = new URLSearchParams(u.search);
          const code = params.get('code');
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (code && !accessToken) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data.session && data.user) {
              setIsAuthModalOpen(false);
              const { user } = data;
              const metadata = user.user_metadata || {};
              setUser({
                id: user.id,
                email: user.email!,
                name: metadata.full_name || metadata.name || user.email!.split('@')[0],
                avatar: metadata.avatar_url || metadata.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
              });
            }
          } else if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            if (!error && data.user) {
              setIsAuthModalOpen(false);
              const { user } = data;
              const metadata = user.user_metadata || {};
              setUser({
                id: user.id,
                email: user.email!,
                name: metadata.full_name || metadata.name || user.email!.split('@')[0],
                avatar: metadata.avatar_url || metadata.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
              });
            }
          }
        } catch (e) {
          console.error('OAuth callback parse error:', e);
        }
      });
    }

    return () => {
      window.electron.offDownloadUpdated();
      window.electron.offDownloadDone();
      window.electron.offNewTab();
      if (window.electron.offAdBlocked) window.electron.offAdBlocked();
      if (window.electron.offContextMenuRequest) window.electron.offContextMenuRequest();
      if (window.electron.offDeepLink) window.electron.offDeepLink();
      if (window.electron.offOAuthCallback) window.electron.offOAuthCallback();
    };
  }, []);

  // Keyboard Shortcuts (Command Palette, New Tab, Close Tab)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(v => !v);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        addTab();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        if (tabs.length > 1) {
          closeTab({ stopPropagation: () => {} } as React.MouseEvent, activeTabId);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs, activeTabId]);

  const handleContextMenuAction = (action: string, params?: { url?: string; text?: string; selectionText?: string }) => {
    setContextMenu(null);
    const webview = webviewRefs.current[activeTabId];
    if (!webview) return;

    switch (action) {
      case 'back':
        if (webview.canGoBack()) webview.goBack();
        break;
      case 'forward':
        if (webview.canGoForward()) webview.goForward();
        break;
      case 'reload':
        webview.reload();
        break;
      case 'open-new-tab':
        if (params?.url) {
          const newId = crypto.randomUUID();
          const newTab: Tab = {
            id: newId,
            url: params.url,
            title: language === 'fr' ? 'Chargement...' : 'Loading...',
            isLoading: true
          };
          setTabs(prev => [...prev, newTab]);
          setActiveTabId(newId);
        }
        break;
      case 'copy-link':
        if (params?.url) {
          navigator.clipboard.writeText(params.url);
        }
        break;
      case 'copy-text':
        if (params?.text) {
          navigator.clipboard.writeText(params.text);
        }
        break;
      case 'search-text':
        if (params?.text) {
          const url = getSearchUrl(params.text);
          const newId = crypto.randomUUID();
          const newTab: Tab = {
            id: newId,
            url: url,
            title: language === 'fr' ? 'Chargement...' : 'Loading...',
            isLoading: true
          };
          setTabs(prev => [...prev, newTab]);
          setActiveTabId(newId);
        }
        break;
      case 'save-image':
        if (params?.url) {
           webview.downloadURL(params.url);
        }
        break;
      case 'open-image':
        if (params?.url) {
           webview.loadURL(params.url);
        }
        break;
      case 'copy-image-url':
        if (params?.url) {
          navigator.clipboard.writeText(params.url);
        }
        break;
      case 'save-page':
        // webview.getWebContentsId() -> send to main to save?
        // Or send IPC to main to save current page
        // For now not implemented fully or use keyboard shortcut
        break;
      case 'print':
        webview.print();
        break;
      case 'translate': {
        // Translate page to French
        const currentUrl = webview.getURL();
        const translateUrl = `https://translate.google.com/translate?sl=auto&tl=fr&u=${encodeURIComponent(currentUrl)}`;
        const newId = crypto.randomUUID();
        const newTab: Tab = {
          id: newId,
          url: translateUrl,
          title: language === 'fr' ? 'Traduction en cours...' : 'Translating...',
          isLoading: true
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newId);
        break;
      }
      case 'inspect':
        webview.openDevTools();
        break;
      case 'block-domain': {
        const url = webview.getURL();
        try {
          const hostname = new URL(url).hostname;
          // Remove www. if present for cleaner blocking
          const domain = hostname.replace(/^www\./, '');
          setConfirmModal({
             isOpen: true,
             title: language === 'fr' ? 'Bloquer le domaine' : 'Block Domain',
             message: language === 'fr' ? `Voulez-vous vraiment bloquer ${domain} ?` : `Are you sure you want to block ${domain}?`,
             onConfirm: () => {
                if (window.electron?.blockDomain) {
                   window.electron.blockDomain(domain);
                }
                // Reload to apply blocking
                webview.reload();
             }
          });
        } catch {
          console.error('Invalid URL for blocking:', url);
        }
        break;
      }
      case 'capture-question':
        if (params?.selectionText) {
           // Simulate capturing a question - copy to clipboard with context
           const question = params.selectionText;
           navigator.clipboard.writeText(question).then(() => {
              setConfirmModal({
                isOpen: true,
                title: language === 'fr' ? 'Question Capturée' : 'Question Captured',
                message: language === 'fr' 
                  ? 'Le texte a été capturé et copié dans le presse-papiers.' 
                  : 'The text has been captured and copied to the clipboard.',
                onConfirm: () => {}
              });
           });
        } else {
           // If no text selected, maybe capture the whole page URL as a reference?
           const url = webview.getURL();
           navigator.clipboard.writeText(url).then(() => {
              setConfirmModal({
                isOpen: true,
                title: language === 'fr' ? 'Page Capturée' : 'Page Captured',
                message: language === 'fr' 
                  ? 'L\'URL de la page a été copiée.' 
                  : 'Page URL has been copied.',
                onConfirm: () => {}
              });
           });
        }
        break;
    }
  };

  const activeTab = tabs.find(t => t.id === activeTabId);
  const isPrivate = activeTab?.isPrivate || false;
  const activeThemeColor = activeTab?.isPrivate
    ? '#64748b' // Slate gray for all private pages
    : activeTab?.url === 'explore://newtab' 
      ? colors.hex 
      : activeTab?.themeColor;

  const prevVpnStateRef = useRef<{ connected: boolean; locationId: string } | null>(null);

  useEffect(() => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return;
    const isCurrentTabPrivate = !!activeTab.isPrivate;

    if (isCurrentTabPrivate) {
      const currentlyConnected = localStorage.getItem('vpn_connected') === 'true';
      const lastLocationId = localStorage.getItem('vpn_location_id') || 'fr';
      const lastLocationName = localStorage.getItem('vpn_location') || 'France';

      if (!currentlyConnected) {
        prevVpnStateRef.current = { connected: false, locationId: lastLocationId };

        localStorage.setItem('vpn_connected', 'true');
        localStorage.setItem('vpn_location', lastLocationName);
        localStorage.setItem('vpn_location_id', lastLocationId);

        if (window.electron) {
          window.electron.setProxy(lastLocationId);
        }
        window.dispatchEvent(new Event('vpn-state-change'));
      }
    } else {
      if (prevVpnStateRef.current !== null) {
        const { connected, locationId } = prevVpnStateRef.current;
        prevVpnStateRef.current = null;

        localStorage.setItem('vpn_connected', String(connected));
        
        if (connected) {
          if (window.electron) {
            window.electron.setProxy(locationId);
          }
        } else {
          if (window.electron) {
            window.electron.disableProxy();
          }
        }
        window.dispatchEvent(new Event('vpn-state-change'));
      }
    }
  }, [activeTabId, tabs]);

  useEffect(() => {
    // Check initial adblock state
    if (window.electron?.getAdBlockEnabled) {
      window.electron.getAdBlockEnabled().then((enabled: unknown) => setAdBlockEnabled(!!enabled));
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const { user } = session;
        const metadata = user.user_metadata || {};
        
        setUser({
          id: user.id,
          email: user.email!,
          name: metadata.full_name || metadata.name || user.email!.split('@')[0],
          avatar: metadata.avatar_url || metadata.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const { user } = session;
        const metadata = user.user_metadata || {};
        setUser({
          id: user.id,
          email: user.email!,
          name: metadata.full_name || metadata.name || user.email!.split('@')[0],
          avatar: metadata.avatar_url || metadata.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
        });
      } else {
        setUser(null);
        setHistory([]);
        setBookmarks([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      // Fetch history
      supabase
        .from('history')
        .select('*')
        .order('visited_at', { ascending: false })
        .limit(100)
        .then(({ data }) => {
          if (data) setHistory(data as HistoryItem[]);
        });

      // Fetch bookmarks
      supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setBookmarks(data as Bookmark[]);
        });
    } else {
      setHistory([]);
      setBookmarks([]);
    }
  }, [user]);

  const addToHistory = async (url: string, title: string, isTabPrivate?: boolean) => {
    // Check if url is internal
    if (url.startsWith('explore://') || isPrivate || isTabPrivate) return;
    
    let shouldAdd = true;
    const newItem = {
      id: crypto.randomUUID(),
      user_id: user?.id || 'guest',
      url,
      title,
      visited_at: new Date().toISOString()
    };
    
    setHistory(prev => {
      if (prev.length > 0 && prev[0].url === url) {
        shouldAdd = false;
        return prev;
      }
      return [newItem, ...prev];
    });

    if (!shouldAdd) return;

    if (user) {
      await supabase.from('history').insert({
        user_id: user.id,
        url,
        title,
        visited_at: newItem.visited_at
      });
    }
  };

  const toggleBookmark = async () => {
    if (!activeTab) return;
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const existing = bookmarks.find(b => b.url === activeTab.url);
    if (existing) {
      // Remove
      setBookmarks(prev => prev.filter(b => b.id !== existing.id));
      await supabase.from('bookmarks').delete().eq('id', existing.id);
    } else {
      // Add
      const newBookmark = {
        id: crypto.randomUUID(),
        user_id: user.id,
        url: activeTab.url,
        title: activeTab.title,
        created_at: new Date().toISOString()
      };
      setBookmarks(prev => [newBookmark, ...prev]);
      
      const { data } = await supabase.from('bookmarks').insert({
        user_id: user.id,
        url: activeTab.url,
        title: activeTab.title
      }).select().single();
      
      if (data) {
        // Update with real ID
        setBookmarks(prev => prev.map(b => b.id === newBookmark.id ? (data as Bookmark) : b));
      }
    }
  };

  useEffect(() => {
    if (activeTab && activeTab.url !== urlInput) {
      setUrlInput(activeTab.url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab?.url]);



  useEffect(() => {
    localStorage.setItem('explore_shortcuts_v1', JSON.stringify(shortcuts));
  }, [shortcuts]);

  const parseShortcut = (shortcut: string) => {
    const parts = shortcut.split('+').map(p => p.trim().toLowerCase());
    return {
      ctrl: parts.includes('ctrl'),
      alt: parts.includes('alt'),
      shift: parts.includes('shift'),
      key: parts.find(p => p.length === 1 || ['enter','escape','space','tab','backspace'].includes(p)) || parts[parts.length - 1]
    };
  };

  const matches = React.useCallback((e: KeyboardEvent, shortcut: string) => {
    const s = parseShortcut(shortcut);
    const key = e.key.toLowerCase();
    return (!!s.ctrl === e.ctrlKey) && (!!s.alt === e.altKey) && (!!s.shift === e.shiftKey) && key === s.key;
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (matches(e, shortcuts.newTab)) {
        e.preventDefault();
        const newId = crypto.randomUUID();
        const newTab: Tab = {
          id: newId,
          url: 'explore://newtab',
          title: languageRef.current === 'fr' ? 'Nouvel onglet' : 'New Tab',
          isLoading: false
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newId);
      } else if (matches(e, shortcuts.closeTab)) {
        e.preventDefault();
        setTabs(prev => {
          if (prev.length <= 1) {
            window.electron?.windowControls?.close?.();
            return prev;
          }
          const idx = prev.findIndex(t => t.id === activeTabId);
          const nextTabs = prev.filter(t => t.id !== activeTabId);
          const nextActive = nextTabs[Math.max(0, idx - 1)]?.id || nextTabs[0].id;
          setActiveTabId(nextActive);
          return nextTabs;
        });
      } else if (matches(e, shortcuts.focusUrl)) {
        e.preventDefault();
        urlInputRef.current?.focus();
        urlInputRef.current?.select();
      } else if (matches(e, shortcuts.reloadTab)) {
        e.preventDefault();
        webviewRefs.current[activeTabId]?.reload();
      } else if (matches(e, shortcuts.togglePrivate) || (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 'n'))) {
        e.preventDefault();
        addTab('explore://newtab', true, true);
      } else if (matches(e, shortcuts.saveSession)) {
        e.preventDefault();
        localStorage.setItem('explore_sessions', JSON.stringify(tabs));
      } else if (matches(e, shortcuts.restoreSession)) {
        e.preventDefault();
        const saved = localStorage.getItem('explore_sessions');
        if (saved) {
          const s = JSON.parse(saved) as Tab[];
          if (s.length) {
            setTabs(s);
            setActiveTabId(s[0].id);
          }
        }
      } else if (matches(e, shortcuts.enablePiP)) {
        e.preventDefault();
        enablePiP();
      } else if (matches(e, shortcuts.toggleHistory)) {
        e.preventDefault();
        setShowHistory(prev => !prev);
        setShowBookmarks(false);
      } else if (matches(e, shortcuts.toggleBookmarks)) {
        e.preventDefault();
        setShowBookmarks(prev => !prev);
        setShowHistory(false);
      } else if (matches(e, shortcuts.openSettings)) {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts, activeTabId, matches, tabs, enablePiP]);

  // Function to fetch suggestions
  const fetchSuggestions = React.useCallback(async (query: string) => {
    if (!query || query.startsWith('http') || query.startsWith('explore://')) {
      setSuggestions([]);
      return;
    }
    
    if (window.electron?.getSearchSuggestions) {
      try {
        const results = await window.electron.getSearchSuggestions(query);
        setSuggestions(results);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      }
    } else {
      try {
        const response = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setSuggestions(data[1] || []);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      }
    }
  }, []);


  useEffect(() => {
    const timer = setTimeout(() => {
      if (urlInput.trim()) fetchSuggestions(urlInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [urlInput, fetchSuggestions]);


  const handleNavigate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    
    // If a suggestion is selected, use it
    let url = selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex] 
      ? suggestions[selectedSuggestionIndex] 
      : urlInput.trim();

    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setUrlInput(url); // Update input to match selected URL

    if (url.toLowerCase() === 'explore://onboarding') {
      setShowOnboarding(true);
      setUrlInput(activeTab?.url || 'explore://newtab');
      return;
    }

    if (!url.startsWith('http') && !url.startsWith('explore://')) {
       console.log('Generating search URL for:', url);
       url = getSearchUrl(url);
       console.log('Search URL:', url);
    }
    
    updateTab(activeTabId, { url, title: url, isLoading: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev > -1 ? prev - 1 : prev));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHistory([]);
    setBookmarks([]);
  };

  const deleteHistory = async () => {
    setHistory([]);
    if (user) {
      await supabase.from('history').delete().eq('user_id', user.id);
    }
  };

  const handleClearData = (onSuccess?: () => void) => {
    setConfirmModal({
      isOpen: true,
      title: language === 'fr' ? 'Effacer les données de navigation' : 'Clear Browsing Data',
      message: language === 'fr' 
        ? 'Êtes-vous sûr de vouloir effacer votre historique, vos cookies et votre cache ? Cette action est irréversible.' 
        : 'Are you sure you want to clear your browsing history, cookies, and cache? This action cannot be undone.',
      onConfirm: () => {
        deleteHistory();
        if (window.electron?.clearData) {
          window.electron.clearData();
        }
        if (onSuccess) {
          onSuccess();
        }
      }
    });
  };

  const handleSaveSessionToCloud = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data: existing, error: selectError } = await supabase
        .from('sessions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (selectError) {
        console.error("Error checking existing session:", selectError);
        return false;
      }

      const tabsToSave = tabs.map(t => ({
        id: t.id,
        url: t.url,
        title: t.title,
        isLoading: false,
        isPrivate: t.isPrivate
      }));

      if (existing) {
        const { error: updateError } = await supabase
          .from('sessions')
          .update({
            tabs: tabsToSave,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error("Error updating session in cloud:", updateError);
          return false;
        }
      } else {
        const { error: insertError } = await supabase
          .from('sessions')
          .insert({
            user_id: user.id,
            tabs: tabsToSave,
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error("Error inserting session in cloud:", insertError);
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error("Failed to save session to cloud:", e);
      return false;
    }
  };

  const handleRestoreSessionFromCloud = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('tabs')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error restoring session from cloud:", error);
        return false;
      }

      if (data && data.tabs && data.tabs.length > 0) {
        setTabs(data.tabs);
        setActiveTabId(data.tabs[0].id);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to restore session from cloud:", e);
      return false;
    }
  };

  // Debounced Auto Cloud Sync when tabs change
  useEffect(() => {
    if (!autoCloudSync || !user) return;

    const timer = setTimeout(() => {
      handleSaveSessionToCloud();
    }, 2000); // 2 seconds debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs, autoCloudSync, user]);

  const deleteHistoryItem = async (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (user) {
      await supabase.from('history').delete().eq('id', id);
    }
  };

  const handleImportBookmarks = async () => {
    if (!window.electron?.importBookmarks) return;
    
    try {
      const htmlContent = await window.electron.importBookmarks();
      if (!htmlContent) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const links = doc.querySelectorAll('a');
      
      const newBookmarks: Bookmark[] = [];
      const now = new Date().toISOString();

      links.forEach((link) => {
        const url = link.href;
        const title = link.textContent || url;
        
        if (url && !url.startsWith('place:') && !url.startsWith('about:')) {
          newBookmarks.push({
            id: crypto.randomUUID(),
            user_id: user?.id || 'guest',
            url,
            title,
            created_at: now
          });
        }
      });

      if (newBookmarks.length > 0) {
        setBookmarks(prev => [...newBookmarks, ...prev]);
        
        if (user) {
          // Batch insert for Supabase
          const { error } = await supabase.from('bookmarks').insert(
            newBookmarks.map(b => ({
              user_id: user.id,
              url: b.url,
              title: b.title,
              type: 'link' // Default to link
            }))
          );
          
          if (error) console.error('Failed to sync imported bookmarks:', error);
        }
      }
    } catch (error) {
      console.error('Failed to import bookmarks:', error);
    }
  };

  const getFaviconUrl = (url: string) => {
    if (url === 'explore://newtab') return 'explore-logo';
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}`;
    } catch {
      return '';
    }
  };

  const handleScreenshot = async (type: 'full' | 'visible' | 'region') => {
    // Note: Implementation of 'region' and 'full' will be done in the electron main process
    // For now we pass the type to a new IPC if needed or fallback to basic visible capture
    const webview = webviewRefs.current[activeTabId];
    if (webview && window.electron?.capturePage) {
      try {
        const id = webview.getWebContentsId();
        const dataUrl = await window.electron.capturePage(id);
        
        if (type === 'region' && dataUrl) {
          setScreenshotToCrop(dataUrl);
          return;
        }

        if (dataUrl) {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `screenshot_${type}_${new Date().getTime()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } catch (e) {
        console.error("Screenshot failed:", e);
      }
    }
  };

  const handleSplitView = (direction: 'horizontal' | 'vertical') => {
    setTabs(prev => {
      const activeIdx = prev.findIndex(t => t.id === activeTabId);
      if (activeIdx === -1) return prev;
      
      const activeTab = prev[activeIdx];
      if (activeTab.splitTabId) {
        if (activeTab.splitDirection === direction) {
          return prev.map(t => t.id === activeTabId ? { ...t, splitTabId: null, splitDirection: undefined } : t);
        } else {
          return prev.map(t => t.id === activeTabId ? { ...t, splitDirection: direction } : t);
        }
      }

      const otherTab = prev.find(t => t.id !== activeTabId && !t.splitTabId);
      const newTabs = [...prev];
      let targetSplitId = otherTab?.id;
      
      if (!targetSplitId) {
        const newTabId = Math.random().toString(36).substr(2, 9);
        newTabs.push({ id: newTabId, url: 'explore://newtab', title: 'Nouvel onglet', isLoading: false });
        targetSplitId = newTabId;
      }
      
      return newTabs.map(t => t.id === activeTabId ? { ...t, splitTabId: targetSplitId, splitDirection: direction } : t);
    });
  };

  const handleWindowControl = (action: 'minimize' | 'maximize' | 'close') => {
    if (window.electron && window.electron.windowControls) {
      window.electron.windowControls[action]();
    }
  };

  const renderWindowControls = () => {
    if (windowStyle === 'windows') {
      return (
        <div className="flex items-center gap-1 h-full no-drag text-gray-400 px-2">
          <button 
            onClick={() => handleWindowControl('minimize')} 
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors"
            title={language === 'fr' ? 'Réduire' : 'Minimize'}
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleWindowControl('maximize')} 
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors"
            title={language === 'fr' ? 'Agrandir' : 'Maximize'}
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => handleWindowControl('close')} 
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
            title={language === 'fr' ? 'Fermer' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 no-drag px-2 py-1 group">
        <button 
          onClick={() => handleWindowControl('close')} 
          className="w-3 h-3 rounded-full bg-[#ff5f56] flex items-center justify-center text-[9px] font-extrabold text-[#4c0002] transition-all duration-150 cursor-pointer active:brightness-90 relative"
          title={language === 'fr' ? 'Fermer' : 'Close'}
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity select-none" style={{ marginTop: '-2px' }}>×</span>
        </button>
        <button 
          onClick={() => handleWindowControl('minimize')} 
          className="w-3 h-3 rounded-full bg-[#febc2e] flex items-center justify-center text-[9px] font-extrabold text-[#5c3e00] transition-all duration-150 cursor-pointer active:brightness-90 relative"
          title={language === 'fr' ? 'Réduire' : 'Minimize'}
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity select-none" style={{ marginTop: '-3px' }}>−</span>
        </button>
        <button 
          onClick={() => handleWindowControl('maximize')} 
          className="w-3 h-3 rounded-full bg-[#28c840] flex items-center justify-center text-[8px] font-extrabold text-[#006504] transition-all duration-150 cursor-pointer active:brightness-90 relative"
          title={language === 'fr' ? 'Agrandir' : 'Maximize'}
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity select-none" style={{ marginTop: '-2px' }}>+</span>
        </button>
      </div>
    );
  };

  const platform = detectPlatform();

  const renderMobileLayout = () => {
    const layoutProps = {
      tabs,
      activeTabId,
      urlInput,
      theme: theme as 'dark' | 'light',
      colors,
      language,
      suggestions,
      adBlockEnabled,
      blockedAdsCount,
      isBookmarked: bookmarks.some(b => b.url === activeTab?.url),
      userName: user?.name,
      userAvatar: user?.avatar,
      isLoggedIn: !!user,
      onUrlChange: setUrlInput,
      onUrlSubmit: (url: string) => {
        let finalUrl = url;
        if (!url.startsWith('http') && !url.startsWith('explore://')) {
          finalUrl = getSearchUrl(url);
        }
        updateTab(activeTabId, { url: finalUrl, title: finalUrl, isLoading: true });
        setUrlInput(finalUrl);
      },
      onGetSuggestions: fetchSuggestions,
      onSuggestionSelect: (suggestion: string) => {
        const finalUrl = getSearchUrl(suggestion);
        updateTab(activeTabId, { url: finalUrl, title: finalUrl, isLoading: true });
        setUrlInput(finalUrl);
      },
      onGoBack: () => {
        const wb = webviewRefs.current[activeTabId];
        if (wb && typeof wb.goBack === 'function' && wb.canGoBack?.()) {
          wb.goBack();
        } else {
          updateTab(activeTabId, { url: 'explore://newtab' });
        }
      },
      onGoForward: () => webviewRefs.current[activeTabId]?.goForward?.(),
      onReload: () => {
        if (activeTab?.url.startsWith('explore://')) return;
        const iframe = document.getElementById(`iframe-${activeTabId}`) as HTMLIFrameElement;
        if (iframe) {
          const currentSrc = iframe.src;
          iframe.src = 'about:blank';
          setTimeout(() => { iframe.src = currentSrc; }, 10);
        }
      },
      onSelectTab: setActiveTabId,
      onCloseTab: (id: string) => closeTab({ stopPropagation: () => {} } as React.MouseEvent, id),
      onNewTab: () => addTab('explore://newtab', true),
      onNewPrivateTab: () => addTab('explore://newtab', true, true),
      onToggleBookmark: toggleBookmark,
      onToggleAdBlock: () => setAdBlockEnabled(!adBlockEnabled),
      onToggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      onOpenBookmarks: () => updateTab(activeTabId, { url: 'explore://bookmarks' }),
      onOpenHistory: () => updateTab(activeTabId, { url: 'explore://history' }),
      onOpenSettings: () => updateTab(activeTabId, { url: 'explore://settings' }),
      onOpenAuth: () => setIsAuthModalOpen(true),
      onLogout: () => supabase.auth.signOut(),
      onShare: () => {
        if (navigator.share && activeTab) {
          navigator.share({ title: activeTab.title, url: activeTab.url }).catch(console.error);
        }
      }
    };

    const renderTabPages = () => (
      <div className="w-full h-full relative">
        {tabs.map(tab => {
          const isActive = activeTabId === tab.id;
          return (
            <div
              key={tab.id}
              className={clsx(
                "absolute inset-0 w-full h-full transition-opacity duration-300",
                isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
              )}
            >
              {tab.url.startsWith('explore://') ? (
                <div className={clsx("w-full h-full overflow-y-auto", theme === 'dark' ? "bg-[#1e1e2e]" : "bg-white")}>
                  {tab.url === 'explore://newtab' && (
                    <NewTabPage 
                      theme={theme} 
                      accentColor={accentColor}
                      isPrivate={tab.isPrivate}
                      onSearch={(query) => {
                        const url = getSearchUrl(query);
                        updateTab(tab.id, { url, title: url, isLoading: true });
                      }} 
                      onQueryChange={setUrlInput}
                      suggestions={suggestions}
                      language={language}
                      blockedAdsCount={blockedAdsCount}
                      adBlockEnabled={adBlockEnabled}
                      bookmarks={bookmarks}
                    />
                  )}
                  {tab.url === 'explore://settings' && (
                    <div className="p-4"><p className="text-gray-500">Settings available in bottom sheet.</p></div>
                  )}
                  {tab.url === 'explore://history' && (
                    <div className="p-4"><p className="text-gray-500">History page (Mobile optimized coming soon).</p></div>
                  )}
                  {tab.url === 'explore://bookmarks' && (
                    <div className="p-4"><p className="text-gray-500">Bookmarks page (Mobile optimized coming soon).</p></div>
                  )}
                </div>
              ) : (
                <iframe
                  id={`iframe-${tab.id}`}
                  src={tab.url}
                  className="w-full h-full border-none bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  onLoad={(e) => {
                    updateTab(tab.id, { isLoading: false, title: tab.url });
                    const target = e.target as HTMLIFrameElement;
                    if (target.contentWindow) {
                      addToHistory(tab.url, tab.url, tab.isPrivate);
                    }
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );

    if (platform === 'ios') {
      return <IOSLayout {...layoutProps}>{renderTabPages()}</IOSLayout>;
    } else {
      return <AndroidLayout {...layoutProps}>{renderTabPages()}</AndroidLayout>;
    }
  };

  if (platform === 'ios' || platform === 'android') {
    return renderMobileLayout();
  }

  // DESKTOP LAYOUT
  return (
    <div className={clsx("flex h-screen w-full overflow-hidden transition-colors duration-1000 relative theme-bg", 
      activeTab?.isPrivate 
        ? (theme === 'dark' ? "bg-[#0f1218] text-white" : "bg-slate-100 text-slate-950")
        : (theme === 'dark' ? "bg-[#14141d] text-white" : "bg-gray-100 text-gray-900")
    )}>
      
      {ambientMode && activeThemeColor && (
        <>
          {/* Main Ambient Glow */}
          <div 
            className="absolute inset-0 z-0 pointer-events-none transition-all duration-1000 ease-in-out blur-[120px]"
            style={{
              background: activeTab?.url === 'explore://newtab'
                ? `radial-gradient(circle at 50% 50%, ${activeThemeColor}40 0%, ${activeThemeColor}10 60%, transparent 100%)`
                : `radial-gradient(ellipse at 50% -20%, ${activeThemeColor}50 0%, ${activeThemeColor}15 50%, transparent 100%)`,
              opacity: activeTab?.url === 'explore://newtab' 
                ? (theme === 'dark' ? 0.95 : 0.75) 
                : (theme === 'dark' ? 0.6 : 0.4)
            }}
          />
          {/* Subtle Secondary Glow for Depth */}
          <div 
            className="absolute inset-0 z-0 pointer-events-none transition-all duration-1500 ease-in-out mix-blend-screen blur-[100px]"
            style={{
              background: `radial-gradient(circle at 100% 0%, ${activeThemeColor}20 0%, transparent 80%)`,
              opacity: theme === 'dark' ? 0.4 : 0.2
            }}
          />
          {/* Bottom Bloom */}
          <div 
            className="absolute inset-0 z-0 pointer-events-none transition-all duration-1000 ease-in-out blur-[80px]"
            style={{
              background: `linear-gradient(to top, ${activeThemeColor}15 0%, transparent 40%)`,
              opacity: activeTab?.url === 'explore://newtab' ? 0 : 1
            }}
          />
        </>
      )}
      
      {showOnboarding && (
        <Onboarding 
          onComplete={() => {
            setShowOnboarding(false);
            localStorage.setItem('onboardingCompleted', 'true');
            localStorage.setItem('searchEngine', searchEngine);
          }}
          setTheme={setTheme}
          setSearchEngine={setSearchEngine}
          setLanguage={setLanguage}
          currentTheme={theme}
          language={language}
        />
      )}
      
      {/* Sidebar (Left or Right Position) */}
      {(tabPosition === 'left' || tabPosition === 'right') && (
        <div 
          className={clsx(
            "w-16 flex flex-col transition-colors duration-1000 relative z-10 theme-surface",
            tabPosition === 'left' ? "border-r order-first" : "border-l order-last"
          )}
          style={{
            backgroundColor: ambientMode && activeThemeColor 
              ? (theme === 'dark' ? `${activeThemeColor}1A` : `${activeThemeColor}0F`)
              : (theme === 'dark' ? "#181825" : "#ffffff"),
            backdropFilter: ambientMode && activeThemeColor ? "blur(40px)" : "none",
            borderColor: theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
          }}
        >
          <div className="h-12 w-full flex items-center justify-center drag-region border-b border-white/5 group cursor-default shrink-0">
            <Logo className="w-8 h-8 group-hover:rotate-180 transition-transform duration-500" />
          </div>

          <div className="px-3 pb-2 mt-4">
            <button 
              onClick={() => addTab()}
              className={clsx("w-full flex items-center justify-center gap-2 text-white py-2 rounded-xl transition-all shadow-lg font-medium", colors.bgSolid, colors.bgHover, colors.shadow)}
              title={language === 'fr' ? 'Nouvel onglet' : 'New Tab'}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none px-3 py-2 space-y-1">
            <div className="w-full flex justify-center mb-1 py-1">
              <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest pl-[0.1em]">
                {language === 'fr' ? 'Onglets' : 'Tabs'}
              </div>
            </div>
            {tabs.map(tab => {
              const isSplitChild = tabs.some(t => t.splitTabId === tab.id);
              if (isSplitChild) return null;
              
              const splitChild = tab.splitTabId ? tabs.find(t => t.id === tab.splitTabId) : null;
              const isActive = activeTabId === tab.id || activeTabId === splitChild?.id;

              return (
              <div
                key={tab.id}
                className="relative group w-full"
              >
                <div
                  onClick={() => setActiveTabId(tab.id)}
                  className={twMerge(
                    "flex items-center justify-center w-full h-10 rounded-xl cursor-pointer transition-all border border-transparent mb-1",
                    isActive 
                      ? clsx(colors.bg, colors.text, colors.borderSubtle, "shadow-lg")
                      : clsx("text-gray-400 hover:bg-white/5", colors.textHover)
                  )}
                  title={tab.title}
                >
                  <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center text-[10px]", isActive ? clsx(colors.borderSubtle, colors.text) : "bg-white/10 text-gray-400", tab.isPrivate && "border border-slate-500/30 bg-slate-500/10")}>
                    {tab.isLoading ? (
                      <RotateCw className={clsx("w-4 h-4 animate-spin", isActive ? colors.text : "text-gray-400")} />
                    ) : tab.isPrivate ? (
                      <IncognitoIcon size="sm" animated={false} className="text-slate-400" />
                    ) : tab.url === 'explore://newtab' ? (
                       <Logo className={clsx("w-3.5 h-3.5", isActive ? colors.text : "text-gray-400")} />
                    ) : (
                      splitChild ? (
                         <div className="flex gap-0.5">
                           <img src={getFaviconUrl(tab.url)} className="w-3 h-3 rounded-sm object-cover" alt="" />
                           <img src={getFaviconUrl(splitChild.url)} className="w-3 h-3 rounded-sm object-cover" alt="" />
                         </div>
                      ) : (
                        <img 
                          src={getFaviconUrl(tab.url)} 
                          className="w-4 h-4 rounded-sm object-cover"
                          alt=""
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )
                    )}
                  </div>
                </div>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTab(e, tab.id); if (splitChild) closeTab(e, splitChild.id); }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-sm"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )})}
          </div>

          <div className="flex flex-col items-center gap-2 pb-2">
            <button 
              onClick={() => addTab('explore://newtab', true, true)}
              className={clsx(
                "p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center text-gray-400 hover:text-white",
                theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-100"
              )}
              title={language === 'fr' ? 'Nouvel onglet privé' : 'New Private Tab'}
            >
              <IncognitoIcon size="md" animated className="shrink-0 opacity-75 hover:opacity-100" />
            </button>
          </div>

          <div className={clsx("p-4 border-t flex flex-col items-center gap-2", theme === 'dark' ? "border-white/5" : "border-gray-200")}>
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors flex items-center justify-center text-gray-400 hover:text-white shrink-0"
              title={user ? user.name : (language === 'fr' ? 'Connexion' : 'Sign In')}
            >
              {user ? (
                <img 
                  src={user.avatar} 
                  className="w-6 h-6 rounded-full bg-white/10 object-cover shrink-0" 
                  alt="" 
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                  }}
                />
              ) : (
                <UserIcon className="w-6 h-6" />
              )}
            </button>
            <button 
              onClick={() => updateTab(activeTabId, { url: 'explore://settings' })}
              className={clsx("p-2 rounded-xl transition-colors flex items-center justify-center", theme === 'dark' ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-600")}
              title={language === 'fr' ? 'Paramètres' : 'Settings'}
            >
              <Settings className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={clsx("flex-1 flex flex-col relative transition-colors duration-1000 theme-bg", 
          (ambientMode && activeThemeColor) ? "bg-transparent" : (theme === 'dark' ? "bg-[#1e1e2e]" : "bg-white")
      )}>
        
        {/* Window Controls for Bottom Tab Position */}
        {tabPosition === 'bottom' && (
          <div className="absolute top-2 right-2 z-50">
            {renderWindowControls()}
          </div>
        )}

        {/* Top Bar (if tabPosition is top) */}
        {tabPosition === 'top' && (
          <div 
            className={clsx("flex items-center gap-2 px-2 pt-1 pb-1 drag-region w-full min-w-0 transition-colors duration-1000 relative z-10")}
            style={{
              backgroundColor: ambientMode && activeThemeColor 
                ? (theme === 'dark' ? `${activeThemeColor}1A` : `${activeThemeColor}0F`)
                : (theme === 'dark' ? "#181825" : "#ffffff"),
              backdropFilter: ambientMode && activeThemeColor ? "blur(40px)" : "none"
            }}
          >
            <div className={clsx("flex items-center gap-2 px-4 font-bold text-lg no-drag", colors.text)}>
              <Logo className="w-6 h-6" />
            </div>
            <Reorder.Group 
              axis="x" 
              values={tabs} 
              onReorder={setTabs} 
              className="flex-1 flex flex-nowrap overflow-x-auto scrollbar-none min-w-0 drag-region gap-2 px-2 pb-1 pt-1 items-center"
            >
              {tabs.map(tab => (
                <Reorder.Item
                  key={tab.id}
                  value={tab}
                  layout
                  className={twMerge(
                    "group relative flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer transition-all border border-transparent min-w-[30px] w-48 shrink no-drag",
                    activeTabId === tab.id 
                      ? clsx(colors.bg, colors.text, "shadow-lg relative overflow-hidden after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5", colors.bgSolid.replace("bg-", "after:bg-"), "border-white/5")
                      : clsx("text-gray-400 hover:bg-white/10 dark:hover:bg-white/5", colors.textHover)
                  )}
                  onPointerDown={() => setActiveTabId(tab.id)}
                >
                   <div className={clsx("min-w-6 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0", activeTabId === tab.id ? clsx(colors.borderSubtle, colors.text) : "bg-white/10 text-gray-400", tab.isPrivate && "border border-purple-500/30 bg-purple-500/10")}>
                    {tab.isLoading ? (
                      <RotateCw className={clsx("w-3.5 h-3.5 animate-spin", activeTabId === tab.id ? colors.text : "text-gray-400")} />
                    ) : tab.isPrivate ? (
                      <IncognitoIcon size="sm" animated={false} className="text-purple-400" />
                    ) : (
                      <img 
                      src={getFaviconUrl(tab.url)} 
                      className="w-4 h-4 rounded-sm"
                      alt=""
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    )}
                  </div>
                  <span className={clsx("truncate text-sm flex-1 text-center select-none transition-all", tabs.length > 10 && "hidden lg:block")}>{tab.title || (language === 'fr' ? 'Chargement...' : 'Loading...')}</span>
                  <button
                    onClick={(e) => closeTab(e, tab.id)}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-all shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Reorder.Item>
              ))}
              <div className="flex items-center">
                <button onClick={() => addTab()} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 no-drag shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </Reorder.Group>
             <div className="flex items-center no-drag ml-auto">
                {renderWindowControls()}

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* Profile / Settings */}
                <button 
                  onClick={() => updateTab(activeTabId, { url: 'explore://settings' })}
                  className={clsx("p-1.5 hover:bg-white/10 rounded-lg transition-colors", colors.textHover)}
                  title={language === 'fr' ? 'Paramètres' : 'Settings'}
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                </button>
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                >
                  {user ? (
                      <img 
                        src={user.avatar} 
                        className="w-6 h-6 rounded-full bg-white/10" 
                        alt="" 
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                        }}
                      />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <UserIcon className="w-3 h-3 text-gray-400" />
                    </div>
                  )}
                </button>
             </div>
          </div>
        )}

        {/* Navigation Bar & Window Controls */}
        <div 
          className={clsx(
            "h-12 grid grid-cols-3 items-center px-4 border-b relative z-30 transition-colors duration-1000 drag-region", 
            tabPosition === 'bottom' && "order-last border-t border-b-0"
          )}
          style={{
            backgroundColor: ambientMode && activeThemeColor 
              ? (theme === 'dark' ? `${activeThemeColor}20` : `${activeThemeColor}15`)
              : (theme === 'dark' ? "#1e1e2e" : "#ffffff"),
            backdropFilter: ambientMode && activeThemeColor ? "blur(40px)" : "none",
            borderColor: theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.1)"
          }}
        >
          
          <div className="flex items-center justify-start h-full">
            <div className="flex items-center gap-1 no-drag">
            <button 
              className={clsx("p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors disabled:opacity-30", colors.textHover)}
              onClick={() => webviewRefs.current[activeTabId]?.goBack()}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button 
              className={clsx("p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors disabled:opacity-30", colors.textHover)}
              onClick={() => webviewRefs.current[activeTabId]?.goForward()}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              className={clsx("p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors", colors.textHover)}
              onClick={() => webviewRefs.current[activeTabId]?.reload()}
            >
              <RotateCw className={clsx("w-4 h-4", activeTab?.isLoading && "animate-spin")} />
            </button>
            
            {earlyTesting.splitView && (
              <div className="relative flex items-center shrink-0 ml-1">
                <button 
                  type="button"
                  onClick={() => setShowSplitMenu(!showSplitMenu)}
                  className={clsx("p-1.5 hover:bg-white/10 rounded-lg transition-colors", showSplitMenu || activeTab?.splitDirection ? "text-blue-400 bg-white/10" : "text-gray-400")}
                  title={language === 'fr' ? 'Écran scindé' : 'Split View'}
                >
                  <SplitSquareHorizontal className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showSplitMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className={clsx(
                        "absolute top-[calc(100%+8px)] left-0 w-48 rounded-xl shadow-xl border p-2 z-50 overflow-hidden",
                        theme === 'dark' ? "bg-[#181825] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
                      )}
                    >
                      <button onClick={() => { handleSplitView('horizontal'); setShowSplitMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 rounded-lg flex items-center gap-2">
                        <SplitSquareHorizontal className="w-4 h-4" /> {language === 'fr' ? 'Horizontal' : 'Horizontal'}
                      </button>
                      <button onClick={() => { handleSplitView('vertical'); setShowSplitMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 rounded-lg flex items-center gap-2">
                        <SplitSquareVertical className="w-4 h-4" /> {language === 'fr' ? 'Vertical' : 'Vertical'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {earlyTesting.screenshot && (
              <div className="relative flex items-center shrink-0">
                <button 
                  type="button"
                  onClick={() => setShowScreenshotMenu(!showScreenshotMenu)}
                  className={clsx("p-1.5 hover:bg-white/10 rounded-lg transition-colors", showScreenshotMenu ? "text-blue-400 bg-white/10" : "text-gray-400")}
                  title={language === 'fr' ? 'Capture d\'écran' : 'Screenshot'}
                >
                  <Camera className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showScreenshotMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className={clsx(
                        "absolute top-[calc(100%+8px)] left-0 w-48 rounded-xl shadow-xl border p-2 z-50 overflow-hidden",
                        theme === 'dark' ? "bg-[#181825] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
                      )}
                    >
                      <button onClick={() => { handleScreenshot('full'); setShowScreenshotMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 rounded-lg">
                        {language === 'fr' ? 'Toute la page' : 'Full Page'}
                      </button>
                      <button onClick={() => { handleScreenshot('visible'); setShowScreenshotMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 rounded-lg">
                        {language === 'fr' ? 'Partie visible' : 'Visible Part'}
                      </button>
                      <button onClick={() => { handleScreenshot('region'); setShowScreenshotMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 rounded-lg">
                        {language === 'fr' ? 'Sélectionner une zone' : 'Select Region'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            </div>
          </div>

          <form onSubmit={handleNavigate} className="w-full max-w-2xl mx-auto relative z-50 px-4 flex justify-center h-full items-center">
            <div className="relative group w-full no-drag">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                {activeTab?.isPrivate ? (
                  <IncognitoIcon size="sm" animated={false} className="w-4 h-4 text-slate-400 drop-shadow-[0_0_4px_rgba(100,116,139,0.4)]" />
                ) : (
                  <Search className={clsx("w-4 h-4 text-gray-500 transition-colors", `group-focus-within:${colors.text}`)} />
                )}
              </div>
              <input
                type="text"
                value={selectedSuggestionIndex >= 0 ? suggestions[selectedSuggestionIndex] : urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setShowSuggestions(true);
                  setSelectedSuggestionIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                onFocus={(e) => {
                  e.target.select();
                  setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                ref={urlInputRef}
                className={clsx(
                    "w-full border rounded-2xl py-1.5 pl-11 pr-44 text-sm focus:outline-none focus:ring-2 transition-all shadow-sm overflow-hidden text-ellipsis whitespace-nowrap",
                    activeTab?.isPrivate ? "focus:ring-slate-500/50" : colors.ring,
                    ambientMode && activeThemeColor
                      ? (theme === 'dark' ? "bg-black/20 border-white/5 text-gray-200 placeholder-gray-600" : "bg-white/40 border-black/5 text-gray-800 placeholder-gray-400")
                      : (theme === 'dark' ? "bg-[#181825] border-white/5 text-gray-200 placeholder-gray-600 shadow-inner" : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"),
                    activeTab?.isPrivate && (theme === 'dark' ? "border-slate-500/30 bg-[#0f1218]/60 text-slate-200 placeholder-slate-600" : "border-slate-300 bg-slate-50/50 text-slate-900 placeholder-slate-400")
                  )}
                placeholder={language === 'fr' ? "Rechercher ou entrer une URL" : "Search or enter URL"}
              />
               <div className="absolute inset-y-0 right-2 flex items-center gap-1 flex-nowrap">
                 {/* Ad Blocker Menu Indicator */}
                 <div className="relative flex items-center shrink-0">
                   <button 
                    type="button"
                    onClick={() => setShowAdBlockMenu(!showAdBlockMenu)}
                    className={clsx("flex items-center gap-1 px-1.5 py-1 rounded-lg transition-all cursor-pointer shrink-0", 
                      adBlockEnabled ? "bg-green-500/10 text-green-600 dark:text-green-500 hover:bg-green-500/20" : "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
                    )}
                    title={language === 'fr' ? 'Bloqueur de publicités' : 'Ad Blocker'}
                   >
                     <Shield className="w-3.5 h-3.5 shrink-0" />
                     {adBlockEnabled && blockedAdsCount > 0 && <span className="text-[10px] font-bold leading-none">{blockedAdsCount}</span>}
                   </button>

                   <AnimatePresence>
                     {showAdBlockMenu && (
                       <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className={clsx(
                          "absolute top-[calc(100%+12px)] right-0 w-80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border p-5 z-50 overflow-hidden",
                          theme === 'dark' ? "bg-[#181825] border-white/20 text-white" : "bg-white border-gray-200 text-gray-900"
                        )}
                       >
                         <div className="flex items-center gap-3 mb-4">
                            <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors", adBlockEnabled ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-400")}>
                               <Shield className="w-5 h-5" />
                            </div>
                            <div>
                               <h4 className="font-bold text-sm tracking-tight">{language === 'fr' ? 'Bloqueur de pubs' : 'Ad Blocker'}</h4>
                               <p className="text-xs opacity-60">
                                 {adBlockEnabled 
                                    ? (language === 'fr' ? `${blockedAdsCount} éléments bloqués` : `${blockedAdsCount} items blocked`) 
                                    : (language === 'fr' ? 'Désactivé sur cette session' : 'Disabled for session')}
                               </p>
                            </div>
                         </div>
                         
                         <div className={clsx("p-3 rounded-lg mb-4 flex items-center justify-between", theme === 'dark' ? "bg-white/5" : "bg-gray-50")}>
                            <span className="text-sm font-medium">{language === 'fr' ? 'Protection de Navigation' : 'Browsing Protection'}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newVal = !adBlockEnabled;
                                setAdBlockEnabled(newVal);
                                if (window.electron?.setAdBlockEnabled) {
                                  window.electron.setAdBlockEnabled(newVal);
                                  // Recharge juste l'onglet actif si nécessaire
                                  webviewRefs.current[activeTabId]?.reload();
                                }
                              }}
                              className={clsx(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
                                adBlockEnabled ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                              )}
                            >
                              <span className={clsx("inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform", adBlockEnabled ? "translate-x-6" : "translate-x-1")} />
                            </button>
                         </div>
                         <button type="button" onClick={() => setShowAdBlockMenu(false)} className="w-full py-1.5 text-xs font-semibold uppercase tracking-wider text-center bg-transparent opacity-50 hover:opacity-100 transition-opacity rounded-md">
                            {language === 'fr' ? 'Fermer' : 'Close'}
                         </button>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
                 {activeTab?.url?.startsWith('http') && activeTab.isMediaPlaying && (
                   <button 
                    type="button"
                    onClick={enableZenMode}
                    className="p-1 hover:bg-white/10 text-gray-400 rounded transition-colors"
                    title={language === 'fr' ? 'Mode Lecture' : 'Reader Mode'}
                   >
                     <BookOpen className="w-4 h-4" />
                   </button>
                 )}
                 {activeTab?.url?.startsWith('http') && activeTab.isMediaPlaying && (
                   <button 
                    type="button"
                    onClick={enablePiP}
                    className="p-1 hover:bg-white/10 text-gray-400 rounded transition-colors"
                    title={language === 'fr' ? 'Lecteur Flottant (PiP)' : 'Picture in Picture'}
                   >
                     <Tv className="w-4 h-4" />
                   </button>
                 )}
                 {activeTab?.url?.startsWith('http') && activeTab.isMediaPlaying && (
                   <button 
                    type="button"
                    onClick={toggleMute}
                    className="p-1 hover:bg-white/10 text-gray-400 rounded transition-colors"
                    title={language === 'fr' ? 'Couper/Activer le son' : 'Mute/Unmute audio'}
                   >
                     <Volume2 className="w-4 h-4" />
                   </button>
                 )}
                 {activeTab?.url?.startsWith('http') && (
                   <>
                     <button 
                      type="button"
                      onClick={openDevTools}
                      className="p-1 hover:bg-white/10 text-gray-400 rounded transition-colors"
                      title={language === 'fr' ? 'Inspecter la page' : 'Developer Tools'}
                     >
                       <Terminal className="w-4 h-4" />
                     </button>
                   </>
                 )}
                 {installedExtensions.filter(e => e.enabled && pinnedExtensions.includes(e.id)).map(ext => (
                   <div key={ext.id} className="relative">
                     <button
                       type="button"
                       onClick={() => {
                         if (ext.popup) {
                           setActiveExtensionPopup(activeExtensionPopup === ext.id ? null : ext.id);
                           setShowExtensionsMenu(false);
                         }
                       }}
                       className={clsx(
                         "p-1 rounded transition-colors flex items-center justify-center",
                         activeExtensionPopup === ext.id ? "bg-white/20" : "hover:bg-white/10"
                       )}
                       title={ext.name}
                     >
                       {ext.icon ? (
                         <img src={ext.icon} alt={ext.name} className="w-4 h-4 rounded-sm object-cover" />
                       ) : (
                         <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center text-[10px] font-bold text-white">
                           {ext.name.charAt(0).toUpperCase()}
                         </div>
                       )}
                     </button>
                   </div>
                 ))}
                 
                 <div className="relative">
                   <button 
                    type="button"
                    onClick={() => {
                      setShowExtensionsMenu(!showExtensionsMenu);
                      setActiveExtensionPopup(null);
                    }}
                    className={clsx(
                      "p-1 rounded transition-colors flex items-center justify-center",
                      showExtensionsMenu ? "bg-white/20 text-white" : "hover:bg-white/10 text-gray-400"
                    )}
                    title={language === 'fr' ? 'Extensions' : 'Extensions'}
                   >
                     <Puzzle className="w-4 h-4" />
                   </button>
                   
                   <AnimatePresence>
                     {showExtensionsMenu && (
                       <motion.div
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
                         className={clsx(
                           "absolute top-full mt-4 right-0 rounded-xl shadow-2xl overflow-hidden z-9999 border w-72 flex flex-col",
                           theme === 'dark' ? "bg-[#1e1e2e] border-white/10 text-white" : "bg-white border-gray-100 text-gray-900"
                         )}
                       >
                         <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                           <h3 className="font-semibold text-sm">Extensions</h3>
                         </div>
                         <div className="max-h-80 overflow-y-auto">
                           {installedExtensions.filter(e => e.enabled).length === 0 ? (
                             <div className="p-4 text-center text-sm text-gray-500">
                               Aucune extension installée
                             </div>
                           ) : (
                             installedExtensions.filter(e => e.enabled).map(ext => (
                               <div key={ext.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                                 <button
                                   onClick={() => {
                                     setShowExtensionsMenu(false);
                                     if (ext.popup) {
                                       setActiveExtensionPopup(ext.id);
                                     }
                                   }}
                                   className="flex items-center gap-3 flex-1 text-left"
                                 >
                                   {ext.icon ? (
                                     <img src={ext.icon} alt={ext.name} className="w-6 h-6 rounded-sm object-cover shadow-sm" />
                                   ) : (
                                     <div className="w-6 h-6 bg-blue-500 rounded-sm flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                       {ext.name.charAt(0).toUpperCase()}
                                     </div>
                                   )}
                                   <span className="text-sm font-medium truncate max-w-[150px]">{ext.name}</span>
                                 </button>
                                 <button
                                   onClick={() => {
                                     setPinnedExtensions(prev => 
                                       prev.includes(ext.id) 
                                         ? prev.filter(id => id !== ext.id)
                                         : [...prev, ext.id]
                                     );
                                   }}
                                   className={clsx(
                                     "p-1.5 rounded-md transition-colors",
                                     pinnedExtensions.includes(ext.id) ? "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20" : "text-gray-400 hover:text-white hover:bg-white/10"
                                   )}
                                   title="Épingler"
                                 >
                                   <Pin className={clsx("w-3.5 h-3.5", pinnedExtensions.includes(ext.id) && "fill-current")} />
                                 </button>
                               </div>
                             ))
                           )}
                         </div>
                         <div className="p-2 border-t border-white/10 bg-white/5">
                           <button
                             onClick={() => {
                               setShowExtensionsMenu(false);
                               updateTab(activeTabId, { url: 'explore://extensions' });
                             }}
                             className="w-full py-2 text-sm text-center font-medium hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center gap-2"
                           >
                             <Settings className="w-4 h-4" />
                             Gérer les extensions
                           </button>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>

                   {/* Global active popup renderer */}
                   <div className="absolute top-full mt-4 right-0 z-9999 w-0 h-0">
                     {installedExtensions.filter(e => e.popup && openedPopups.includes(e.id)).map(ext => (
                       <motion.div
                         key={ext.id}
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ 
                           opacity: activeExtensionPopup === ext.id ? 1 : 0, 
                           y: activeExtensionPopup === ext.id ? 0 : 10, 
                           scale: activeExtensionPopup === ext.id ? 1 : 0.95 
                         }}
                         className={clsx(
                           "absolute top-full mt-4 right-0 rounded-xl shadow-2xl overflow-hidden border",
                           theme === 'dark' ? "bg-[#1e1e2e] border-white/10" : "bg-white border-gray-100"
                         )}
                         style={{ 
                           width: ext.popupWidth || 320, 
                           height: ext.popupHeight || 380,
                           pointerEvents: activeExtensionPopup === ext.id ? 'auto' : 'none'
                         }}
                       >
                         <webview
                           src={`chrome-extension://${ext.id}/${ext.popup}`}
                           className="w-full h-full bg-transparent"
                         />
                       </motion.div>
                     ))}
                   </div>

                 </div>
                 <button 
                  type="button"
                  className={clsx("p-1 hover:bg-white/10 rounded transition-colors", bookmarks.some(b => b.url === activeTab?.url) ? "text-yellow-400" : "text-gray-400")}
                  onClick={toggleBookmark}
                >
                  <Star className={clsx("w-3.5 h-3.5", bookmarks.some(b => b.url === activeTab?.url) && "fill-current")} />
                </button>
               </div>
            </div>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className={clsx(
                "absolute top-full left-4 right-4 mt-1 rounded-xl shadow-xl border overflow-hidden z-50",
                theme === 'dark' ? "bg-[#1e1e2e] border-white/10" : "bg-white border-gray-100"
              )}>
                {suggestions.map((suggestion, index) => (
                  <button
                      key={index}
                      type="button"
                      className={clsx(
                        "w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors",
                        index === selectedSuggestionIndex 
                          ? clsx(colors.bg, colors.text)
                          : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                      )}
                      onMouseDown={(e) => { // Use onMouseDown to prevent blur before click
                        e.preventDefault();
                        const url = suggestion;
                        setUrlInput(url);
                        setShowSuggestions(false);
                        setSelectedSuggestionIndex(-1);
                        
                        // Navigate
                        if (!url.startsWith('http') && !url.startsWith('explore://')) {
                          const finalUrl = getSearchUrl(url);
                          updateTab(activeTabId, { url: finalUrl, title: finalUrl, isLoading: true });
                        }
                      }}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    >
                    <Search className="w-4 h-4 opacity-50" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </form>

          <div className="flex items-center justify-end h-full">
             <div className="flex items-center gap-1.5 no-drag">
             <button 
              onClick={() => {
                setIsDownloadsOpen(!isDownloadsOpen);
                if (!isDownloadsOpen) {
                  setShowBookmarks(false);
                  setShowHistory(false);
                }
              }}
              className={clsx("p-1.5 hover:bg-white/10 rounded-lg transition-colors relative flex items-center justify-center", isDownloadsOpen ? clsx(colors.text, "bg-white/10") : "text-gray-400")}
            >
              {downloads.some(d => d.state === 'progressing') ? (
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 24 24">
                    <circle
                      className="text-gray-300 dark:text-gray-700"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="transparent"
                      r="10"
                      cx="12"
                      cy="12"
                    />
                    <circle
                      className={clsx(colors.text, "transition-all duration-300 ease-in-out")}
                      strokeWidth="2"
                      strokeDasharray={2 * Math.PI * 10}
                      strokeDashoffset={
                        2 * Math.PI * 10 * (1 - (
                          downloads
                            .filter(d => d.state === 'progressing')
                            .reduce((acc, d) => acc + (d.total ? d.received / d.total : 0), 0) / 
                          (downloads.filter(d => d.state === 'progressing').length || 1)
                        ))
                      }
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="10"
                      cx="12"
                      cy="12"
                    />
                  </svg>
                  <FileDown className="w-3 h-3 relative z-10" />
                </div>
              ) : (
                <FileDown className="w-4 h-4" />
              )}
            </button>
             <button 
              className={clsx("p-1.5 hover:bg-white/10 rounded-lg transition-colors", activeTab?.url === 'explore://history' ? clsx(colors.text, "bg-white/10") : "text-gray-400")}
              onClick={() => { 
                updateTab(activeTabId, { url: 'explore://history' }); 
              }}
              title={language === 'fr' ? 'Historique' : 'History'}
            >
              <div className="w-4 h-4 flex items-center justify-center font-bold text-xs">H</div>
            </button>
             <button 
              className={clsx("p-1.5 hover:bg-white/10 rounded-lg transition-colors", activeTab?.url === 'explore://passwords' ? clsx(colors.text, "bg-white/10") : "text-gray-400")}
              onClick={() => { 
                updateTab(activeTabId, { url: 'explore://passwords' }); 
              }}
              title={language === 'fr' ? 'Mots de passe' : 'Passwords'}
            >
              <Key className="w-4 h-4" />
            </button>
             <button 
              className={clsx("p-1.5 hover:bg-white/10 rounded-lg transition-colors", activeTab?.url === 'explore://vpn' ? clsx(colors.text, "bg-white/10") : "text-gray-400")}
              onClick={() => { 
                updateTab(activeTabId, { url: 'explore://vpn' }); 
              }}
              title={language === 'fr' ? 'VPN' : 'VPN'}
            >
              <Globe className="w-4 h-4" />
            </button>
            
            {/* Window Controls for Left/Right Tab Position */}
            {(tabPosition === 'left' || tabPosition === 'right') && (
               <div className="flex items-center no-drag ml-1.5 border-l border-white/10 pl-1.5">
                  {renderWindowControls()}
               </div>
            )}
            </div>
          </div>

        </div>

        {/* Bookmarks Bar */}
        {showBookmarksBar && (
          <BookmarksBar 
            bookmarks={bookmarks}
            onNavigate={(url) => updateTab(activeTabId, { url })}
            onContextMenu={(e, bookmark) => {
              e.preventDefault();
              confirmDeleteBookmark(bookmark.id);
            }}
            theme={theme}
            emptyMessage={language === 'fr' ? 'Barre de favoris vide' : 'Bookmarks bar is empty'}
          />
        )}

        {/* Bottom Bar (if tabPosition is bottom) */}
        {tabPosition === 'bottom' && (
          <div 
            className={clsx("flex items-center gap-2 px-2 pt-1 pb-1 order-last drag-region w-full min-w-0 transition-colors duration-1000 relative z-10")}
            style={{
              backgroundColor: ambientMode && activeThemeColor 
                ? (theme === 'dark' ? `${activeThemeColor}1A` : `${activeThemeColor}0F`)
                : (theme === 'dark' ? "#181825" : "#ffffff"),
              backdropFilter: ambientMode && activeThemeColor ? "blur(40px)" : "none"
            }}
          >
            <div className={clsx("flex items-center gap-2 px-4 font-bold text-lg no-drag", colors.text)}>
              <Logo className="w-6 h-6" />
            </div>
            <Reorder.Group 
              axis="x" 
              values={tabs} 
              onReorder={setTabs} 
              className="flex-1 flex flex-nowrap overflow-x-auto overflow-y-hidden min-w-0 gap-2 px-2 scrollbar-none pb-1 pt-1 items-center"
            >
              {tabs.map(tab => (
                <Reorder.Item
                  key={tab.id}
                  value={tab}
                  layout
                  className={twMerge(
                    "group relative flex items-center gap-2 px-3 py-1.5 rounded-2xl cursor-pointer transition-all border border-transparent min-w-[30px] max-w-[240px] shrink no-drag",
                    activeTabId === tab.id 
                      ? clsx(colors.bg, colors.text, "shadow-lg relative overflow-hidden after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5", colors.bgSolid.replace("bg-", "after:bg-"), "border-white/5")
                      : clsx("text-gray-400 hover:bg-white/10 dark:hover:bg-white/5", colors.textHover)
                  )}
                  onPointerDown={() => setActiveTabId(tab.id)}
                >
                   <div className={clsx("min-w-5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0", activeTabId === tab.id ? clsx(colors.borderSubtle, colors.text) : "bg-white/10 text-gray-400", tab.isPrivate && "border border-purple-500/30 bg-purple-500/10")}>
                    {tab.isLoading ? (
                      <RotateCw className={clsx("w-3 h-3 animate-spin", activeTabId === tab.id ? colors.text : "text-gray-400")} />
                    ) : tab.isPrivate ? (
                      <IncognitoIcon size="sm" animated={false} className="text-purple-400" />
                    ) : tab.url === 'explore://newtab' ? (
                       <Logo className={clsx("w-3.5 h-3.5", activeTabId === tab.id ? colors.text : "text-gray-400")} />
                    ) : (
                      <img 
                      src={getFaviconUrl(tab.url)} 
                      className="w-3 h-3 rounded-sm"
                      alt=""
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    )}
                  </div>
                  <span className={clsx("truncate text-sm flex-1 text-center select-none transition-all", tabs.length > 10 && "hidden lg:block")}>{tab.title || (language === 'fr' ? 'Chargement...' : 'Loading...')}</span>
                  <button
                    onClick={(e) => closeTab(e, tab.id)}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-all shrink-0 no-drag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Reorder.Item>
              ))}
              <div className="flex items-center">
                <button onClick={() => addTab()} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 no-drag shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </Reorder.Group>
             <div className="flex items-center gap-1 no-drag px-2 shrink-0 border-l border-white/10 pl-2">
               {/* Profile Button in Bottom Bar */}
                <button 
                 onClick={() => {
                   setAuthModalMode('login');
                   setIsAuthModalOpen(true);
                 }}
                 className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                 title={user ? user.name : "Guest User"}
               >
                {user ? (
                   <img src={user.avatar} className="w-5 h-5 rounded-full" alt="" />
                ) : (
                   <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                    <UserIcon className="w-3 h-3 text-gray-400" />
                   </div>
                )}
              </button>
               <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <Settings className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Panels */}
        {(showBookmarks || showHistory) && (
          <div className={clsx(
            "absolute right-0 bottom-0 w-80 border-l z-20 shadow-xl overflow-y-auto p-4 backdrop-blur-xl",
            tabPosition === 'top' ? "top-28" : "top-12",
            theme === 'dark' ? "bg-[#1e1e2e]/95 border-white/10" : "bg-white/95 border-gray-200"
          )}>
             <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{showBookmarks ? (language === 'fr' ? 'Favoris' : 'Bookmarks') : (language === 'fr' ? 'Historique' : 'History')}</h3>
              <div className="flex gap-1">
                {showBookmarks && (
                    <button onClick={createFolder} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title={language === 'fr' ? 'Nouveau dossier' : 'New Folder'}>
                        <FolderPlus className="w-4 h-4 text-gray-400" />
                    </button>
                )}
                <button onClick={() => { setShowBookmarks(false); setShowHistory(false); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            
            {showBookmarks && (
              <div 
                className="flex flex-col h-full overflow-hidden"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const id = e.dataTransfer.getData('text/plain');
                  if (id) moveBookmark(id, undefined);
                }}
              >
                <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                    <BookmarkList 
                        bookmarks={bookmarks}
                        parentId={undefined}
                        onMove={moveBookmark}
                        onDelete={confirmDeleteBookmark}
                        onOpen={(url: string) => {
                            updateTab(activeTabId, { url });
                            setShowBookmarks(false);
                        }}
                        getFaviconUrl={getFaviconUrl}
                        language={language}
                    />
                </div>
              </div>
            )}

            {showHistory && (
               <div className="space-y-2">
                <div className="flex justify-between items-center px-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{language === 'fr' ? 'Historique' : 'History'}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmModal({
                        isOpen: true,
                        title: language === 'fr' ? 'Effacer l\'historique' : 'Clear History',
                        message: language === 'fr' 
                          ? 'Êtes-vous sûr de vouloir effacer votre historique de navigation ? Cette action est irréversible.' 
                          : 'Are you sure you want to clear your browsing history? This action cannot be undone.',
                        onConfirm: deleteHistory
                      });
                    }}
                    className="p-1 hover:bg-red-500/10 text-red-500 rounded transition-colors"
                    title={language === 'fr' ? 'Effacer l\'historique' : 'Clear History'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {history.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">{language === 'fr' ? 'Aucun historique' : 'No history yet'}</div>
                ) : (
                  history.map(item => (
                  <div 
                    key={item.id} 
                    className="p-2 hover:bg-white/5 rounded-lg cursor-pointer group"
                    onClick={() => {
                      updateTab(activeTabId, { url: item.url });
                      setShowHistory(false);
                    }}
                  >
                    <div className="text-sm font-medium truncate">{item.title}</div>
                    <div className="text-xs text-gray-500 truncate">{item.url}</div>
                    <div className="text-[10px] text-gray-600 mt-1">
                      {new Date(item.visited_at).toLocaleTimeString()}
                    </div>
                  </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

      <div className={clsx("flex-1 relative transition-colors duration-1000",
        (ambientMode && activeThemeColor) ? "bg-transparent" : "bg-white dark:bg-[#1e1e2e]"
      )}>
        {tabs.map(tab => {
          const isActive = activeTabId === tab.id;
          const isSplitTarget = activeTabId && tabs.find(t => t.id === activeTabId)?.splitTabId === tab.id;
          const activeTabObj = tabs.find(t => t.id === activeTabId);
          const isVisible = isActive || isSplitTarget;
          
          let positionClasses = "inset-0 w-full h-full";
          
          if (isActive && activeTabObj?.splitTabId) {
             positionClasses = activeTabObj.splitDirection === 'horizontal' 
               ? "top-0 left-0 bottom-0 w-1/2 border-r border-white/20" 
               : "top-0 left-0 right-0 h-1/2 border-b border-white/20";
          } else if (isSplitTarget) {
             positionClasses = activeTabObj?.splitDirection === 'horizontal'
               ? "top-0 right-0 bottom-0 w-1/2 left-1/2"
               : "bottom-0 left-0 right-0 h-1/2 top-1/2";
          }

          return (
          <div
            key={tab.id}
            className={clsx(
              "absolute transition-all duration-300",
              isVisible ? "z-10 visible" : "z-0 invisible",
              positionClasses
            )}
          >
            {tab.url.startsWith('explore://') ? (
              activeTabId === tab.id ? (
                <div className={clsx("w-full h-full transition-colors duration-1000", 
                   (ambientMode && activeThemeColor) ? "bg-transparent" : (theme === 'dark' ? "bg-[#1e1e2e]" : "bg-white")
                )}>
                {tab.url === 'explore://newtab' && (
                  <NewTabPage 
                    theme={theme} 
                    accentColor={accentColor}
                    isPrivate={tab.isPrivate}
                    onSearch={(query) => {
                      const url = getSearchUrl(query);
                      updateTab(tab.id, { url, title: url, isLoading: true });
                    }} 
                    onQueryChange={(query) => {
                      setUrlInput(query);
                      setSelectedSuggestionIndex(-1);
                    }}
                    suggestions={suggestions}
                    language={language}
                    blockedAdsCount={blockedAdsCount}
                    adBlockEnabled={adBlockEnabled}
                    bookmarks={bookmarks}
                  />
                )}
                {tab.url === 'explore://settings' && (
                  <div className="w-full h-full overflow-y-auto bg-transparent p-12">
                     <SettingsModal 
                        isOpen={true}
                        isFullPage={true}
                        onClose={() => updateTab(tab.id, { url: 'explore://newtab' })}
                        tabPosition={tabPosition}
                        setTabPosition={setTabPosition}
                        theme={theme}
                        setTheme={setTheme}
                        searchEngine={searchEngine}
                        setSearchEngine={setSearchEngine}
                        language={language}
                        setLanguage={setLanguage}
                        accentColor={accentColor}
                        setAccentColor={setAccentColor}
                        shortcuts={shortcuts}
                        setShortcuts={setShortcuts}
                        onOpenUrl={(url) => updateTab(activeTabId, { url })}
                        onImportBookmarks={handleImportBookmarks}
                        onClearData={handleClearData}
                        onSaveSessionToCloud={handleSaveSessionToCloud}
                        onRestoreSessionFromCloud={handleRestoreSessionFromCloud}
                        isAuthenticated={!!user}
                        onRequireAuth={() => setIsAuthModalOpen(true)}
                        autoCloudSync={autoCloudSync}
                        setAutoCloudSync={setAutoCloudSync}
                        windowStyle={windowStyle}
                        setWindowStyle={setWindowStyle}
                        showBookmarksBar={showBookmarksBar}
                        setShowBookmarksBar={setShowBookmarksBar}
                        ambientMode={ambientMode}
                        setAmbientMode={setAmbientMode}
                        checkForUpdates={handleCheckForUpdates}
                        earlyTesting={earlyTesting}
                        setEarlyTesting={setEarlyTesting}
                        setConfirmModal={setConfirmModal}
                     />
                  </div>
                )}
                {tab.url === 'explore://history' && (
                   <div className="w-full h-full overflow-y-auto bg-transparent p-12 max-w-4xl mx-auto animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                         <h2 className="text-3xl font-black flex items-center gap-3">
                            <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", colors.bgSolid)}>
                               H
                            </div>
                            {language === 'fr' ? 'Historique de navigation' : 'Browsing History'}
                         </h2>
                         <div className="flex items-center gap-3">
                            <div className="relative flex-1 md:w-64 group">
                               <Search className={clsx("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", theme === 'dark' ? "text-gray-500 group-focus-within:text-blue-400" : "text-gray-400 group-focus-within:text-blue-500")} />
                               <input
                                  type="text"
                                  placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'}
                                  value={historySearchQuery}
                                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                                  className={clsx(
                                     "w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm outline-none transition-all",
                                     theme === 'dark' ? "bg-white/5 border-white/10 focus:bg-white/10 focus:border-blue-500/50" : "bg-white border-gray-200 focus:border-blue-500/50 shadow-sm"
                                  )}
                               />
                            </div>
                            <button
                               onClick={() => {
                                  setConfirmModal({
                                     isOpen: true,
                                     title: language === 'fr' ? 'Effacer l\'historique' : 'Clear history',
                                     message: language === 'fr' ? 'Voulez-vous vraiment effacer tout votre historique ?' : 'Are you sure you want to clear all your history?',
                                     onConfirm: deleteHistory
                                  });
                               }}
                               className="px-4 py-2.5 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-sm"
                            >
                               {language === 'fr' ? 'Effacer tout' : 'Clear all'}
                            </button>
                         </div>
                      </div>

                      {(() => {
                         const filteredHistory = history.filter(item => 
                            item.title.toLowerCase().includes(historySearchQuery.toLowerCase()) || 
                            item.url.toLowerCase().includes(historySearchQuery.toLowerCase())
                         );

                         if (filteredHistory.length === 0) {
                            return (
                               <div className="text-center py-20 opacity-50 border border-dashed border-white/10 rounded-3xl bg-white/2">
                                  <div className="text-4xl mb-3">🕒</div>
                                  <p className="font-semibold text-lg">{language === 'fr' ? 'Aucun historique trouvé' : 'No history found'}</p>
                                  <p className="text-xs opacity-50 mt-1">{language === 'fr' ? 'Les sites que vous visitez s\'afficheront ici.' : 'Websites you visit will be listed here.'}</p>
                               </div>
                            );
                         }

                         const today = new Date();
                         today.setHours(0,0,0,0);
                         const yesterday = new Date();
                         yesterday.setDate(yesterday.getDate() - 1);
                         yesterday.setHours(0,0,0,0);

                         const groups: { title: string; items: HistoryItem[] }[] = [
                            { title: language === 'fr' ? "Aujourd'hui" : "Today", items: [] },
                            { title: language === 'fr' ? "Hier" : "Yesterday", items: [] },
                            { title: language === 'fr' ? "Plus ancien" : "Older", items: [] }
                         ];

                         filteredHistory.forEach(item => {
                            const d = new Date(item.visited_at);
                            d.setHours(0,0,0,0);
                            if (d.getTime() === today.getTime()) {
                               groups[0].items.push(item);
                            } else if (d.getTime() === yesterday.getTime()) {
                               groups[1].items.push(item);
                            } else {
                               groups[2].items.push(item);
                            }
                         });

                         return (
                            <div className="space-y-8">
                               {groups.map(group => {
                                  if (group.items.length === 0) return null;
                                  return (
                                     <div key={group.title} className="space-y-3">
                                        <h3 className={clsx("text-sm font-bold uppercase tracking-wider opacity-60 flex items-center gap-2 px-1", theme === 'dark' ? "text-white" : "text-gray-700")}>
                                           <span>{group.title}</span>
                                           <span className={clsx("text-[10px] px-2 py-0.5 rounded-full border", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200")}>{group.items.length}</span>
                                        </h3>
                                        <div className="grid gap-2">
                                           {group.items.map(item => (
                                              <div 
                                                 key={item.id}
                                                 onClick={() => updateTab(tab.id, { url: item.url })}
                                                 className={clsx(
                                                    "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group/item hover:translate-x-0.5",
                                                    theme === 'dark' ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20" : "bg-white border-gray-100 hover:bg-gray-50 shadow-sm"
                                                 )}
                                              >
                                                 <div className="flex items-center gap-4 min-w-0">
                                                    <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center p-1.5 shrink-0 shadow-xs", theme === 'dark' ? "bg-white/5" : "bg-gray-50")}>
                                                       <img 
                                                          src={getFaviconUrl(item.url)} 
                                                          className="w-full h-full object-contain" 
                                                          alt=""
                                                          onError={(e) => { e.currentTarget.src = `https://icons.duckduckgo.com/ip3/${new URL(item.url).hostname}.ico`; }}
                                                       />
                                                    </div>
                                                    <div className="min-w-0">
                                                       <div className="font-bold text-sm truncate leading-tight group-hover/item:text-blue-400 transition-colors">{item.title}</div>
                                                       <div className="text-[10px] opacity-40 truncate mt-1">{item.url}</div>
                                                    </div>
                                                 </div>
                                                 <div className="flex items-center gap-4 shrink-0">
                                                    <div className="text-[10px] font-mono opacity-40">{new Date(item.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    <button 
                                                       onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                                                       className={clsx(
                                                          "p-2 opacity-0 group-hover/item:opacity-100 rounded-xl transition-all hover:bg-red-500/10 text-red-500"
                                                       )}
                                                       title={language === 'fr' ? 'Supprimer' : 'Delete'}
                                                    >
                                                       <Trash2 className="w-4 h-4" />
                                                    </button>
                                                 </div>
                                              </div>
                                           ))}
                                        </div>
                                     </div>
                                  );
                               })}
                            </div>
                         );
                      })()}
                   </div>
                )}
                {tab.url === 'explore://bookmarks' && (
                   <div className="w-full h-full overflow-y-auto bg-transparent p-12 max-w-6xl mx-auto animate-fadeIn relative">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                         <h2 className="text-3xl font-black flex items-center gap-3">
                            <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", colors.bgSolid)}>
                               <Star className="w-6 h-6 fill-current" />
                            </div>
                            {language === 'fr' ? 'Mes Favoris' : 'My Bookmarks'}
                         </h2>
                         <div className="flex items-center gap-3">
                            <div className="relative flex-1 md:w-64 group">
                               <Search className={clsx("absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", theme === 'dark' ? "text-gray-500 group-focus-within:text-blue-400" : "text-gray-400 group-focus-within:text-blue-500")} />
                               <input
                                  type="text"
                                  placeholder={language === 'fr' ? 'Filtrer les favoris...' : 'Search bookmarks...'}
                                  value={bookmarkSearchQuery}
                                  onChange={(e) => setBookmarkSearchQuery(e.target.value)}
                                  className={clsx(
                                     "w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm outline-none transition-all",
                                     theme === 'dark' ? "bg-white/5 border-white/10 focus:bg-white/10 focus:border-blue-500/50" : "bg-white border-gray-200 focus:border-blue-500/50 shadow-sm"
                                  )}
                               />
                            </div>
                            <button 
                               onClick={createFolder}
                               className={clsx("px-5 py-2.5 rounded-2xl text-white font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 shrink-0", colors.bgSolid)}
                            >
                               <FolderPlus className="w-4 h-4" />
                               {language === 'fr' ? 'Nouveau dossier' : 'New Folder'}
                            </button>
                         </div>
                      </div>
                      
                      {(() => {
                         const filteredBookmarks = bookmarks.filter(bookmark => 
                            bookmark.title.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()) || 
                            (bookmark.url && bookmark.url.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()))
                         );

                         if (filteredBookmarks.length === 0) {
                            return (
                               <div className="text-center py-20 opacity-50 border border-dashed border-white/10 rounded-3xl bg-white/2">
                                  <Star className="w-16 h-16 mx-auto mb-4 opacity-25 text-gray-400" />
                                  <p className="font-semibold text-lg">{language === 'fr' ? 'Aucun favori trouvé' : 'No bookmarks found'}</p>
                                  <p className="text-xs opacity-50 mt-1">{language === 'fr' ? 'Ajoutez vos sites préférés pour y accéder rapidement.' : 'Add your favorite websites for quick access.'}</p>
                               </div>
                            );
                         }

                         return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                               {filteredBookmarks.map(bookmark => (
                                  <div 
                                     key={bookmark.id}
                                     onClick={() => bookmark.url && updateTab(tab.id, { url: bookmark.url })}
                                     onContextMenu={(e) => {
                                        e.preventDefault();
                                        setBookmarkContextMenu({
                                           isOpen: true,
                                           x: e.clientX,
                                           y: e.clientY,
                                           bookmarkId: bookmark.id,
                                           bookmarkUrl: bookmark.url
                                        });
                                     }}
                                     className={clsx(
                                        "group relative aspect-4/3 rounded-3xl border overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-1 hover:border-blue-500/20",
                                        theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-150 shadow-sm"
                                     )}
                                  >
                                     <div className={clsx("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-linear-to-tr from-blue-500 to-purple-500")} />
                                     <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                           <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105", theme === 'dark' ? "bg-white/10" : "bg-gray-100")}>
                                              {bookmark.type === 'folder' ? (
                                                 <span className="text-2xl select-none">📁</span>
                                              ) : (
                                                 <img 
                                                    src={getFaviconUrl(bookmark.url)} 
                                                    className="w-6 h-6 object-contain" 
                                                    alt="" 
                                                    onError={(e) => { e.currentTarget.src = `https://icons.duckduckgo.com/ip3/${new URL(bookmark.url || '').hostname}.ico`; }}
                                                 />
                                              )}
                                           </div>
                                           <button 
                                              onClick={(e) => { e.stopPropagation(); confirmDeleteBookmark(bookmark.id); }}
                                              className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                              title={language === 'fr' ? 'Supprimer' : 'Delete'}
                                           >
                                              <Trash2 className="w-4 h-4" />
                                           </button>
                                        </div>
                                        <div>
                                           <div className="font-bold text-base leading-tight mb-1 truncate group-hover:text-blue-400 transition-colors">{bookmark.title}</div>
                                           <div className="text-[10px] opacity-40 truncate">{bookmark.url || (language === 'fr' ? 'Dossier favoris' : 'Bookmarks Folder')}</div>
                                        </div>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         );
                      })()}
                   </div>
                )}
                {tab.url === 'explore://passwords' && (
                  <div className="w-full h-full overflow-y-auto bg-transparent p-12 max-w-5xl mx-auto animate-fadeIn">
                    <PasswordManager
                      isOpen={true}
                      isFullPage={true}
                      onClose={() => updateTab(tab.id, { url: 'explore://newtab' })}
                      theme={theme}
                      accentColor={accentColor}
                      language={language}
                    />
                  </div>
                )}
                {tab.url === 'explore://vpn' && (
                  <div className="w-full h-full overflow-y-auto bg-transparent p-12 max-w-5xl mx-auto animate-fadeIn">
                    <VPN
                      isOpen={true}
                      isFullPage={true}
                      onClose={() => updateTab(tab.id, { url: 'explore://newtab' })}
                      theme={theme}
                      accentColor={accentColor}
                      language={language}
                    />
                  </div>
                )}
                {tab.url.startsWith('explore://search') && (
                  <SearchPage
                    query={new URLSearchParams(tab.url.split('?')[1]).get('q') || ''}
                    onSearch={(q) => updateTab(tab.id, { url: `explore://search?q=${encodeURIComponent(q)}` })}
                    onOpenUrl={(url) => updateTab(tab.id, { url })}
                    onNewTab={(url) => {
                      const newTabId = Date.now().toString();
                      setTabs(prev => [...prev, { id: newTabId, url, title: language === 'fr' ? 'Nouvel onglet' : 'New Tab', isLoading: true, isPrivate: tab.isPrivate }]);
                      setActiveTabId(newTabId);
                    }}
                    theme={theme as 'dark' | 'light'}
                    colors={colors}
                    language={language}
                  />
                )}
                {tab.url === 'explore://extensions' && (
                  <ExtensionsPage
                    theme={theme as 'dark' | 'light'}
                    accentColor={accentColor}
                    language={language}
                    colors={colors}
                    onOpenStore={() => updateTab(activeTabId, { url: 'explore://store' })}
                  />
                )}
                {tab.url === 'explore://store' && (
                  <ExtensionStore
                    theme={theme as 'dark' | 'light'}
                    language={language}
                    colors={colors}
                  />
                )}
                {tab.url === 'explore://themes' && (
                  <ThemesPage
                    theme={theme as 'dark' | 'light'}
                    setTheme={setTheme}
                    accentColor={accentColor}
                    language={language}
                    colors={colors}
                  />
                )}
                </div>
              ) : null
            ) : (
              <webview
                src={tab.url}
                useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
                ref={(el: Electron.WebviewTag | null) => {
                  if (el) {
                    webviewRefs.current[tab.id] = el;
                    // Add event listeners once
                    if (!el.dataset.listenersAttached) {
                      el.addEventListener('did-start-loading', () => {
                        updateTab(tab.id, { isLoading: true });
                      });
                      el.addEventListener('did-stop-loading', () => {
                        updateTab(tab.id, { isLoading: false, title: el.getTitle() });
                        addToHistory(el.getURL(), el.getTitle(), tab.isPrivate);
                      });
                      el.addEventListener('did-finish-load', () => {
                        updateTab(tab.id, { isLoading: false, title: el.getTitle(), canGoBack: el.canGoBack(), canGoForward: el.canGoForward() });
                      });
                      el.addEventListener('did-change-theme-color', (e: Event) => {
                         const event = e as Event & { themeColor: string };
                         if (event.themeColor) {
                           updateTab(tab.id, { themeColor: event.themeColor });
                         }
                      });
                      el.addEventListener('page-favicon-updated', () => {
                         // const event = e as Event & { favicons: string[] };
                         // Favicons update available if needed
                      });
                      el.addEventListener('media-started-playing', () => {
                        updateTab(tab.id, { isMediaPlaying: true });
                      });
                      el.addEventListener('media-paused', () => {
                        updateTab(tab.id, { isMediaPlaying: false });
                      });
                      el.addEventListener('dom-ready', () => {
                        updateTab(tab.id, { title: el.getTitle(), canGoBack: el.canGoBack(), canGoForward: el.canGoForward() });
                        
                        // Inject theme CSS
                        if (theme === 'dark') {
                           el.insertCSS(`
                            @media (prefers-color-scheme: dark) {
                              body { background-color: #121212 !important; color: #e0e0e0 !important; }
                            }
                          `);
                        }

                        // Image Viewer & Zoom
                        if (/\\.(jpe?g|png|gif|webp|svg|bmp|ico)$/i.test(el.getURL())) {
                          el.executeJavaScript(`
                            (function() {
                              const img = document.querySelector('img');
                              if (!img) return;
                              document.body.style.display = 'flex';
                              document.body.style.justifyContent = 'center';
                              document.body.style.alignItems = 'center';
                              document.body.style.height = '100vh';
                              document.body.style.backgroundColor = '#000';
                              document.body.style.margin = '0';
                              document.body.style.overflow = 'hidden';
                              
                              let scale = 1;
                              document.addEventListener('wheel', (e) => {
                                if (e.ctrlKey || true) {
                                  e.preventDefault();
                                  scale += e.deltaY * -0.005;
                                  scale = Math.min(Math.max(0.1, scale), 10);
                                  img.style.transform = \`scale(\${scale})\`;
                                  img.style.transition = 'transform 0.1s ease-out';
                                }
                              }, { passive: false });
                            })();
                          `).catch(console.error);
                        }

                        // Ambient Theme Color Extraction - helper function
                        const extractAmbientColor = () => {
                          el.executeJavaScript(`
                            (function() {
                              // 1. Try meta theme-color
                              const meta = document.querySelector('meta[name="theme-color"]');
                              if (meta && meta.content) return meta.content;

                              // 2. YouTube: extract the dominant color from the video player ambient
                              if (window.location.hostname.includes('youtube.com')) {
                                // YouTube uses a cinematic lighting effect with computed ambient colors
                                const ambientEl = document.querySelector('#cinematics canvas');
                                if (ambientEl) {
                                  try {
                                    const ctx = ambientEl.getContext('2d');
                                    if (ctx) {
                                      const w = ambientEl.width;
                                      const h = ambientEl.height;
                                      const data = ctx.getImageData(Math.floor(w/2), Math.floor(h/4), 1, 1).data;
                                      if (data[3] > 50) {
                                        return 'rgb(' + data[0] + ', ' + data[1] + ', ' + data[2] + ')';
                                      }
                                    }
                                  } catch(e) {}
                                }
                                // Fallback: try the video thumbnail dominant color
                                const playerBg = document.querySelector('#player');
                                if (playerBg) {
                                  const bg = window.getComputedStyle(playerBg).backgroundColor;
                                  if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== 'rgb(0, 0, 0)') return bg;
                                }
                                // YouTube dark mode fallback
                                return 'rgb(15, 15, 15)';
                              }

                              // 3. Try to find dominant color of the body or html
                              const getElementColor = (el) => {
                                if (!el) return null;
                                const bg = window.getComputedStyle(el).backgroundColor;
                                if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                                  return bg;
                                }
                                return null;
                              };

                              return getElementColor(document.body) || getElementColor(document.documentElement) || null;
                            })();
                          `).then((color: string | null) => {
                            if (color && typeof color === 'string') {
                              if (color.startsWith('rgb')) {
                                const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                                if (rgbMatch) {
                                  const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
                                  const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
                                  const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
                                  updateTab(tab.id, { themeColor: '#' + r + g + b });
                                  return;
                                }
                              }
                              updateTab(tab.id, { themeColor: color });
                            }
                          }).catch(() => {});
                        };

                        // Extract once on load
                        extractAmbientColor();

                        // For dynamic sites like YouTube, re-extract periodically
                        const ambientInterval = setInterval(() => {
                          try { extractAmbientColor(); } catch { /* ignore */ }
                        }, 3000);
                        el.addEventListener('will-navigate', () => clearInterval(ambientInterval));
                        el.addEventListener('destroyed', () => clearInterval(ambientInterval));
                      });
                        el.addEventListener('new-window', (e) => {
                          const event = e as Event & { url: string };
                          const newTabId = Date.now().toString();
                          const newTab: Tab = { 
                            id: newTabId, 
                            url: event.url, 
                            title: languageRef.current === 'fr' ? 'Nouvel onglet' : 'New Tab', 
                            isLoading: true,
                            isPrivate: tab.isPrivate
                          };
                          setTabs(prev => [...prev, newTab]);
                          setActiveTabId(newTabId);
                        });
                        el.addEventListener('before-input-event', (e: Event) => {
                          const event = e as Event & { input: { type: string, key: string, code: string, control: boolean, shift: boolean, alt: boolean, meta: boolean } };
                          if (event.input.type === 'keyDown') {
                            const fakeEvent = new KeyboardEvent('keydown', {
                              key: event.input.key,
                              code: event.input.code,
                              ctrlKey: event.input.control,
                              shiftKey: event.input.shift,
                              altKey: event.input.alt,
                              metaKey: event.input.meta,
                              bubbles: true,
                              cancelable: true
                            });
                            const allowed = window.dispatchEvent(fakeEvent);
                            if (!allowed) {
                              event.preventDefault();
                            }
                          }
                        });
                        
                        el.dataset.listenersAttached = 'true';
                      }
                    }
                  }}
                className={clsx("w-full h-full bg-transparent")}
                allowpopups={true}
                partition={tab.isPrivate ? "private" : "persist:explore"}
                webpreferences="contextIsolation=true, nodeIntegration=false"
              />
            )}
          </div>
          );
        })}
        {screenshotToCrop && (
          <RegionCropper
            imageUrl={screenshotToCrop}
            language={language}
            onCancel={() => setScreenshotToCrop(null)}
            onCrop={(croppedDataUrl) => {
              const a = document.createElement('a');
              a.href = croppedDataUrl;
              a.download = `screenshot_region_${new Date().getTime()}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setScreenshotToCrop(null);
            }}
          />
        )}
      </div>
    </div>

      <PasswordManager 
        isOpen={showPasswordManager}
        onClose={() => setShowPasswordManager(false)}
        theme={theme}
        accentColor={accentColor}
        language={language}
      />

      <VPN 
        isOpen={showVPN}
        onClose={() => setShowVPN(false)}
        theme={theme}
        accentColor={accentColor}
        language={language}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={(u) => setUser(u)}
        onLogout={handleLogout}
        user={user}
        language={language}
        theme={theme}
        accentColor={accentColor}
        initialMode={authModalMode}
      />

      <DownloadsPopup 
        isOpen={isDownloadsOpen} 
        onClose={() => setIsDownloadsOpen(false)} 
        downloads={downloads}
        theme={theme}
        accentColor={accentColor}
        language={language}
        className={clsx(
          "z-50",
          tabPosition === 'top' ? "top-28 right-4" :
          tabPosition === 'bottom' ? "bottom-20 right-4" :
          tabPosition === 'right' ? "top-16 right-48" : "top-16 right-4"
        )}
      />



      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tabPosition={tabPosition}
        setTabPosition={setTabPosition}
        theme={theme}
        setTheme={setTheme}
        searchEngine={searchEngine}
        setSearchEngine={(engine) => {
          setSearchEngine(engine);
          localStorage.setItem('searchEngine', engine);
        }}
        language={language}
        setLanguage={setLanguage}
        accentColor={accentColor}
        setAccentColor={setAccentColor}
        onSaveSessionToCloud={handleSaveSessionToCloud}
        onRestoreSessionFromCloud={handleRestoreSessionFromCloud}
        isAuthenticated={!!user}
        onRequireAuth={() => setIsAuthModalOpen(true)}
        autoCloudSync={autoCloudSync}
        setAutoCloudSync={setAutoCloudSync}
        shortcuts={shortcuts}
        setShortcuts={setShortcuts}
        onImportBookmarks={handleImportBookmarks}
        ambientMode={ambientMode}
        setAmbientMode={setAmbientMode}
        onClearData={handleClearData}
        earlyTesting={earlyTesting}
        setEarlyTesting={setEarlyTesting}
        setConfirmModal={setConfirmModal}
        onOpenUrl={(url) => {
          const newId = crypto.randomUUID();
          const newTab: Tab = {
            id: newId,
            url,
            title: language === 'fr' ? 'Nouvel onglet' : 'New Tab',
            isLoading: true
          };
          setTabs([...tabs, newTab]);
          setActiveTabId(newId);
          setIsSettingsOpen(false);
        }}
        windowStyle={windowStyle}
        setWindowStyle={setWindowStyle}
        showBookmarksBar={showBookmarksBar}
        setShowBookmarksBar={setShowBookmarksBar}
        checkForUpdates={handleCheckForUpdates}
      />

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() => confirmModal.onConfirm(modalInputValue)}
        title={confirmModal.title}
        message={confirmModal.message}
        theme={theme}
        accentColor={accentColor}
        isInput={confirmModal.isInput}
        inputValue={modalInputValue}
        setInputValue={setModalInputValue}
        inputPlaceholder={confirmModal.inputPlaceholder}
      />
      {contextMenu && contextMenu.isOpen && (
        <ContextMenu
            isOpen={contextMenu.isOpen}
            x={contextMenu.x}
            y={contextMenu.y}
            params={contextMenu.params}
            onClose={() => setContextMenu(null)}
            onAction={handleContextMenuAction}
            theme={theme}
            language={language}
          />
      )}

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(url) => {
          if (!url.startsWith('http') && !url.startsWith('explore://')) {
             updateTab(activeTabId, { url: getSearchUrl(url), title: url, isLoading: true });
          } else {
             updateTab(activeTabId, { url, title: url, isLoading: true });
          }
        }}
        theme={theme}
        language={language}
        history={history}
      />

      {/* Interactive Glassmorphic Auto-Updater Modal */}
      <AnimatePresence>
        {updateState.showModal && (
          <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-md p-6 rounded-2xl border border-white/10 backdrop-blur-xl bg-[#1e1e2e]/90 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Decorative background glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Glowing Top Icon */}
              <div className="relative mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-tr from-blue-500 to-purple-600 shadow-lg text-white">
                <RotateCw className={clsx("w-8 h-8", updateState.status === 'checking' || updateState.status === 'downloading' ? "animate-spin" : "")} />
                <div className="absolute inset-0 rounded-full bg-linear-to-tr from-blue-500 to-purple-600 blur-md opacity-50 -z-10 animate-pulse" />
              </div>

              {/* Title based on status */}
              <h3 className="text-xl font-bold mb-2 bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {updateState.status === 'checking' && (language === 'fr' ? 'Recherche de mises à jour...' : 'Checking for updates...')}
                {updateState.status === 'available' && (language === 'fr' ? 'Nouvelle version disponible !' : 'New version available!')}
                {updateState.status === 'downloading' && (language === 'fr' ? 'Téléchargement de la mise à jour' : 'Downloading update')}
                {updateState.status === 'downloaded' && (language === 'fr' ? 'Mise à jour prête !' : 'Update is ready!')}
                {updateState.status === 'not-available' && (language === 'fr' ? 'Navigateur à jour !' : 'Up to date!')}
                {updateState.status === 'error' && (language === 'fr' ? 'Erreur de mise à jour' : 'Update error')}
              </h3>

              {/* Subtitle / details */}
              <p className="text-sm text-slate-400 mb-6 px-2">
                {updateState.status === 'checking' && (language === 'fr' ? 'Nous recherchons si une nouvelle version majeure de Navigateur Explore est disponible.' : 'We are checking if a new major version of Navigateur Explore is available.')}
                {updateState.status === 'available' && (language === 'fr' ? `La version ${updateState.version || 'suivante'} est disponible avec de superbes fonctionnalités. Le téléchargement va démarrer...` : `Version ${updateState.version || 'update'} is available with stunning new features. Starting download...`)}
                {updateState.status === 'downloading' && (language === 'fr' ? 'Récupération des derniers fichiers système. Veuillez ne pas éteindre le navigateur.' : 'Fetching the latest system files. Please do not close the browser.')}
                {updateState.status === 'downloaded' && (language === 'fr' ? `La version ${updateState.version || 'suivante'} a été téléchargée avec succès. Redémarrez maintenant pour en profiter.` : `Version ${updateState.version || 'update'} has been successfully downloaded. Restart now to apply.`)}
                {updateState.status === 'not-available' && (language === 'fr' ? 'Vous utilisez déjà la toute dernière version stable de Navigateur Explore.' : 'You are already running the latest stable version of Navigateur Explore.')}
                {updateState.status === 'error' && (updateState.error || (language === 'fr' ? 'Une erreur est survenue lors de la vérification ou du téléchargement.' : 'An error occurred while checking or downloading.'))}
              </p>

              {/* Progress bar for downloading */}
              {updateState.status === 'downloading' && (
                <div className="w-full px-4 mb-6">
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>{language === 'fr' ? 'Téléchargement...' : 'Downloading...'}</span>
                    <span className="font-semibold">{Math.round(updateState.progress || 0)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5 relative">
                    <motion.div
                      className="h-full bg-linear-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"
                      initial={{ width: "0%" }}
                      animate={{ width: `${updateState.progress || 0}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-3 justify-center w-full mt-2">
                {updateState.status === 'downloaded' && (
                  <>
                    <button
                      onClick={() => {
                        if (window.electron?.restartApp) {
                          window.electron.restartApp();
                        }
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl text-white font-semibold text-sm bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-[0.98] transition-all shadow-lg hover:shadow-purple-500/20"
                    >
                      {language === 'fr' ? 'Installer & Redémarrer' : 'Install & Restart'}
                    </button>
                    <button
                      onClick={() => setUpdateState(prev => ({ ...prev, showModal: false }))}
                      className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/5 active:scale-[0.98] transition-all"
                    >
                      {language === 'fr' ? 'Plus tard' : 'Later'}
                    </button>
                  </>
                )}
                {(updateState.status === 'error' || updateState.status === 'not-available') && (
                  <button
                    onClick={() => setUpdateState(prev => ({ ...prev, showModal: false, status: 'idle' }))}
                    className="w-full max-w-[200px] px-4 py-2.5 rounded-xl text-white font-semibold text-sm bg-white/10 hover:bg-white/15 active:scale-[0.98] transition-all border border-white/5"
                  >
                    {language === 'fr' ? 'Fermer' : 'Close'}
                  </button>
                )}
                {updateState.status === 'checking' && (
                  <button
                    onClick={() => setUpdateState(prev => ({ ...prev, showModal: false, status: 'idle' }))}
                    className="w-full max-w-[200px] px-4 py-2.5 rounded-xl text-slate-400 font-semibold text-sm border border-white/5 hover:bg-white/5 transition-all"
                  >
                    {language === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bookmarks Page Right-Click Context Menu */}
      {bookmarkContextMenu && bookmarkContextMenu.isOpen && (
         <div 
            className={clsx(
               "fixed z-100 py-1.5 rounded-2xl border shadow-2xl backdrop-blur-xl w-56 flex flex-col overflow-hidden animate-fadeIn text-xs font-bold",
               theme === 'dark' ? "bg-[#181825]/90 border-white/10 text-white" : "bg-white/95 border-gray-200 text-gray-900"
            )}
            style={{ top: bookmarkContextMenu.y, left: bookmarkContextMenu.x }}
            onClick={(e) => e.stopPropagation()}
         >
            {bookmarkContextMenu.bookmarkUrl ? (
               <>
                  <button 
                     onClick={() => {
                        const activeTab = tabs.find(t => t.id === activeTabId);
                        if (activeTab) {
                           updateTab(activeTab.id, { url: bookmarkContextMenu.bookmarkUrl });
                        }
                        setBookmarkContextMenu(null);
                     }}
                     className={clsx("px-4 py-2.5 text-left flex items-center gap-2 transition-colors", theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-100")}
                  >
                     {language === 'fr' ? 'Ouvrir dans cet onglet' : 'Open in this tab'}
                  </button>
                  <button 
                     onClick={() => {
                        addTab(bookmarkContextMenu.bookmarkUrl, true);
                        setBookmarkContextMenu(null);
                     }}
                     className={clsx("px-4 py-2.5 text-left flex items-center gap-2 transition-colors", theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-100")}
                  >
                     {language === 'fr' ? 'Ouvrir dans un nouvel onglet' : 'Open in new tab'}
                  </button>
                  <button 
                     onClick={() => {
                        addTab(bookmarkContextMenu.bookmarkUrl, false);
                        setBookmarkContextMenu(null);
                     }}
                     className={clsx("px-4 py-2.5 text-left flex items-center gap-2 transition-colors", theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-100")}
                  >
                     {language === 'fr' ? 'Ouvrir en arrière-plan' : 'Open in background'}
                  </button>
                  <div className="h-px my-1 bg-white/5" />
               </>
            ) : null}
            <button 
               onClick={() => {
                  confirmDeleteBookmark(bookmarkContextMenu.bookmarkId);
                  setBookmarkContextMenu(null);
               }}
               className="px-4 py-2.5 text-left hover:bg-red-500 hover:text-white text-red-400 flex items-center gap-2 transition-colors"
            >
               <Trash2 className="w-4 h-4 shrink-0" />
               {language === 'fr' ? 'Supprimer' : 'Delete'}
            </button>
         </div>
      )}
    </div>
  );
}

export default App;
