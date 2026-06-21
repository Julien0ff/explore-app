import { 
  Shield, BookOpen, Globe, Settings, User, LogOut, 
  Moon, Sun, History, Lock 
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import type { ThemeColors } from '../../lib/theme';

interface MobileSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  colors: ThemeColors;
  language: 'fr' | 'en';
  adBlockEnabled: boolean;
  onToggleAdBlock: () => void;
  onToggleTheme: () => void;
  onOpenBookmarks: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onNewPrivateTab: () => void;
  userName?: string;
  userAvatar?: string;
  onOpenAuth: () => void;
  onLogout: () => void;
  isLoggedIn: boolean;
  blockedAdsCount: number;
}

export function MobileSettingsSheet({
  isOpen,
  onClose,
  theme,
  colors,
  language,
  adBlockEnabled,
  onToggleAdBlock,
  onToggleTheme,
  onOpenBookmarks,
  onOpenHistory,
  onOpenSettings,
  onNewPrivateTab,
  userName,
  userAvatar,
  onOpenAuth,
  onLogout,
  isLoggedIn,
  blockedAdsCount,
}: MobileSettingsSheetProps) {
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const quickActions = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: language === 'fr' ? 'Favoris' : 'Bookmarks',
      onClick: onOpenBookmarks,
    },
    {
      icon: <History className="w-5 h-5" />,
      label: language === 'fr' ? 'Historique' : 'History',
      onClick: onOpenHistory,
    },
    {
      icon: <Lock className="w-5 h-5" />,
      label: language === 'fr' ? 'Navigation\nprivée' : 'Private\nBrowsing',
      onClick: onNewPrivateTab,
    },
  ];

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="mobile-sheet-overlay"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={clsx('mobile-sheet', !isDark && 'light')}
      >
        {/* Handle */}
        <div className="mobile-sheet-handle" />

        <div className="px-5 pb-6 space-y-6">
          {/* User card */}
          <div className={clsx(
            'flex items-center gap-4 p-4 rounded-2xl',
            isDark ? 'bg-white/4' : 'bg-gray-50'
          )}>
            {isLoggedIn ? (
              <>
                <img
                  src={userAvatar}
                  alt=""
                  className="w-11 h-11 rounded-full border-2"
                  style={{ borderColor: colors.hex }}
                />
                <div className="flex-1 min-w-0">
                  <p className={clsx('font-semibold truncate', isDark ? 'text-white' : 'text-gray-900')}>
                    {userName}
                  </p>
                  <p className={clsx('text-xs', isDark ? 'text-white/40' : 'text-gray-400')}>
                    {language === 'fr' ? 'Synchronisé' : 'Synced'}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className={clsx(
                    'p-2.5 rounded-xl transition-all active:scale-90',
                    isDark ? 'hover:bg-white/8 text-white/40' : 'hover:bg-gray-200 text-gray-400'
                  )}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className={clsx(
                  'w-full flex items-center gap-3 py-1',
                  isDark ? 'text-white/70' : 'text-gray-600'
                )}
              >
                <div className={clsx(
                  'w-11 h-11 rounded-full flex items-center justify-center',
                  isDark ? 'bg-white/8' : 'bg-gray-200'
                )}>
                  <User className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className={clsx('font-semibold text-sm', isDark ? 'text-white' : 'text-gray-900')}>
                    {language === 'fr' ? 'Se connecter' : 'Sign in'}
                  </p>
                  <p className={clsx('text-xs', isDark ? 'text-white/40' : 'text-gray-400')}>
                    {language === 'fr' ? 'Synchroniser vos données' : 'Sync your data'}
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                className={clsx(
                  'flex flex-col items-center justify-center gap-2 py-3 h-[72px] rounded-2xl transition-all active:scale-90',
                  isDark ? 'bg-white/4 hover:bg-white/8 text-white/60' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
                )}
              >
                {action.icon}
                <span className="text-[10px] font-medium leading-tight text-center whitespace-pre-line">
                  {action.label}
                </span>
              </button>
            ))}
          </div>

          {/* Toggle rows */}
          <div className={clsx(
            'rounded-2xl overflow-hidden',
            isDark ? 'bg-white/4' : 'bg-gray-50'
          )}>
            {/* Ad Blocker */}
            <button
              onClick={onToggleAdBlock}
              className={clsx(
                'w-full flex items-center gap-4 px-4 py-3.5 transition-all active:scale-[0.98]',
                isDark ? 'hover:bg-white/4' : 'hover:bg-gray-100'
              )}
            >
              <Shield className={clsx('w-5 h-5', adBlockEnabled ? colors.text : (isDark ? 'text-white/30' : 'text-gray-300'))} />
              <div className="flex-1 text-left">
                <p className={clsx('text-sm font-medium', isDark ? 'text-white/80' : 'text-gray-700')}>
                  {language === 'fr' ? 'Bloqueur de pubs' : 'Ad Blocker'}
                </p>
                <p className={clsx('text-xs', isDark ? 'text-white/30' : 'text-gray-400')}>
                  {blockedAdsCount} {language === 'fr' ? 'bloquées' : 'blocked'}
                </p>
              </div>
              <div className={clsx(
                'w-12 h-7 rounded-full p-0.5 transition-colors',
                adBlockEnabled ? colors.bgSolid : (isDark ? 'bg-white/15' : 'bg-gray-300')
              )}>
                <div className={clsx(
                  'w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                  adBlockEnabled ? 'translate-x-5' : 'translate-x-0'
                )} />
              </div>
            </button>

            {/* Separator */}
            <div className={clsx('h-px mx-4', isDark ? 'bg-white/5' : 'bg-gray-200')} />

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={clsx(
                'w-full flex items-center gap-4 px-4 py-3.5 transition-all active:scale-[0.98]',
                isDark ? 'hover:bg-white/4' : 'hover:bg-gray-100'
              )}
            >
              {isDark
                ? <Moon className="w-5 h-5 text-indigo-400" />
                : <Sun className="w-5 h-5 text-amber-500" />
              }
              <p className={clsx('text-sm font-medium flex-1 text-left', isDark ? 'text-white/80' : 'text-gray-700')}>
                {isDark
                  ? (language === 'fr' ? 'Mode sombre' : 'Dark Mode')
                  : (language === 'fr' ? 'Mode clair' : 'Light Mode')
                }
              </p>
              <Globe className={clsx('w-4 h-4', isDark ? 'text-white/20' : 'text-gray-300')} />
            </button>
          </div>

          {/* Settings button */}
          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className={clsx(
              'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]',
              isDark ? 'bg-white/4 hover:bg-white/6 text-white/60' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
            )}
          >
            <Settings className="w-5 h-5" />
            <span className={clsx('text-sm font-medium', isDark ? 'text-white/80' : 'text-gray-700')}>
              {language === 'fr' ? 'Paramètres' : 'Settings'}
            </span>
          </button>
        </div>
      </motion.div>
    </>
  );
}
