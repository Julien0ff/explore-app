import { useState, useEffect } from 'react';
import { X, Key, Copy, Eye, EyeOff, Plus, Trash2, Search, Save, Globe, User, Lock, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { getAccentColorClass } from '../lib/theme';
import { ConfirmModal } from './ConfirmModal';

interface PasswordManagerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  language: 'fr' | 'en';
}

interface PasswordEntry {
  id: string;
  site: string;
  username: string;
  password: string;
  icon: string;
  created_at: number;
}

export function PasswordManager({ isOpen, onClose, theme, accentColor, language }: PasswordManagerProps) {
  const colors = getAccentColorClass(accentColor, theme === 'dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [entries, setEntries] = useState<PasswordEntry[]>(() => {
    try {
      const saved = localStorage.getItem('password_manager_entries');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load passwords:', e);
    }
    return [
      { id: '1', site: 'google.com', username: 'user@gmail.com', password: 'password123', icon: 'https://www.google.com/favicon.ico', created_at: Date.now() },
    ];
  });
  
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({ site: '', username: '', password: '' });
  
  // Custom alerts/toasts
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('password_manager_entries', JSON.stringify(entries));
  }, [entries]);

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage(language === 'fr' ? 'Mot de passe copié !' : 'Password copied!');
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setEntries(prev => prev.filter(e => e.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  const handleAdd = () => {
    if (!newEntry.site || !newEntry.username || !newEntry.password) return;
    
    const iconUrl = `https://www.google.com/s2/favicons?domain=${newEntry.site}&sz=64`;
    
    const entry: PasswordEntry = {
      id: crypto.randomUUID(),
      site: newEntry.site,
      username: newEntry.username,
      password: newEntry.password,
      icon: iconUrl,
      created_at: Date.now()
    };

    setEntries(prev => [entry, ...prev]);
    setIsAdding(false);
    setNewEntry({ site: '', username: '', password: '' });
  };

  const filteredEntries = entries.filter(entry => 
    entry.site.toLowerCase().includes(searchQuery.toLowerCase()) || 
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={clsx(
                "w-full max-w-2xl h-[600px] rounded-2xl shadow-2xl border flex flex-col overflow-hidden",
                theme === 'dark' ? "bg-[#1e1e2e] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
              )}
            >
              {/* Header */}
              <div className={clsx("p-4 border-b flex items-center justify-between", theme === 'dark' ? "border-white/10" : "border-gray-200")}>
                <div className="flex items-center gap-3">
                  <div className={clsx("p-2 rounded-lg", colors.bg, colors.text)}>
                    <Key className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold">{language === 'fr' ? 'Gestionnaire de mots de passe' : 'Password Manager'}</h2>
                </div>
                <button 
                  onClick={onClose}
                  className={clsx("p-2 rounded-lg transition-colors", theme === 'dark' ? "hover:bg-white/10" : "hover:bg-gray-100")}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toolbar */}
              <div className="p-4 flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={language === 'fr' ? 'Rechercher...' : 'Search passwords...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={clsx(
                      "w-full pl-10 pr-4 py-2 rounded-xl border focus:outline-none transition-colors",
                      theme === 'dark' ? "bg-[#181825] border-white/10 focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:border-blue-500"
                    )}
                  />
                </div>
                <button 
                  onClick={() => setIsAdding(!isAdding)}
                  className={clsx("px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors", colors.bg, colors.text)}
                >
                  <Plus className="w-4 h-4" />
                  {language === 'fr' ? 'Ajouter' : 'Add New'}
                </button>
              </div>

              {/* Add Form */}
              <AnimatePresence>
                {isAdding && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={clsx("px-4 pb-4 border-b overflow-hidden", theme === 'dark' ? "border-white/10" : "border-gray-200")}
                  >
                    <div className={clsx("p-4 rounded-xl space-y-3", theme === 'dark' ? "bg-[#181825]" : "bg-gray-50")}>
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Website (e.g., google.com)"
                          className="flex-1 bg-transparent border-b border-gray-500/20 focus:border-blue-500 outline-none py-1"
                          value={newEntry.site}
                          onChange={e => setNewEntry({...newEntry, site: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Username / Email"
                          className="flex-1 bg-transparent border-b border-gray-500/20 focus:border-blue-500 outline-none py-1"
                          value={newEntry.username}
                          onChange={e => setNewEntry({...newEntry, username: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Password"
                          className="flex-1 bg-transparent border-b border-gray-500/20 focus:border-blue-500 outline-none py-1"
                          value={newEntry.password}
                          onChange={e => setNewEntry({...newEntry, password: e.target.value})}
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button 
                          onClick={() => setIsAdding(false)}
                          className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleAdd}
                          className={clsx("px-3 py-1.5 rounded-lg text-sm flex items-center gap-2", colors.bg, colors.text)}
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-10 opacity-50">
                    <Key className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>{language === 'fr' ? 'Aucun mot de passe trouvé' : 'No passwords found'}</p>
                  </div>
                ) : (
                  filteredEntries.map(entry => (
                    <div 
                      key={entry.id}
                      className={clsx(
                        "p-4 rounded-xl border transition-all flex items-center gap-4 group",
                        theme === 'dark' ? "bg-[#181825] border-white/5 hover:border-white/10" : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <img 
                        src={entry.icon} 
                        alt={entry.site} 
                        className="w-10 h-10 rounded-full bg-white p-1 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${entry.site}&background=random`;
                        }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{entry.site}</div>
                        <div className="text-sm text-gray-500 truncate">{entry.username}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className={clsx("px-3 py-1.5 rounded-lg font-mono text-sm min-w-[120px]", theme === 'dark' ? "bg-black/20" : "bg-white border")}>
                          {showPasswords.has(entry.id) ? entry.password : '••••••••'}
                        </div>
                        
                        <button 
                          onClick={() => togglePasswordVisibility(entry.id)}
                          className={clsx("p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100", theme === 'dark' ? "hover:bg-white/10" : "hover:bg-gray-200")}
                          title={showPasswords.has(entry.id) ? "Hide" : "Show"}
                        >
                          {showPasswords.has(entry.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>

                        <button 
                          onClick={() => copyToClipboard(entry.password)}
                          className={clsx("p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100", theme === 'dark' ? "hover:bg-white/10" : "hover:bg-gray-200")}
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button 
                          onClick={() => handleDelete(entry.id)}
                          className={clsx("p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 hover:text-red-500", theme === 'dark' ? "hover:bg-red-500/10" : "hover:bg-red-50")}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </motion.div>
          </motion.div>
          
          {/* Internal Toast for Password Copies */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={clsx(
                  "fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg border flex items-center gap-2 z-60",
                  theme === 'dark' ? "bg-[#181825] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
                )}
              >
                <div className={clsx("p-1 rounded-full", colors.bg, colors.text)}>
                  <Check className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom Delete Confirmation Modal */}
          <ConfirmModal
            isOpen={!!deleteConfirmId}
            onClose={() => setDeleteConfirmId(null)}
            onConfirm={confirmDelete}
            title={language === 'fr' ? 'Supprimer le mot de passe' : 'Delete Password'}
            message={language === 'fr' 
              ? 'Êtes-vous sûr de vouloir supprimer définitivement ce mot de passe ?' 
              : 'Are you sure you want to permanently delete this password?'}
            theme={theme}
            accentColor={accentColor}
            language={language}
          />
        </>
      )}
    </AnimatePresence>
  );
}
