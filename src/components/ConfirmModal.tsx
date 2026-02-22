import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { getAccentColorClass } from '../lib/theme';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  isInput?: boolean;
  inputValue?: string;
  setInputValue?: (value: string) => void;
  inputPlaceholder?: string;
  language?: 'fr' | 'en';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  theme,
  accentColor,
  isInput,
  inputValue,
  setInputValue,
  inputPlaceholder,
  language = 'en'
}: ConfirmModalProps) {
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const colors = getAccentColorClass(accentColor, isDark);
  
  const defaultConfirmText = confirmText || (language === 'fr' ? 'Confirmer' : 'Confirm');
  const defaultCancelText = cancelText || (language === 'fr' ? 'Annuler' : 'Cancel');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={clsx(
              "relative w-full max-w-sm rounded-2xl shadow-2xl border p-6 overflow-hidden",
              isDark ? "bg-[#1e1e2e] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
            )}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={clsx("p-3 rounded-full", colors.bg, colors.text)}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">{title}</h3>
            </div>
            
            <p className={clsx("mb-6", isDark ? "text-gray-400" : "text-gray-500")}>
              {message}
            </p>

            {isInput && setInputValue && (
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={inputPlaceholder}
                className={clsx(
                  "w-full px-4 py-2 mb-6 rounded-xl border focus:outline-none focus:ring-2",
                  isDark 
                    ? clsx("bg-[#181825] border-white/10 text-white", colors.ring)
                    : clsx("bg-gray-50 border-gray-200 text-gray-900", colors.ring)
                )}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onConfirm();
                    onClose();
                  }
                }}
              />
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className={clsx("px-4 py-2 rounded-xl font-medium transition-colors", isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-500")}
              >
                {defaultCancelText}
              </button>
              <button
                onClick={onConfirm}
                className={clsx("px-4 py-2 rounded-xl font-medium transition-colors", isDark ? `bg-${accentColor}-500 hover:bg-${accentColor}-600 text-white` : `bg-${accentColor}-500 hover:bg-${accentColor}-600 text-white`)}
              >
                {defaultConfirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
