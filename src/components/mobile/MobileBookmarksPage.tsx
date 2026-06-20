import { clsx } from 'clsx';
import { Search, Trash2, FolderPlus, Star } from 'lucide-react';
import type { Bookmark } from '../../types';
import type { ThemeColors } from '../../lib/theme';

interface MobileBookmarksPageProps {
  theme: 'dark' | 'light' | 'system';
  colors: ThemeColors;
  language: 'fr' | 'en';
  bookmarks: Bookmark[];
  bookmarkSearchQuery: string;
  setBookmarkSearchQuery: (q: string) => void;
  createFolder: () => void;
  confirmDeleteBookmark: (id: string) => void;
  setBookmarkContextMenu: (ctx: { isOpen: boolean; x: number; y: number; bookmarkId: string; bookmarkUrl?: string }) => void;
  updateTab: (url: string) => void;
  getFaviconUrl: (url: string) => string;
}

export function MobileBookmarksPage({
  theme, colors, language, bookmarks, bookmarkSearchQuery, setBookmarkSearchQuery,
  createFolder, confirmDeleteBookmark, setBookmarkContextMenu, updateTab, getFaviconUrl
}: MobileBookmarksPageProps) {

  const filteredBookmarks = bookmarks.filter(bookmark => 
    bookmark.title.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()) || 
    (bookmark.url && bookmark.url.toLowerCase().includes(bookmarkSearchQuery.toLowerCase()))
  );

  return (
    <div className="w-full h-full overflow-y-auto bg-transparent p-4 pb-24 animate-fadeIn">
      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-2xl font-black flex items-center gap-3">
          <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg", colors.bgSolid)}>
            <Star className="w-5 h-5 fill-current" />
          </div>
          {language === 'fr' ? 'Favoris' : 'Bookmarks'}
        </h2>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1 group">
            <Search className={clsx("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", theme === 'dark' ? "text-gray-500 group-focus-within:text-blue-400" : "text-gray-400 group-focus-within:text-blue-500")} />
            <input
              type="text"
              placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'}
              value={bookmarkSearchQuery}
              onChange={(e) => setBookmarkSearchQuery(e.target.value)}
              className={clsx(
                "w-full pl-9 pr-4 py-2 rounded-xl border text-sm outline-none transition-all",
                theme === 'dark' ? "bg-white/5 border-white/10 focus:bg-white/10 focus:border-blue-500/50" : "bg-white border-gray-200 focus:border-blue-500/50 shadow-sm"
              )}
            />
          </div>
          <button 
            onClick={createFolder}
            className={clsx("px-3 py-2 rounded-xl text-white font-bold text-sm transition-all active:scale-95 shadow-md flex items-center gap-1 shrink-0", colors.bgSolid)}
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-10 opacity-50 border border-dashed border-white/10 rounded-2xl bg-white/2">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-25 text-gray-400" />
          <p className="font-semibold text-base">{language === 'fr' ? 'Aucun favori' : 'No bookmarks'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredBookmarks.map(bookmark => (
            <div 
              key={bookmark.id}
              onClick={() => bookmark.url && updateTab(bookmark.url)}
              onContextMenu={(e) => {
                e.preventDefault();
                setBookmarkContextMenu({
                  isOpen: true,
                  x: e.clientX,
                  y: e.clientY,
                  bookmarkId: bookmark.id,
                  bookmarkUrl: bookmark.url
                });
              }}
              className={clsx(
                "group relative aspect-square rounded-2xl border overflow-hidden transition-all active:scale-95 cursor-pointer flex flex-col justify-between p-4",
                theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-gray-150 shadow-sm"
              )}
            >
              <div className="flex justify-between items-start">
                <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", theme === 'dark' ? "bg-white/10" : "bg-gray-100")}>
                  {bookmark.type === 'folder' ? (
                    <span className="text-xl select-none">📁</span>
                  ) : (
                    <img 
                      src={getFaviconUrl(bookmark.url || '')} 
                      className="w-5 h-5 object-contain" 
                      alt="" 
                      onError={(e) => { e.currentTarget.src = `https://icons.duckduckgo.com/ip3/${new URL(bookmark.url || '').hostname}.ico`; }}
                    />
                  )}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); confirmDeleteBookmark(bookmark.id); }}
                  className="p-1.5 active:bg-red-500 active:text-white rounded-lg transition-colors text-red-500/50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2">
                <div className="font-bold text-sm leading-tight mb-0.5 truncate">{bookmark.title}</div>
                <div className="text-[10px] opacity-40 truncate">{bookmark.url || (language === 'fr' ? 'Dossier favoris' : 'Bookmarks Folder')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
