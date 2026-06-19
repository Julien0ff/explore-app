import { useState, useRef } from 'react';
import { Search, X, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import type { ThemeColors } from '../../lib/theme';
import { detectPlatform } from '../../lib/platform';

interface MobileSearchBarProps {
  urlInput: string;
  onUrlChange: (value: string) => void;
  onSubmit: (url: string) => void;
  suggestions: string[];
  onSuggestionSelect: (suggestion: string) => void;
  onGetSuggestions: (query: string) => void;
  isPrivate: boolean;
  theme: 'dark' | 'light';
  colors: ThemeColors;
  language: 'fr' | 'en';
  currentUrl?: string;
}

export function MobileSearchBar({
  urlInput,
  onUrlChange,
  onSubmit,
  suggestions,
  onSuggestionSelect,
  onGetSuggestions,
  isPrivate,
  theme,
  colors,
  language,
  currentUrl,
}: MobileSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const platform = detectPlatform();
  const isDark = theme === 'dark';
  const isIOS = platform === 'ios';

  const displayUrl = isFocused
    ? urlInput
    : currentUrl?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') || '';

  const isSecure = currentUrl?.startsWith('https://');

  const handleFocus = () => {
    setIsFocused(true);
    onUrlChange(currentUrl || '');
    setTimeout(() => inputRef.current?.select(), 50);
  };

  const handleBlur = () => {
    setTimeout(() => setIsFocused(false), 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(urlInput);
    inputRef.current?.blur();
    setIsFocused(false);
  };

  const handleInputChange = (value: string) => {
    onUrlChange(value);
    if (value.length > 1) {
      onGetSuggestions(value);
    }
  };

  return (
    <div className="relative w-full px-4">
      <form onSubmit={handleSubmit}>
        <div
          className={clsx(
            isIOS ? 'ios-search-bubble' : 'android-url-bar',
            !isDark && 'light'
          )}
        >
          {/* Icon */}
          {isPrivate ? (
            <Lock className={clsx('w-4 h-4 shrink-0', isDark ? 'text-slate-400' : 'text-slate-500')} />
          ) : isSecure && !isFocused ? (
            <Lock className={clsx('w-4 h-4 shrink-0', colors.text)} />
          ) : (
            <Search className={clsx('w-4 h-4 shrink-0', isDark ? 'text-white/40' : 'text-gray-400')} />
          )}

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={isFocused ? urlInput : displayUrl}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={
              language === 'fr'
                ? 'Rechercher ou saisir une URL…'
                : 'Search or enter URL…'
            }
            className={clsx(
              'flex-1 bg-transparent outline-none text-sm',
              isDark ? 'text-white placeholder:text-white/30' : 'text-gray-900 placeholder:text-gray-400',
              !isFocused && 'text-center'
            )}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            enterKeyHint="go"
          />

          {/* Clear button */}
          {isFocused && urlInput && (
            <button
              type="button"
              onClick={() => onUrlChange('')}
              className={clsx(
                'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                isDark ? 'bg-white/10' : 'bg-gray-200'
              )}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={clsx(
              'absolute left-4 right-4 mt-2 rounded-2xl overflow-hidden z-50 shadow-2xl',
              isDark
                ? 'bg-[#1e1e2e]/95 border border-white/8'
                : 'bg-white/95 border border-gray-200'
            )}
            style={{ backdropFilter: 'blur(20px)' }}
          >
            {suggestions.slice(0, 6).map((suggestion, i) => (
              <button
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSuggestionSelect(suggestion);
                }}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors',
                  isDark
                    ? 'hover:bg-white/5 text-white/80'
                    : 'hover:bg-gray-50 text-gray-700',
                  i > 0 && (isDark ? 'border-t border-white/4' : 'border-t border-gray-100')
                )}
              >
                <Search className={clsx('w-4 h-4 shrink-0', isDark ? 'text-white/25' : 'text-gray-300')} />
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
