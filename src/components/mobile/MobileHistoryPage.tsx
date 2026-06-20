import { clsx } from 'clsx';
import { Search, Trash2 } from 'lucide-react';
import type { HistoryItem } from '../../types';
import type { ThemeColors } from '../../lib/theme';

interface MobileHistoryPageProps {
  theme: 'dark' | 'light' | 'system';
  colors: ThemeColors;
  language: 'fr' | 'en';
  history: HistoryItem[];
  historySearchQuery: string;
  setHistorySearchQuery: (q: string) => void;
  setConfirmModal: (modal: { isOpen: boolean; title: string; message: string; onConfirm: (value?: string) => void; isInput?: boolean; inputPlaceholder?: string; }) => void;
  deleteHistory: () => void;
  deleteHistoryItem: (id: string) => void;
  updateTab: (url: string) => void;
  getFaviconUrl: (url: string) => string;
}

export function MobileHistoryPage({
  theme, colors, language, history, historySearchQuery, setHistorySearchQuery,
  setConfirmModal, deleteHistory, deleteHistoryItem, updateTab, getFaviconUrl
}: MobileHistoryPageProps) {
  
  const filteredHistory = history.filter(item => 
    item.title.toLowerCase().includes(historySearchQuery.toLowerCase()) || 
    item.url.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  const today = new Date();
  today.setHours(0,0,0,0);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0,0,0,0);

  const groups: { title: string; items: HistoryItem[] }[] = [
    { title: language === 'fr' ? "Aujourd'hui" : "Today", items: [] },
    { title: language === 'fr' ? "Hier" : "Yesterday", items: [] },
    { title: language === 'fr' ? "Plus ancien" : "Older", items: [] }
  ];

  filteredHistory.forEach(item => {
    const d = new Date(item.visited_at);
    d.setHours(0,0,0,0);
    if (d.getTime() === today.getTime()) {
      groups[0].items.push(item);
    } else if (d.getTime() === yesterday.getTime()) {
      groups[1].items.push(item);
    } else {
      groups[2].items.push(item);
    }
  });

  return (
    <div className="w-full h-full overflow-y-auto bg-transparent p-4 pb-24 animate-fadeIn">
      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-2xl font-black flex items-center gap-3">
          <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg", colors.bgSolid)}>
            H
          </div>
          {language === 'fr' ? 'Historique' : 'History'}
        </h2>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1 group">
            <Search className={clsx("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", theme === 'dark' ? "text-gray-500 group-focus-within:text-blue-400" : "text-gray-400 group-focus-within:text-blue-500")} />
            <input
              type="text"
              placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'}
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              className={clsx(
                "w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none transition-all",
                theme === 'dark' ? "bg-white/5 border-white/10 focus:bg-white/10 focus:border-blue-500/50" : "bg-white border-gray-200 focus:border-blue-500/50 shadow-sm"
              )}
            />
          </div>
          <button
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: language === 'fr' ? 'Effacer l\'historique' : 'Clear history',
                message: language === 'fr' ? 'Voulez-vous vraiment effacer tout votre historique ?' : 'Are you sure you want to clear all your history?',
                onConfirm: deleteHistory
              });
            }}
            className="px-3 py-2 rounded-xl bg-red-500/10 text-red-500 font-bold text-sm transition-all active:scale-95 shadow-sm whitespace-nowrap"
          >
            {language === 'fr' ? 'Effacer tout' : 'Clear all'}
          </button>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-10 opacity-50 border border-dashed border-white/10 rounded-2xl bg-white/2">
          <div className="text-3xl mb-2">🕒</div>
          <p className="font-semibold text-base">{language === 'fr' ? 'Aucun historique trouvé' : 'No history found'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => {
            if (group.items.length === 0) return null;
            return (
              <div key={group.title} className="space-y-2">
                <h3 className={clsx("text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-2 px-1", theme === 'dark' ? "text-white" : "text-gray-700")}>
                  <span>{group.title}</span>
                  <span className={clsx("text-[9px] px-1.5 py-0.5 rounded-full border", theme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200")}>{group.items.length}</span>
                </h3>
                <div className="flex flex-col gap-2">
                  {group.items.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => updateTab(item.url)}
                      className={clsx(
                        "p-3 rounded-xl border transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between",
                        theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-100 shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center p-1.5 shrink-0", theme === 'dark' ? "bg-white/5" : "bg-gray-50")}>
                          <img 
                            src={getFaviconUrl(item.url)} 
                            className="w-full h-full object-contain" 
                            alt=""
                            onError={(e) => { e.currentTarget.src = `https://icons.duckduckgo.com/ip3/${new URL(item.url).hostname}.ico`; }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate leading-tight">{item.title}</div>
                          <div className="text-[10px] opacity-40 truncate mt-0.5">{item.url}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <div className="text-[10px] font-mono opacity-40">{new Date(item.visited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                          className="p-1.5 rounded-lg active:bg-red-500/20 text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
