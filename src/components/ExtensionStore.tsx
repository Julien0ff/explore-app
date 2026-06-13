import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Star, ExternalLink, Search, PackageOpen, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import type { ThemeColors } from '../lib/theme';

interface ExtensionStoreProps {
  theme: 'dark' | 'light';
  language?: 'fr' | 'en';
  colors: ThemeColors;
}

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  html_url: string;
  owner: {
    avatar_url: string;
    login: string;
  };
}

export default function ExtensionStore({ theme, language = 'fr', colors }: ExtensionStoreProps) {
  const [extensions, setExtensions] = useState<GithubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [installing, setInstalling] = useState<Record<number, boolean>>({});
  const [installed, setInstalled] = useState<Record<number, boolean>>({});

  const handleInstall = async (ext: GithubRepo) => {
    if (!window.electron?.extensionsInstallFromUrl) {
      window.electron?.openExternal(`${ext.html_url}/releases/latest`);
      return;
    }

    try {
      setInstalling(prev => ({ ...prev, [ext.id]: true }));
      const response = await fetch(`https://api.github.com/repos/${ext.owner.login}/${ext.name}/releases/latest`);
      if (!response.ok) throw new Error('No release found');
      const release = await response.json();
      
      const zipAsset = release.assets?.find((a: { name: string; browser_download_url: string }) => a.name.endsWith('.zip'));
      if (!zipAsset) {
        window.electron?.openExternal(`${ext.html_url}/releases/latest`);
        setInstalling(prev => ({ ...prev, [ext.id]: false }));
        return;
      }
      
      const result = await window.electron.extensionsInstallFromUrl(zipAsset.browser_download_url);
      if (result.success) {
        setInstalled(prev => ({ ...prev, [ext.id]: true }));
        window.dispatchEvent(new Event('extensions-changed'));
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      console.error('Failed to install extension:', e);
      window.electron?.openExternal(`${ext.html_url}/releases/latest`);
    } finally {
      setInstalling(prev => ({ ...prev, [ext.id]: false }));
    }
  };

  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        setIsLoading(true);
        // On recherche les repositories avec le topic "explore-extension"
        const response = await fetch('https://api.github.com/search/repositories?q=topic:explore-extension+sort:stars');
        if (!response.ok) throw new Error('API Rate limit ou erreur réseau');
        const data = await response.json();
        setExtensions(data.items || []);
      } catch (err) {
        console.error('Failed to fetch extensions:', err);
        setError(language === 'fr' ? 'Impossible de charger le catalogue d\'extensions. Réessayez plus tard.' : 'Unable to load extension catalog. Try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExtensions();
  }, [language]);

  const filteredExtensions = extensions.filter(ext => 
    ext.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (ext.description && ext.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={clsx(
      "w-full h-full flex flex-col",
      theme === 'dark' ? "bg-[#1e1e2e] text-white" : "bg-white text-gray-900"
    )}>
      {/* Header */}
      <div className={clsx(
        "px-10 pt-12 pb-6 shrink-0 border-b",
        theme === 'dark' ? "border-white/5 bg-[#181825]" : "border-gray-150 bg-gray-50/50"
      )}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={clsx(
              "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border",
              theme === 'dark' ? "bg-linear-to-br from-white/10 to-transparent border-white/10" : "bg-linear-to-br from-white to-gray-50 border-gray-200"
            )}>
              <PackageOpen className={clsx("w-7 h-7", colors.text)} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Explore Store</h1>
              <p className={clsx("text-sm font-bold opacity-60", theme === 'dark' ? "text-gray-400" : "text-gray-500")}>
                {language === 'fr' ? 'Découvrez des extensions créées par la communauté.' : 'Discover extensions created by the community.'}
              </p>
            </div>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'fr' ? "Rechercher une extension..." : "Search extensions..."}
              className={clsx(
                "w-full pl-10 pr-4 py-3 rounded-2xl font-semibold text-sm outline-none transition-all focus:ring-2",
                theme === 'dark' 
                  ? "bg-black/20 focus:bg-black/40 placeholder-white/30 focus:ring-white/10" 
                  : "bg-gray-100/50 focus:bg-white border border-transparent focus:border-gray-300 placeholder-gray-400 focus:ring-gray-200 shadow-inner"
              )}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-10 scrollbar-thin">
        <div className="max-w-6xl mx-auto">
          {error ? (
            <div className={clsx("p-6 rounded-3xl border flex items-center gap-4", theme === 'dark' ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600")}>
              <AlertTriangle className="w-6 h-6" />
              <p className="font-bold">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className={clsx("w-10 h-10 border-4 border-t-transparent rounded-full animate-spin", colors.border)} />
              <p className="font-bold opacity-60 text-sm animate-pulse">
                {language === 'fr' ? 'Chargement du catalogue...' : 'Loading catalog...'}
              </p>
            </div>
          ) : filteredExtensions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-60">
              <PackageOpen className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-xl font-bold mb-2">{language === 'fr' ? 'Aucune extension trouvée' : 'No extensions found'}</h3>
              <p className="text-sm font-semibold max-w-sm">
                {language === 'fr' 
                  ? 'Il n\'y a pas encore d\'extensions correspondant à votre recherche. Si vous êtes développeur, ajoutez le tag "explore-extension" à votre dépôt GitHub pour apparaître ici !' 
                  : 'There are no extensions matching your search. If you are a developer, add the "explore-extension" topic to your GitHub repo to appear here!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExtensions.map((ext, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={ext.id}
                  className={clsx(
                    "group relative p-6 rounded-3xl border flex flex-col transition-all hover:scale-[1.02] hover:shadow-xl",
                    theme === 'dark' ? "bg-white/5 hover:bg-white/10 border-white/5" : "bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
                  )}
                >
                  <div className="flex gap-4 mb-4">
                    <img 
                      src={ext.owner.avatar_url} 
                      alt={ext.owner.login} 
                      className="w-14 h-14 rounded-2xl border bg-white/10 shadow-sm object-cover shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col items-start gap-1">
                        <h3 className="font-black text-lg truncate group-hover:text-blue-500 transition-colors w-full">{ext.name.replace('explore-extension-', '')}</h3>
                        {ext.owner.login.toLowerCase() === 'julien0ff' && (
                          <span className={clsx("text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider", theme === 'dark' ? "bg-blue-500/20 text-blue-400 border border-blue-500/20" : "bg-blue-50 text-blue-600 border border-blue-200")}>
                            {language === 'fr' ? 'Extension Officielle' : 'Official Extension'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold opacity-50 truncate flex items-center gap-1.5 mt-1">
                        <span className="w-4 h-4 rounded-full bg-current opacity-20 inline-block overflow-hidden relative">
                          <img src={ext.owner.avatar_url} className="absolute inset-0 w-full h-full" />
                        </span>
                        {ext.owner.login}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm font-semibold opacity-70 line-clamp-3 mb-6 flex-1">
                    {ext.description || (language === 'fr' ? 'Aucune description fournie.' : 'No description provided.')}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-current border-opacity-10 mt-auto">
                    <div className="flex items-center gap-1.5 text-xs font-bold opacity-60">
                      <Star className="w-3.5 h-3.5 fill-current text-yellow-500" />
                      {ext.stargazers_count}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => window.electron?.openExternal(ext.html_url)}
                        className={clsx(
                          "w-9 h-9 rounded-xl flex items-center justify-center transition-colors border",
                          theme === 'dark' ? "hover:bg-white/10 border-white/10" : "hover:bg-gray-100 border-gray-200"
                        )}
                        title={language === 'fr' ? 'Voir sur GitHub' : 'View on GitHub'}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleInstall(ext)}
                        disabled={installing[ext.id] || installed[ext.id]}
                        className={clsx(
                          "px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center gap-2",
                          installing[ext.id] || installed[ext.id] ? "opacity-75 cursor-not-allowed bg-gray-500" : clsx("hover:scale-105 active:scale-95", colors.bgSolid, colors.bgHover)
                        )}
                      >
                        {installing[ext.id] ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {language === 'fr' ? 'Téléchargement...' : 'Downloading...'}
                          </>
                        ) : installed[ext.id] ? (
                          <>
                            <Star className="w-3.5 h-3.5" />
                            {language === 'fr' ? 'Installé' : 'Installed'}
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            {language === 'fr' ? 'Télécharger' : 'Download'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
