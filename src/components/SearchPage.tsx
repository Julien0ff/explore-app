import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Search as SearchIcon, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';
import type { ThemeColors } from '../lib/theme';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface SearchPageProps {
  query: string;
  onSearch: (q: string) => void;
  onOpenUrl: (url: string) => void;
  onNewTab: (url: string) => void;
  theme: 'dark' | 'light';
  colors: ThemeColors;
  language: 'fr' | 'en';
}

export function SearchPage({ query, onSearch, onOpenUrl, onNewTab, theme, colors, language }: SearchPageProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localQuery, setLocalQuery] = useState(query);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (query) {
      setLocalQuery(query);
      fetchResults(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchResults = async (q: string) => {
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const electron = (window as any).electron;
      if (!electron?.searchWeb) throw new Error("Search engine IPC not available");

      const html = await electron.searchWeb(q);
      if (!html) throw new Error("No response from search backend");

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const resultNodes = doc.querySelectorAll('.result');
      const parsedResults: SearchResult[] = [];

      resultNodes.forEach(node => {
        const titleNode = node.querySelector('.result__a');
        const snippetNode = node.querySelector('.result__snippet');
        
        if (titleNode && snippetNode) {
          // DDG often prefixes URLs with //duckduckgo.com/l/?uddg=...
          let href = titleNode.getAttribute('href') || '';
          if (href.startsWith('//duckduckgo.com/l/?uddg=')) {
            try {
              const urlParams = new URLSearchParams(href.split('?')[1]);
              const uddg = urlParams.get('uddg');
              if (uddg) href = decodeURIComponent(uddg);
            } catch {
              // fallback
            }
          } else if (href.startsWith('/')) {
            href = 'https://duckduckgo.com' + href;
          }

          parsedResults.push({
            title: titleNode.textContent?.trim() || '',
            url: href,
            snippet: snippetNode.textContent?.trim() || ''
          });
        }
      });

      setResults(parsedResults);
    } catch (err) {
      console.error(err);
      setError(language === 'fr' ? 'Une erreur est survenue lors de la recherche.' : 'An error occurred during search.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      onSearch(localQuery.trim());
    }
  };

  return (
    <div className={clsx("w-full h-full overflow-y-auto animate-fadeIn", isDark ? "text-gray-200" : "text-gray-800")}>
      <div className="max-w-7xl mx-auto px-8 py-8">
        
        {/* Search Header minimalist */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-10">
          <div className="flex items-center gap-3 shrink-0">
            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shadow-md", isDark ? "bg-white/10" : "bg-white")}>
              <Logo className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black tracking-tight select-none flex items-center gap-2">
              Explore Search
              <span className={clsx("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full", colors.bgSolid, "text-white")}>
                Early Testing
              </span>
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 relative flex max-w-3xl">
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className={clsx(
                "w-full px-5 py-3 pl-12 rounded-full border shadow-sm outline-none transition-all",
                colors.ring,
                isDark 
                  ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10" 
                  : "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:shadow-md"
              )}
              placeholder={language === 'fr' ? "Rechercher avec Explore..." : "Search with Explore..."}
            />
            <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          </form>
        </div>

        {/* Search Tabs */}
        <div className={clsx("flex items-center gap-6 mb-8 border-b pb-0.5", isDark ? "border-white/10" : "border-gray-200")}>
          <button className={clsx("pb-3 text-sm font-semibold border-b-2", colors.text, colors.border)}>
            {language === 'fr' ? 'Tous' : 'All'}
          </button>
          <button 
            onClick={() => onNewTab(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`)}
            className={clsx("pb-3 text-sm font-medium border-b-2 border-transparent transition-colors", isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800")}
          >
            {language === 'fr' ? 'Images' : 'Images'}
          </button>
          <button 
            onClick={() => onNewTab(`https://www.google.com/search?tbm=vid&q=${encodeURIComponent(query)}`)}
            className={clsx("pb-3 text-sm font-medium border-b-2 border-transparent transition-colors", isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800")}
          >
            {language === 'fr' ? 'Vidéos' : 'Videos'}
          </button>
          <button 
            onClick={() => onNewTab(`https://www.google.com/search?tbm=nws&q=${encodeURIComponent(query)}`)}
            className={clsx("pb-3 text-sm font-medium border-b-2 border-transparent transition-colors", isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800")}
          >
            {language === 'fr' ? 'Actualités' : 'News'}
          </button>
          <button 
            onClick={() => onNewTab(`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`)}
            className={clsx("pb-3 text-sm font-medium border-b-2 border-transparent transition-colors", isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800")}
          >
            {language === 'fr' ? 'Shopping' : 'Shopping'}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-8">
          {isLoading ? (
            // Skeleton loaders
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className={clsx("h-5 w-3/4 rounded mb-3", isDark ? "bg-white/10" : "bg-gray-200")} />
                <div className={clsx("h-4 w-1/3 rounded mb-2", isDark ? "bg-white/5" : "bg-gray-100")} />
                <div className={clsx("h-3 w-full rounded", isDark ? "bg-white/5" : "bg-gray-100")} />
                <div className={clsx("h-3 w-5/6 rounded mt-1", isDark ? "bg-white/5" : "bg-gray-100")} />
              </div>
            ))
          ) : error ? (
            <div className={clsx("p-4 rounded-xl border", isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600")}>
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20">
              <p className={clsx("text-lg", isDark ? "text-gray-400" : "text-gray-500")}>
                {language === 'fr' ? `Aucun résultat pour "${query}"` : `No results for "${query}"`}
              </p>
            </div>
          ) : (
            results.map((result, i) => {
              let hostname = '';
              try { hostname = new URL(result.url).hostname; } catch { /* ignore */ }
              
              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center shrink-0", isDark ? "bg-white/10" : "bg-gray-100")}>
                      {hostname ? (
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`} 
                          className="w-4 h-4" 
                          alt=""
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </div>
                    <p className={clsx("text-sm truncate", isDark ? "text-gray-300" : "text-gray-600")}>
                      {result.url}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => onOpenUrl(result.url)}
                    className={clsx(
                      "text-xl font-medium hover:underline text-left",
                      colors.text
                    )}
                  >
                    {result.title}
                  </button>
                  
                  <p className={clsx("text-sm mt-1.5 leading-relaxed", isDark ? "text-gray-400" : "text-gray-600")}>
                    {result.snippet}
                  </p>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
