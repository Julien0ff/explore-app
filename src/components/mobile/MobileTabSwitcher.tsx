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
        'fixed inset-0 z-[999] flex flex-col',
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
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.25 }}
                onClick={() => {
                  onSelectTab(tab.id);
                  onClose();
                }}
                className={clsx(
                  'mobile-tab-card cursor-pointer',
                  !isDark && 'light',
                  isActive && 'active'
                )}
              >
                {/* Preview area */}
                <div className={clsx(
                  'mobile-tab-preview flex items-center justify-center',
                  tab.isPrivate
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                    : isDark
                      ? 'bg-gradient-to-br from-white/3 to-white/1'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100'
                )}>
                  {tab.isPrivate ? (
                    <IncognitoIcon size="lg" animated={false} />
                  ) : favicon ? (
                    <img src={favicon} alt="" className="w-10 h-10 rounded-lg" />
                  ) : (
                    <div className={clsx(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold',
                      isDark ? 'bg-white/10 text-white/50' : 'bg-gray-200 text-gray-400'
                    )}>
                      {tab.title?.[0]?.toUpperCase() || 'E'}
                    </div>
                  )}
                </div>

                {/* Title bar */}
                <div className={clsx(
                  'mobile-tab-title flex items-center gap-2',
                  isDark ? 'text-white/80' : 'text-gray-700'
                )}>
                  {favicon && (
                    <img src={favicon} alt="" className="w-3.5 h-3.5 rounded-sm shrink-0" />
                  )}
                  <span className="truncate">{tab.title}</span>
                </div>

                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="mobile-tab-close"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
