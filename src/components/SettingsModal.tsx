import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layout, RefreshCw, Send } from 'lucide-react';
import { clsx } from 'clsx';

import { getAccentColorClass } from '../lib/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export function SettingsModal({
  isOpen,
  onClose,
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
  onClearData
}: SettingsModalProps) {
  const colors = getAccentColorClass(accentColor, theme === 'dark');
  const [suggestion, setSuggestion] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [suggestionStatus, setSuggestionStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [localShortcuts, setLocalShortcuts] = React.useState(shortcuts);
  const [updateProgress, setUpdateProgress] = React.useState(0);
  const [appVersion, setAppVersion] = React.useState('0.0.0');
  const [adBlockEnabled, setAdBlockEnabled] = React.useState(true);

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
    
    // Discord Webhook URL
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL || '';

    try {
      if (!webhookUrl || webhookUrl.includes('YOUR_WEBHOOK_URL')) {
        // Mock success for now if no URL configured
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
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                "w-full max-w-2xl p-6 rounded-2xl shadow-2xl border relative max-h-[90vh] overflow-y-auto z-10",
                theme === 'dark' ? "bg-[#1e1e2e] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
              )}
            >
              <button
                onClick={onClose}
                className={clsx("absolute top-4 right-4 p-2 rounded-full transition-colors", theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900")}
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Layout className={clsx("w-6 h-6", colors.text)} />
                {language === 'fr' ? 'Paramètres' : 'Settings'}
              </h2>

              <div className="space-y-8">
                {/* Tab Position */}
                <div>
                  <h3 className={clsx("text-lg font-medium mb-4", theme === 'dark' ? "text-white" : "text-gray-900")}>
                    {language === 'fr' ? 'Position des onglets' : 'Tab Position'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(['top', 'bottom', 'left', 'right'] as const).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setTabPosition(pos)}
                        className={clsx(
                          "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                          tabPosition === pos
                            ? clsx(colors.border, colors.bg, colors.text)
                            : theme === 'dark' ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className={clsx("w-full h-12 rounded-lg relative overflow-hidden border flex items-center justify-center", theme === 'dark' ? "bg-[#181825] border-white/5" : "bg-gray-100 border-gray-200")}>
                          {/* CSS-based layout representation */}
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
                        <span className={clsx("font-medium text-sm capitalize", tabPosition === pos ? colors.text : (theme === 'dark' ? "text-white" : "text-gray-900"))}>{pos}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Engine */}
                <div>
                  <h3 className={clsx("text-lg font-medium mb-4", theme === 'dark' ? "text-white" : "text-gray-900")}>
                    {language === 'fr' ? 'Moteur de recherche' : 'Search Engine'}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { id: 'google', name: 'Google', url: 'https://www.google.com/s2/favicons?domain=google.com&sz=64' },
                        { id: 'bing', name: 'Bing', url: 'https://www.google.com/s2/favicons?domain=bing.com&sz=64' },
                        { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=64' },
                        { id: 'ecosia', name: 'Ecosia', url: 'https://www.google.com/s2/favicons?domain=ecosia.org&sz=64' }
                    ].map((engine) => (
                         <button
                            key={engine.id}
                            onClick={() => setSearchEngine(engine.id)}
                            className={clsx(
                                "p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all",
                                searchEngine === engine.id
                                ? clsx(colors.border, colors.bg)
                                : theme === 'dark' ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300"
                            )}
                        >
                            <img 
                              src={engine.url} 
                              alt={engine.name} 
                              className="w-8 h-8" 
                              onError={(e) => {
                                const target = e.currentTarget;
                                if (target.src.includes('google.com')) {
                                  target.src = `https://icons.duckduckgo.com/ip3/${engine.id === 'google' ? 'google.com' : engine.id === 'bing' ? 'bing.com' : engine.id === 'duckduckgo' ? 'duckduckgo.com' : 'ecosia.org'}.ico`;
                                } else {
                                  target.style.display = 'none';
                                }
                              }}
                            />
                            <span className={clsx("font-medium text-sm", theme === 'dark' ? "text-white" : "text-gray-900")}>{engine.name}</span>
                        </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <h3 className={clsx("text-lg font-medium mb-4", theme === 'dark' ? "text-white" : "text-gray-900")}>
                    {language === 'fr' ? 'Langue' : 'Language'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setLanguage('fr')}
                      className={clsx(
                        "p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all",
                        language === 'fr'
                        ? clsx(colors.border, colors.bg)
                        : theme === 'dark' ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <img src="https://flagcdn.com/w40/fr.png" alt="French" className="w-8 h-6 rounded shadow-sm" />
                      <span className={clsx("font-medium", theme === 'dark' ? "text-white" : "text-gray-900")}>Français</span>
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={clsx(
                        "p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all",
                        language === 'en'
                        ? clsx(colors.border, colors.bg)
                        : theme === 'dark' ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <img src="https://flagcdn.com/w40/gb.png" alt="English" className="w-8 h-6 rounded shadow-sm" />
                      <span className={clsx("font-medium", theme === 'dark' ? "text-white" : "text-gray-900")}>English</span>
                    </button>
                  </div>
                </div>

                {/* Appearance */}
                <div>
                  <h3 className={clsx("text-lg font-medium mb-4", theme === 'dark' ? "text-white" : "text-gray-900")}>
                    {language === 'fr' ? 'Apparence' : 'Appearance'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      onClick={() => setTheme('dark')}
                      className={clsx(
                        "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                        theme === 'dark'
                          ? clsx(colors.border, colors.bg)
                          : "border-white/10 hover:border-white/20"
                      )}
                    >
                      <div className="w-full h-20 bg-[#1e1e2e] rounded-lg border border-white/10 flex items-center justify-center">
                        <div className="w-16 h-12 bg-[#181825] rounded border border-white/5" />
                      </div>
                      <span className={clsx("font-medium text-sm", theme === 'dark' ? "text-white" : "text-gray-900")}>{language === 'fr' ? 'Mode Sombre' : 'Dark Mode'}</span>
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={clsx(
                        "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all",
                        theme === 'light'
                          ? clsx(colors.border, colors.bg)
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="w-full h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                        <div className="w-16 h-12 bg-white rounded border border-gray-100 shadow-sm" />
                      </div>
                      <span className={clsx("font-medium text-sm", theme === 'dark' ? "text-white" : "text-gray-900")}>{language === 'fr' ? 'Mode Clair' : 'Light Mode'}</span>
                    </button>
                  </div>

                  {/* Accent Color */}
                  <div className="flex flex-wrap gap-3">
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
                          "w-10 h-10 rounded-full transition-all border-2",
                          accentColor === color
                            ? "border-white scale-110 shadow-lg"
                            : "border-transparent hover:scale-105",
                          `bg-${color}-500`
                        )}
                        title={language === 'fr' ? colorNames[color].fr : colorNames[color].en}
                      />
                    );
                    })}
                  </div>
                </div>
                
                {/* Updates */}
                <div>
                  <h3 className={clsx("text-lg font-medium mb-4", theme === 'dark' ? "text-white" : "text-gray-900")}>
                    {language === 'fr' ? 'Mise à jour' : 'Updates'}
                  </h3>
                  <div className={clsx("p-4 rounded-xl border", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className={clsx("font-medium", theme === 'dark' ? "text-white" : "text-gray-900")}>Explore Browser</h4>
                        <p className={clsx("text-sm", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                          Version {appVersion}
                        </p>
                      </div>
                      <div className={clsx("px-3 py-1 rounded-full text-xs font-medium", theme === 'dark' ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700")}>
                        {language === 'fr' ? 'À jour' : 'Up to date'}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        className={clsx("flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2", theme === 'dark' ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white border hover:bg-gray-50 text-gray-900")}
                      >
                        <RefreshCw className="w-4 h-4" />
                        {language === 'fr' ? 'Rechercher' : 'Check for updates'}
                      </button>
                      <button 
                        onClick={handleRestart}
                        disabled={isUpdating}
                        className={clsx("flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-white relative overflow-hidden", colors.bgSolid, colors.bgHover)}
                      >
                        <span className="relative z-10">{isUpdating ? `${updateProgress}%` : (language === 'fr' ? 'Redémarrer' : 'Restart to update')}</span>
                        {isUpdating && (
                          <div 
                            className="absolute inset-0 bg-white/20 transition-all duration-100 ease-linear"
                            style={{ width: `${updateProgress}%` }}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                <div>
                  <h3 className={clsx("text-lg font-medium mb-4", theme === 'dark' ? "text-white" : "text-gray-900")}>
                    {language === 'fr' ? 'Suggestions' : 'Suggestions'}
                  </h3>
                  <div className={clsx("p-4 rounded-xl border relative overflow-hidden", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}>
                    <textarea
                      value={suggestion}
                      onChange={(e) => setSuggestion(e.target.value)}
                      placeholder={language === 'fr' ? 'Partagez vos idées pour améliorer le navigateur...' : 'Share your ideas to improve the browser...'}
                      className={clsx(
                        "w-full h-24 bg-transparent resize-none outline-none mb-3 text-sm",
                        theme === 'dark' ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                      )}
                    />
                    <div className="flex justify-between items-center">
                      <AnimatePresence mode="wait">
                        {suggestionStatus !== 'idle' ? (
                          <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={clsx(
                              "text-sm font-medium",
                              suggestionStatus === 'success' ? "text-green-500" : "text-red-500"
                            )}
                          >
                            {suggestionStatus === 'success' 
                              ? (language === 'fr' ? 'Merci pour votre suggestion !' : 'Thank you for your suggestion!')
                              : (language === 'fr' ? 'Erreur lors de l\'envoi.' : 'Error sending suggestion.')}
                          </motion.span>
                        ) : (
                          <span />
                        )}
                      </AnimatePresence>
                      <button 
                        onClick={handleSendSuggestion}
                        disabled={isSending || !suggestion.trim()}
                        className={clsx(
                          "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
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
                        {language === 'fr' ? 'Envoyer' : 'Send'}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenUrl('https://discord.gg/sjqwhXahtc')}
                    className={clsx("w-full mt-3 px-4 py-2 rounded-lg font-medium transition-colors border flex items-center justify-center gap-2", theme === 'dark' ? "border-white/10 hover:bg-white/5 text-white" : "border-gray-200 hover:bg-gray-50 text-gray-900")}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 127.14 96.36" fill="currentColor">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.09,105.09,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c2.36-24.44-5.42-48.18-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
                    </svg>
                    {language === 'fr' ? 'Rejoindre le Discord' : 'Join Discord'}
                  </button>
                </div>

                {/* Keyboard Shortcuts */}
                <div>
                  <h3 className={clsx("text-lg font-medium mb-4", theme === 'dark' ? "text-white" : "text-gray-900")}>
                    {language === 'fr' ? 'Raccourcis clavier' : 'Keyboard Shortcuts'}
                  </h3>
                  <div className={clsx("p-4 rounded-xl border space-y-3", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center gap-3">
                        <span className={clsx("w-40 text-sm", theme === 'dark' ? "text-white" : "text-gray-900")}>{language === 'fr' ? 'Nouvel onglet' : 'New Tab'}</span>
                        <input
                          value={localShortcuts.newTab}
                          onChange={(e) => setLocalShortcuts({ ...localShortcuts, newTab: e.target.value })}
                          className={clsx("flex-1 px-3 py-2 rounded-lg border text-sm outline-none", theme === 'dark' ? "bg-[#181825] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900")}
                          placeholder="Ctrl+T"
                        />
                      </label>
                      <label className="flex items-center gap-3">
                        <span className={clsx("w-40 text-sm", theme === 'dark' ? "text-white" : "text-gray-900")}>{language === 'fr' ? 'Fermer l’onglet' : 'Close Tab'}</span>
                        <input
                          value={localShortcuts.closeTab}
                          onChange={(e) => setLocalShortcuts({ ...localShortcuts, closeTab: e.target.value })}
                          className={clsx("flex-1 px-3 py-2 rounded-lg border text-sm outline-none", theme === 'dark' ? "bg-[#181825] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900")}
                          placeholder="Ctrl+W"
                        />
                      </label>
                      <label className="flex items-center gap-3">
                        <span className={clsx("w-40 text-sm", theme === 'dark' ? "text-white" : "text-gray-900")}>{language === 'fr' ? 'Focus barre d’URL' : 'Focus URL bar'}</span>
                        <input
                          value={localShortcuts.focusUrl}
                          onChange={(e) => setLocalShortcuts({ ...localShortcuts, focusUrl: e.target.value })}
                          className={clsx("flex-1 px-3 py-2 rounded-lg border text-sm outline-none", theme === 'dark' ? "bg-[#181825] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900")}
                          placeholder="Ctrl+L"
                        />
                      </label>
                      <label className="flex items-center gap-3">
                        <span className={clsx("w-40 text-sm", theme === 'dark' ? "text-white" : "text-gray-900")}>{language === 'fr' ? 'Recharger' : 'Reload'}</span>
                        <input
                          value={localShortcuts.reloadTab}
                          onChange={(e) => setLocalShortcuts({ ...localShortcuts, reloadTab: e.target.value })}
                          className={clsx("flex-1 px-3 py-2 rounded-lg border text-sm outline-none", theme === 'dark' ? "bg-[#181825] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900")}
                          placeholder="Ctrl+R"
                        />
                      </label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setLocalShortcuts(shortcuts)}
                        className={clsx("px-3 py-2 rounded-lg text-sm transition-colors", theme === 'dark' ? "bg-white/10 text-white hover:bg-white/20" : "bg-white border hover:bg-gray-50 text-gray-900")}
                      >
                        {language === 'fr' ? 'Annuler' : 'Cancel'}
                      </button>
                      <button
                        onClick={() => setShortcuts({ ...shortcuts, ...localShortcuts })}
                        className={clsx("px-3 py-2 rounded-lg text-sm text-white transition-colors", colors.bgSolid, colors.bgHover)}
                      >
                        {language === 'fr' ? 'Enregistrer' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Extensions */}
                <div>
                  <h3 className={clsx("text-lg font-medium mb-4", theme === 'dark' ? "text-white" : "text-gray-900")}>
                    {language === 'fr' ? 'Extensions' : 'Extensions'}
                  </h3>
                  <div className={clsx("p-4 rounded-xl border flex items-center justify-between", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}>
                    <div>
                      <h4 className={clsx("font-medium", theme === 'dark' ? "text-white" : "text-gray-900")}>Chrome Web Store</h4>
                      <p className={clsx("text-sm max-w-xs", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                        {language === 'fr' ? 'Accédez à des milliers d\'extensions pour personnaliser votre expérience.' : 'Access thousands of extensions to customize your experience.'}
                      </p>
                    </div>
                    <button 
                      onClick={() => onOpenUrl('https://chrome.google.com/webstore')}
                      className={clsx("px-4 py-2 rounded-lg font-medium transition-colors text-white", colors.bgSolid, colors.bgHover)}
                    >
                      {language === 'fr' ? 'Ouvrir le Store' : 'Open Store'}
                    </button>
                  </div>
                </div>

                {/* Privacy & Security */}
                <div>
                  <h3 className={clsx("text-lg font-medium mb-4", theme === 'dark' ? "text-white" : "text-gray-900")}>
                    {language === 'fr' ? 'Confidentialité & Sécurité' : 'Privacy & Security'}
                  </h3>
                  <div className="space-y-4">
                    {/* AdBlock Toggle */}
                    <div className={clsx("p-4 rounded-xl border flex items-center justify-between", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}>
                      <div>
                        <h4 className={clsx("font-medium", theme === 'dark' ? "text-white" : "text-gray-900")}>
                          AdBlock
                        </h4>
                        <p className={clsx("text-sm", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                          {language === 'fr' ? 'Bloquer les publicités intrusives' : 'Block intrusive advertisements'}
                        </p>
                      </div>
                      <button 
                        onClick={() => setAdBlockEnabled(!adBlockEnabled)}
                        className={clsx(
                          "w-12 h-6 rounded-full transition-colors relative",
                          adBlockEnabled ? "bg-green-500" : (theme === 'dark' ? "bg-gray-600" : "bg-gray-300")
                        )}
                      >
                        <div className={clsx(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                          adBlockEnabled ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>

                    <div className={clsx("p-4 rounded-xl border flex items-center justify-between", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}>
                      <div>
                        <h4 className={clsx("font-medium", theme === 'dark' ? "text-white" : "text-gray-900")}>
                          {language === 'fr' ? 'Effacer les données de navigation' : 'Clear Browsing Data'}
                        </h4>
                        <p className={clsx("text-sm", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                          {language === 'fr' ? 'Historique, cookies, cache' : 'History, cookies, cache'}
                        </p>
                      </div>
                      <button 
                        onClick={onClearData}
                        className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 font-medium transition-colors"
                      >
                        {language === 'fr' ? 'Effacer' : 'Clear Data'}
                      </button>
                    </div>

                    <div className={clsx("p-4 rounded-xl border flex items-center justify-between", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}>
                      <div>
                        <h4 className={clsx("font-medium", theme === 'dark' ? "text-white" : "text-gray-900")}>
                          {language === 'fr' ? 'Importer les favoris' : 'Import Bookmarks'}
                        </h4>
                        <p className={clsx("text-sm", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                          {language === 'fr' ? 'Importer un fichier HTML' : 'Import HTML bookmark file'}
                        </p>
                      </div>
                      <button 
                        onClick={onImportBookmarks}
                        className={clsx("px-4 py-2 rounded-lg font-medium transition-colors text-white", colors.bgSolid, colors.bgHover)}
                      >
                        {language === 'fr' ? 'Importer' : 'Import'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
