import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCw, Layers, Menu, Star, Shield, Home
} from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence } from 'framer-motion';
import type { ThemeColors } from '../../lib/theme';
import { MobileSearchBar } from './MobileSearchBar';
import { MobileTabSwitcher } from './MobileTabSwitcher';
import { MobileSettingsSheet } from './MobileSettingsSheet';
import { Logo } from '../Logo';
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

interface AndroidLayoutProps {
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
  /** Toggle between liquid glass and normal bar style */
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

export function AndroidLayout({
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
  liquidGlassEnabled = false,
  onToggleLiquidGlass,
  children,
  onUrlChange,
  onUrlSubmit,
  onGetSuggestions,
  onSuggestionSelect,
  onGoBack,
  onGoForward,
  onReload,
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
}: AndroidLayoutProps) {
  const [showTabSwitcher, setShowTabSwitcher] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const isDark = theme === 'dark';
  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className={clsx(
      'mobile-layout flex flex-col h-screen w-screen overflow-hidden',
      isDark ? 'bg-[#0f0f1a]' : 'bg-white'
    )}>
      {/* ─── Android Top Header ──────────────────────────── */}
      <LiquidGlass
        className={clsx(
          'android-header',
          !isDark && 'light'
        )}
        radius={0}
        effect="regular"
        enabled={liquidGlassEnabled}
      >
        <div style={{ paddingTop: 'var(--safe-top)' }}>
          <div className="flex items-center gap-3 px-3 py-2">
            {/* Logo */}
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <Logo />
            </div>

            {/* URL Bar */}
            <div className="flex-1">
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
            </div>

            {/* Ad Shield */}
            <button
              onClick={onToggleAdBlock}
              className={clsx(
                'android-nav-button relative',
                adBlockEnabled && 'active'
              )}
            >
              <Shield className={clsx('w-5 h-5', adBlockEnabled ? colors.text : '')} />
              {adBlockEnabled && blockedAdsCount > 0 && (
                <span className={clsx(
                  'absolute -top-1 -right-1 min-w-[14px] h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center px-0.5',
                  colors.bgSolid, 'text-white'
                )}>
                  {blockedAdsCount > 99 ? '99+' : blockedAdsCount}
                </span>
              )}
            </button>

            {/* Tab count */}
            <button
              onClick={() => setShowTabSwitcher(true)}
              className={clsx(
                'android-nav-button relative',
              )}
            >
              <Layers className="w-5 h-5" />
              <span className={clsx(
                'absolute -top-1 -right-1 min-w-[14px] h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center px-0.5',
                colors.bgSolid, 'text-white'
              )}>
                {tabs.length}
              </span>
            </button>

            {/* Menu */}
            <button
              onClick={() => setShowSettingsSheet(true)}
              className="android-nav-button"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Loading bar */}
          {activeTab?.isLoading && (
            <div className="h-[2px] w-full relative overflow-hidden">
              <div
                className={clsx('h-full rounded-r-full absolute', colors.bgSolid)}
                style={{
                  animation: 'loading-bar 1.5s ease-in-out infinite',
                  width: '60%',
                }}
              />
            </div>
          )}
        </div>
      </LiquidGlass>

      {/* ─── Main Content Area ─────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {children}
      </div>

      {/* ─── Android Bottom Nav ──────────────────────────── */}
      <LiquidGlass
        className={clsx('android-bottom-bar', !isDark && 'light')}
        radius={0}
        effect="regular"
        enabled={liquidGlassEnabled}
      >
        <div className="flex items-center justify-around px-2 py-1.5">
          {/* Home */}
          <button
            onClick={() => onUrlSubmit('explore://newtab')}
            className="android-nav-button"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* Back */}
          <button
            onClick={onGoBack}
            className="android-nav-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Reload */}
          <button onClick={onReload} className="android-nav-button">
            <RotateCw className={clsx('w-5 h-5', activeTab?.isLoading && 'animate-spin')} />
          </button>

          {/* Forward */}
          <button
            onClick={onGoForward}
            className="android-nav-button"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Bookmark */}
          <button
            onClick={onToggleBookmark}
            className={clsx('android-nav-button', isBookmarked && 'active')}
          >
            <Star className={clsx('w-5 h-5', isBookmarked && 'fill-current')} />
          </button>
        </div>
      </LiquidGlass>

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
