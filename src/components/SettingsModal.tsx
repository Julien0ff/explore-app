import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Layout, RefreshCw, Send, Globe, Palette, Keyboard, Shield, Accessibility, Info, 
  Check, Sparkles, Sliders, Chrome
} from 'lucide-react';
import { clsx } from 'clsx';

import { getAccentColorClass } from '../lib/theme';
import { Logo } from './Logo';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFullPage?: boolean;
  tabPosition: 'top' | 'left' | 'bottom' | 'right';
  setTabPosition: (pos: 'top' | 'left' | 'bottom' | 'right') => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  searchEngine: string;
  setSearchEngine: (engine: string) => void;
  language: 'fr' | 'en';
  setLanguage: (lang: 'fr' | 'en') => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  shortcuts: { 
    newTab: string; closeTab: string; focusUrl: string; reloadTab: string;
    togglePrivate: string; saveSession: string; restoreSession: string; enablePiP: string
  };
  setShortcuts: (s: { 
    newTab: string; closeTab: string; focusUrl: string; reloadTab: string;
    togglePrivate: string; saveSession: string; restoreSession: string; enablePiP: string
  }) => void;
  onOpenUrl: (url: string) => void;
  onImportBookmarks: () => void;
  onClearData: () => void;
  ambientMode: boolean;
  setAmbientMode: (val: boolean) => void;
  checkForUpdates?: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  isFullPage = false,
  tabPosition,
  setTabPosition,
  theme,
  setTheme,
  searchEngine,
  setSearchEngine,
  language,
  setLanguage,
  accentColor,
  setAccentColor,
  shortcuts,
  setShortcuts,
  onOpenUrl,
  onImportBookmarks,
  onClearData,
  ambientMode,
  setAmbientMode,
  checkForUpdates
}: SettingsModalProps) {
  const colors = getAccentColorClass(accentColor, theme === 'dark');
  const [suggestion, setSuggestion] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [suggestionStatus, setSuggestionStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [localShortcuts, setLocalShortcuts] = React.useState(shortcuts);
  const [updateProgress, setUpdateProgress] = React.useState(0);
  const [appVersion, setAppVersion] = React.useState('1.6.1');
  const [adBlockEnabled, setAdBlockEnabled] = React.useState(true);
  
  // Accessibility state
  const [fontSize, setFontSize] = React.useState(() => {
    return localStorage.getItem('explore-font-size') || '100';
  });
  const [readerModeDefault, setReaderModeDefault] = React.useState(() => {
    return localStorage.getItem('explore-reader-mode-default') === 'true';
  });

  // Active Category for Sidebar layout
  const [activeCategory, setActiveCategory] = React.useState<'general' | 'appearance' | 'shortcuts' | 'privacy' | 'accessibility' | 'about'>('general');

  // Custom Toast state
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  React.useEffect(() => {
    if (window.electron?.getAdBlockEnabled) {
      window.electron.getAdBlockEnabled().then(setAdBlockEnabled);
    }
  }, []);

  React.useEffect(() => {
    if (window.electron?.setAdBlockEnabled) {
      window.electron.setAdBlockEnabled(adBlockEnabled);
    }
  }, [adBlockEnabled]);

  React.useEffect(() => {
    if (suggestionStatus !== 'idle') {
      const timer = setTimeout(() => setSuggestionStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [suggestionStatus]);

  React.useEffect(() => {
    if (window.electron?.getAppVersion) {
      window.electron.getAppVersion().then(setAppVersion).catch(console.error);
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('explore-font-size', fontSize);
    document.documentElement.style.fontSize = fontSize === '100' ? '' : `${fontSize}%`;
  }, [fontSize]);

  React.useEffect(() => {
    localStorage.setItem('explore-reader-mode-default', String(readerModeDefault));
  }, [readerModeDefault]);

  const handleRestart = () => {
    setIsUpdating(true);
    setUpdateProgress(0);
    const interval = setInterval(() => {
      setUpdateProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
             setIsUpdating(false);
             window.location.reload();
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleSendSuggestion = async () => {
    if (!suggestion.trim()) return;
    setIsSending(true);
    
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL || '';

    try {
      if (!webhookUrl || webhookUrl.includes('YOUR_WEBHOOK_URL')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert(language === 'fr' 
          ? 'Mode simulation : Ajoutez votre URL Webhook Discord dans le fichier .env pour activer cette fonctionnalité.' 
          : 'Simulation mode: Add your Discord Webhook URL in the .env file to enable this feature.');
      } else {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `**New Suggestion:**\n${suggestion}\n\n*From Explore Browser*`
          })
        });
        setSuggestionStatus('success');
      }
      setSuggestion('');
    } catch (error) {
      console.error('Failed to send suggestion:', error);
      setSuggestionStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const categories = [
    { id: 'general', name: language === 'fr' ? 'Général' : 'General', icon: Globe },
    { id: 'appearance', name: language === 'fr' ? 'Apparence' : 'Appearance', icon: Palette },
    { id: 'shortcuts', name: language === 'fr' ? 'Raccourcis' : 'Shortcuts', icon: Keyboard },
    { id: 'privacy', name: language === 'fr' ? 'Confidentialité & Sécurité' : 'Privacy & Security', icon: Shield },
    { id: 'accessibility', name: language === 'fr' ? 'Accessibilité' : 'Accessibility', icon: Accessibility },
    { id: 'about', name: language === 'fr' ? 'À propos' : 'About', icon: Info },
  ] as const;

  // Render specific content panel
  const renderCategoryContent = (catId: typeof activeCategory) => {
    switch (catId) {
      case 'general':
        return (
          <div className="space-y-8 animate-fadeIn">
            {/* Tab Position */}
            <div className={clsx("p-6 rounded-3xl border", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <h3 className={clsx("text-lg font-bold mb-4 flex items-center gap-2", theme === 'dark' ? "text-white" : "text-gray-900")}>
                <Layout className="w-5 h-5 opacity-75" />
                {language === 'fr' ? 'Position des onglets' : 'Tab Position'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {(['top', 'bottom', 'left', 'right'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setTabPosition(pos)}
                    className={clsx(
                      "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all hover:scale-[1.02]",
                      tabPosition === pos
                        ? clsx(colors.border, colors.bg, colors.text)
                        : theme === 'dark' ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className={clsx("w-full h-12 rounded-lg relative overflow-hidden border flex items-center justify-center", theme === 'dark' ? "bg-[#181825] border-white/5" : "bg-gray-100 border-gray-200")}>
                      <div className={clsx(
                        "absolute bg-current opacity-20 transition-all",
                        pos === 'top' && "top-0 left-0 right-0 h-3",
                        pos === 'bottom' && "bottom-0 left-0 right-0 h-3",
                        pos === 'left' && "left-0 top-0 bottom-0 w-3",
                        pos === 'right' && "right-0 top-0 bottom-0 w-3",
                        tabPosition === pos ? "opacity-40" : (theme === 'dark' ? "text-white" : "text-black")
                      )} />
                      <div className={clsx(
                        "w-4 h-4 rounded-full border-2 border-current opacity-50",
                        tabPosition === pos ? "opacity-80" : (theme === 'dark' ? "text-white" : "text-black")
                      )} />
                    </div>
                    <span className={clsx("font-bold text-sm capitalize", tabPosition === pos ? colors.text : (theme === 'dark' ? "text-white" : "text-gray-900"))}>
                      {pos === 'top' ? (language === 'fr' ? 'Haut' : 'Top') :
                       pos === 'bottom' ? (language === 'fr' ? 'Bas' : 'Bottom') :
                       pos === 'left' ? (language === 'fr' ? 'Gauche' : 'Left') :
                       (language === 'fr' ? 'Droite' : 'Right')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Engine */}
            <div className={clsx("p-6 rounded-3xl border", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <h3 className={clsx("text-lg font-bold mb-4 flex items-center gap-2", theme === 'dark' ? "text-white" : "text-gray-900")}>
                <Sliders className="w-5 h-5 opacity-75" />
                {language === 'fr' ? 'Moteur de recherche' : 'Search Engine'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { id: 'google', name: 'Google', url: 'https://www.google.com/s2/favicons?domain=google.com&sz=64' },
                  { id: 'bing', name: 'Bing', url: 'https://www.google.com/s2/favicons?domain=bing.com&sz=64' },
                  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=64' },
                  { id: 'ecosia', name: 'Ecosia', url: 'https://www.google.com/s2/favicons?domain=ecosia.org&sz=64' },
                  { id: 'qwant', name: 'Qwant', url: 'https://www.google.com/s2/favicons?domain=qwant.com&sz=64' },
                  { id: 'perplexity', name: 'Perplexity', url: 'https://icons.duckduckgo.com/ip3/perplexity.ai.ico' }
                ].map((engine) => (
                  <button
                    key={engine.id}
                    onClick={() => setSearchEngine(engine.id)}
                    className={clsx(
                      "p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.03]",
                      searchEngine === engine.id
                        ? clsx(colors.border, colors.bg)
                        : theme === 'dark' ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2 shadow-sm shrink-0">
                      <img 
                        src={engine.url} 
                        alt={engine.name} 
                        className="w-8 h-8 object-contain rounded-md" 
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.includes('google.com')) {
                            target.src = `https://icons.duckduckgo.com/ip3/${engine.id === 'google' ? 'google.com' : engine.id === 'bing' ? 'bing.com' : engine.id === 'duckduckgo' ? 'duckduckgo.com' : 'ecosia.org'}.ico`;
                          } else {
                            target.style.display = 'none';
                          }
                        }}
                      />
                    </div>
                    <span className={clsx("font-bold text-sm", theme === 'dark' ? "text-white" : "text-gray-900")}>{engine.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className={clsx("p-6 rounded-3xl border", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <h3 className={clsx("text-lg font-bold mb-4", theme === 'dark' ? "text-white" : "text-gray-900")}>
                {language === 'fr' ? 'Langue' : 'Language'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setLanguage('fr')}
                  className={clsx(
                    "p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]",
                    language === 'fr'
                      ? clsx(colors.border, colors.bg)
                      : theme === 'dark' ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <img src="https://flagcdn.com/w40/fr.png" alt="French" className="w-8 h-6 rounded shadow-sm" />
                  <span className={clsx("font-bold", theme === 'dark' ? "text-white" : "text-gray-900")}>Français</span>
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={clsx(
                    "p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all hover:scale-[1.02]",
                    language === 'en'
                      ? clsx(colors.border, colors.bg)
                      : theme === 'dark' ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <img src="https://flagcdn.com/w40/gb.png" alt="English" className="w-8 h-6 rounded shadow-sm" />
                  <span className={clsx("font-bold", theme === 'dark' ? "text-white" : "text-gray-900")}>English</span>
                </button>
              </div>
            </div>

            {/* Extensions */}
            <div className={clsx("p-6 rounded-3xl border flex items-center justify-between", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <div className="space-y-1">
                <h4 className={clsx("font-bold text-lg flex items-center gap-2", theme === 'dark' ? "text-white" : "text-gray-900")}>
                  <Chrome className="w-5 h-5 text-blue-400" />
                  Chrome Web Store
                </h4>
                <p className={clsx("text-sm max-w-md", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                  {language === 'fr' ? 'Accédez à des milliers d\'extensions pour personnaliser votre expérience.' : 'Access thousands of extensions to customize your experience.'}
                </p>
              </div>
              <button 
                onClick={() => onOpenUrl('https://chrome.google.com/webstore')}
                className={clsx("px-5 py-3 rounded-2xl font-bold transition-all text-white hover:scale-105 active:scale-95 shadow-md", colors.bgSolid, colors.bgHover)}
              >
                {language === 'fr' ? 'Ouvrir le Store' : 'Open Store'}
              </button>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-8 animate-fadeIn">
            {/* Appearance Theme */}
            <div className={clsx("p-6 rounded-3xl border", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <h3 className={clsx("text-lg font-bold mb-4", theme === 'dark' ? "text-white" : "text-gray-900")}>
                {language === 'fr' ? 'Thème visuel' : 'Visual Theme'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme('dark')}
                  className={clsx(
                    "p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all hover:scale-[1.02]",
                    theme === 'dark'
                      ? clsx(colors.border, colors.bg)
                      : "border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="w-full h-24 bg-[#1e1e2e] rounded-lg border border-white/10 flex items-center justify-center">
                    <div className="w-20 h-14 bg-[#181825] rounded border border-white/5 shadow-inner" />
                  </div>
                  <span className={clsx("font-bold text-sm", theme === 'dark' ? "text-white" : "text-gray-900")}>{language === 'fr' ? 'Mode Sombre' : 'Dark Mode'}</span>
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={clsx(
                    "p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all hover:scale-[1.02]",
                    theme === 'light'
                      ? clsx(colors.border, colors.bg)
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="w-full h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                    <div className="w-20 h-14 bg-white rounded border border-gray-100 shadow-sm" />
                  </div>
                  <span className={clsx("font-bold text-sm", theme === 'dark' ? "text-white" : "text-gray-900")}>{language === 'fr' ? 'Mode Clair' : 'Light Mode'}</span>
                </button>
              </div>
            </div>

            {/* Ambient Mode Toggle */}
            <div className={clsx("p-6 rounded-3xl border flex items-center justify-between", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <div className="space-y-1">
                <h4 className={clsx("font-bold text-lg flex items-center gap-2", theme === 'dark' ? "text-white" : "text-gray-900")}>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  {language === 'fr' ? 'Éclairage Ambiant' : 'Ambient Mode'}
                </h4>
                <p className={clsx("text-sm max-w-md", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                  {language === 'fr' ? 'Diffuse en arrière-plan la couleur dominante du site web actif.' : 'Diffuses the dominant color of the active website in the background.'}
                </p>
              </div>
              <button 
                onClick={() => setAmbientMode(!ambientMode)}
                className={clsx(
                  "w-14 h-7 rounded-full transition-colors relative shadow-inner shrink-0",
                  ambientMode ? colors.bgSolid : (theme === 'dark' ? "bg-gray-600" : "bg-gray-300")
                )}
              >
                <div className={clsx(
                  "absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md",
                  ambientMode ? "left-8" : "left-1"
                )} />
              </button>
            </div>

            {/* Accent Color */}
            <div className={clsx("p-6 rounded-3xl border", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <h3 className={clsx("text-lg font-bold mb-4", theme === 'dark' ? "text-white" : "text-gray-900")}>
                {language === 'fr' ? 'Couleur d\'accentuation' : 'Accent Color'}
              </h3>
              <div className="flex flex-wrap gap-4">
                {['blue', 'purple', 'green', 'orange', 'pink', 'red'].map((color) => {
                  const colorNames: Record<string, { en: string; fr: string }> = {
                    blue: { en: 'Blue', fr: 'Bleu' },
                    purple: { en: 'Purple', fr: 'Violet' },
                    green: { en: 'Green', fr: 'Vert' },
                    orange: { en: 'Orange', fr: 'Orange' },
                    pink: { en: 'Pink', fr: 'Rose' },
                    red: { en: 'Red', fr: 'Rouge' }
                  };
                  
                  return (
                    <button
                      key={color}
                      onClick={() => setAccentColor(color)}
                      className={clsx(
                        "w-12 h-12 rounded-full transition-all border-4 flex items-center justify-center shadow-md",
                        accentColor === color
                          ? "border-white scale-110 shadow-lg"
                          : "border-transparent hover:scale-105",
                        `bg-${color}-500`
                      )}
                      title={language === 'fr' ? colorNames[color].fr : colorNames[color].en}
                    >
                      {accentColor === color && (
                        <Check className="w-5 h-5 text-white stroke-[3px]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case 'shortcuts':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className={clsx("p-6 rounded-3xl border", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <h3 className={clsx("text-lg font-bold mb-4 flex items-center gap-2", theme === 'dark' ? "text-white" : "text-gray-900")}>
                <Keyboard className="w-5 h-5" />
                {language === 'fr' ? 'Personnalisation des raccourcis' : 'Customize Shortcuts'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {[
                  { label: language === 'fr' ? 'Nouvel onglet' : 'New Tab', key: 'newTab', placeholder: 'Ctrl+T' },
                  { label: language === 'fr' ? 'Fermer l’onglet' : 'Close Tab', key: 'closeTab', placeholder: 'Ctrl+W' },
                  { label: language === 'fr' ? 'Focus barre d’URL' : 'Focus URL bar', key: 'focusUrl', placeholder: 'Ctrl+L' },
                  { label: language === 'fr' ? 'Recharger l’onglet' : 'Reload Tab', key: 'reloadTab', placeholder: 'Ctrl+R' },
                  { label: language === 'fr' ? 'Mode Privé' : 'Private Mode', key: 'togglePrivate', placeholder: 'Ctrl+Shift+P' },
                  { label: language === 'fr' ? 'Sauvegarder Session' : 'Save Session', key: 'saveSession', placeholder: 'Ctrl+S' },
                  { label: language === 'fr' ? 'Restaurer Session' : 'Restore Session', key: 'restoreSession', placeholder: 'Ctrl+Shift+R' },
                  { label: language === 'fr' ? 'Activer Picture-in-Picture' : 'Enable PiP', key: 'enablePiP', placeholder: 'Ctrl+Shift+E' },
                ].map((s) => (
                  <div key={s.key} className="flex flex-col gap-2">
                    <span className={clsx("text-sm font-bold opacity-80", theme === 'dark' ? "text-white" : "text-gray-900")}>{s.label}</span>
                    <input
                      value={localShortcuts[s.key as keyof typeof localShortcuts]}
                      readOnly
                      onKeyDown={(e) => {
                        e.preventDefault();
                        if (['Control', 'Shift', 'Alt', 'Meta', 'Tab', 'CapsLock'].includes(e.key)) return;
                        
                        const parts = [];
                        if (e.ctrlKey) parts.push('Ctrl');
                        if (e.altKey) parts.push('Alt');
                        if (e.shiftKey) parts.push('Shift');
                        
                        let keyName = e.key;
                        if (keyName === ' ') keyName = 'Space';
                        if (keyName.length === 1) keyName = keyName.toUpperCase();
                        
                        parts.push(keyName);
                        setLocalShortcuts({ ...localShortcuts, [s.key]: parts.join('+') });
                      }}
                      className={clsx(
                        "px-4 py-3 rounded-xl border text-sm font-semibold outline-none transition-all focus:ring-2 focus:ring-opacity-50 cursor-pointer",
                        theme === 'dark' 
                          ? "bg-[#181825] border-white/10 text-white focus:ring-blue-500" 
                          : "bg-white border-gray-200 text-gray-900 focus:ring-blue-500 shadow-sm"
                      )}
                      placeholder={language === 'fr' ? 'Appuyez sur une touche...' : 'Press a key combo...'}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
                <button
                  onClick={() => setLocalShortcuts(shortcuts)}
                  className={clsx("px-5 py-2.5 rounded-xl font-bold text-sm transition-colors", theme === 'dark' ? "bg-white/10 text-white hover:bg-white/20" : "bg-white border hover:bg-gray-50 text-gray-900 shadow-sm")}
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    setShortcuts({ ...shortcuts, ...localShortcuts });
                    showToast(language === 'fr' ? 'Raccourcis enregistrés !' : 'Shortcuts saved!');
                  }}
                  className={clsx("px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 active:scale-95 shadow-md", colors.bgSolid, colors.bgHover)}
                >
                  {language === 'fr' ? 'Enregistrer' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* AdBlock Toggle */}
            <div className={clsx("p-6 rounded-3xl border flex items-center justify-between", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <div className="space-y-1">
                <h4 className={clsx("font-bold text-lg flex items-center gap-2", theme === 'dark' ? "text-white" : "text-gray-900")}>
                  <Shield className="w-5 h-5 text-green-400" />
                  Shield AdBlocker
                </h4>
                <p className={clsx("text-sm max-w-md", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                  {language === 'fr' ? 'Bloque automatiquement les publicités intrusives et les traqueurs publicitaires.' : 'Automatically blocks intrusive advertisements and commercial trackers.'}
                </p>
              </div>
              <button 
                onClick={() => setAdBlockEnabled(!adBlockEnabled)}
                className={clsx(
                  "w-14 h-7 rounded-full transition-colors relative shadow-inner shrink-0",
                  adBlockEnabled ? "bg-green-500" : (theme === 'dark' ? "bg-gray-600" : "bg-gray-300")
                )}
              >
                <div className={clsx(
                  "absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md",
                  adBlockEnabled ? "left-8" : "left-1"
                )} />
              </button>
            </div>

            {/* Clear Browsing Data */}
            <div className={clsx("p-6 rounded-3xl border flex items-center justify-between", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <div className="space-y-1">
                <h4 className={clsx("font-bold text-lg text-red-400", theme === 'dark' ? "text-white" : "text-gray-900")}>
                  {language === 'fr' ? 'Effacer les données de navigation' : 'Clear Browsing Data'}
                </h4>
                <p className={clsx("text-sm max-w-md", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                  {language === 'fr' ? 'Supprime instantanément votre historique local, vos cookies et votre cache.' : 'Instantly removes your local navigation history, cookies, and cache.'}
                </p>
              </div>
              <button 
                onClick={() => {
                  if (confirm(language === 'fr' ? 'Voulez-vous vraiment effacer toutes vos données de navigation ?' : 'Are you sure you want to clear all browsing data?')) {
                    onClearData();
                    showToast(language === 'fr' ? 'Données effacées !' : 'Browsing data cleared!');
                  }
                }}
                className="px-5 py-3 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                {language === 'fr' ? 'Effacer tout' : 'Clear Everything'}
              </button>
            </div>

            {/* Import Bookmarks */}
            <div className={clsx("p-6 rounded-3xl border flex items-center justify-between", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <div className="space-y-1">
                <h4 className={clsx("font-bold text-lg", theme === 'dark' ? "text-white" : "text-gray-900")}>
                  {language === 'fr' ? 'Importer les favoris' : 'Import Bookmarks'}
                </h4>
                <p className={clsx("text-sm max-w-md", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                  {language === 'fr' ? 'Transférez vos favoris depuis un autre navigateur via un fichier HTML standard.' : 'Transfer your bookmarks from another browser using a standard HTML file.'}
                </p>
              </div>
              <button 
                onClick={onImportBookmarks}
                className={clsx("px-5 py-3 rounded-2xl font-bold transition-all text-white hover:scale-105 active:scale-95 shadow-md", colors.bgSolid, colors.bgHover)}
              >
                {language === 'fr' ? 'Importer' : 'Import'}
              </button>
            </div>
          </div>
        );
      case 'accessibility':
        return (
          <div className="space-y-8 animate-fadeIn">
            {/* Font Size Slider */}
            <div className={clsx("p-6 rounded-3xl border", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <h3 className={clsx("text-lg font-bold mb-2 flex items-center gap-2", theme === 'dark' ? "text-white" : "text-gray-900")}>
                <Accessibility className="w-5 h-5 opacity-75" />
                {language === 'fr' ? 'Taille de la police globale' : 'Global Font Size'}
              </h3>
              <p className={clsx("text-sm mb-6", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                {language === 'fr' ? 'Ajustez la taille du texte de l’interface utilisateur d’Explore.' : 'Adjust the text scale of the Explore browser UI.'}
              </p>
              
              <div className="flex items-center gap-6">
                <span className="text-sm font-bold opacity-60">A</span>
                <input
                  type="range"
                  min="80"
                  max="150"
                  step="5"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className={clsx(
                    "flex-1 h-2 rounded-lg appearance-none cursor-pointer",
                    theme === 'dark' ? "bg-white/10" : "bg-gray-200"
                  )}
                  style={{
                    background: `linear-gradient(to right, ${accentColor === 'blue' ? '#3b82f6' : accentColor === 'purple' ? '#a855f7' : accentColor === 'green' ? '#22c55e' : accentColor === 'orange' ? '#f97316' : accentColor === 'pink' ? '#ec4899' : '#ef4444'} 0%, ${accentColor === 'blue' ? '#3b82f6' : accentColor === 'purple' ? '#a855f7' : accentColor === 'green' ? '#22c55e' : accentColor === 'orange' ? '#f97316' : accentColor === 'pink' ? '#ec4899' : '#ef4444'} ${(Number(fontSize) - 80) / 70 * 100}%, ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} ${(Number(fontSize) - 80) / 70 * 100}%, ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 100%)`
                  }}
                />
                <span className="text-xl font-black">{fontSize}%</span>
              </div>
              
              <div className={clsx("mt-6 p-4 rounded-2xl border text-center transition-all", theme === 'dark' ? "bg-white/5 border-white/5 text-gray-300" : "bg-white border-gray-100 text-gray-700 shadow-sm")} style={{ fontSize: `${Number(fontSize)/100}rem` }}>
                {language === 'fr' ? 'Exemple de texte à cette échelle' : 'Sample text at this scale'}
              </div>
            </div>

            {/* Default Reading Mode Toggle */}
            <div className={clsx("p-6 rounded-3xl border flex items-center justify-between", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <div className="space-y-1">
                <h4 className={clsx("font-bold text-lg", theme === 'dark' ? "text-white" : "text-gray-900")}>
                  {language === 'fr' ? 'Mode Lecture intelligent par défaut' : 'Smart Reading Mode by default'}
                </h4>
                <p className={clsx("text-sm max-w-md", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                  {language === 'fr' ? 'Force l’affichage épuré sans distractions dès que cela est possible.' : 'Forces a distractions-free layout on eligible articles by default.'}
                </p>
              </div>
              <button 
                onClick={() => setReaderModeDefault(!readerModeDefault)}
                className={clsx(
                  "w-14 h-7 rounded-full transition-colors relative shadow-inner shrink-0",
                  readerModeDefault ? colors.bgSolid : (theme === 'dark' ? "bg-gray-600" : "bg-gray-300")
                )}
              >
                <div className={clsx(
                  "absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-md",
                  readerModeDefault ? "left-8" : "left-1"
                )} />
              </button>
            </div>
          </div>
        );
      case 'about':
        return (
          <div className="space-y-8 animate-fadeIn">
            {/* App Branding & Info */}
            <div className={clsx("p-6 rounded-3xl border text-center flex flex-col items-center justify-center relative overflow-hidden", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <div className={clsx("absolute top-0 right-0 p-8 opacity-10 pointer-events-none")}>
                <Layout className="w-64 h-64 rotate-12" />
              </div>
              <div className={clsx("w-20 h-20 rounded-3xl flex items-center justify-center bg-white/5 border border-white/10 mb-4 shadow-xl")}>
                <Logo className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-black">Explore Browser</h3>
              <p className="text-sm opacity-60 font-bold mt-1">Version {appVersion} (Stable v1.6.1)</p>
              <div className="mt-4 flex gap-2">
                <span className={clsx("px-3 py-1 rounded-full text-xs font-bold", theme === 'dark' ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700")}>
                  Stable
                </span>
              </div>
            </div>

            {/* Updates Cockpit */}
            <div className={clsx("p-6 rounded-3xl border", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className={clsx("font-bold text-lg", theme === 'dark' ? "text-white" : "text-gray-900")}>
                    {language === 'fr' ? 'Mises à jour système' : 'System Updates'}
                  </h4>
                  <p className={clsx("text-sm", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                    {language === 'fr' ? 'Gardez Explore à jour pour profiter des dernières sécurités.' : 'Keep Explore updated for maximum speed and security.'}
                  </p>
                </div>
                <div className={clsx("px-4 py-1.5 rounded-full text-xs font-bold", theme === 'dark' ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700")}>
                  {language === 'fr' ? 'À jour' : 'Up to date'}
                </div>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={checkForUpdates}
                  className={clsx("flex-1 px-4 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2", theme === 'dark' ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white border hover:bg-gray-50 text-gray-900 shadow-sm")}
                >
                  <RefreshCw className="w-4 h-4" />
                  {language === 'fr' ? 'Vérifier' : 'Check'}
                </button>
                <button 
                  onClick={handleRestart}
                  disabled={isUpdating}
                  className={clsx("flex-1 px-4 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] text-white relative overflow-hidden shadow-md", colors.bgSolid, colors.bgHover)}
                >
                  <span className="relative z-10">{isUpdating ? `${updateProgress}%` : (language === 'fr' ? 'Redémarrer Explore' : 'Restart Explore')}</span>
                  {isUpdating && (
                    <div 
                      className="absolute inset-0 bg-white/20 transition-all duration-100 ease-linear"
                      style={{ width: `${updateProgress}%` }}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Suggestions & Feedbacks to Discord Webhook */}
            <div className={clsx("p-6 rounded-3xl border", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50/50 border-gray-200")}>
              <h3 className={clsx("text-lg font-bold mb-2", theme === 'dark' ? "text-white" : "text-gray-900")}>
                {language === 'fr' ? 'Boîte à suggestions' : 'Suggestions Box'}
              </h3>
              <p className={clsx("text-sm opacity-60 mb-4", theme === 'dark' ? "text-gray-300" : "text-gray-600")}>
                {language === 'fr' ? 'Envoyez vos suggestions directement à nos développeurs en temps réel.' : 'Send your suggestions directly to our developers in real-time.'}
              </p>
              
              <div className="relative overflow-hidden rounded-2xl border border-white/5 mb-4">
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder={language === 'fr' ? 'Partagez vos idées ou signalez un bug...' : 'Share your ideas or report a bug...'}
                  className={clsx(
                    "w-full h-28 bg-black/10 p-4 resize-none outline-none text-sm font-semibold",
                    theme === 'dark' ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                  )}
                />
              </div>

              <div className="flex justify-between items-center">
                <AnimatePresence mode="wait">
                  {suggestionStatus !== 'idle' ? (
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={clsx(
                        "text-sm font-bold",
                        suggestionStatus === 'success' ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {suggestionStatus === 'success' 
                        ? (language === 'fr' ? 'Suggestion transmise avec succès !' : 'Suggestion sent successfully!')
                        : (language === 'fr' ? 'Erreur de transmission.' : 'Transmission error.')}
                    </motion.span>
                  ) : (
                    <span />
                  )}
                </AnimatePresence>
                <button 
                  onClick={handleSendSuggestion}
                  disabled={isSending || !suggestion.trim()}
                  className={clsx(
                    "px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 text-sm shadow-md",
                    isSending || !suggestion.trim()
                      ? "opacity-50 cursor-not-allowed bg-gray-500/10 text-gray-500"
                      : clsx("text-white hover:scale-105 active:scale-95", colors.bgSolid)
                  )}
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {language === 'fr' ? 'Transmettre' : 'Send'}
                </button>
              </div>

              <button
                onClick={() => onOpenUrl('https://discord.gg/sjqwhXahtc')}
                className={clsx("w-full mt-4 px-4 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.01] border flex items-center justify-center gap-2 shadow-sm", theme === 'dark' ? "border-white/10 hover:bg-white/5 text-white" : "border-gray-200 hover:bg-gray-50 text-gray-900 bg-white")}
              >
                <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 127.14 96.36" fill="currentColor">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.09,105.09,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c2.36-24.44-5.42-48.18-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                </svg>
                {language === 'fr' ? 'Rejoindre le serveur d\'Explore' : 'Join the Explore Discord Server'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (isFullPage) {
      return (
        <div className="w-full h-full flex flex-row overflow-hidden transition-all duration-300 bg-transparent text-current">
          {/* Dashboard Left Sidebar */}
          <div className={clsx(
            "w-72 p-6 flex flex-col gap-2 shrink-0 border-r",
            theme === 'dark' ? "bg-transparent border-white/5 text-white" : "bg-transparent border-gray-150 text-gray-900"
          )}>
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 shadow-lg shrink-0">
                <Logo className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="font-black text-lg leading-tight truncate">Explore</h2>
                <p className="text-xs opacity-50 font-bold">{language === 'fr' ? 'Paramètres' : 'Settings'}</p>
              </div>
            </div>

            {/* Categories Buttons list */}
            <div className="flex-1 space-y-1.5">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={clsx(
                      "w-full px-4 py-3 rounded-2xl flex items-center gap-3.5 font-bold text-sm transition-all hover:translate-x-1",
                      isActive
                        ? clsx(colors.bgSolid, "text-white shadow-md shadow-blue-500/10")
                        : theme === 'dark'
                          ? "text-gray-400 hover:bg-white/5 hover:text-white"
                          : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                    )}
                  >
                    <IconComponent className="w-5 h-5 shrink-0" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
            
            <div className={clsx("mt-auto pt-4 border-t px-2", theme === 'dark' ? "border-white/5" : "border-gray-100")}>
              <p className="text-[10px] opacity-40 font-bold text-center tracking-widest uppercase">Explore v{appVersion}</p>
            </div>
          </div>

          {/* Dashboard Right Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-[70vh]">
            <div className={clsx("p-8 pb-4 flex items-center justify-between border-b shrink-0", theme === 'dark' ? "border-white/5" : "border-gray-150")}>
              <h2 className="text-2xl font-black flex items-center gap-3">
                {categories.find(c => c.id === activeCategory)?.name}
              </h2>
              <button
                onClick={onClose}
                className={clsx(
                  "p-2.5 rounded-2xl transition-all hover:scale-105 active:scale-95 border flex items-center gap-2 font-bold text-sm shadow-sm",
                  theme === 'dark' 
                    ? "bg-white/5 border-white/10 text-white hover:bg-white/10" 
                    : "bg-white border-gray-250 text-gray-900 hover:bg-gray-50"
                )}
              >
                <X className="w-4 h-4" />
                {language === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </div>
            <div className="flex-1 p-8 overflow-y-auto max-h-[70vh]">
              {children}
            </div>

            {/* Internal Toast */}
            <AnimatePresence>
              {toastMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className={clsx(
                    "absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl z-50",
                    theme === 'dark' ? "bg-white text-black" : "bg-black text-white"
                  )}
                >
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      );
    }

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={clsx(
                  "w-full max-w-2xl p-6 rounded-3xl shadow-2xl border relative max-h-[90vh] overflow-y-auto z-10",
                  theme === 'dark' ? "bg-[#1e1e2e] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
                )}
              >
                <button
                  onClick={onClose}
                  className={clsx("absolute top-4 right-4 p-2 rounded-full transition-colors z-10", theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900")}
                >
                  <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Layout className={clsx("w-6 h-6", colors.text)} />
                  {language === 'fr' ? 'Paramètres Explore' : 'Explore Settings'}
                </h2>
                {children}
              </motion.div>

              {/* Internal Toast */}
              <AnimatePresence>
                {toastMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className={clsx(
                      "absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl z-50",
                      theme === 'dark' ? "bg-white text-black" : "bg-black text-white"
                    )}
                  >
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <Wrapper>
      {isFullPage ? (
        renderCategoryContent(activeCategory)
      ) : (
        <div className="space-y-8">
          {/* Render all parameters as categories sections in standard modal */}
          <div>
            <h3 className={clsx("text-base font-bold mb-4 uppercase tracking-wider opacity-60 border-b pb-1", theme === 'dark' ? "text-white border-white/10" : "text-gray-900 border-gray-200")}>
              {language === 'fr' ? 'Général & Apparence' : 'General & Appearance'}
            </h3>
            <div className="space-y-6">
              {/* Tab Position */}
              <div>
                <span className="text-sm font-bold mb-2 block">{language === 'fr' ? 'Position des onglets' : 'Tab Position'}</span>
                <div className="grid grid-cols-4 gap-2">
                  {(['top', 'bottom', 'left', 'right'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setTabPosition(pos)}
                      className={clsx(
                        "py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all",
                        tabPosition === pos ? clsx(colors.border, colors.bg, colors.text) : (theme === 'dark' ? "border-white/10 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50")
                      )}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme & Ambient Mode */}
              <div className="flex gap-4">
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={clsx("flex-1 p-3 rounded-xl border font-bold text-xs transition-all", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}
                >
                  {theme === 'dark' ? (language === 'fr' ? 'Passer en Mode Clair' : 'Switch to Light Mode') : (language === 'fr' ? 'Passer en Mode Sombre' : 'Switch to Dark Mode')}
                </button>
                <button
                  onClick={() => setAmbientMode(!ambientMode)}
                  className={clsx("flex-1 p-3 rounded-xl border font-bold text-xs transition-all", ambientMode ? colors.bg : "border-gray-200", ambientMode && colors.text)}
                >
                  {language === 'fr' ? 'Mode Ambiant :' : 'Ambient Mode :'} {ambientMode ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Accent Color picker */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold">{language === 'fr' ? 'Couleur d\'accentuation' : 'Accent Color'}</span>
                <div className="flex gap-1.5">
                  {['blue', 'purple', 'green', 'orange', 'pink', 'red'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setAccentColor(color)}
                      className={clsx(
                        "w-6 h-6 rounded-full border transition-all",
                        accentColor === color ? "border-white scale-110 shadow" : "border-transparent opacity-75 hover:opacity-100",
                        `bg-${color}-500`
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Shortcuts */}
          <div>
            <h3 className={clsx("text-base font-bold mb-4 uppercase tracking-wider opacity-60 border-b pb-1", theme === 'dark' ? "text-white border-white/10" : "text-gray-900 border-gray-200")}>
              {language === 'fr' ? 'Confidentialité & Données' : 'Privacy & Data'}
            </h3>
            <div className="space-y-4">
              <div className={clsx("p-3 rounded-xl border flex items-center justify-between", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}>
                <span className="text-xs font-bold">Shield AdBlocker</span>
                <button 
                  onClick={() => setAdBlockEnabled(!adBlockEnabled)}
                  className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold text-white", adBlockEnabled ? "bg-green-500" : "bg-gray-500")}
                >
                  {adBlockEnabled ? 'ACTIF' : 'INACTIF'}
                </button>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={onClearData}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/10"
                >
                  {language === 'fr' ? 'Effacer historique' : 'Clear History'}
                </button>
                <button 
                  onClick={onImportBookmarks}
                  className={clsx("flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white transition-all shadow", colors.bgSolid, colors.bgHover)}
                >
                  {language === 'fr' ? 'Importer favoris' : 'Import Bookmarks'}
                </button>
              </div>
            </div>
          </div>

          {/* About */}
          <div>
            <h3 className={clsx("text-base font-bold mb-4 uppercase tracking-wider opacity-60 border-b pb-1", theme === 'dark' ? "text-white border-white/10" : "text-gray-900 border-gray-200")}>
              {language === 'fr' ? 'À propos' : 'About'}
            </h3>
            <div className={clsx("p-4 rounded-xl border text-center flex flex-col items-center", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}>
              <span className="font-extrabold text-sm">Explore Browser</span>
              <span className="text-xs opacity-50 mt-0.5">Version {appVersion}</span>
              <button 
                onClick={checkForUpdates}
                className={clsx("mt-3 px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 bg-white text-gray-900 border-gray-200 shadow-sm hover:bg-gray-50")}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {language === 'fr' ? 'Vérifier les mises à jour' : 'Check for updates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Wrapper>
  );
}
