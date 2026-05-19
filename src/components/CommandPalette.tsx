import { useState, useEffect, useRef } from 'react';
import { Search, Globe, Clock, X, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
  theme: string;
  language: string;
  history: { title?: string; url: string }[];
}

export function CommandPalette({ isOpen, onClose, onNavigate, theme, language, history }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setQuery('');
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getSearchUrl = (q: string) => {
    if (q.startsWith('http')) return q;
    if (q.includes('.') && !q.includes(' ')) return `https://${q}`;
    return `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
  };

  const filteredHistory = history
    .filter(item => item.title?.toLowerCase().includes(query.toLowerCase()) || item.url.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Palette */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
            className={clsx(
              "relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col mx-4",
              theme === 'dark' ? "bg-[#1e1e2e]/90 border-white/10 text-white" : "bg-white/95 border-gray-200 text-gray-900",
              "backdrop-blur-xl"
            )}
          >
            <div className={clsx("flex items-center px-4 py-3 border-b", theme === 'dark' ? "border-white/10" : "border-gray-200")}>
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query) {
                    onNavigate(getSearchUrl(query));
                    onClose();
                  }
                }}
                className={clsx("flex-1 bg-transparent border-none outline-none text-lg font-medium", theme === 'dark' ? "placeholder-gray-500" : "placeholder-gray-400")}
                placeholder={language === 'fr' ? "Que cherchez-vous ? (Échap pour fermer)" : "What are you looking for? (Esc to close)"}
              />
              <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
              {query && (
                <div className="px-2 pb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-2 mt-2">
                    {language === 'fr' ? 'Rechercher sur le web' : 'Search the web'}
                  </div>
                  <button 
                    onClick={() => {
                      onNavigate(getSearchUrl(query));
                      onClose();
                    }}
                    className={clsx("w-full text-left px-3 py-3 rounded-xl flex items-center justify-between group transition-colors", 
                      theme === 'dark' ? "hover:bg-blue-500/10" : "hover:bg-blue-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Globe className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-blue-500">"{query}"</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              )}

              {filteredHistory.length > 0 && (
                <div className={clsx("px-2 pb-2 border-t pt-2", theme === 'dark' ? "border-white/5" : "border-gray-100")}>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-2 mt-2">
                    {language === 'fr' ? 'Historique' : 'History'}
                  </div>
                  {filteredHistory.map((item, id) => (
                    <button 
                      key={id}
                      onClick={() => {
                        onNavigate(item.url);
                        onClose();
                      }}
                      className={clsx(
                        "w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-4 group transition-colors",
                        theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-100"
                      )}
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div className="flex flex-col overflow-hidden max-w-md">
                        <span className="font-medium text-sm truncate">{item.title || item.url}</span>
                        <span className="text-xs text-gray-500 truncate">{item.url}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {!query && filteredHistory.length === 0 && (
                  <div className="py-8 text-center text-sm font-medium text-gray-400">
                      {language === 'fr' ? 'Tapez pour rechercher ou naviguer' : 'Type to search or navigate...'}
                  </div>
              )}
            </div>

            <div className={clsx("px-4 py-2.5 text-[10px] font-semibold flex justify-end items-center border-t", theme === 'dark' ? "bg-black/20 text-gray-500 border-white/5" : "bg-gray-50 text-gray-400 border-gray-100")}>
              <span><kbd className={clsx("font-sans px-1.5 py-0.5 rounded mx-1 shadow-sm", theme === 'dark' ? "bg-white/10" : "bg-white border text-gray-500")}>Enter</kbd> {language === 'fr' ? 'pour ouvrir' : 'to open'}</span>
              <span><kbd className={clsx("font-sans px-1.5 py-0.5 rounded mx-1 shadow-sm", theme === 'dark' ? "bg-white/10" : "bg-white border text-gray-500")}>Esc</kbd> {language === 'fr' ? 'pour fermer' : 'to close'}</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
