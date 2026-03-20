import React, { useState, useRef, useEffect } from 'react';
import { FolderPlus } from 'lucide-react';
import { clsx } from 'clsx';
import type { Bookmark } from '../types';

interface BookmarksBarProps {
  bookmarks: Bookmark[];
  onNavigate: (url: string) => void;
  onContextMenu: (e: React.MouseEvent, bookmark: Bookmark) => void;
  theme: 'light' | 'dark' | 'system';
  emptyMessage?: string;
}

interface BookmarkItemProps {
  bookmark: Bookmark;
  allBookmarks: Bookmark[];
  onNavigate: (url: string) => void;
  onContextMenu: (e: React.MouseEvent, bookmark: Bookmark) => void;
  theme: 'light' | 'dark' | 'system';
  depth?: number;
}

const getFaviconUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
  } catch {
    return '';
  }
};

const BookmarkFolder = ({ bookmark, allBookmarks, onNavigate, onContextMenu, theme, depth = 0 }: BookmarkItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const children = allBookmarks.filter(b => b.parent_id === bookmark.id);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300); // Small delay to prevent accidental closing
  };

  return (
    <div 
      className="relative group"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        onContextMenu={(e) => onContextMenu(e, bookmark)}
        className={clsx(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors max-w-[200px] select-none",
          theme === 'dark' ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-200 text-gray-700",
          isOpen && (theme === 'dark' ? "bg-white/10" : "bg-gray-200")
        )}
      >
        <FolderPlus className="w-3.5 h-3.5 text-yellow-500" />
        <span className="truncate text-xs font-medium">{bookmark.title}</span>
      </div>

      {isOpen && children.length > 0 && (
        <div 
          className={clsx(
            "absolute z-50 py-1 rounded-lg shadow-xl border min-w-[200px]",
            theme === 'dark' ? "bg-[#1e1e2e] border-white/10" : "bg-white border-gray-200",
            depth === 0 ? "top-full left-0 mt-1" : "top-0 left-full ml-1"
          )}
        >
          {children.map(child => (
            child.type === 'folder' ? (
              <BookmarkFolder
                key={child.id}
                bookmark={child}
                allBookmarks={allBookmarks}
                onNavigate={onNavigate}
                onContextMenu={onContextMenu}
                theme={theme}
                depth={depth + 1}
              />
            ) : (
              <div
                key={child.id}
                onClick={() => {
                  onNavigate(child.url);
                  setIsOpen(false);
                }}
                onContextMenu={(e) => onContextMenu(e, child)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors text-xs",
                  theme === 'dark' ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-100 text-gray-700"
                )}
              >
                <img 
                  src={getFaviconUrl(child.url)} 
                  className="w-4 h-4 rounded-sm"
                  alt=""
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="truncate flex-1">{child.title}</span>
              </div>
            )
          ))}
        </div>
      )}
      
      {isOpen && children.length === 0 && (
        <div 
          className={clsx(
            "absolute z-50 py-2 px-4 rounded-lg shadow-xl border min-w-[150px] text-center italic text-xs",
            theme === 'dark' ? "bg-[#1e1e2e] border-white/10 text-gray-500" : "bg-white border-gray-200 text-gray-400",
            depth === 0 ? "top-full left-0 mt-1" : "top-0 left-full ml-1"
          )}
        >
          Empty
        </div>
      )}
    </div>
  );
};

export const BookmarksBar = ({ bookmarks, onNavigate, onContextMenu, theme, emptyMessage }: BookmarksBarProps) => {
  const rootBookmarks = bookmarks.filter(b => !b.parent_id);

  if (rootBookmarks.length === 0) {
    if (emptyMessage) {
      return (
        <div className={clsx(
          "flex items-center gap-1 px-2 py-1 border-b text-xs overflow-x-auto custom-scrollbar z-40 relative", 
          theme === 'dark' ? "bg-[#1e1e2e] border-white/5" : "bg-gray-50 border-gray-200"
        )}>
          <span className="text-gray-400 italic px-2">{emptyMessage}</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={clsx(
      "flex items-center gap-1 px-2 py-1 border-b text-xs overflow-x-auto custom-scrollbar z-40 relative", 
      theme === 'dark' ? "bg-[#1e1e2e] border-white/5" : "bg-gray-50 border-gray-200"
    )}>
      {rootBookmarks.map(bookmark => (
        bookmark.type === 'folder' ? (
          <BookmarkFolder
            key={bookmark.id}
            bookmark={bookmark}
            allBookmarks={bookmarks}
            onNavigate={onNavigate}
            onContextMenu={onContextMenu}
            theme={theme}
          />
        ) : (
          <div
            key={bookmark.id}
            onClick={() => onNavigate(bookmark.url)}
            onContextMenu={(e) => onContextMenu(e, bookmark)}
            className={clsx(
              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors max-w-[200px]",
              theme === 'dark' ? "hover:bg-white/10 text-gray-300" : "hover:bg-gray-200 text-gray-700"
            )}
            title={bookmark.title}
          >
            <img 
              src={getFaviconUrl(bookmark.url)} 
              className="w-3.5 h-3.5 rounded-sm"
              alt=""
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="truncate">{bookmark.title}</span>
          </div>
        )
      ))}
    </div>
  );
};
