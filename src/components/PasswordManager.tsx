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
  isFullPage?: boolean;
}

interface PasswordEntry {
  id: string;
  site: string;
  username: string;
  password: string;
  icon: string;
  created_at: number;
}

export function PasswordManager({ isOpen, onClose, theme, accentColor, language, isFullPage = false }: PasswordManagerProps) {
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

  const dashboardContent = (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className={clsx("p-6 border-b flex items-center justify-between", theme === 'dark' ? "border-white/5" : "border-gray-150")}>
        <div className="flex items-center gap-4">
          <div className={clsx("p-3 rounded-2xl shadow-lg relative overflow-hidden", colors.bgSolid, "text-white")}>
            <div className="absolute inset-0 bg-linear-to-tr from-white/20 to-transparent opacity-40" />
            <Key className="w-6 h-6 relative z-10 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              {language === 'fr' ? 'Gestionnaire de Mots de Passe' : 'Password Manager'}
            </h2>
            <p className="text-xs opacity-50 mt-1">
              {language === 'fr' ? 'Stockez vos identifiants en toute sécurité localement.' : 'Securely store and manage your credentials locally.'}
            </p>
          </div>
        </div>
        {!isFullPage && (
          <button 
            onClick={onClose}
            className={clsx("p-2 rounded-xl transition-all hover:scale-105 active:scale-95", theme === 'dark' ? "hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900")}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Toolbar / Actions */}
      <div className="p-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[240px] group">
          <Search className={clsx("absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", theme === 'dark' ? "text-gray-500 group-focus-within:text-blue-400" : "text-gray-400 group-focus-within:text-blue-500")} />
          <input
            type="text"
            placeholder={language === 'fr' ? 'Rechercher un site ou un identifiant...' : 'Search websites or usernames...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={clsx(
              "w-full pl-11 pr-4 py-3 rounded-2xl border focus:outline-none transition-all duration-300 shadow-xs",
              theme === 'dark' ? "bg-white/5 border-white/5 focus:border-blue-500/50 focus:bg-white/10" : "bg-gray-50 border-gray-200 focus:border-blue-500/50 focus:bg-white"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={clsx("px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md", colors.bgSolid, "text-white")}
        >
          <Plus className="w-4 h-4" />
          {language === 'fr' ? 'Nouvel Identifiant' : 'Add Credential'}
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6 overflow-hidden"
          >
            <div className={clsx(
              "p-6 rounded-3xl border space-y-4 shadow-inner relative overflow-hidden",
              theme === 'dark' ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-200"
            )}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase opacity-50 pl-1">{language === 'fr' ? 'Site Internet' : 'Website'}</span>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. google.com, github.com"
                      className={clsx(
                        "w-full pl-11 pr-4 py-2.5 rounded-xl border outline-none text-sm transition-all focus:border-blue-500/50",
                        theme === 'dark' ? "bg-[#181825] border-white/10 text-white" : "bg-white border-gray-200"
                      )}
                      value={newEntry.site}
                      onChange={e => setNewEntry({...newEntry, site: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase opacity-50 pl-1">{language === 'fr' ? 'Identifiant / Email' : 'Username / Email'}</span>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="e.g. user@gmail.com"
                      className={clsx(
                        "w-full pl-11 pr-4 py-2.5 rounded-xl border outline-none text-sm transition-all focus:border-blue-500/50",
                        theme === 'dark' ? "bg-[#181825] border-white/10 text-white" : "bg-white border-gray-200"
                      )}
                      value={newEntry.username}
                      onChange={e => setNewEntry({...newEntry, username: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold uppercase opacity-50 pl-1">{language === 'fr' ? 'Mot de passe' : 'Password'}</span>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      className={clsx(
                        "w-full pl-11 pr-4 py-2.5 rounded-xl border outline-none text-sm transition-all focus:border-blue-500/50",
                        theme === 'dark' ? "bg-[#181825] border-white/10 text-white" : "bg-white border-gray-200"
                      )}
                      value={newEntry.password}
                      onChange={e => setNewEntry({...newEntry, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setIsAdding(false)}
                  className={clsx("px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/10 transition-colors", theme === 'dark' ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900")}
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button 
                  onClick={handleAdd}
                  className={clsx("px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 text-white shadow-md hover:scale-105 active:scale-95 transition-all", colors.bgSolid)}
                >
                  <Save className="w-4 h-4" />
                  {language === 'fr' ? 'Enregistrer' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 custom-scrollbar">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-20 opacity-50 border border-dashed border-white/10 rounded-3xl bg-white/2">
            <Key className="w-16 h-16 mx-auto mb-4 opacity-25 text-gray-400" />
            <p className="font-semibold text-lg">{language === 'fr' ? 'Aucun mot de passe enregistré' : 'No saved passwords'}</p>
            <p className="text-xs opacity-50 mt-1">{language === 'fr' ? 'Cliquez sur "Nouvel Identifiant" pour en ajouter un.' : 'Click "Add Credential" to secure a new one.'}</p>
          </div>
        ) : (
          <div className={clsx(
            "rounded-3xl border overflow-hidden",
            theme === 'dark' ? "bg-white/2 border-white/5" : "bg-white border-gray-150 shadow-sm"
          )}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={clsx("border-b text-[10px] font-bold uppercase tracking-wider", theme === 'dark' ? "bg-white/2 border-white/5 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-500")}>
                  <th className="py-4 px-6">{language === 'fr' ? 'Site / Service' : 'Site / Service'}</th>
                  <th className="py-4 px-6">{language === 'fr' ? 'Identifiant' : 'Username'}</th>
                  <th className="py-4 px-6">{language === 'fr' ? 'Mot de passe' : 'Password'}</th>
                  <th className="py-4 px-6 text-right">{language === 'fr' ? 'Actions' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEntries.map(entry => (
                  <tr 
                    key={entry.id} 
                    className={clsx(
                      "group hover:bg-white/2 transition-colors",
                      theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-50/50"
                    )}
                  >
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className={clsx("w-9 h-9 rounded-full flex items-center justify-center p-0.5 overflow-hidden shadow-xs", theme === 'dark' ? "bg-white/10" : "bg-white border border-gray-100")}>
                        <img 
                          src={entry.icon} 
                          alt={entry.site} 
                          className="w-full h-full object-contain rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = `https://icons.duckduckgo.com/ip3/${entry.site}.ico`;
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">{entry.site}</div>
                        <a href={`https://${entry.site}`} target="_blank" rel="noreferrer" className="text-[10px] opacity-40 hover:underline hover:text-blue-400 truncate block mt-0.5">{entry.site}</a>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm font-medium opacity-85">
                      {entry.username}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className={clsx(
                          "px-3 py-1.5 rounded-xl font-mono text-sm tracking-wider min-w-[140px] text-center border shadow-inner",
                          theme === 'dark' ? "bg-black/30 border-white/5 text-gray-300" : "bg-white border-gray-200 text-gray-800"
                        )}>
                          {showPasswords.has(entry.id) ? entry.password : '••••••••••••'}
                        </div>
                        <button 
                          onClick={() => togglePasswordVisibility(entry.id)}
                          className={clsx("p-2 rounded-xl transition-all active:scale-95 text-gray-400 hover:text-white hover:bg-white/5", theme === 'dark' ? "" : "hover:bg-gray-100 hover:text-gray-900")}
                          title={showPasswords.has(entry.id) ? "Cacher" : "Afficher"}
                        >
                          {showPasswords.has(entry.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => copyToClipboard(entry.password)}
                          className={clsx("p-2 rounded-xl transition-all active:scale-95 text-gray-400 hover:text-white hover:bg-white/5", theme === 'dark' ? "" : "hover:bg-gray-100 hover:text-gray-900")}
                          title={language === 'fr' ? 'Copier' : 'Copy'}
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => handleDelete(entry.id)}
                        className={clsx("p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 text-red-400 hover:text-white hover:bg-red-500/20", theme === 'dark' ? "" : "hover:bg-red-500/10 hover:text-red-600")}
                        title={language === 'fr' ? 'Supprimer' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Internal Toast for Password Copies */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={clsx(
              "fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 z-60 backdrop-blur-md",
              theme === 'dark' ? "bg-[#181825]/90 border-white/10 text-white" : "bg-white/90 border-gray-200 text-gray-900"
            )}
          >
            <div className={clsx("p-1.5 rounded-xl text-white shadow-md", colors.bgSolid)}>
              <Check className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
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
    </div>
  );

  if (isFullPage) {
    return (
      <div className="w-full h-full relative flex flex-col bg-transparent transition-all duration-300">
        {dashboardContent}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={clsx(
                "w-full max-w-3xl h-[650px] rounded-3xl shadow-2xl border flex flex-col overflow-hidden backdrop-blur-2xl transition-all duration-300",
                theme === 'dark' ? "bg-[#12121e]/95 border-white/10 text-white" : "bg-white/95 border-gray-250 text-gray-900"
              )}
            >
              {dashboardContent}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
