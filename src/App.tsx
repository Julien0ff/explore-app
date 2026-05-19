import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  X, 
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
  Book,
  Key,
  Globe,
  FolderPlus,
  Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Reorder, AnimatePresence, motion } from 'framer-motion';

import { Logo } from './components/Logo';
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
import { CommandPalette } from './components/CommandPalette';
import { ContextMenu } from './components/ContextMenu';
import { FileDown } from 'lucide-react';
import { getAccentColorClass } from './lib/theme';

interface Tab {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  themeColor?: string;
  isReaderMode?: boolean;
}

function App() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', url: 'explore://newtab', title: 'Nouvel onglet', isLoading: false }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [urlInput, setUrlInput] = useState<string>('https://www.google.com');
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
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  const [showBookmarksBar] = useState(() => {
    return localStorage.getItem('showBookmarksBar') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('showBookmarksBar', String(showBookmarksBar));
  }, [showBookmarksBar]);
  
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
  const [searchEngine, setSearchEngine] = useState(() => {
    return localStorage.getItem('searchEngine') || 'google';
  });
  
  const [accentColor, setAccentColor] = useState('blue');
  const colors = getAccentColorClass(accentColor, theme === 'dark');

  // Language state must be declared before it is used in initial state
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const languageRef = useRef(language);
  const [isPrivate, setIsPrivate] = useState(false);
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
      togglePrivate: 'Ctrl+Shift+N',
      saveSession: 'Ctrl+Shift+S',
      restoreSession: 'Ctrl+Shift+R',
      enablePiP: 'Ctrl+Shift+P',
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
    if (!webview) return;
    webview.openDevTools();
  };

  function addTab() {
    const newId = crypto.randomUUID();
    const newTab: Tab = {
      id: newId,
      url: 'explore://newtab',
      title: languageRef.current === 'fr' ? 'Nouvel onglet' : 'New Tab',
      isLoading: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
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
          if (confirm(language === 'fr' ? `Voulez-vous vraiment bloquer ${domain} ?` : `Are you sure you want to block ${domain}?`)) {
               window.electron.blockDomain(domain);
               // Reload to apply blocking
               webview.reload();
            }
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
  const activeThemeColor = activeTab?.url === 'explore://newtab' 
    ? colors.hex 
    : activeTab?.themeColor;

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

  const addToHistory = async (url: string, title: string) => {
    // Check if url is internal
    if (url.startsWith('explore://') || isPrivate) return;
    
    const newItem = {
      id: crypto.randomUUID(),
      user_id: user?.id || 'guest',
      url,
      title,
      visited_at: new Date().toISOString()
    };
    
    setHistory(prev => [newItem, ...prev]);

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
          if (prev.length <= 1) return prev;
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
      } else if (matches(e, shortcuts.togglePrivate)) {
        e.preventDefault();
        setIsPrivate(prev => !prev);
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

  const handleWindowControl = (action: 'minimize' | 'maximize' | 'close') => {
    if (window.electron && window.electron.windowControls) {
      window.electron.windowControls[action]();
    }
  };

  const renderWindowControls = () => {
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

  return (
    <div className={clsx("flex h-screen w-full overflow-hidden transition-colors duration-1000 relative", theme === 'dark' ? "bg-[#14141d] text-white" : "bg-gray-100 text-gray-900")}>
      
      {ambientMode && activeThemeColor && (
        <>
          {/* Main Ambient Glow */}
          <div 
            className="absolute inset-0 z-0 pointer-events-none transition-all duration-1000 ease-in-out"
            style={{
              background: activeTab?.url === 'explore://newtab'
                ? `radial-gradient(circle at 50% 50%, ${activeThemeColor}2b 0%, ${activeThemeColor}0f 45%, ${activeThemeColor}05 75%, transparent 100%)`
                : `radial-gradient(circle at 50% 0%, ${activeThemeColor} 0%, ${activeThemeColor}15 35%, transparent 75%)`,
              opacity: activeTab?.url === 'explore://newtab' 
                ? (theme === 'dark' ? 0.95 : 0.75) 
                : (theme === 'dark' ? 0.5 : 0.4)
            }}
          />
          {/* Subtle Secondary Glow for Depth */}
          <div 
            className="absolute inset-0 z-0 pointer-events-none transition-all duration-1500 ease-in-out mix-blend-screen"
            style={{
              background: `radial-gradient(circle at 100% 0%, ${activeThemeColor}10 0%, transparent 50%)`,
              opacity: theme === 'dark' ? 0.3 : 0.15
            }}
          />
          {/* Bottom Bloom */}
          <div 
            className="absolute inset-0 z-0 pointer-events-none transition-all duration-1000 ease-in-out"
            style={{
              background: `linear-gradient(to top, ${activeThemeColor}05 0%, transparent 20%)`,
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
          currentTheme={theme}
          language={language}
        />
      )}
      
      {/* Sidebar (Left or Right Position) */}
      {(tabPosition === 'left' || tabPosition === 'right') && (
        <div 
          className={clsx(
            "w-20 flex flex-col transition-colors duration-1000 relative z-10",
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
          <div className="p-4 flex flex-col items-center justify-center drag-region">
            <div className="flex items-center justify-center py-4 border-b border-white/5 w-full">
              <Logo className="w-8 h-8" />
            </div>
          </div>

          <div className="px-3 pb-2">
            <button 
              onClick={addTab}
              className={clsx("w-full flex items-center justify-center gap-2 text-white py-2 rounded-xl transition-all shadow-lg font-medium", colors.bgSolid, colors.bgHover, colors.shadow)}
              title={language === 'fr' ? 'Nouvel onglet' : 'New Tab'}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <div className="text-[10px] font-bold text-gray-500 px-1 py-1 uppercase tracking-[0.2em] mb-1 text-center">
              {language === 'fr' ? 'Onglets' : 'Tabs'}
            </div>
            {tabs.map(tab => (
              <div
                key={tab.id}
                className="relative group w-full"
              >
                <div
                  onClick={() => setActiveTabId(tab.id)}
                  className={twMerge(
                    "flex items-center justify-center w-full h-10 rounded-xl cursor-pointer transition-all border border-transparent mb-1",
                    activeTabId === tab.id 
                      ? clsx(colors.bg, colors.text, colors.borderSubtle, "shadow-lg")
                      : clsx("text-gray-400 hover:bg-white/5", colors.textHover)
                  )}
                  title={tab.title}
                >
                  <div className={clsx("w-5 h-5 rounded-full flex items-center justify-center text-[10px]", activeTabId === tab.id ? clsx(colors.borderSubtle, colors.text) : "bg-white/10 text-gray-400")}>
                    {tab.isLoading ? (
                      <RotateCw className={clsx("w-3.5 h-3.5 animate-spin", activeTabId === tab.id ? colors.text : "text-gray-400")} />
                    ) : tab.url === 'explore://newtab' ? (
                       <Logo className={clsx("w-3.5 h-3.5", activeTabId === tab.id ? colors.text : "text-gray-400")} />
                    ) : (
                      <img 
                        src={getFaviconUrl(tab.url)} 
                        className="w-3.5 h-3.5 rounded-sm"
                        alt=""
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                </div>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTab(e, tab.id); }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-sm"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className={clsx("p-4 border-t flex flex-col items-center gap-2", theme === 'dark' ? "border-white/5" : "border-gray-200")}>
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors flex items-center justify-center text-gray-400 hover:text-white"
              title={user ? user.name : (language === 'fr' ? 'Connexion' : 'Sign In')}
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
                <UserIcon className="w-6 h-6" />
              )}
            </button>
            <button 
              onClick={() => updateTab(activeTabId, { url: 'explore://settings' })}
              className={clsx("w-full flex items-center justify-center p-2.5 rounded-xl transition-colors", theme === 'dark' ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-600")}
              title={language === 'fr' ? 'Paramètres' : 'Settings'}
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={clsx("flex-1 flex flex-col relative transition-colors duration-1000", 
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
              className="flex-1 flex flex-nowrap overflow-x-auto overflow-y-hidden min-w-0 no-drag gap-2 px-2 custom-scrollbar pb-1 pt-1 items-center"
            >
              {tabs.map(tab => (
                <Reorder.Item
                  key={tab.id}
                  value={tab}
                  layout
                  className={twMerge(
                    "group relative flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer transition-all border border-transparent min-w-[140px] max-w-[240px] shrink-0",
                    activeTabId === tab.id 
                      ? clsx(colors.bg, colors.text, "shadow-lg relative overflow-hidden after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5", colors.bgSolid.replace("bg-", "after:bg-"), "border-white/5")
                      : clsx("text-gray-400 hover:bg-white/10 dark:hover:bg-white/5", colors.textHover)
                  )}
                  onPointerDown={() => setActiveTabId(tab.id)}
                >
                   <div className={clsx("min-w-4 w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0", activeTabId === tab.id ? clsx(colors.borderSubtle, colors.text) : "bg-white/10 text-gray-400")}>
                    {tab.isLoading ? (
                      <RotateCw className={clsx("w-3 h-3 animate-spin", activeTabId === tab.id ? colors.text : "text-gray-400")} />
                    ) : (
                      <img 
                      src={getFaviconUrl(tab.url)} 
                      className="w-3 h-3 rounded-sm"
                      alt=""
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    )}
                  </div>
                  <span className={clsx("truncate text-sm flex-1 select-none transition-all", tabs.length > 10 && "hidden lg:block")}>{tab.title || (language === 'fr' ? 'Chargement...' : 'Loading...')}</span>
                  <button
                    onClick={(e) => closeTab(e, tab.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-all shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Reorder.Item>
              ))}
              <div className="flex items-center">
                <button onClick={addTab} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
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
            "h-12 flex items-center px-4 gap-3 border-b drag-region relative z-30 transition-colors duration-1000", 
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
          </div>

          <form onSubmit={handleNavigate} className="flex-1 max-w-2xl mx-auto no-drag relative z-50 px-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className={clsx("w-4 h-4 text-gray-500 transition-colors", `group-focus-within:${colors.text}`)} />
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
                    "w-full border rounded-2xl py-1.5 pl-11 pr-32 text-sm focus:outline-none focus:ring-2 transition-all shadow-sm",
                    colors.ring,
                    ambientMode && activeThemeColor
                      ? (theme === 'dark' ? "bg-black/20 border-white/5 text-gray-200 placeholder-gray-600" : "bg-white/40 border-black/5 text-gray-800 placeholder-gray-400")
                      : (theme === 'dark' ? "bg-[#181825] border-white/5 text-gray-200 placeholder-gray-600 shadow-inner" : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400")
                  )}
                placeholder={language === 'fr' ? "Rechercher ou entrer une URL" : "Search or enter URL"}
              />
               <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                 {/* Ad Blocker Menu Indicator */}
                 <div className="relative flex items-center">
                   <button 
                    type="button"
                    onClick={() => setShowAdBlockMenu(!showAdBlockMenu)}
                    className={clsx("flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all cursor-pointer", 
                      adBlockEnabled ? "bg-green-500/10 text-green-600 dark:text-green-500 hover:bg-green-500/20" : "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
                    )}
                    title={language === 'fr' ? 'Bloqueur de publicités' : 'Ad Blocker'}
                   >
                     <Shield className="w-4 h-4" />
                     {adBlockEnabled && blockedAdsCount > 0 && <span className="text-xs font-bold">{blockedAdsCount}</span>}
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
                 {activeTab?.url?.startsWith('http') && (
                   <button 
                    type="button"
                    onClick={enableZenMode}
                    className="p-1 hover:bg-white/10 text-gray-400 rounded transition-colors"
                    title={language === 'fr' ? 'Mode Lecture' : 'Reader Mode'}
                   >
                     <BookOpen className="w-4 h-4" />
                   </button>
                 )}
                 {activeTab?.url?.startsWith('http') && (
                   <button 
                    type="button"
                    onClick={enablePiP}
                    className="p-1 hover:bg-white/10 text-gray-400 rounded transition-colors"
                    title={language === 'fr' ? 'Lecteur Flottant (PiP)' : 'Picture in Picture'}
                   >
                     <Tv className="w-4 h-4" />
                   </button>
                 )}
                 {activeTab?.url?.startsWith('http') && (
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
                   <button 
                    type="button"
                    onClick={openDevTools}
                    className="p-1 hover:bg-white/10 text-gray-400 rounded transition-colors"
                    title={language === 'fr' ? 'Inspecter la page' : 'Developer Tools'}
                   >
                     <Terminal className="w-4 h-4" />
                   </button>
                 )}
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
                "absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl border overflow-hidden z-50",
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

          <div className="flex items-center gap-1 no-drag">
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
              className={clsx("p-1.5 hover:bg-white/10 rounded-lg transition-colors", activeTab?.url === 'explore://bookmarks' ? clsx(colors.text, "bg-white/10") : "text-gray-400")}
              onClick={() => { 
                updateTab(activeTabId, { url: 'explore://bookmarks' }); 
                 
                
              }}
            >
              <Book className="w-4 h-4" />
            </button>
             <button 
              className={clsx("p-1.5 hover:bg-white/10 rounded-lg transition-colors", activeTab?.url === 'explore://history' ? clsx(colors.text, "bg-white/10") : "text-gray-400")}
              onClick={() => { 
                updateTab(activeTabId, { url: 'explore://history' }); 
                 
                
              }}
            >
              <div className="w-4 h-4 flex items-center justify-center font-bold text-xs">H</div>
            </button>
             <button 
              className={clsx("p-1.5 hover:bg-white/10 rounded-lg transition-colors", showPasswordManager ? clsx(colors.text, "bg-white/10") : "text-gray-400")}
              onClick={() => { 
                setShowPasswordManager(true);
                setShowHistory(false); 
                setShowBookmarks(false); 
                setIsDownloadsOpen(false);
              }}
              title={language === 'fr' ? 'Mots de passe' : 'Passwords'}
            >
              <Key className="w-4 h-4" />
            </button>
             <button 
              className={clsx("p-1.5 hover:bg-white/10 rounded-lg transition-colors", showVPN ? clsx(colors.text, "bg-white/10") : "text-gray-400")}
              onClick={() => { 
                setShowVPN(true);
                setShowHistory(false); 
                setShowBookmarks(false); 
                setIsDownloadsOpen(false);
              }}
              title={language === 'fr' ? 'VPN' : 'VPN'}
            >
              <Globe className="w-4 h-4" />
            </button>
          </div>
          
          {/* Window Controls for Left/Right Tab Position */}
          {(tabPosition === 'left' || tabPosition === 'right') && (
             <div className="flex items-center no-drag ml-auto">
                {renderWindowControls()}
             </div>
          )}

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
              className="flex-1 flex flex-nowrap overflow-x-auto overflow-y-hidden min-w-0 no-drag gap-2 px-2 custom-scrollbar pb-1 pt-1 items-center"
            >
              {tabs.map(tab => (
                <Reorder.Item
                  key={tab.id}
                  value={tab}
                  layout
                  className={twMerge(
                    "group relative flex items-center gap-2 px-3 py-1.5 rounded-2xl cursor-pointer transition-all border border-transparent min-w-[140px] max-w-[240px] shrink-0",
                    activeTabId === tab.id 
                      ? clsx(colors.bg, colors.text, "shadow-lg relative overflow-hidden after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5", colors.bgSolid.replace("bg-", "after:bg-"), "border-white/5")
                      : clsx("text-gray-400 hover:bg-white/10 dark:hover:bg-white/5", colors.textHover)
                  )}
                  onPointerDown={() => setActiveTabId(tab.id)}
                >
                   <div className={clsx("min-w-4 w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0", activeTabId === tab.id ? clsx(colors.borderSubtle, colors.text) : "bg-white/10 text-gray-400")}>
                    {tab.isLoading ? (
                      <RotateCw className={clsx("w-3 h-3 animate-spin", activeTabId === tab.id ? colors.text : "text-gray-400")} />
                    ) : tab.url === 'explore://newtab' ? (
                       <Logo className={clsx("w-3 h-3", activeTabId === tab.id ? colors.text : "text-gray-400")} />
                    ) : (
                      <img 
                      src={getFaviconUrl(tab.url)} 
                      className="w-3 h-3 rounded-sm"
                      alt=""
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    )}
                  </div>
                  <span className={clsx("truncate text-sm flex-1 select-none transition-all", tabs.length > 10 && "hidden lg:block")}>{tab.title || (language === 'fr' ? 'Chargement...' : 'Loading...')}</span>
                  <button
                    onClick={(e) => closeTab(e, tab.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-all shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Reorder.Item>
              ))}
              <div className="flex items-center">
                <button onClick={addTab} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
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
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={clsx(
              "absolute inset-0 w-full h-full",
              activeTabId === tab.id ? "z-10" : "z-0 invisible"
            )}
          >
            {tab.url.startsWith('explore://') ? (
              <div className={clsx("w-full h-full transition-colors duration-1000", 
                 (ambientMode && activeThemeColor) ? "bg-transparent" : (theme === 'dark' ? "bg-[#1e1e2e]" : "bg-white")
              )}>
                {tab.url === 'explore://newtab' && (
                  <NewTabPage 
                    theme={theme} 
                    accentColor={accentColor}
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
                  />
                )}
                {tab.url === 'explore://settings' && (
                  <div className="w-full h-full overflow-y-auto bg-transparent p-12">
                     <SettingsModal 
                        isOpen={true}
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
                        onClearData={deleteHistory}
                        ambientMode={ambientMode}
                        setAmbientMode={setAmbientMode}
                     />
                  </div>
                )}
                {tab.url === 'explore://history' && (
                   <div className="w-full h-full overflow-y-auto bg-transparent p-12 max-w-4xl mx-auto">
                      <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                         <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center", colors.bgSolid, "text-white")}>H</div>
                         {language === 'fr' ? 'Historique' : 'History'}
                      </h2>
                      <div className="grid gap-3">
                         {history.map(item => (
                            <div 
                               key={item.id}
                               onClick={() => updateTab(tab.id, { url: item.url })}
                               className={clsx(
                                  "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group",
                                  theme === 'dark' ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-gray-100 hover:bg-gray-50 shadow-sm"
                               )}
                            >
                               <div className="flex items-center gap-4 min-w-0">
                                  <img src={getFaviconUrl(item.url)} className="w-5 h-5 shrink-0" alt="" />
                                  <div className="min-w-0">
                                     <div className="font-bold truncate">{item.title}</div>
                                     <div className="text-xs opacity-50 truncate">{item.url}</div>
                                  </div>
                               </div>
                               <div className="text-xs opacity-40 shrink-0">{new Date(item.visited_at).toLocaleString()}</div>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
                {tab.url === 'explore://bookmarks' && (
                   <div className="w-full h-full overflow-y-auto bg-transparent p-12 max-w-6xl mx-auto">
                      <div className="flex items-center justify-between mb-8">
                         <h2 className="text-3xl font-bold flex items-center gap-3">
                            <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg", colors.bgSolid, "text-white")}>
                               <Star className="w-6 h-6 fill-current" />
                            </div>
                            {language === 'fr' ? 'Favoris' : 'Bookmarks'}
                         </h2>
                         <button 
                            onClick={createFolder}
                            className={clsx("px-4 py-2 rounded-xl text-white font-medium transition-all hover:scale-105 active:scale-95 shadow-md", colors.bgSolid)}
                         >
                            {language === 'fr' ? '+ Nouveau dossier' : '+ New Folder'}
                         </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                         {bookmarks.map(bookmark => (
                            <div 
                               key={bookmark.id}
                               onClick={() => bookmark.url && updateTab(tab.id, { url: bookmark.url })}
                               className={clsx(
                                  "group relative aspect-4/3 rounded-3xl border overflow-hidden transition-all cursor-pointer hover:shadow-2xl hover:-translate-y-1",
                                  theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"
                               )}
                            >
                               <div className={clsx("absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity", colors.bgSolid)} />
                               <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                  <div className="flex justify-between items-start">
                                     <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center shadow-md", theme === 'dark' ? "bg-white/10" : "bg-gray-100")}>
                                        {bookmark.type === 'folder' ? (
                                           <div className="text-2xl">📁</div>
                                        ) : (
                                           <img src={getFaviconUrl(bookmark.url)} className="w-6 h-6" alt="" />
                                        )}
                                     </div>
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); confirmDeleteBookmark(bookmark.id); }}
                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                     >
                                        <Trash2 className="w-4 h-4" />
                                     </button>
                                  </div>
                                  <div>
                                     <div className="font-bold text-lg leading-tight mb-1 truncate">{bookmark.title}</div>
                                     <div className="text-xs opacity-50 truncate">{bookmark.url || (language === 'fr' ? 'Dossier' : 'Folder')}</div>
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
              </div>
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
                        addToHistory(el.getURL(), el.getTitle());
                      });
                      el.addEventListener('did-finish-load', () => {
                        updateTab(tab.id, { isLoading: false, title: el.getTitle(), canGoBack: el.canGoBack(), canGoForward: el.canGoForward() });
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

                        // Ambient Theme Color Extraction
                        el.executeJavaScript(`
                          (function() {
                            // 1. Try meta theme-color
                            const meta = document.querySelector('meta[name="theme-color"]');
                            if (meta && meta.content) return meta.content;

                            // 2. Try OpenGraph / Twitter meta colors
                            const ogColor = document.querySelector('meta[property="og:color"]');
                            if (ogColor && ogColor.content) return ogColor.content;

                            const appleColor = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
                            if (appleColor && appleColor.content && appleColor.content.startsWith('#')) return appleColor.content;

                            // 3. Try to find dominant color of the body or a large header
                            const getElementColor = (el) => {
                               if (!el) return null;
                               const bg = window.getComputedStyle(el).backgroundColor;
                               if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== 'rgb(255, 255, 255)') {
                                  return bg;
                               }
                               return null;
                            };

                            const bodyColor = getElementColor(document.body);
                            if (bodyColor) return bodyColor;

                            const header = document.querySelector('header') || document.querySelector('nav') || document.querySelector('#header') || document.querySelector('#masthead-container');
                            const headerColor = getElementColor(header);
                            if (headerColor) return headerColor;

                            // 5. Special check for YouTube
                            if (window.location.hostname.includes('youtube.com')) {
                               const ytHeader = document.querySelector('ytd-masthead');
                               if (ytHeader) return getComputedStyle(ytHeader).backgroundColor;
                            }

                            return null;
                          })();
                        `).then((color) => {
                          if (color && typeof color === 'string') {
                            // Convert non-hex colors to hex if possible
                            if (color.startsWith('rgb')) {
                               const rgbMatch = color.match(/^rgb(?:a)?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*[\\d.]+)?\\)$/);
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
                      });
                        el.addEventListener('new-window', (e) => {
                          const event = e as Event & { url: string };
                          const newTabId = Date.now().toString();
                          const newTab: Tab = { 
                            id: newTabId, 
                            url: event.url, 
                            title: languageRef.current === 'fr' ? 'Nouvel onglet' : 'New Tab', 
                            isLoading: true 
                          };
                          setTabs(prev => [...prev, newTab]);
                          setActiveTabId(newTabId);
                        });
                      el.dataset.listenersAttached = 'true';
                    }
                  }
                }}
                className={clsx("w-full h-full bg-transparent")}
                allowpopups={true}
                partition={isPrivate ? "private" : "persist:explore"}
                webpreferences="contextIsolation=true, nodeIntegration=false"
              />
            )}
          </div>
        ))}
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
        shortcuts={shortcuts}
        setShortcuts={setShortcuts}
        onImportBookmarks={handleImportBookmarks}
        ambientMode={ambientMode}
        setAmbientMode={setAmbientMode}
        onClearData={() => {
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
            }
          });
        }}
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
    </div>
  );
}

export default App;
