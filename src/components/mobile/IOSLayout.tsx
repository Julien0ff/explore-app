import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Layers, Ellipsis, Star, Home
} from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence } from 'framer-motion';
import type { ThemeColors } from '../../lib/theme';
import { MobileSearchBar } from './MobileSearchBar';
import { MobileTabSwitcher } from './MobileTabSwitcher';
import { MobileSettingsSheet } from './MobileSettingsSheet';
import { LiquidGlass } from '../ui/LiquidGlass';

interface Tab {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  isPrivate?: boolean;
}

interface IOSLayoutProps {
  tabs: Tab[];
  activeTabId: string;
  urlInput: string;
  theme: 'dark' | 'light';
  colors: ThemeColors;
  language: 'fr' | 'en';
  suggestions: string[];
  adBlockEnabled: boolean;
  blockedAdsCount: number;
  isBookmarked: boolean;
  userName?: string;
  userAvatar?: string;
  isLoggedIn: boolean;
  /** Toggle between liquid glass and normal tab bar style */
  liquidGlassEnabled?: boolean;
  onToggleLiquidGlass?: () => void;
  children: React.ReactNode;
  onUrlChange: (value: string) => void;
  onUrlSubmit: (url: string) => void;
  onGetSuggestions: (query: string) => void;
  onSuggestionSelect: (suggestion: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onNewPrivateTab: () => void;
  onToggleBookmark: () => void;
  onToggleAdBlock: () => void;
  onToggleTheme: () => void;
  onOpenBookmarks: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function IOSLayout({
  tabs,
  activeTabId,
  urlInput,
  theme,
  colors,
  language,
  suggestions,
  adBlockEnabled,
  blockedAdsCount,
  isBookmarked,
  userName,
  userAvatar,
  isLoggedIn,
  liquidGlassEnabled = true,
  onToggleLiquidGlass,
  children,
  onUrlChange,
  onUrlSubmit,
  onGetSuggestions,
  onSuggestionSelect,
  onGoBack,
  onGoForward,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onNewPrivateTab,
  onToggleBookmark,
  onToggleAdBlock,
  onToggleTheme,
  onOpenBookmarks,
  onOpenHistory,
  onOpenSettings,
  onOpenAuth,
  onLogout,
}: IOSLayoutProps) {
  const [showTabSwitcher, setShowTabSwitcher] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const isDark = theme === 'dark';
  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className={clsx(
      'mobile-layout flex flex-col h-screen w-screen overflow-hidden',
      isDark ? 'bg-[#0f0f1a]' : 'bg-white'
    )}>
      {/* ─── Main Content Area ─────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Page content (WebView / Internal Pages) */}
        {children}

        {/* Loading progress bar */}
        {activeTab?.isLoading && (
          <div className="absolute top-0 left-0 right-0 h-[2px] z-50">
            <div
              className={clsx('h-full rounded-r-full', colors.bgSolid)}
              style={{
                animation: 'loading-bar 1.5s ease-in-out infinite',
                width: '60%',
              }}
            />
          </div>
        )}
      </div>

      {/* ─── iOS Floating Search Pill ──────────────────────────── */}
      <div className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+64px)] left-4 right-4 z-50 pointer-events-none">
        <LiquidGlass 
          className="pointer-events-auto shadow-xl"
          radius={28}
          effect="clear"
          enabled={liquidGlassEnabled}
        >
          <MobileSearchBar
            urlInput={urlInput}
            onUrlChange={onUrlChange}
            onSubmit={onUrlSubmit}
            suggestions={suggestions}
            onSuggestionSelect={onSuggestionSelect}
            onGetSuggestions={onGetSuggestions}
            isPrivate={!!activeTab?.isPrivate}
            theme={theme}
            colors={colors}
            language={language}
            currentUrl={activeTab?.url}
          />
        </LiquidGlass>
      </div>

      {/* ─── iOS Bottom Tab Bar ──────────────────────────── */}
      <div className={clsx('absolute bottom-0 left-0 right-0 z-50 pointer-events-none')}>
        <LiquidGlass
          className={clsx(
            'w-full pointer-events-auto border-t',
            liquidGlassEnabled ? 'border-white/10' : (isDark ? 'border-white/10 bg-[#0f0f1a]/90' : 'border-gray-200 bg-white/90')
          )}
          radius={0}
          effect="regular"
          enabled={liquidGlassEnabled}
        >
          {/* Navigation Row */}
          <div className="flex items-center justify-around px-2 py-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
            {/* Back */}
            <button onClick={onGoBack} className="ios-nav-button">
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Forward */}
            <button onClick={onGoForward} className="ios-nav-button">
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Bookmark */}
            <button onClick={onToggleBookmark} className={clsx('ios-nav-button', isBookmarked && 'active')}>
              <Star className={clsx('w-5 h-5', isBookmarked && 'fill-current')} />
            </button>

            {/* Home */}
            <button onClick={() => onUrlSubmit('explore://newtab')} className="ios-nav-button">
              <Home className="w-5 h-5" />
            </button>

            {/* Tab Switcher */}
            <button onClick={() => setShowTabSwitcher(true)} className="ios-nav-button relative">
              <Layers className="w-5 h-5" />
              {tabs.length > 1 && (
                <span className={clsx(
                  'absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1',
                  colors.bgSolid, 'text-white'
                )}>
                  {tabs.length}
                </span>
              )}
            </button>

            {/* More (Settings Sheet) */}
            <button onClick={() => setShowSettingsSheet(true)} className="ios-nav-button">
              <Ellipsis className="w-5 h-5" />
            </button>
          </div>
        </LiquidGlass>
      </div>

      {/* ─── Tab Switcher Overlay ──────────────────────────── */}
      <AnimatePresence>
        {showTabSwitcher && (
          <MobileTabSwitcher
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={onSelectTab}
            onCloseTab={onCloseTab}
            onNewTab={onNewTab}
            onClose={() => setShowTabSwitcher(false)}
            theme={theme}
            colors={colors}
            language={language}
          />
        )}
      </AnimatePresence>

      {/* ─── Settings Sheet ────────────────────────────────── */}
      <AnimatePresence>
        {showSettingsSheet && (
          <MobileSettingsSheet
            isOpen={showSettingsSheet}
            onClose={() => setShowSettingsSheet(false)}
            theme={theme}
            colors={colors}
            language={language}
            adBlockEnabled={adBlockEnabled}
            onToggleAdBlock={onToggleAdBlock}
            onToggleTheme={onToggleTheme}
            onOpenBookmarks={onOpenBookmarks}
            onOpenHistory={onOpenHistory}
            onOpenSettings={onOpenSettings}
            onNewPrivateTab={onNewPrivateTab}
            userName={userName}
            userAvatar={userAvatar}
            onOpenAuth={onOpenAuth}
            onLogout={onLogout}
            isLoggedIn={isLoggedIn}
            blockedAdsCount={blockedAdsCount}
            liquidGlassEnabled={liquidGlassEnabled}
            onToggleLiquidGlass={onToggleLiquidGlass}
          />
        )}
      </AnimatePresence>

      {/* Loading bar keyframes */}
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
