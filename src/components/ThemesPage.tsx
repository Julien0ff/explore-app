import { useState } from 'react';
import { clsx } from 'clsx';
import { Palette, Check, RotateCcw, Sparkles, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ThemeColors } from '../lib/theme';
import { PREDEFINED_THEMES, getActiveThemeId, setActiveThemeId, applyTheme } from '../lib/themes';
import type { ExploreTheme } from '../lib/themes';

interface ThemesPageProps {
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  accentColor: string;
  language: 'fr' | 'en';
  colors: ThemeColors;
  isEmbedded?: boolean;
}

export function ThemesPage({ theme, setTheme, language, colors, isEmbedded }: ThemesPageProps) {
  const [activeThemeId, setActiveThemeState] = useState<string | null>(getActiveThemeId());
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);
  const isDark = theme === 'dark';

  const darkThemes = PREDEFINED_THEMES.filter(t => t.mode === 'dark');
  const lightThemes = PREDEFINED_THEMES.filter(t => t.mode === 'light');

  const handleSelectTheme = (t: ExploreTheme) => {
    if (activeThemeId === t.id) {
      // Deselect
      setActiveThemeState(null);
      setActiveThemeId(null);
      applyTheme(null);
      window.dispatchEvent(new CustomEvent('explore-theme-changed', { detail: null }));
    } else {
      setActiveThemeState(t.id);
      setActiveThemeId(t.id);
      applyTheme(t);
      window.dispatchEvent(new CustomEvent('explore-theme-changed', { detail: t.id }));
      // Also switch the base dark/light mode to match
      if (t.mode !== theme) {
        setTheme(t.mode);
      }
    }
  };

  const handleReset = () => {
    setActiveThemeState(null);
    setActiveThemeId(null);
    applyTheme(null);
    window.dispatchEvent(new CustomEvent('explore-theme-changed', { detail: null }));
  };

  return (
    <div className={clsx(
      "w-full animate-fadeIn",
      isEmbedded ? "" : "h-full overflow-y-auto p-8 md:p-12"
    )}>
      <div className={clsx("max-w-5xl mx-auto", isEmbedded ? "pt-4" : "")}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", colors.bgSolid)}>
              <Palette className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                {language === 'fr' ? 'Thèmes' : 'Themes'}
              </h1>
              <p className={clsx("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-500")}>
                {language === 'fr'
                  ? 'Personnalisez l\'apparence de votre navigateur'
                  : 'Customize the look of your browser'
                }
              </p>
            </div>
          </div>
          {activeThemeId && (
            <button
              onClick={handleReset}
              className={clsx(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all active:scale-95",
                isDark ? "bg-white/10 hover:bg-white/15 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
            >
              <RotateCcw className="w-4 h-4" />
              {language === 'fr' ? 'Thème par défaut' : 'Reset to default'}
            </button>
          )}
        </div>

        {/* Active Theme Banner */}
        <AnimatePresence>
          {activeThemeId && (() => {
            const active = PREDEFINED_THEMES.find(t => t.id === activeThemeId);
            if (!active) return null;
            return (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={clsx(
                  "flex items-center gap-4 p-5 rounded-2xl border mb-10",
                  isDark ? "bg-white/3 border-white/10" : "bg-white border-gray-200 shadow-sm"
                )}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: active.preview }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className={clsx("w-4 h-4", colors.text)} />
                    <span className={clsx("text-sm font-semibold", isDark ? "text-white" : "text-gray-900")}>
                      {language === 'fr' ? 'Thème actif' : 'Active theme'}
                    </span>
                  </div>
                  <p className={clsx("text-sm mt-0.5", isDark ? "text-gray-400" : "text-gray-500")}>
                    {language === 'fr' ? active.name : active.nameEn}
                  </p>
                </div>
                <Check className={clsx("w-6 h-6", colors.text)} />
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Dark Themes Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Moon className={clsx("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
            <h2 className={clsx("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
              {language === 'fr' ? 'Thèmes sombres' : 'Dark themes'}
            </h2>
            <span className={clsx("text-xs px-2 py-0.5 rounded-full ml-1", isDark ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500")}>
              {darkThemes.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {darkThemes.map((t) => (
              <ThemeCard
                key={t.id}
                exploreTheme={t}
                isActive={activeThemeId === t.id}
                isHovered={hoveredTheme === t.id}
                onHover={setHoveredTheme}
                onSelect={handleSelectTheme}
                language={language}
                isDark={isDark}
                colors={colors}
              />
            ))}
          </div>
        </div>

        {/* Light Themes Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Sun className={clsx("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
            <h2 className={clsx("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
              {language === 'fr' ? 'Thèmes clairs' : 'Light themes'}
            </h2>
            <span className={clsx("text-xs px-2 py-0.5 rounded-full ml-1", isDark ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500")}>
              {lightThemes.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {lightThemes.map((t) => (
              <ThemeCard
                key={t.id}
                exploreTheme={t}
                isActive={activeThemeId === t.id}
                isHovered={hoveredTheme === t.id}
                onHover={setHoveredTheme}
                onSelect={handleSelectTheme}
                language={language}
                isDark={isDark}
                colors={colors}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Theme Card Component ──────────────────────────────────────────────

interface ThemeCardProps {
  exploreTheme: ExploreTheme;
  isActive: boolean;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onSelect: (t: ExploreTheme) => void;
  language: 'fr' | 'en';
  isDark: boolean;
  colors: ThemeColors;
}

function ThemeCard({ exploreTheme, isActive, onHover, onSelect, language, isDark }: ThemeCardProps) {
  const t = exploreTheme;

  return (
    <motion.button
      layout
      onClick={() => onSelect(t)}
      onMouseEnter={() => onHover(t.id)}
      onMouseLeave={() => onHover(null)}
      className={clsx(
        "relative group text-left rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer",
        isActive
          ? clsx("ring-2 shadow-xl", isDark ? "border-white/20 bg-white/5" : "border-gray-300 bg-white")
          : clsx(isDark ? "border-white/5 bg-white/2 hover:border-white/15 hover:bg-white/5" : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg")
      )}
      style={isActive ? { borderColor: t.colors.accent, boxShadow: `0 0 20px ${t.colors.accent}30` } : undefined}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Preview */}
      <div className="relative h-36 w-full overflow-hidden flex items-center justify-center" style={{ background: t.preview, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {/* Mini browser mockup */}
        <div className="w-[calc(100%-24px)] h-[calc(100%-24px)] rounded-lg overflow-hidden shadow-xl flex flex-col border border-white/10" style={{ backgroundColor: t.colors.bgPrimary }}>
          {/* Mock topbar */}
          <div className="h-6 flex items-center px-2 gap-1" style={{ backgroundColor: t.colors.topbarBg, borderBottom: `1px solid ${t.colors.borderSubtle}` }}>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400/60" />
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400/60" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
            </div>
            <div className="flex-1 mx-2 h-3 rounded-full" style={{ backgroundColor: t.colors.inputBg }} />
          </div>
          {/* Mock content */}
          <div className="p-2 space-y-1.5">
            <div className="h-2 w-3/4 rounded-full" style={{ backgroundColor: t.colors.accent, opacity: 0.6 }} />
            <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: t.colors.textMuted, opacity: 0.3 }} />
            <div className="h-1.5 w-5/6 rounded-full" style={{ backgroundColor: t.colors.textMuted, opacity: 0.2 }} />
            <div className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: t.colors.textMuted, opacity: 0.15 }} />
          </div>
        </div>

        {/* Active check */}
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: t.colors.accent }}
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={clsx("font-bold text-sm", isDark ? "text-white" : "text-gray-900")}>
            {language === 'fr' ? t.name : t.nameEn}
          </h3>
        </div>
        <p className={clsx("text-xs leading-relaxed", isDark ? "text-gray-400" : "text-gray-500")}>
          {language === 'fr' ? t.description : t.descriptionEn}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex gap-1">
            {[t.colors.accent, t.colors.bgPrimary, t.colors.textPrimary, t.colors.bgTertiary].map((c, i) => (
              <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span className={clsx("text-[10px] ml-auto", isDark ? "text-gray-500" : "text-gray-400")}>
            {t.author}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
