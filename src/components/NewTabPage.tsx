import React, { useState, useEffect, useRef } from 'react';
import { Logo } from './Logo';
import { IncognitoIcon } from './IncognitoIcon';
import { Search, Plus, X, Shield, Star, Folder, FolderOpen, ChevronRight, CloudRain, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

import { getAccentColorClass } from '../lib/theme';
import type { Bookmark } from '../types';

interface BookmarkTreeItemProps {
  item: Bookmark;
  bookmarks: Bookmark[];
  expandedFolders: Record<string, boolean>;
  toggleFolder: (id: string) => void;
  onOpen: (url: string) => void;
  depth: number;
  theme: 'dark' | 'light' | 'system';
}

function BookmarkTreeItem({ 
  item, 
  bookmarks, 
  expandedFolders, 
  toggleFolder, 
  onOpen, 
  depth, 
  theme 
}: BookmarkTreeItemProps) {
  const isFolder = item.type === 'folder';
  const isExpanded = expandedFolders[item.id] || false;
  const children = bookmarks.filter(b => b.parent_id === item.id);

  if (isFolder) {
    return (
      <div className="w-full select-none">
        <button
          onClick={() => toggleFolder(item.id)}
          className={clsx(
            "w-full flex items-center gap-2 py-1.5 px-2 rounded-xl transition-all duration-200 text-left group",
            theme === 'dark' 
              ? "hover:bg-white/5 text-gray-400 hover:text-white" 
              : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <ChevronRight 
            className={clsx(
              "w-3.5 h-3.5 transition-transform duration-200 shrink-0", 
              isExpanded && "rotate-90 text-blue-500"
            )} 
          />
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-500 fill-yellow-500/20 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-500 fill-yellow-500/20 shrink-0" />
          )}
          <span className="font-semibold text-xs tracking-wide truncate uppercase flex-1 pl-1">
            {item.title}
          </span>
          <span className="text-[10px] opacity-40 group-hover:opacity-75 transition-opacity pr-1">
            ({children.length})
          </span>
        </button>

        {isExpanded && children.length > 0 && (
          <div className="relative">
            <div 
              className={clsx(
                "absolute top-0 bottom-0 w-px transition-colors left-4",
                theme === 'dark' ? "bg-white/10" : "bg-gray-200"
              )}
              style={{ left: `${depth * 12 + 15}px` }}
            />
            <div className="space-y-0.5 mt-0.5">
              {children.map(child => (
                <BookmarkTreeItem
                  key={child.id}
                  item={child}
                  bookmarks={bookmarks}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                  onOpen={onOpen}
                  depth={depth + 1}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        )}
        {isExpanded && children.length === 0 && (
          <div 
            className={clsx(
              "text-[11px] italic py-1 opacity-55",
              theme === 'dark' ? "text-gray-500" : "text-gray-400"
            )}
            style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}
          >
            Dossier vide
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onOpen(item.url)}
      className={clsx(
        "w-full flex items-center gap-2.5 py-1.5 px-3 rounded-xl transition-all duration-200 text-left group",
        theme === 'dark' 
          ? "hover:bg-[#1e1e2e] text-gray-300 hover:text-white" 
          : "hover:bg-gray-50 text-gray-600 hover:text-gray-900 shadow-xs"
      )}
      style={{ paddingLeft: `${depth * 12 + 22}px` }}
    >
      <div className={clsx(
        "w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold overflow-hidden shadow-xs",
        theme === 'dark' ? "bg-white/5 border border-white/5" : "bg-white border border-gray-100"
      )}>
        <img 
          src={`https://www.google.com/s2/favicons?domain=${item.url}&sz=32`} 
          className="w-3.5 h-3.5"
          alt=""
          onError={(e) => { 
            e.currentTarget.style.display = 'none'; 
            e.currentTarget.parentElement!.innerText = item.title.charAt(0).toUpperCase();
          }} 
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate leading-normal">{item.title}</div>
        <div className="text-[9px] opacity-40 truncate leading-none mt-0.5">{item.url}</div>
      </div>
    </button>
  );
}

interface NewTabPageProps {
  onSearch: (query: string) => void;
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  language: 'fr' | 'en';
  onQueryChange?: (query: string) => void;
  suggestions?: string[];
  blockedAdsCount?: number;
  adBlockEnabled?: boolean;
  bookmarks?: Bookmark[];
  isPrivate?: boolean;
}

interface QuickLink {
  id: string;
  title: string;
  url: string;
}

export function NewTabPage({ onSearch, theme, accentColor, language, onQueryChange, suggestions = [], blockedAdsCount = 0, adBlockEnabled = false, bookmarks = [], isPrivate = false }: NewTabPageProps) {
  const colors = getAccentColorClass(accentColor, theme === 'dark');
  const [query, setQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  
  const [enabledWidgets, setEnabledWidgets] = useState<string[]>(() => {
    const saved = localStorage.getItem('explore_widgets');
    return saved ? JSON.parse(saved) : ['quicklinks', 'notes', 'adblock', 'weather'];
  });
  const [isWidgetMenuOpen, setIsWidgetMenuOpen] = useState(false);
  const [weather, setWeather] = useState<{temp: number, code: number, city: string} | null>(null);

  useEffect(() => {
    localStorage.setItem('explore_widgets', JSON.stringify(enabledWidgets));
    if (enabledWidgets.includes('weather') && !weather) {
      const loadWeather = (lat: number, lon: number, cityName: string) => {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
          .then(r => r.json())
          .then(wData => setWeather({ 
             temp: wData.current_weather.temperature, 
             code: wData.current_weather.weathercode,
             city: cityName 
          })).catch(console.error);
      };

      const fallbackToIP = () => {
        fetch('https://ipapi.co/json/')
          .then(r => {
            if (!r.ok) throw new Error('IP API limit');
            return r.json();
          })
          .then(data => {
            if (data.latitude && data.longitude) {
              loadWeather(data.latitude, data.longitude, data.city);
            } else throw new Error('Invalid IP data');
          })
          .catch(() => {
            // Default to Paris if everything fails
            loadWeather(48.8566, 2.3522, 'Paris');
          });
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            // Reverse geocode to get city name
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=fr`)
              .then(r => r.json())
              .then(data => {
                loadWeather(pos.coords.latitude, pos.coords.longitude, data.city || data.locality || 'Local');
              })
              .catch(() => {
                loadWeather(pos.coords.latitude, pos.coords.longitude, 'Local');
              });
          },
          (err) => {
            console.warn('Geolocation denied or failed, falling back to IP:', err);
            fallbackToIP();
          },
          { timeout: 5000 }
        );
      } else {
        fallbackToIP();
      }
    }
  }, [enabledWidgets, weather]);

  const toggleWidget = (id: string) => {
    setEnabledWidgets(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredBookmarks = bookmarks.filter(b => {
    if (!searchQuery.trim()) return false;
    return b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (b.url && b.url.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  const [greeting, setGreeting] = useState('');
  const [time, setTime] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Set greeting
      if (language === 'fr') {
        if (hour >= 5 && hour < 12) setGreeting('Bonjour');
        else if (hour >= 12 && hour < 18) setGreeting('Bon après-midi');
        else if (hour >= 18 && hour <= 23) setGreeting('Bonsoir');
        else setGreeting('Bonne nuit');
      } else {
        if (hour >= 5 && hour < 12) setGreeting('Good Morning');
        else if (hour >= 12 && hour < 18) setGreeting('Good Afternoon');
        else if (hour >= 18 && hour <= 23) setGreeting('Good Evening');
        else setGreeting('Good Night');
      }

      // Set time
      setTime(now.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language]);

  const [notes, setNotes] = useState(() => localStorage.getItem('explore_quick_notes') || '');

  useEffect(() => {
    localStorage.setItem('explore_quick_notes', notes);
  }, [notes]);

  const [quickLinks, setQuickLinks] = useState<QuickLink[]>(() => {
    const saved = localStorage.getItem('explore_quicklinks_v4');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'YouTube', url: 'youtube.com' },
      { id: '2', title: 'Tiktok', url: 'tiktok.com' },
      { id: '3', title: 'Netflix', url: 'netflix.com' },
      { id: '4', title: 'Anime Sama', url: 'anime-sama.pw' }
    ];
  });
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');

  useEffect(() => {
    localStorage.setItem('explore_quicklinks_v4', JSON.stringify(quickLinks));
  }, [quickLinks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
      onSearch(suggestions[selectedSuggestionIndex]);
      setShowSuggestions(false);
    } else if (query.trim()) {
      onSearch(query);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      onQueryChange?.(val);
    }, 300);

    setShowSuggestions(true);
    setSelectedSuggestionIndex(-1);
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLinkUrl && newLinkTitle) {
      setQuickLinks([...quickLinks, {
        id: crypto.randomUUID(),
        title: newLinkTitle,
        url: newLinkUrl
      }]);
      setNewLinkUrl('');
      setNewLinkTitle('');
      setIsAddingLink(false);
    }
  };

  const removeLink = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickLinks(quickLinks.filter(link => link.id !== id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={clsx(
        "flex flex-col items-center h-full w-full overflow-y-auto custom-scrollbar relative",
        theme === 'dark' ? "bg-transparent text-white" : "bg-transparent text-gray-900"
      )}
    >
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className={clsx(
          "absolute top-6 left-6 p-3 rounded-2xl border transition-all duration-300 z-40 group hover:scale-110 shadow-lg",
          theme === 'dark' 
            ? "bg-[#181825]/60 border-white/10 text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30 hover:shadow-[0_0_20px_rgba(250,204,21,0.2)]" 
            : "bg-white/60 border-gray-200 text-gray-500 hover:text-yellow-500 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-gray-200"
        )}
        title={language === 'fr' ? 'Favoris' : 'Bookmarks'}
      >
        <Star className="w-5 h-5 transition-transform group-hover:rotate-12" />
      </button>

      {/* Floating Weather Widget */}
      {enabledWidgets.includes('weather') && weather && (
        <div
          className={clsx(
            "absolute top-6 right-20 flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all duration-300 z-40 shadow-lg backdrop-blur-md cursor-default",
            theme === 'dark' 
              ? "bg-[#181825]/60 border-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
              : "bg-white/60 border-gray-200 hover:border-gray-300 hover:shadow-xl"
          )}
        >
          <CloudRain className={clsx("w-5 h-5", colors.text)} />
          <div className="flex flex-col">
            <span className={clsx("text-sm font-bold leading-none", theme === 'dark' ? "text-white" : "text-gray-900")}>
              {weather.temp}°C
            </span>
            <span className="text-[10px] font-medium text-gray-400 mt-0.5 max-w-[80px] truncate">
              {weather.city}
            </span>
          </div>
        </div>
      )}

      {/* Widget Settings Toggle */}
      <button
        onClick={() => setIsWidgetMenuOpen(true)}
        className={clsx(
          "absolute top-6 right-6 p-3 rounded-2xl border transition-all duration-300 z-40 group hover:scale-110 shadow-lg",
          theme === 'dark' 
            ? "bg-[#181825]/60 border-white/10 text-gray-400 hover:text-blue-400 hover:border-blue-400/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]" 
            : "bg-white/60 border-gray-200 text-gray-500 hover:text-blue-500 hover:border-blue-500/30 hover:shadow-lg hover:shadow-gray-200"
        )}
        title={language === 'fr' ? 'Widgets' : 'Widgets'}
      >
        <LayoutDashboard className="w-5 h-5 transition-transform group-hover:rotate-12" />
      </button>

      {/* Widget Settings Drawer */}
      <AnimatePresence>
        {isWidgetMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWidgetMenuOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs z-40"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={clsx(
                "absolute top-0 right-0 bottom-0 w-80 z-50 h-full flex flex-col border-l shadow-2xl backdrop-blur-2xl text-left",
                theme === 'dark' 
                  ? "bg-[#12121e]/85 border-white/10 text-white" 
                  : "bg-white/85 border-gray-200 text-gray-900"
              )}
            >
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm tracking-tight leading-none">
                      {language === 'fr' ? 'Personnalisation' : 'Customization'}
                    </h3>
                    <p className="text-[10px] opacity-40 mt-1 leading-none">Widgets & Layout</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsWidgetMenuOpen(false)}
                  className={clsx("p-1.5 rounded-lg transition-colors", theme === 'dark' ? "hover:bg-white/10" : "hover:bg-gray-100")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { id: 'quicklinks', icon: Star, label: language === 'fr' ? 'Liens Rapides' : 'Quick Links' },
                  { id: 'notes', icon: Folder, label: language === 'fr' ? 'Bloc-Notes' : 'Notepad' },
                  { id: 'weather', icon: CloudRain, label: language === 'fr' ? 'Météo' : 'Weather' },
                  { id: 'adblock', icon: Shield, label: 'AdBlock Stats' }
                ].map(widget => (
                  <button
                    key={widget.id}
                    onClick={() => toggleWidget(widget.id)}
                    className={clsx(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                      theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <widget.icon className={clsx("w-4 h-4", enabledWidgets.includes(widget.id) ? "text-blue-500" : "text-gray-400")} />
                      <span className="text-sm font-medium">{widget.label}</span>
                    </div>
                    <div className={clsx(
                      "w-8 h-5 rounded-full relative transition-colors duration-300",
                      enabledWidgets.includes(widget.id) ? "bg-blue-500" : (theme === 'dark' ? "bg-gray-700" : "bg-gray-300")
                    )}>
                      <div className={clsx(
                        "absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform duration-300",
                        enabledWidgets.includes(widget.id) && "translate-x-3"
                      )} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Favorites Drawer & Backdrop */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Click-away backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs z-40"
            />
            
            {/* Lateral Drawer */}
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={clsx(
                "absolute top-0 left-0 bottom-0 w-80 z-50 h-full flex flex-col border-r shadow-2xl backdrop-blur-2xl text-left",
                theme === 'dark' 
                  ? "bg-[#12121e]/85 border-white/10 text-white" 
                  : "bg-white/85 border-gray-200 text-gray-900"
              )}
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm tracking-tight leading-none">
                      {language === 'fr' ? 'Volet des Favoris' : 'Favorites Sidebar'}
                    </h3>
                    <p className="text-[10px] opacity-40 mt-1 leading-none">
                      {language === 'fr' ? 'Explore Bookmarks' : 'Explore Bookmarks'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className={clsx(
                    "p-1.5 rounded-lg transition-colors",
                    theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Box */}
              <div className="p-4">
                <div className="relative group">
                  <Search className={clsx(
                    "absolute left-3.5 top-2.5 w-4 h-4 transition-colors",
                    theme === 'dark' ? "text-gray-500 group-focus-within:text-blue-400" : "text-gray-400 group-focus-within:text-blue-500"
                  )} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'fr' ? 'Rechercher un favori...' : 'Search bookmarks...'}
                    className={clsx(
                      "w-full pl-10 pr-8 py-2 text-xs rounded-xl outline-none border transition-all duration-300",
                      theme === 'dark'
                        ? "bg-[#181825] border-white/5 text-white placeholder-gray-600 focus:border-blue-500/50 focus:bg-[#1e1e2e]"
                        : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500/50 focus:bg-white"
                    )}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Favorites Tree / Search Results */}
              <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar space-y-1">
                {searchQuery.trim() ? (
                  // Search Results (Flat list)
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">
                      {language === 'fr' ? 'Résultats de recherche' : 'Search Results'}
                    </div>
                    {filteredBookmarks.length === 0 ? (
                      <div className="text-center py-8 text-xs text-gray-500 italic">
                        {language === 'fr' ? 'Aucun favori trouvé' : 'No bookmarks found'}
                      </div>
                    ) : (
                      filteredBookmarks.map(item => (
                        <BookmarkTreeItem
                          key={item.id}
                          item={item}
                          bookmarks={bookmarks}
                          expandedFolders={expandedFolders}
                          toggleFolder={toggleFolder}
                          onOpen={(url) => {
                            onSearch(url);
                            setIsDrawerOpen(false);
                          }}
                          depth={0}
                          theme={theme}
                        />
                      ))
                    )}
                  </div>
                ) : (
                  // Normal hierarchical tree
                  <div className="space-y-1">
                    {bookmarks.filter(b => b.parent_id === undefined || b.parent_id === null).length === 0 ? (
                      <div className="text-center py-12 text-xs text-gray-500 italic">
                        {language === 'fr' ? 'Aucun favori enregistré' : 'No bookmarks saved yet'}
                      </div>
                    ) : (
                      bookmarks
                        .filter(b => b.parent_id === undefined || b.parent_id === null)
                        .map(item => (
                          <BookmarkTreeItem
                            key={item.id}
                            item={item}
                            bookmarks={bookmarks}
                            expandedFolders={expandedFolders}
                            toggleFolder={toggleFolder}
                            onOpen={(url) => {
                              onSearch(url);
                              setIsDrawerOpen(false);
                            }}
                            depth={0}
                            theme={theme}
                          />
                        ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center gap-6 w-full max-w-3xl px-6 py-8 min-h-full justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            {isPrivate ? (
              <div className="relative z-10 text-gray-300 drop-shadow-[0_0_16px_rgba(255,255,255,0.1)]">
                <IncognitoIcon size="lg" animated glow />
              </div>
            ) : (
              <Logo className="w-16 h-16 relative z-10" />
            )}
          </div>
            <div className={clsx(
              "text-6xl font-extrabold tracking-tighter mb-2 bg-clip-text text-transparent pr-3 pb-1",
              isPrivate 
                ? "bg-linear-to-r from-gray-300 to-gray-500" 
                : clsx("bg-linear-to-r", colors.gradientFrom, colors.gradientTo)
            )}>
              {time}
            </div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={clsx(
                "text-3xl font-extralight tracking-tight",
                theme === 'dark' ? "text-gray-400" : "text-gray-500"
              )}
            >
              {greeting}
            </motion.h1>
        </motion.div>
        
        <motion.form 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit} 
          className="w-full relative group z-20"
        >
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className={clsx(
              "w-5 h-5 transition-colors",
              theme === 'dark' ? "text-gray-500 group-focus-within:text-white" : "text-gray-400 group-focus-within:text-gray-900"
            )} />
          </div>
          <input
            type="text"
            value={selectedSuggestionIndex >= 0 ? suggestions[selectedSuggestionIndex] : query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={language === 'fr' ? "Rechercher sur le web..." : "Search the web..."}
            className={clsx(
              "w-full py-4 pl-14 pr-6 rounded-2xl shadow-lg border outline-none text-lg transition-all duration-300",
              theme === 'dark' 
                ? "bg-[#181825] border-white/5 text-white placeholder-gray-600 focus:bg-[#1e1e2e]" 
                : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white",
              colors.focusBorder,
              colors.focusShadow,
              showSuggestions && suggestions.length > 0 && "rounded-b-none border-b-0"
            )}
            autoFocus
          />
          
          {showSuggestions && suggestions.length > 0 && (
            <div className={clsx(
              "absolute top-full left-0 right-0 rounded-b-2xl shadow-xl border border-t-0 overflow-hidden z-50",
              theme === 'dark' ? "bg-[#1e1e2e] border-white/5" : "bg-white border-gray-200"
            )}>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className={clsx(
                    "w-full text-left px-14 py-3 text-lg flex items-center gap-3 transition-colors",
                    index === selectedSuggestionIndex 
                      ? clsx(colors.bg, colors.text)
                      : theme === 'dark' ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-gray-50"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setQuery(suggestion);
                    onSearch(suggestion);
                    setShowSuggestions(false);
                  }}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </motion.form>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full max-w-2xl mx-auto mt-4"
        >
          {enabledWidgets.includes('quicklinks') && quickLinks.map((link) => (
            <div
              key={link.id}
              onClick={(e) => {
                e.preventDefault();
                onSearch(link.url);
              }}
              className={clsx(
                "group flex flex-col items-center gap-3 p-3 w-24 rounded-2xl transition-all duration-300 relative cursor-pointer hover:scale-110 hover:-translate-y-1.5 border border-transparent select-none",
                theme === 'dark' 
                  ? "hover:bg-white/5 hover:border-white/10 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)]" 
                  : "hover:bg-gray-50 hover:border-gray-200/50 hover:shadow-lg hover:shadow-gray-200/50"
              )}
            >
              <button
                onClick={(e) => removeLink(link.id, e)}
                className={clsx("absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 transition-all z-10", colors.textHover)}
              >
                <X className="w-3 h-3 pointer-events-none" />
              </button>
              <div className={clsx(
                "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300 group-hover:shadow-md",
                theme === 'dark' ? "bg-[#181825] text-white" : "bg-white text-gray-900 shadow-sm"
              )}>
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${link.url}&sz=64`}
                  alt={link.title}
                  className="w-6 h-6"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.includes('google.com')) {
                      target.src = `https://icons.duckduckgo.com/ip3/${link.url}.ico`;
                    } else {
                      target.style.display = 'none';
                      if (target.parentElement) {
                        target.parentElement.innerText = link.title[0].toUpperCase();
                      }
                    }
                  }}
                />
              </div>
              <span className={clsx(
                "text-xs font-semibold w-full text-center wrap-break-word whitespace-normal line-clamp-2 min-h-8 flex items-center justify-center px-1 transition-colors select-none", 
                theme === 'dark' ? "text-gray-400 group-hover:text-white" : "text-gray-500 group-hover:text-gray-900"
              )}>
                {link.title}
              </span>
            </div>
          ))}
          
          
          {enabledWidgets.includes('quicklinks') && (
            <button
              onClick={() => setIsAddingLink(true)}
              className={clsx(
                "flex flex-col items-center gap-3 p-3 w-24 rounded-2xl transition-all group",
                theme === 'dark' ? "hover:bg-white/5 text-gray-500 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-900",
                colors.textHover
              )}
            >
              <div className={clsx(
                "w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed transition-colors",
                theme === 'dark' ? "border-gray-700 group-hover:border-gray-500" : "border-gray-300 group-hover:border-gray-400"
              )}>
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">{language === 'fr' ? "Ajouter un raccourci" : "Add Shortcut"}</span>
            </button>
          )}
        </motion.div>

        {/* Notes Widget */}
        {enabledWidgets.includes('notes') && (
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.5 }}
           className="w-full mt-4 max-w-xl mx-auto"
        >
          <div className={clsx(
            "p-6 rounded-4xl border backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.2)] focus-within:border-white/20",
            theme === 'dark' ? "bg-[#181825]/60 border-white/10" : "bg-white/60 border-gray-200"
          )}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] pl-1">
                <span className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", theme === 'dark' ? "bg-yellow-500" : "bg-yellow-400")} />
                {language === 'fr' ? 'Notes Rapides' : 'Quick Notes'}
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'fr' ? "Écrivez quelque chose à ne pas oublier..." : "Write something to remember..."}
              className={clsx(
                "w-full h-28 bg-transparent border-none outline-none resize-none text-[16px] leading-relaxed custom-scrollbar px-1", 
                theme === 'dark' ? "placeholder-gray-600 text-gray-200" : "placeholder-gray-400 text-gray-700"
              )}
            />
          </div>
          
          {/* AdBlock Stats Badge */}
          {enabledWidgets.includes('adblock') && adBlockEnabled && blockedAdsCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 flex justify-center"
            >
              <div className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm backdrop-blur-md text-[13px] font-medium transition-colors",
                theme === 'dark' ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-700"
              )}>
                <Shield className="w-4 h-4" />
                {language === 'fr' 
                  ? `${blockedAdsCount.toLocaleString()} publicités et traqueurs bloqués` 
                  : `${blockedAdsCount.toLocaleString()} ads and trackers blocked`}
              </div>
            </motion.div>
          )}
        </motion.div>
        )}

      </div>

      <AnimatePresence>
        {isAddingLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddingLink(false)}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={clsx(
                  "relative w-full max-w-sm rounded-2xl shadow-2xl border p-6 overflow-hidden z-10",
                  theme === 'dark' ? "bg-[#1e1e2e] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
                )}
              >
              <h3 className="text-xl font-bold mb-4">{language === 'fr' ? "Ajouter un raccourci" : "Add Shortcut"}</h3>
              <form onSubmit={handleAddLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-70">{language === 'fr' ? "Titre" : "Title"}</label>
                  <input
                    type="text"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className={clsx(
                      "w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2",
                      theme === 'dark' 
                        ? "bg-[#181825] border-white/10" 
                        : "bg-gray-50 border-gray-200",
                      colors.focusBorder,
                      colors.ring
                    )}
                    placeholder={language === 'fr' ? "Mon raccourci" : "My Shortcut"}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 opacity-70">URL</label>
                  <input
                    type="text"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className={clsx(
                      "w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2",
                      theme === 'dark' 
                        ? "bg-[#181825] border-white/10" 
                        : "bg-gray-50 border-gray-200",
                      colors.focusBorder,
                      colors.ring
                    )}
                    placeholder={language === 'fr' ? "exemple.com" : "example.com"}
                    required
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddingLink(false)}
                    className={clsx(
                      "flex-1 px-4 py-2 rounded-xl font-medium transition-colors",
                      theme === 'dark' ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"
                    )}
                  >
                    {language === 'fr' ? "Annuler" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className={clsx(
                      "flex-1 px-4 py-2 rounded-xl font-medium text-white shadow-lg transition-all hover:scale-105 active:scale-95",
                      colors.bgSolid,
                      colors.shadow
                    )}
                  >
                    {language === 'fr' ? "Ajouter" : "Add"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
