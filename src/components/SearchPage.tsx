import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { Search as SearchIcon, Globe, ExternalLink, Play, Clock, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';
import type { ThemeColors } from '../lib/theme';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface ImageResult {
  title: string;
  url: string;
  image: string;
  thumbnail: string;
  source: string;
  width: number;
  height: number;
}

interface VideoResult {
  title: string;
  content: string;
  description: string;
  images?: { large?: string; medium?: string; small?: string };
  duration: string;
  publisher: string;
  published: string;
  uploader: string;
}

interface NewsResult {
  title: string;
  url: string;
  body: string;
  source: string;
  date: number;
  image?: string;
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

type TabType = 'all' | 'images' | 'videos' | 'news';

export function SearchPage({ query, onSearch, onOpenUrl, theme, colors, language }: SearchPageProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [imageResults, setImageResults] = useState<ImageResult[]>([]);
  const [videoResults, setVideoResults] = useState<VideoResult[]>([]);
  const [newsResults, setNewsResults] = useState<NewsResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localQuery, setLocalQuery] = useState(query);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);

  const isDark = theme === 'dark';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const electron = (window as any).electron;

  const fetchWebResults = useCallback(async (q: string) => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    try {
      if (!electron?.searchWeb) throw new Error("Search engine IPC not available");
      const html = await electron.searchWeb(q);
      if (!html) throw new Error("No response from search backend");

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const resultNodes = doc.querySelectorAll('.result');
      const parsedResults: SearchResult[] = [];

      resultNodes.forEach((node: Element) => {
        const titleNode = node.querySelector('.result__a');
        const snippetNode = node.querySelector('.result__snippet');
        if (titleNode && snippetNode) {
          let href = titleNode.getAttribute('href') || '';
          if (href.startsWith('//duckduckgo.com/l/?uddg=')) {
            try {
              const urlParams = new URLSearchParams(href.split('?')[1]);
              const uddg = urlParams.get('uddg');
              if (uddg) href = decodeURIComponent(uddg);
            } catch { /* fallback */ }
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
  }, [electron, language]);

  const fetchImageResults = useCallback(async (q: string) => {
    setIsLoading(true);
    setError(null);
    setImageResults([]);
    try {
      if (!electron?.searchImages) throw new Error("Image search IPC not available");
      const data = await electron.searchImages(q);
      setImageResults(data || []);
    } catch (err) {
      console.error(err);
      setError(language === 'fr' ? 'Erreur lors de la recherche d\'images.' : 'Error during image search.');
    } finally {
      setIsLoading(false);
    }
  }, [electron, language]);

  const fetchVideoResults = useCallback(async (q: string) => {
    setIsLoading(true);
    setError(null);
    setVideoResults([]);
    try {
      if (!electron?.searchVideos) throw new Error("Video search IPC not available");
      const data = await electron.searchVideos(q);
      setVideoResults(data || []);
    } catch (err) {
      console.error(err);
      setError(language === 'fr' ? 'Erreur lors de la recherche de vidéos.' : 'Error during video search.');
    } finally {
      setIsLoading(false);
    }
  }, [electron, language]);

  const fetchNewsResults = useCallback(async (q: string) => {
    setIsLoading(true);
    setError(null);
    setNewsResults([]);
    try {
      if (!electron?.searchNews) throw new Error("News search IPC not available");
      const data = await electron.searchNews(q);
      setNewsResults(data || []);
    } catch (err) {
      console.error(err);
      setError(language === 'fr' ? 'Erreur lors de la recherche d\'actualités.' : 'Error during news search.');
    } finally {
      setIsLoading(false);
    }
  }, [electron, language]);

  useEffect(() => {
    if (!query) return;
    setLocalQuery(query);
    switch (activeTab) {
      case 'all': fetchWebResults(query); break;
      case 'images': fetchImageResults(query); break;
      case 'videos': fetchVideoResults(query); break;
      case 'news': fetchNewsResults(query); break;
    }
  }, [query, activeTab, fetchWebResults, fetchImageResults, fetchVideoResults, fetchNewsResults]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      onSearch(localQuery.trim());
    }
  };

  const formatDuration = (dur: string) => {
    if (!dur) return '';
    return dur;
  };

  const formatDate = (timestamp: number) => {
    try {
      const date = new Date(timestamp * 1000);
      return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  const SkeletonLoader = () => (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className={clsx("h-5 w-3/4 rounded mb-3", isDark ? "bg-white/10" : "bg-gray-200")} />
          <div className={clsx("h-4 w-1/3 rounded mb-2", isDark ? "bg-white/5" : "bg-gray-100")} />
          <div className={clsx("h-3 w-full rounded", isDark ? "bg-white/5" : "bg-gray-100")} />
          <div className={clsx("h-3 w-5/6 rounded mt-1", isDark ? "bg-white/5" : "bg-gray-100")} />
        </div>
      ))}
    </>
  );

  const ImageSkeletonLoader = () => (
    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className={clsx("animate-pulse rounded-xl mb-3 break-inside-avoid", isDark ? "bg-white/10" : "bg-gray-200")}
          style={{ height: `${120 + Math.random() * 180}px` }} />
      ))}
    </div>
  );

  // Render images tab
  const renderImages = () => {
    if (isLoading) return <ImageSkeletonLoader />;
    if (error) return <div className={clsx("p-4 rounded-xl border", isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600")}>{error}</div>;
    if (imageResults.length === 0) return (
      <div className="text-center py-20">
        <ImageIcon className={clsx("w-12 h-12 mx-auto mb-4", isDark ? "text-gray-600" : "text-gray-300")} />
        <p className={clsx("text-lg", isDark ? "text-gray-400" : "text-gray-500")}>
          {language === 'fr' ? `Aucune image pour "${query}"` : `No images for "${query}"`}
        </p>
      </div>
    );

    return (
      <>
        {/* Image grid - masonry style */}
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3">
          {imageResults.map((img, i) => {
            let hostname = '';
            try { hostname = new URL(img.url).hostname.replace('www.', ''); } catch { /* ignore */ }

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
                className="mb-3 break-inside-avoid group cursor-pointer"
                onClick={() => setSelectedImage(img)}
              >
                <div className={clsx(
                  "rounded-xl overflow-hidden border transition-all duration-200",
                  isDark ? "border-white/5 hover:border-white/20" : "border-gray-200 hover:border-gray-400",
                  "hover:shadow-xl hover:scale-[1.02]"
                )}>
                  <img
                    src={img.thumbnail}
                    alt={img.title}
                    className="w-full object-cover"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className={clsx("px-2.5 py-2", isDark ? "bg-white/5" : "bg-gray-50")}>
                    <p className={clsx("text-xs font-medium truncate", isDark ? "text-gray-200" : "text-gray-800")}>
                      {img.title}
                    </p>
                    <p className={clsx("text-[10px] truncate mt-0.5", isDark ? "text-gray-500" : "text-gray-400")}>
                      {hostname} · {img.width}×{img.height}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Image preview panel */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={clsx("max-w-4xl max-h-[85vh] w-full mx-4 rounded-2xl overflow-hidden shadow-2xl", isDark ? "bg-gray-900" : "bg-white")}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative flex items-center justify-center bg-black/30 max-h-[60vh] overflow-hidden">
                <img
                  src={selectedImage.image}
                  alt={selectedImage.title}
                  className="max-w-full max-h-[60vh] object-contain"
                  onError={(e) => { e.currentTarget.src = selectedImage.thumbnail; }}
                />
              </div>
              <div className="p-5">
                <h3 className={clsx("text-base font-semibold mb-1", isDark ? "text-white" : "text-gray-900")}>{selectedImage.title}</h3>
                <p className={clsx("text-sm mb-3", isDark ? "text-gray-400" : "text-gray-500")}>
                  {selectedImage.width}×{selectedImage.height}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => onOpenUrl(selectedImage.image)}
                    className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors", colors.bgSolid, "text-white hover:opacity-90")}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {language === 'fr' ? 'Ouvrir l\'image' : 'Open image'}
                  </button>
                  <button
                    onClick={() => onOpenUrl(selectedImage.url)}
                    className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border", isDark ? "border-white/10 text-gray-300 hover:bg-white/5" : "border-gray-200 text-gray-700 hover:bg-gray-50")}
                  >
                    <Globe className="w-4 h-4" />
                    {language === 'fr' ? 'Visiter le site' : 'Visit site'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </>
    );
  };

  // Render videos tab
  const renderVideos = () => {
    if (isLoading) return <SkeletonLoader />;
    if (error) return <div className={clsx("p-4 rounded-xl border", isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600")}>{error}</div>;
    if (videoResults.length === 0) return (
      <div className="text-center py-20">
        <Play className={clsx("w-12 h-12 mx-auto mb-4", isDark ? "text-gray-600" : "text-gray-300")} />
        <p className={clsx("text-lg", isDark ? "text-gray-400" : "text-gray-500")}>
          {language === 'fr' ? `Aucune vidéo pour "${query}"` : `No videos for "${query}"`}
        </p>
      </div>
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videoResults.map((vid, i) => {
          const thumb = vid.images?.large || vid.images?.medium || vid.images?.small || '';

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={clsx(
                "rounded-xl overflow-hidden border cursor-pointer group transition-all duration-200 hover:shadow-xl hover:scale-[1.02]",
                isDark ? "border-white/5 bg-white/[0.02] hover:border-white/15" : "border-gray-200 bg-white hover:border-gray-300"
              )}
              onClick={() => onOpenUrl(vid.content)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-black/20 overflow-hidden">
                {thumb ? (
                  <img src={thumb} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-10 h-10 text-gray-500" />
                  </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors duration-200">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                    <Play className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" />
                  </div>
                </div>
                {/* Duration badge */}
                {vid.duration && (
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-medium px-1.5 py-0.5 rounded">
                    {formatDuration(vid.duration)}
                  </span>
                )}
              </div>
              {/* Info */}
              <div className="p-3">
                <h3 className={clsx("text-sm font-semibold line-clamp-2 mb-1", isDark ? "text-gray-100" : "text-gray-900")}>
                  {vid.title}
                </h3>
                <div className={clsx("flex items-center gap-2 text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                  {vid.uploader && <span className="truncate">{vid.uploader}</span>}
                  {vid.publisher && <span className="truncate opacity-60">• {vid.publisher}</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Render news tab
  const renderNews = () => {
    if (isLoading) return <SkeletonLoader />;
    if (error) return <div className={clsx("p-4 rounded-xl border", isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600")}>{error}</div>;
    if (newsResults.length === 0) return (
      <div className="text-center py-20">
        <p className={clsx("text-lg", isDark ? "text-gray-400" : "text-gray-500")}>
          {language === 'fr' ? `Aucune actualité pour "${query}"` : `No news for "${query}"`}
        </p>
      </div>
    );

    return (
      <div className="space-y-4 max-w-4xl">
        {newsResults.map((news, i) => {
          let hostname = '';
          try { hostname = new URL(news.url).hostname.replace('www.', ''); } catch { /* ignore */ }

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={clsx(
                "flex gap-4 p-4 rounded-xl border cursor-pointer group transition-all duration-200 hover:shadow-lg",
                isDark ? "border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              )}
              onClick={() => onOpenUrl(news.url)}
            >
              {/* Image */}
              {news.image && (
                <div className="w-32 h-24 rounded-lg overflow-hidden shrink-0 bg-black/10">
                  <img src={news.image} alt={news.title} className="w-full h-full object-cover" loading="lazy"
                    onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
                  />
                </div>
              )}
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className={clsx("flex items-center gap-2 mb-1 text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                  <span className="font-medium">{news.source || hostname}</span>
                  {news.date && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(news.date)}</span>
                    </>
                  )}
                </div>
                <h3 className={clsx("text-base font-semibold line-clamp-2 mb-1 group-hover:underline", colors.text)}>
                  {news.title}
                </h3>
                <p className={clsx("text-sm line-clamp-2", isDark ? "text-gray-400" : "text-gray-600")}>
                  {news.body}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Render web results tab (default)
  const renderWebResults = () => {
    if (isLoading) return <SkeletonLoader />;
    if (error) return <div className={clsx("p-4 rounded-xl border", isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600")}>{error}</div>;
    if (results.length === 0) return (
      <div className="text-center py-20">
        <p className={clsx("text-lg", isDark ? "text-gray-400" : "text-gray-500")}>
          {language === 'fr' ? `Aucun résultat pour "${query}"` : `No results for "${query}"`}
        </p>
      </div>
    );

    return (
      <div className="space-y-8 max-w-4xl">
        {results.map((result, i) => {
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
                className={clsx("text-xl font-medium hover:underline text-left", colors.text)}
              >
                {result.title}
              </button>

              <p className={clsx("text-sm mt-1.5 leading-relaxed", isDark ? "text-gray-400" : "text-gray-600")}>
                {result.snippet}
              </p>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const tabs: { id: TabType; label: { fr: string; en: string } }[] = [
    { id: 'all', label: { fr: 'Tous', en: 'All' } },
    { id: 'images', label: { fr: 'Images', en: 'Images' } },
    { id: 'videos', label: { fr: 'Vidéos', en: 'Videos' } },
    { id: 'news', label: { fr: 'Actualités', en: 'News' } },
  ];

  return (
    <div className={clsx("w-full h-full overflow-hidden flex flex-col animate-fadeIn", isDark ? "text-gray-200" : "text-gray-800")}>
      <div className="max-w-7xl mx-auto px-8 pt-8 w-full shrink-0">

        {/* Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
          <div className="flex items-center gap-3 shrink-0">
            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shadow-md", isDark ? "bg-white/10" : "bg-white")}>
              <Logo className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black tracking-tight select-none">
              Explore Search
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

        {/* Tabs */}
        <div className={clsx("flex items-center gap-6 mb-6 border-b", isDark ? "border-white/10" : "border-gray-200")}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "pb-3 text-sm font-semibold border-b-2 transition-colors",
                activeTab === tab.id
                  ? clsx(colors.text, colors.border)
                  : "border-transparent " + (isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800")
              )}
            >
              {tab.label[language]}
            </button>
          ))}
        </div>
      </div>

      {/* Results area */}
      <div className="flex-1 w-full overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 pb-8">
          {activeTab === 'all' && renderWebResults()}
          {activeTab === 'images' && renderImages()}
          {activeTab === 'videos' && renderVideos()}
          {activeTab === 'news' && renderNews()}
        </div>
      </div>
    </div>
  );
}
