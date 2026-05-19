import { useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Save, 
  Printer, 
  Languages, 
  Search, 
  Copy, 
  ExternalLink,
  Image as ImageIcon,
  Download,
  Shield,
  MessageSquare
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  params: Electron.ContextMenuParams;
  onClose: () => void;
  onAction: (action: string, params?: { url?: string; text?: string }) => void;
  theme: 'dark' | 'light' | 'system';
  language: 'fr' | 'en';
}

export function ContextMenu({ 
  isOpen, 
  x, 
  y, 
  params, 
  onClose, 
  onAction,
  theme,
  language
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Adjust position if it goes off screen
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  // Adjust position to keep on screen
  const menuWidth = 280;
  const menuHeight = 400; // Approximate
  const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x;
  const adjustedY = y + menuHeight > window.innerHeight ? y - menuHeight : y;

  return (
    <>
      <div 
        className="fixed inset-0 z-99 bg-transparent" 
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
      />
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        style={{ top: adjustedY, left: adjustedX }}
        className={clsx(
          "fixed z-100 w-[280px] rounded-xl shadow-2xl border overflow-hidden backdrop-blur-xl py-2",
          isDark ? "bg-[#1e1e2e]/95 border-white/10 text-gray-200" : "bg-white/95 border-gray-200 text-gray-800"
        )}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Navigation - Only if not selecting text/link/image */}
        {!params.selectionText && !params.linkURL && !params.srcURL && (
          <div className="border-b border-gray-200/10 pb-2 mb-2 px-2">
            <button 
              onClick={() => onAction('back')}
              className={clsx("flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors group", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}
            >
              <span className="flex items-center gap-3">
                <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-current" />
                {language === 'fr' ? 'Retour' : 'Back'}
              </span>
              <span className="text-xs text-gray-500">Alt+Left</span>
            </button>
            <button 
              onClick={() => onAction('forward')}
              className={clsx("flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors group", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}
            >
              <span className="flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-current" />
                {language === 'fr' ? 'Avant' : 'Forward'}
              </span>
              <span className="text-xs text-gray-500">Alt+Right</span>
            </button>
            <button 
              onClick={() => onAction('reload')}
              className={clsx("flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors group", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}
            >
              <span className="flex items-center gap-3">
                <RotateCw className="w-4 h-4 text-gray-400 group-hover:text-current" />
                {language === 'fr' ? 'Actualiser' : 'Reload'}
              </span>
              <span className="text-xs text-gray-500">F5</span>
            </button>
          </div>
        )}

        <div className="px-2 space-y-1">
          {params.linkURL && (
            <>
              <button onClick={() => onAction('open-new-tab', { url: params.linkURL })} className={clsx("flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
                <ExternalLink className="w-4 h-4 text-gray-400" />
                {language === 'fr' ? 'Ouvrir le lien dans un nouvel onglet' : 'Open Link in New Tab'}
              </button>
              <button onClick={() => onAction('copy-link', { url: params.linkURL })} className={clsx("flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
                <Copy className="w-4 h-4 text-gray-400" />
                {language === 'fr' ? 'Copier l\'adresse du lien' : 'Copy Link Address'}
              </button>
              <div className={clsx("h-px my-1", isDark ? "bg-white/10" : "bg-gray-200")} />
            </>
          )}

          {params.srcURL && params.mediaType === 'image' && (
            <>
              <button onClick={() => onAction('open-image', { url: params.srcURL })} className={clsx("flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
                <ImageIcon className="w-4 h-4 text-gray-400" />
                {language === 'fr' ? 'Ouvrir l\'image' : 'Open Image'}
              </button>
              <button onClick={() => onAction('open-new-tab', { url: params.srcURL })} className={clsx("flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
                <ExternalLink className="w-4 h-4 text-gray-400" />
                {language === 'fr' ? 'Ouvrir l\'image dans un nouvel onglet' : 'Open Image in New Tab'}
              </button>
              <button onClick={() => onAction('save-image', { url: params.srcURL })} className={clsx("flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
                <Download className="w-4 h-4 text-gray-400" />
                {language === 'fr' ? 'Enregistrer l\'image sous...' : 'Save Image As...'}
              </button>
              <button onClick={() => onAction('copy-image-url', { url: params.srcURL })} className={clsx("flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
                <Copy className="w-4 h-4 text-gray-400" />
                {language === 'fr' ? 'Copier l\'adresse de l\'image' : 'Copy Image Address'}
              </button>
              <div className={clsx("h-px my-1", isDark ? "bg-white/10" : "bg-gray-200")} />
            </>
          )}

          {params.selectionText && (
            <>
              <button onClick={() => onAction('copy-text', { text: params.selectionText })} className={clsx("flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
                <Copy className="w-4 h-4 text-gray-400" />
                {language === 'fr' ? 'Copier' : 'Copy'}
              </button>
              <button onClick={() => onAction('search-text', { text: params.selectionText })} className={clsx("flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
                <Search className="w-4 h-4 text-gray-400" />
                {language === 'fr' ? `Rechercher "${params.selectionText.length > 15 ? params.selectionText.substring(0, 15) + '...' : params.selectionText}"` : `Search for "${params.selectionText.length > 15 ? params.selectionText.substring(0, 15) + '...' : params.selectionText}"`}
              </button>
              <div className={clsx("h-px my-1", isDark ? "bg-white/10" : "bg-gray-200")} />
            </>
          )}

          {!params.selectionText && !params.linkURL && !params.srcURL && (
            <>
              <button onClick={() => onAction('save-page')} className={clsx("flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors group", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
                <span className="flex items-center gap-3">
                  <Save className="w-4 h-4 text-gray-400 group-hover:text-current" />
                  {language === 'fr' ? 'Enregistrer sous...' : 'Save As...'}
                </span>
                <span className="text-xs text-gray-500">Ctrl+S</span>
              </button>
              <button onClick={() => onAction('print')} className={clsx("flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors group", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
                <span className="flex items-center gap-3">
                  <Printer className="w-4 h-4 text-gray-400 group-hover:text-current" />
                  {language === 'fr' ? 'Imprimer...' : 'Print...'}
                </span>
                <span className="text-xs text-gray-500">Ctrl+P</span>
              </button>
               <button onClick={() => onAction('translate')} className={clsx("flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
                <Languages className="w-4 h-4 text-gray-400" />
                {language === 'fr' ? 'Traduire en français' : 'Translate to French'}
              </button>
            </>
          )}

          <div className={clsx("h-px my-1", isDark ? "bg-white/10" : "bg-gray-200")} />

          <div className="py-1">
             <div className={clsx("text-xs font-medium px-2 py-1 mb-1 uppercase tracking-wider", isDark ? "text-gray-500" : "text-gray-400")}>Extensions</div>
             <button onClick={() => onAction('block-domain')} className={clsx("flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
                <Shield className="w-4 h-4 text-gray-400" />
                {language === 'fr' ? 'Bloquer ce domaine' : 'Block this domain'}
             </button>
             <button onClick={() => onAction('capture-question')} className={clsx("flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}>
                <MessageSquare className="w-4 h-4 text-gray-400" />
                {language === 'fr' ? 'Capturer la question' : 'Capture question'}
             </button>
          </div>
          
        </div>
      </motion.div>
    </>
  );
}
