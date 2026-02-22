import { useState } from 'react';
import type { Bookmark } from '../types';
import { Folder, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  parentId?: string;
  onMove: (id: string, parentId: string | undefined) => void;
  onDelete: (id: string) => void;
  onOpen: (url: string) => void;
  getFaviconUrl: (url: string) => string;
  language: 'fr' | 'en';
}

export function BookmarkList({ bookmarks, parentId, onMove, onDelete, onOpen, getFaviconUrl, language }: BookmarkListProps) {
  const items = bookmarks.filter(b => b.parent_id === parentId);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (items.length === 0 && parentId) {
      return <div className="pl-8 text-xs text-gray-500 italic py-1">{language === 'fr' ? 'Dossier vide' : 'Empty folder'}</div>;
  }

  return (
    <div className={parentId ? "pl-4 border-l border-white/5 ml-2 space-y-1" : "space-y-1"}>
      {items.map(item => {
        if (item.type === 'folder') {
            const isExpanded = expandedFolders.has(item.id);
            return (
                <div 
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', item.id);
                        e.stopPropagation();
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const id = e.dataTransfer.getData('text/plain');
                        if (id && id !== item.id) {
                            // Prevent moving folder into itself (simple check)
                            if (id === item.id) return;
                            onMove(id, item.id);
                        }
                    }}
                >
                    <div 
                        className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer group transition-colors"
                        onClick={() => toggleFolder(item.id)}
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        <Folder className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                        <span className="flex-1 truncate font-medium text-sm">{item.title}</span>
                         <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded transition-all"
                            title={language === 'fr' ? 'Supprimer le dossier' : 'Delete folder'}
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                    {isExpanded && (
                        <BookmarkList 
                            bookmarks={bookmarks} 
                            parentId={item.id} 
                            onMove={onMove} 
                            onDelete={onDelete} 
                            onOpen={onOpen}
                            getFaviconUrl={getFaviconUrl}
                            language={language}
                        />
                    )}
                </div>
            );
        }
        
        return (
            <div 
                key={item.id} 
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.id);
                    e.stopPropagation();
                }}
                className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer group relative transition-colors"
                onClick={() => onOpen(item.url)}
            >
                <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs font-bold text-gray-400 overflow-hidden shrink-0">
                    <img 
                    src={getFaviconUrl(item.url)} 
                    className="w-3 h-3"
                    alt=""
                    onError={(e) => { 
                        e.currentTarget.style.display = 'none'; 
                        e.currentTarget.parentElement!.innerText = item.title.charAt(0).toUpperCase();
                    }} 
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate pr-6">{item.title}</div>
                    <div className="text-xs text-gray-500 truncate">{item.url}</div>
                </div>
                <button 
                    onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                    }}
                    className="absolute right-2 p-1.5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Delete bookmark"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        );
      })}
    </div>
  );
}
