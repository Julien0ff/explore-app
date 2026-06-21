import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCw, Layers, Ellipsis, Star, Home
} from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence } from 'framer-motion';
import type { ThemeColors } from '../../lib/theme';
import { MobileSearchBar } from './MobileSearchBar';
import { MobileTabSwitcher } from './MobileTabSwitcher';
import { MobileSettingsSheet } from './MobileSettingsSheet';

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

      {/* ─── iOS Bottom Bar ──────────────────────────── */}
      <div className={clsx(
        'ios-bottom-nav fixed bottom-4 left-4 right-4 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-300 z-50',
        !isDark && 'light'
      )}>
        {/* Search Bubble */}
        <div className="px-2 pt-2 pb-1">
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

        {/* Navigation Row */}
        <div className="flex items-center justify-around px-2 py-1">
          {/* Back */}
          <button
            onClick={onGoBack}
            className="ios-nav-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Forward */}
          <button
            onClick={onGoForward}
            className="ios-nav-button"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Bookmark */}
          <button
            onClick={onToggleBookmark}
            className={clsx('ios-nav-button', isBookmarked && 'active')}
          >
            <Star className={clsx('w-5 h-5', isBookmarked && 'fill-current')} />
          </button>

          {/* Home */}
          <button
            onClick={() => onUrlSubmit('explore://newtab')}
            className="ios-nav-button"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* Tab Switcher */}
          <button
            onClick={() => setShowTabSwitcher(true)}
            className="ios-nav-button relative"
          >
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

          {/* Reload */}
          <button onClick={onReload} className="ios-nav-button">
            <RotateCw className={clsx('w-5 h-5', activeTab?.isLoading && 'animate-spin')} />
          </button>

          {/* More (Settings Sheet) */}
          <button
            onClick={() => setShowSettingsSheet(true)}
            className="ios-nav-button"
          >
            <Ellipsis className="w-5 h-5" />
          </button>
        </div>
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
