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
  Book,
  Minus,
  Square,
  Trash2,
  Shield,
  FolderPlus,
  User as UserIcon
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Reorder } from 'framer-motion';
import { Logo } from './components/Logo';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmModal } from './components/ConfirmModal';

import { AuthModal } from './components/AuthModal';
import type { User } from './components/AuthModal';

import { BookmarkList } from './components/BookmarkList';

import { supabase } from './lib/supabase';
import type { HistoryItem, Bookmark } from './types';
import { Onboarding } from './components/Onboarding';
import { NewTabPage } from './components/NewTabPage';
import { DownloadsPopup } from './components/DownloadsPopup';
import type { DownloadItem } from './components/DownloadsPopup';
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
}

function App() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', url: 'explore://newtab', title: 'Nouvel onglet', isLoading: false }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [urlInput, setUrlInput] = useState<string>('https://www.google.com');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tabPosition, setTabPosition] = useState<'left' | 'top' | 'bottom' | 'right'>('left');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboardingCompleted');
  });
  const [searchEngine, setSearchEngine] = useState(() => {
    return localStorage.getItem('searchEngine') || 'google';
  });
  
  const [accentColor, setAccentColor] = useState('blue');
  const colors = getAccentColorClass(accentColor, theme === 'dark');

  // Language state must be declared before it is used in initial state
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const languageRef = useRef(language);

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

  const getSearchUrl = (query: string) => {
    if (query.includes('.') && !query.includes(' ')) {
      return query.startsWith('http') ? query : 'https://' + query;
    }
    
    const engines: { [key: string]: string } = {
      google: 'https://www.google.com/search?q=',
      bing: 'https://www.bing.com/search?q=',
      duckduckgo: 'https://duckduckgo.com/?q=',
      ecosia: 'https://www.ecosia.org/search?q='
    };

    const baseUrl = engines[searchEngine.toLowerCase()] || engines.google;
    const finalUrl = `${baseUrl}${encodeURIComponent(query)}`;
    console.log('Generated search URL:', finalUrl, 'for engine:', searchEngine);
    return finalUrl;
  };

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
    
    // Handle new tab requests from main process (e.g., context menu)
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
    
    // Check if onAdBlocked is available (it might be added recently)
    if (window.electron.onAdBlocked) {
      window.electron.onAdBlocked(handleAdBlocked);
    }

    // Listen for deep links (Google Auth)
    if (window.electron.onDeepLink) {
      window.electron.onDeepLink((url: string) => {
        console.log('Received deep link:', url);
        // Extract tokens from URL
        // Supabase URL format: explore://auth/callback#access_token=...&refresh_token=...&...
        try {
          const urlObj = new URL(url);
          // The hash might contain the tokens
          const hash = urlObj.hash.substring(1); // remove #
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            }).then(({ data, error }) => {
              if (error) {
                console.error('Error setting session:', error);
              } else {
                console.log('Session set successfully');
                setIsAuthModalOpen(false);
                // Force user update
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
              }
            });
          }
        } catch (e) {
          console.error('Error parsing deep link:', e);
        }
      });
    }

    return () => {
      window.electron.offDownloadUpdated();
      window.electron.offDownloadDone();
      window.electron.offNewTab();
      if (window.electron.offAdBlocked) {
        window.electron.offAdBlocked();
      }
      if (window.electron.offContextMenuRequest) {
        window.electron.offContextMenuRequest();
      }
      if (window.electron.offDeepLink) {
        window.electron.offDeepLink();
      }
    };
  }, []);

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
        // This requires main process handling usually, but we can try downloading it
        if (params?.url) {
           const link = document.createElement('a');
           link.href = params.url;
           link.download = '';
           document.body.appendChild(link);
           link.click();
           document.body.removeChild(link);
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

  useEffect(() => {
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
    if (url.startsWith('explore://')) return;
    
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

  const addTab = () => {
    const newId = crypto.randomUUID();
    const newTab: Tab = {
      id: newId,
      url: 'explore://newtab',
      title: language === 'fr' ? 'Nouvel onglet' : 'New Tab',
      isLoading: false
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Don't close last tab
    
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Function to fetch suggestions
  const fetchSuggestions = async (query: string) => {
    if (!query || query.startsWith('http') || query.startsWith('explore://')) {
      setSuggestions([]);
      return;
    }
    
    if (window.electron?.getSearchSuggestions) {
      try {
        const results = await window.electron.getSearchSuggestions(query);
        console.log('Search suggestions:', results);
        setSuggestions(results);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      }
    } else {
      try {
        // Fallback for browser dev mode (might fail due to CORS)
        const response = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setSuggestions(data[1] || []);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (urlInput.trim()) fetchSuggestions(urlInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [urlInput]);

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

    if (!url.startsWith('http') && !url.startsWith('explore://')) {
       url = getSearchUrl(url);
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

  const updateTab = (id: string, updates: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
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

  return (
    <div className={clsx("flex h-screen w-full overflow-hidden transition-colors duration-300", theme === 'dark' ? "bg-[#1e1e2e] text-white" : "bg-gray-100 text-gray-900")}>
      
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
        <div className={clsx(
          "w-44 flex flex-col transition-colors duration-300",
          theme === 'dark' ? "bg-[#181825] border-white/10" : "bg-white border-gray-200",
          tabPosition === 'left' ? "border-r order-first" : "border-l order-last"
        )}>
          <div className="p-4 flex items-center justify-between drag-region">
            <div className={clsx("flex items-center gap-2 font-bold text-lg", colors.text)}>
              <Logo className="w-6 h-6" />
              <span>Explore</span>
            </div>
            <div className="flex items-center gap-1 no-drag">
               <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                {user ? (
                  <img 
                    src={user.avatar} 
                    className="w-5 h-5 rounded-full bg-white/10" 
                    alt="" 
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                    }}
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="px-3 pb-2">
            <button 
              onClick={addTab}
              className={clsx("w-full flex items-center justify-center gap-2 text-white py-2 rounded-lg transition-all shadow-lg font-medium text-sm", colors.bgSolid, colors.bgHover, colors.shadow)}
            >
              <Plus className="w-4 h-4" />
                {language === 'fr' ? 'Nouvel onglet' : 'New Tab'}
              </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            <div className="text-xs font-semibold text-gray-500 px-2 py-1 uppercase tracking-wider">
              {language === 'fr' ? 'Onglets ouverts' : 'Open Tabs'}
            </div>
            {tabs.map(tab => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={twMerge(
                  "group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all border border-transparent",
                  activeTabId === tab.id 
                    ? clsx(colors.bg, colors.text, colors.borderSubtle, "shadow-sm")
                    : clsx("text-gray-400 hover:bg-white/5", colors.textHover)
                )}
              >
                <div className={clsx("min-w-4 w-4 h-4 rounded-full flex items-center justify-center text-[10px]", activeTabId === tab.id ? clsx(colors.borderSubtle, colors.text) : "bg-white/10 text-gray-400")}>
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
                <span className="truncate text-sm flex-1">{tab.title || (language === 'fr' ? 'Chargement...' : 'Loading...')}</span>
                <button
                  onClick={(e) => closeTab(e, tab.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded-md transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className={clsx("p-4 border-t", theme === 'dark' ? "border-white/5" : "border-gray-200")}>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className={clsx("w-full flex items-center justify-center gap-2 p-2 rounded-lg transition-colors", theme === 'dark' ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-600")}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">{language === 'fr' ? 'Paramètres' : 'Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={clsx("flex-1 flex flex-col relative transition-colors duration-300", theme === 'dark' ? "bg-[#1e1e2e]" : "bg-white")}>
        
        {/* Window Controls for Bottom Tab Position */}
        {tabPosition === 'bottom' && (
          <div className="absolute top-0 right-0 p-2 z-50 flex items-center gap-1 no-drag">
            <button onClick={() => handleWindowControl('minimize')} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 bg-black/20 backdrop-blur-sm">
              <Minus className="w-4 h-4" />
            </button>
            <button onClick={() => handleWindowControl('maximize')} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 bg-black/20 backdrop-blur-sm">
              <Square className="w-3 h-3" />
            </button>
            <button onClick={() => handleWindowControl('close')} className="p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded-lg text-gray-400 bg-black/20 backdrop-blur-sm">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Bar (if tabPosition is top) */}
        {tabPosition === 'top' && (
          <div className={clsx("flex items-center gap-2 px-2 pt-2 pb-2 mb-2 drag-region", theme === 'dark' ? "bg-[#181825]" : "bg-white")}>
            <div className={clsx("flex items-center gap-2 px-4 font-bold text-lg no-drag", colors.text)}>
              <Logo className="w-6 h-6" />
            </div>
            <Reorder.Group 
              axis="x" 
              values={tabs} 
              onReorder={setTabs} 
              className="flex-1 flex overflow-x-auto no-drag gap-1 custom-scrollbar"
            >
              {tabs.map(tab => (
                <Reorder.Item
                  key={tab.id}
                  value={tab}
                  layout
                  className={twMerge(
                    "group flex items-center gap-2 px-3 py-2 rounded-t-2xl hover:rounded-t-3xl cursor-pointer transition-all border-t border-x min-w-[32px] max-w-[200px] flex-1",
                    activeTabId === tab.id 
                      ? clsx(colors.bg, colors.text, colors.borderSubtle, "shadow-sm")
                      : clsx("text-gray-400 hover:bg-white/5", colors.textHover)
                  )}
                  onPointerDown={() => setActiveTabId(tab.id)}
                >
                   <div className={clsx("min-w-4 w-4 h-4 rounded-full flex items-center justify-center text-[10px]", activeTabId === tab.id ? clsx(colors.borderSubtle, colors.text) : "bg-white/10 text-gray-400")}>
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
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded-md transition-all"
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
             <div className="flex items-center gap-1 no-drag px-2 pl-4 border-l border-white/5">
                {/* Window Controls */}
                <button onClick={() => handleWindowControl('minimize')} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400">
                  <Minus className="w-4 h-4" />
                </button>
                <button onClick={() => handleWindowControl('maximize')} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400">
                  <Square className="w-3 h-3" />
                </button>
                <button onClick={() => handleWindowControl('close')} className="p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded-lg text-gray-400">
                  <X className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-4 bg-white/10 mx-1" />

                {/* Profile / Settings */}
                <button 
                  onClick={() => setIsSettingsOpen(true)}
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
        <div className={clsx("h-12 flex items-center px-2 gap-2 border-b drag-region", theme === 'dark' ? "bg-[#1e1e2e] border-white/5" : "bg-white border-gray-200", tabPosition === 'bottom' && "order-last border-t border-b-0")}>
          
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

          <form onSubmit={handleNavigate} className="flex-1 max-w-3xl mx-auto no-drag relative z-50">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
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
                className={clsx(
                    "w-full border rounded-xl py-1.5 pl-10 pr-24 text-sm focus:outline-none focus:ring-2 transition-all shadow-sm",
                    colors.ring,
                    theme === 'dark' 
                      ? "bg-[#181825] border-white/5 text-gray-200 placeholder-gray-600" 
                      : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"
                  )}
                placeholder={language === 'fr' ? "Rechercher ou entrer une URL" : "Search or enter URL"}
              />
               <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                 {/* Ad Blocker Indicator */}
                 <div 
                  className={clsx("flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-help", 
                    colors.bg, colors.text
                  )}
                  title={language === 'fr' ? `${blockedAdsCount} publicités bloquées` : `${blockedAdsCount} ads blocked`}
                 >
                   <Shield className="w-3.5 h-3.5" />
                   <span className="text-xs font-medium">{blockedAdsCount}</span>
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
              className={clsx("p-1.5 hover:bg-white/10 rounded-lg transition-colors", showBookmarks ? clsx(colors.text, "bg-white/10") : "text-gray-400")}
              onClick={() => { 
                setShowBookmarks(!showBookmarks); 
                setShowHistory(false); 
                setIsDownloadsOpen(false);
              }}
            >
              <Book className="w-4 h-4" />
            </button>
             <button 
              className={clsx("p-1.5 hover:bg-white/10 rounded-lg transition-colors", showHistory ? clsx(colors.text, "bg-white/10") : "text-gray-400")}
              onClick={() => { 
                setShowHistory(!showHistory); 
                setShowBookmarks(false); 
                setIsDownloadsOpen(false);
              }}
            >
              <div className="w-4 h-4 flex items-center justify-center font-bold text-xs">H</div>
            </button>
          </div>
          
          {/* Window Controls for Left/Right Tab Position */}
          {(tabPosition === 'left' || tabPosition === 'right') && (
             <div className="flex items-center gap-1 no-drag ml-2 pl-2 border-l border-white/10">
                <button onClick={() => handleWindowControl('minimize')} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400">
                  <Minus className="w-4 h-4" />
                </button>
                <button onClick={() => handleWindowControl('maximize')} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400">
                  <Square className="w-3 h-3" />
                </button>
                <button onClick={() => handleWindowControl('close')} className="p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded-lg text-gray-400">
                  <X className="w-4 h-4" />
                </button>
             </div>
          )}

        </div>

        {/* Bottom Bar (if tabPosition is bottom) */}
        {tabPosition === 'bottom' && (
          <div className={clsx("flex items-center gap-2 px-2 pb-2 order-last border-t drag-region", theme === 'dark' ? "bg-[#181825] border-white/5" : "bg-gray-100 border-gray-200")}>
            <div className={clsx("flex items-center gap-2 px-4 font-bold text-lg no-drag", colors.text)}>
              <Logo className="w-6 h-6" />
            </div>
            <Reorder.Group 
              axis="x" 
              values={tabs} 
              onReorder={setTabs} 
              className="flex-1 flex overflow-x-auto no-drag gap-1 custom-scrollbar"
            >
              {tabs.map(tab => (
                <Reorder.Item
                  key={tab.id}
                  value={tab}
                  className={twMerge(
                    "group flex items-center gap-2 px-3 py-2 rounded-b-lg cursor-pointer transition-all border-b border-x min-w-[150px] max-w-[200px]",
                    activeTabId === tab.id 
                      ? clsx(colors.bg, colors.text, colors.borderSubtle, "shadow-sm")
                      : clsx("text-gray-400 hover:bg-white/5", colors.textHover)
                  )}
                  onPointerDown={() => setActiveTabId(tab.id)}
                >
                   <div className={clsx("min-w-4 w-4 h-4 rounded-full flex items-center justify-center text-[10px]", activeTabId === tab.id ? clsx(colors.bg, colors.text) : "bg-white/10 text-gray-400")}>
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
                  <span className="truncate text-sm flex-1 select-none">{tab.title || (language === 'fr' ? 'Chargement...' : 'Loading...')}</span>
                  <button
                    onClick={(e) => closeTab(e, tab.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/20 rounded-md transition-all"
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
             <div className="flex items-center gap-1 no-drag px-2">
               {/* Profile Button in Bottom Bar */}
               <button 
                onClick={() => setIsAuthModalOpen(true)}
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
                        onOpen={(url) => {
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

      <div className="flex-1 relative bg-white dark:bg-[#1e1e2e]">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={clsx(
              "absolute inset-0 w-full h-full",
              activeTabId === tab.id ? "z-10" : "z-0 invisible"
            )}
          >
            {tab.url.startsWith('explore://') ? (
              <div className={clsx("w-full h-full", theme === 'dark' ? "bg-[#1e1e2e]" : "bg-white")}>
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
                      setShowSuggestions(true);
                      setSelectedSuggestionIndex(-1);
                    }}
                    suggestions={suggestions}
                    language={language}
                  />
                )}
              </div>
            ) : (
              <webview
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
                src={tab.url}
                className={clsx("w-full h-full bg-transparent")}
                allowpopups
                webpreferences="contextIsolation=true, nodeIntegration=false"
              />
            )}
          </div>
        ))}
      </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={(u) => setUser(u)}
        onLogout={handleLogout}
        user={user}
        language={language}
        theme={theme}
        accentColor={accentColor}
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
        onImportBookmarks={handleImportBookmarks}
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
    </div>
  );
}

export default App;
