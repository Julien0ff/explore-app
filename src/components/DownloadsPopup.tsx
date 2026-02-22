import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, X, FolderOpen, Check, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { getAccentColorClass } from '../lib/theme';

export interface DownloadItem {
  id: number;
  filename: string;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted' | 'paused' | 'failed';
  received: number;
  total: number;
  path?: string;
}

interface DownloadsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  downloads: DownloadItem[];
  className?: string;
  theme: string;
  accentColor: string;
  language: 'fr' | 'en';
}

export function DownloadsPopup({ isOpen, onClose, downloads, className, theme, accentColor, language }: DownloadsPopupProps) {
  const colors = getAccentColorClass(accentColor, theme === 'dark');

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={clsx(
            "absolute w-80 rounded-2xl shadow-2xl border z-[60] overflow-hidden backdrop-blur-xl",
            theme === 'dark' ? "bg-[#1e1e2e]/90 border-white/10" : "bg-white/90 border-gray-200",
            className
          )}
        >
          <div className={clsx("flex items-center justify-between p-4 border-b", theme === 'dark' ? "border-white/10" : "border-gray-200")}>
            <div className={clsx("flex items-center gap-2", theme === 'dark' ? "text-white" : "text-gray-900")}>
              <FileDown className={clsx("w-5 h-5", colors.text)} />
              <h3 className="font-semibold">{language === 'fr' ? 'Téléchargements' : 'Downloads'}</h3>
            </div>
            <button 
              onClick={onClose}
              className={clsx("p-1 rounded-full transition-colors", theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto p-2 custom-scrollbar">
            {downloads.length === 0 ? (
              <div className={clsx("flex flex-col items-center justify-center py-8", theme === 'dark' ? "text-gray-500" : "text-gray-400")}>
                <FileDown className="w-12 h-12 mb-2 opacity-20" />
                <p>{language === 'fr' ? 'Aucun téléchargement récent' : 'No recent downloads'}</p>
              </div>
            ) : (
              downloads.map((item) => (
                <div 
                  key={item.id}
                  className={clsx(
                    "p-3 rounded-xl mb-2 flex items-center gap-3 transition-colors group relative overflow-hidden cursor-pointer",
                    theme === 'dark' 
                      ? "hover:bg-white/5 bg-white/5" 
                      : "hover:bg-gray-100 bg-gray-50"
                  )}
                  onClick={() => {
                    if (item.path && window.electron?.showItemInFolder) {
                        console.log('Opening folder for path:', item.path);
                        window.electron.showItemInFolder(item.path);
                    } else {
                        console.warn('Cannot open folder: path or electron missing', { path: item.path, electron: !!window.electron });
                    }
                  }}
                  title={item.path ? (language === 'fr' ? 'Cliquer pour afficher dans le dossier' : 'Click to show in folder') : ''}
                >
                  {/* Progress Bar Background */}
                  {item.state === 'progressing' && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200/20">
                      <motion.div 
                        className={clsx("h-full", colors.bgSolid)}
                        initial={{ width: 0 }}
                        animate={{ width: `${item.total ? (item.received / item.total) * 100 : 0}%` }}
                        transition={{ ease: "linear" }}
                      />
                    </div>
                  )}

                  <div className={clsx(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    item.state === 'completed' ? "bg-green-500/10 text-green-500" :
                    item.state === 'failed' ? "bg-red-500/10 text-red-500" :
                    clsx(colors.bg, colors.text)
                  )}>
                    {item.state === 'completed' ? <Check className="w-5 h-5" /> :
                     item.state === 'failed' ? <AlertCircle className="w-5 h-5" /> :
                     <FileDown className="w-5 h-5 animate-bounce" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={clsx("text-sm font-medium truncate", theme === 'dark' ? "text-white" : "text-gray-900")}>
                      {item.filename}
                    </p>
                    <div className={clsx("flex items-center gap-2 text-xs", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                      <span>{formatBytes(item.received)} {item.total > 0 && `/ ${formatBytes(item.total)}`}</span>
                    </div>
                    {item.state === 'progressing' && (
                        <p className={clsx("text-xs mt-0.5", colors.text)}>{language === 'fr' ? 'Téléchargement...' : 'Downloading...'}</p>
                    )}
                    {item.state === 'failed' && (
                        <p className="text-xs text-red-400 mt-0.5">{language === 'fr' ? 'Échec' : 'Failed'}</p>
                    )}
                  </div>

                  {item.state === 'completed' && item.path && (
                    <button 
                      onClick={(e) => {
                          e.stopPropagation();
                          if (item.path && window.electron?.showItemInFolder) {
                              window.electron.showItemInFolder(item.path).then((success: boolean) => {
                                  if (!success) console.error('Failed to show item in folder:', item.path);
                              });
                          }
                      }}
                      className={clsx(
                        "p-2 rounded-lg transition-colors opacity-100",
                        theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-200 text-gray-500 hover:text-gray-900"
                      )}
                      title={language === 'fr' ? 'Afficher dans le dossier' : 'Show in folder'}
                    >
                      <FolderOpen className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
