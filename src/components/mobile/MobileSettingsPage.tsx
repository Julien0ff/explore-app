import { SettingsModal } from '../SettingsModal';

interface MobileSettingsPageProps {
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  language: 'fr' | 'en';
  setLanguage: (lang: 'fr' | 'en') => void;
  searchEngine: string;
  setSearchEngine: (engine: string) => void;
  tabPosition: 'top' | 'left' | 'bottom' | 'right';
  setTabPosition: (pos: 'top' | 'left' | 'bottom' | 'right') => void;
  shortcuts: { newTab: string; closeTab: string; focusUrl: string; reloadTab: string; togglePrivate: string; saveSession: string; restoreSession: string; enablePiP: string; };
  setShortcuts: (s: { newTab: string; closeTab: string; focusUrl: string; reloadTab: string; togglePrivate: string; saveSession: string; restoreSession: string; enablePiP: string; }) => void;
  onOpenUrl: (url: string) => void;
  onImportBookmarks: () => void;
  onClearData: (onSuccess?: () => void) => void;
  windowStyle: 'mac' | 'windows';
  setWindowStyle: (style: 'mac' | 'windows') => void;
  showBookmarksBar: boolean;
  setShowBookmarksBar: (show: boolean) => void;
  ambientMode: boolean;
  setAmbientMode: (val: boolean) => void;
  checkForUpdates: () => void;
  onSaveSessionToCloud: () => Promise<boolean>;
  onRestoreSessionFromCloud: () => Promise<boolean>;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  autoCloudSync: boolean;
  setAutoCloudSync: (val: boolean) => void;
  earlyTesting: { screenshot: boolean; splitView: boolean; exploreSearch?: boolean; };
  setEarlyTesting: (val: { screenshot: boolean; splitView: boolean; exploreSearch?: boolean; }) => void;
  setConfirmModal: (val: { isOpen: boolean; title: string; message: string; onConfirm: (value?: string) => void; isInput?: boolean; inputPlaceholder?: string; }) => void;
  onClose: () => void;
}

export function MobileSettingsPage(props: MobileSettingsPageProps) {
  return (
    <div className="w-full h-full overflow-hidden bg-transparent pb-16">
      <SettingsModal 
        isOpen={true}
        isFullPage={true}
        isMobile={true}
        {...props}
      />
    </div>
  );
}
