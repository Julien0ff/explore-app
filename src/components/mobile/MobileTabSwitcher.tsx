import { X, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import type { ThemeColors } from '../../lib/theme';
import { IncognitoIcon } from '../IncognitoIcon';

interface Tab {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  isPrivate?: boolean;
}

interface MobileTabSwitcherProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onClose: () => void;
  theme: 'dark' | 'light';
  colors: ThemeColors;
  language: 'fr' | 'en';
}

export function MobileTabSwitcher({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onClose,
  theme,
  colors,
  language,
}: MobileTabSwitcherProps) {
  const isDark = theme === 'dark';

  const getFaviconUrl = (url: string) => {
    if (url.startsWith('explore://')) return null;
    try {
      const hostname = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch {
      return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={clsx(
        'fixed inset-0 z-999 flex flex-col transition-colors duration-500',
        isDark ? 'bg-[#0f0f1a]' : 'bg-gray-100'
      )}
    >
      {/* Header */}
      <div
        className={clsx(
          'flex items-center justify-between px-5 py-4',
          'pt-[calc(env(safe-area-inset-top,0px)+16px)]'
        )}
      >
        <h2 className={clsx('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>
          {tabs.length} {language === 'fr' ? (tabs.length > 1 ? 'onglets' : 'onglet') : (tabs.length > 1 ? 'tabs' : 'tab')}
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={onNewTab}
            className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90',
              colors.bgSolid, 'text-white'
            )}
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className={clsx(
              'text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95',
              isDark
                ? 'text-white/70 hover:text-white hover:bg-white/8'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
            )}
          >
            {language === 'fr' ? 'Fermer' : 'Done'}
          </button>
        </div>
      </div>

      {/* Tab Grid */}
      <div className="mobile-tab-grid flex-1" style={{ paddingTop: 0 }}>
        <AnimatePresence mode="popLayout">
          {tabs.map((tab) => {
            const favicon = getFaviconUrl(tab.url);
            const isActive = tab.id === activeTabId;

            return (
              <motion.div
                key={tab.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                onClick={() => {
                  onSelectTab(tab.id);
                  onClose();
                }}
                className={clsx(
                  'mobile-tab-card cursor-pointer flex items-center p-3 gap-4',
                  !isDark && 'light',
                  isActive && 'active'
                )}
              >
                {/* Icon area */}
                <div className={clsx(
                  'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-inner',
                  isDark ? 'from-white/10 to-white/5 ring-1 ring-white/10' : 'from-gray-100 to-gray-50 ring-1 ring-black/5',
                  isActive && (isDark ? 'ring-2 ring-indigo-500' : 'ring-2 ring-blue-500'),
                  tab.isPrivate && 'from-indigo-900 to-purple-900 text-white'
                )}>
                  {tab.isPrivate ? (
                    <IncognitoIcon size="sm" animated={false} />
                  ) : favicon ? (
                    <img src={favicon} alt="" className="w-6 h-6 rounded-md" />
                  ) : (
                    <div className={clsx(
                      'text-lg font-bold',
                      isDark ? 'text-white/50' : 'text-gray-400'
                    )}>
                      {tab.title?.[0]?.toUpperCase() || 'E'}
                    </div>
                  )}
                </div>

                {/* Text area */}
                <div className="flex-1 min-w-0">
                  <h3 className={clsx(
                    "font-bold text-sm truncate",
                    isDark ? "text-white/90" : "text-gray-900"
                  )}>
                    {tab.title || 'Nouvel onglet'}
                  </h3>
                  <p className={clsx(
                    "text-xs truncate mt-0.5",
                    isDark ? "text-white/40" : "text-gray-500"
                  )}>
                    {tab.url.replace(/^https?:\/\//, '')}
                  </p>
                </div>

                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-90",
                    isDark ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
