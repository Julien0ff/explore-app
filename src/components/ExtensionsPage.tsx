import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Puzzle, Plus, Trash2, FolderOpen, AlertCircle, Package, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ThemeColors } from '../lib/theme';

interface ExtensionInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  icon?: string;
  popup?: string;
  enabled: boolean;
  path: string;
}

interface ExtensionsPageProps {
  theme: 'dark' | 'light';
  accentColor: string;
  language: 'fr' | 'en';
  colors: ThemeColors;
  isEmbedded?: boolean;
  onOpenStore?: () => void;
}

export function ExtensionsPage({ theme, language, colors, isEmbedded, onOpenStore }: ExtensionsPageProps) {
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    loadExtensions();
  }, []);

  const loadExtensions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const electron = (window as any).electron;
      if (electron?.extensionsLoadAll) {
        const loaded = await electron.extensionsLoadAll();
        setExtensions(loaded || []);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const electron = (window as any).electron;
      if (!electron?.extensionsPickFolder) return;
      
      const folderPath = await electron.extensionsPickFolder();
      if (!folderPath) {
        setIsInstalling(false);
        return;
      }

      const result = await electron.extensionsInstall(folderPath);
      if (result.success && result.extension) {
        setExtensions(prev => [...prev, result.extension]);
        window.dispatchEvent(new Event('extensions-changed'));
      } else {
        setError(result.error || (language === 'fr' ? 'Échec de l\'installation' : 'Installation failed'));
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setIsInstalling(false);
    }
  };

  const handleRemove = async (ext: ExtensionInfo) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const electron = (window as any).electron;
      if (!electron?.extensionsRemove) return;

      const result = await electron.extensionsRemove(ext.id, ext.path);
      if (result.success) {
        setExtensions(prev => prev.filter(e => e.id !== ext.id));
        window.dispatchEvent(new Event('extensions-changed'));
      } else {
        setError(result.error || (language === 'fr' ? 'Échec de la suppression' : 'Removal failed'));
      }
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className={clsx(
      "w-full animate-fadeIn",
      isEmbedded ? "" : "h-full overflow-y-auto p-8 md:p-12"
    )}>
      <div className={clsx("max-w-4xl mx-auto", isEmbedded ? "pt-4" : "")}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", colors.bgSolid)}>
              <Puzzle className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                {language === 'fr' ? 'Extensions' : 'Extensions'}
              </h1>
              <p className={clsx("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-500")}>
                {language === 'fr'
                  ? `${extensions.length} extension${extensions.length > 1 ? 's' : ''} installée${extensions.length > 1 ? 's' : ''}`
                  : `${extensions.length} extension${extensions.length !== 1 ? 's' : ''} installed`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onOpenStore) {
                  onOpenStore();
                } else {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const electron = (window as any).electron;
                  if (electron?.openExternal) electron.openExternal('https://chromewebstore.google.com/');
                  else window.open('https://chromewebstore.google.com/', '_blank');
                }
              }}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md active:scale-95",
                isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-900"
              )}
            >
              <Package className="w-4 h-4" />
              {language === 'fr' ? 'Ouvrir le Store' : 'Open Store'}
            </button>
            <button
              onClick={loadExtensions}
              className={clsx(
                "p-2.5 rounded-xl transition-all",
                isDark ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              )}
              title={language === 'fr' ? 'Actualiser' : 'Refresh'}
            >
              <RefreshCw className={clsx("w-5 h-5", isLoading && "animate-spin")} />
            </button>
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className={clsx(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50",
                colors.bgSolid, colors.bgHover
              )}
            >
              {isInstalling ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FolderOpen className="w-4 h-4" />
              )}
              {language === 'fr' ? 'Charger une extension' : 'Load extension'}
            </button>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={clsx(
                "flex items-center gap-3 p-4 rounded-2xl mb-6 border",
                isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"
              )}
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Banner */}
        <div className={clsx(
          "p-5 rounded-2xl border mb-8",
          isDark ? "bg-white/3 border-white/5" : "bg-blue-50/50 border-blue-100"
        )}>
          <div className="flex items-start gap-3">
            <Package className={clsx("w-5 h-5 mt-0.5 shrink-0", colors.text)} />
            <div>
              <p className={clsx("text-sm font-medium", isDark ? "text-gray-200" : "text-gray-700")}>
                {language === 'fr'
                  ? 'Comment installer une extension ?'
                  : 'How to install an extension?'
                }
              </p>
              <p className={clsx("text-sm mt-1.5 leading-relaxed", isDark ? "text-gray-400" : "text-gray-500")}>
                {language === 'fr'
                  ? '1. Téléchargez une extension Chrome au format dézippé (dossier contenant un manifest.json). 2. Cliquez sur « Charger une extension ». 3. Sélectionnez le dossier de l\'extension.'
                  : '1. Download a Chrome extension as an unpacked folder (containing a manifest.json). 2. Click "Load extension". 3. Select the extension folder.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Extensions Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className={clsx("w-8 h-8 animate-spin", colors.text)} />
          </div>
        ) : extensions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={clsx(
              "w-20 h-20 rounded-3xl flex items-center justify-center mb-6",
              isDark ? "bg-white/5" : "bg-gray-100"
            )}>
              <Puzzle className={clsx("w-10 h-10", isDark ? "text-gray-600" : "text-gray-300")} />
            </div>
            <p className={clsx("text-lg font-semibold mb-2", isDark ? "text-gray-300" : "text-gray-600")}>
              {language === 'fr' ? 'Aucune extension installée' : 'No extensions installed'}
            </p>
            <p className={clsx("text-sm max-w-md", isDark ? "text-gray-500" : "text-gray-400")}>
              {language === 'fr'
                ? 'Chargez votre première extension Chrome pour personnaliser votre navigation.'
                : 'Load your first Chrome extension to customize your browsing experience.'
              }
            </p>
            <button
              onClick={handleInstall}
              className={clsx(
                "mt-8 flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold transition-all shadow-lg hover:shadow-xl active:scale-95",
                colors.bgSolid, colors.bgHover
              )}
            >
              <Plus className="w-5 h-5" />
              {language === 'fr' ? 'Installer une extension' : 'Install an extension'}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {extensions.map((ext) => (
                <motion.div
                  key={ext.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={clsx(
                    "group flex items-center gap-5 p-5 rounded-2xl border transition-all duration-200",
                    isDark
                      ? "bg-white/3 border-white/5 hover:bg-white/6 hover:border-white/10"
                      : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-md"
                  )}
                >
                  {/* Icon */}
                  <div className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden",
                    isDark ? "bg-white/10" : "bg-gray-100"
                  )}>
                    {ext.icon ? (
                      <img src={ext.icon} alt="" className="w-8 h-8 object-contain" />
                    ) : (
                      <Puzzle className={clsx("w-6 h-6", isDark ? "text-gray-400" : "text-gray-500")} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={clsx("font-bold text-base truncate", isDark ? "text-white" : "text-gray-900")}>
                        {ext.name}
                      </h3>
                      <span className={clsx("text-xs px-2 py-0.5 rounded-full shrink-0", isDark ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500")}>
                        v{ext.version}
                      </span>
                    </div>
                    {ext.description && (
                      <p className={clsx("text-sm mt-1 truncate", isDark ? "text-gray-400" : "text-gray-500")}>
                        {ext.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleRemove(ext)}
                    className={clsx(
                      "p-2.5 rounded-xl transition-all opacity-0 group-hover:opacity-100",
                      "hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                    )}
                    title={language === 'fr' ? 'Supprimer' : 'Remove'}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
