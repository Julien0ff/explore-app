import { useState, useEffect } from 'react';
import { X, Shield, Globe, Power, Activity, ArrowUp, ArrowDown } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { getAccentColorClass } from '../lib/theme';

interface VPNProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  language: 'fr' | 'en';
  isFullPage?: boolean;
}

export function VPN({ isOpen, onClose, theme, accentColor, language, isFullPage = false }: VPNProps) {
  const colors = getAccentColorClass(accentColor, theme === 'dark');
  const [isConnected, setIsConnected] = useState(() => {
    return localStorage.getItem('vpn_connected') === 'true';
  });
  const [selectedLocation, setSelectedLocation] = useState(() => {
    return localStorage.getItem('vpn_location') || 'France';
  });
  const [selectedLocationId, setSelectedLocationId] = useState(() => {
    return localStorage.getItem('vpn_location_id') || 'fr';
  });
  const [duration, setDuration] = useState(0);
  const [stats, setStats] = useState({ up: 0, down: 0 });

  useEffect(() => {
    localStorage.setItem('vpn_connected', String(isConnected));
    localStorage.setItem('vpn_location', selectedLocation);
    localStorage.setItem('vpn_location_id', selectedLocationId);
  }, [isConnected, selectedLocation, selectedLocationId]);

  useEffect(() => {
    if (isConnected && window.electron) {
      window.electron.setProxy(selectedLocationId);
    } else if (!isConnected && window.electron) {
      window.electron.disableProxy();
    }
  }, [isConnected, selectedLocationId]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isConnected) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
        setStats(prev => ({
          up: prev.up + Math.random() * 0.5,
          down: prev.down + Math.random() * 2
        }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (!isConnected) {
        setDuration(0);
        setStats({ up: 0, down: 0 });
      }
    };
  }, [isConnected]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatData = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const locations = [
    { id: 'fr', name: 'France', city: 'Paris', latency: '12ms' },
    { id: 'us', name: 'USA', city: 'New York', latency: '85ms' },
    { id: 'uk', name: 'United Kingdom', city: 'London', latency: '24ms' },
    { id: 'jp', name: 'Japan', city: 'Tokyo', latency: '210ms' },
    { id: 'de', name: 'Germany', city: 'Frankfurt', latency: '18ms' },
    { id: 'ca', name: 'Canada', city: 'Montreal', latency: '95ms' },
    { id: 'au', name: 'Australia', city: 'Sydney', latency: '250ms' },
  ];

  const cockpitContent = (
    <div className="w-full h-full flex flex-col">
      {/* Top Header */}
      <div className={clsx("p-6 border-b flex items-center justify-between", theme === 'dark' ? "border-white/5" : "border-gray-150")}>
        <div className="flex items-center gap-3">
          <div className={clsx("p-2.5 rounded-xl text-white shadow-md relative overflow-hidden", colors.bgSolid)}>
            <Shield className="w-5 h-5 relative z-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Explore Secure VPN</h2>
            <p className="text-[10px] opacity-40 leading-none mt-1">AES-256 Military Grade Encryption</p>
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

      {/* Main Grid split */}
      <div className={clsx(
        "flex-1 overflow-y-auto custom-scrollbar p-6",
        isFullPage ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "flex flex-col gap-6"
      )}>
        {/* Left Dial Cockpit Column */}
        <div className="flex flex-col items-center justify-center p-6 rounded-3xl border border-white/5 bg-white/2 relative overflow-hidden shadow-inner">
          {/* Glowing Map Backdrop */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <Globe className="w-full h-full scale-125" />
          </div>

          {/* Large Dial Button */}
          <div 
            onClick={() => setIsConnected(!isConnected)}
            className="relative cursor-pointer select-none group flex items-center justify-center mb-6"
          >
            {/* Outer Glow Ring */}
            <div className={clsx(
              "absolute w-44 h-44 rounded-full transition-all duration-1000 blur-xl opacity-30 group-hover:opacity-40",
              isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
            )} />

            {/* Middle nested rotating border */}
            <div className={clsx(
              "absolute w-40 h-40 rounded-full border-2 border-dashed transition-all duration-4000 ease-linear",
              isConnected ? "border-green-500/60 rotate-180" : "border-red-500/20"
            )} />

            {/* Inner Ring dial */}
            <div className={clsx(
              "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 relative border shadow-2xl z-10",
              isConnected 
                ? "bg-green-500 hover:bg-green-600 border-green-400 shadow-green-500/30 scale-105" 
                : "bg-white/5 hover:bg-white/10 border-white/10"
            )}>
              <Power className={clsx(
                "w-12 h-12 transition-all duration-500",
                isConnected ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" : "text-red-500"
              )} />
            </div>
          </div>

          {/* Connected State Badge */}
          <div className="text-center z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className={clsx(
                "w-2.5 h-2.5 rounded-full",
                isConnected ? "bg-green-500 animate-ping" : "bg-red-500"
              )} />
              <h3 className="text-lg font-extrabold tracking-wide uppercase">
                {isConnected 
                  ? (language === 'fr' ? 'Protégé' : 'Protected') 
                  : (language === 'fr' ? 'Déconnecté' : 'Disconnected')
                }
              </h3>
            </div>
            <p className="text-xs opacity-50 max-w-[240px] mx-auto leading-normal">
              {isConnected 
                ? (language === 'fr' ? `VOS DONNÉES SONT SÉCURISÉES VIA ${selectedLocation.toUpperCase()}` : `YOUR DATA IS ENCRYPTED VIA ${selectedLocation.toUpperCase()}`) 
                : (language === 'fr' ? 'Votre adresse IP publique est exposée. Connectez-vous.' : 'Your actual IP is exposed. Tap above to secure your connection.')
              }
            </p>
          </div>

          {/* Time and Latency Stats */}
          {isConnected && (
            <div className="mt-6 flex items-center gap-4 text-xs font-mono border border-white/5 bg-black/10 px-4 py-2 rounded-2xl z-10 text-green-400">
              <div className="flex items-center gap-1.5 border-r border-white/10 pr-4">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>{formatTime(duration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>PING:</span>
                <span className="font-bold">{locations.find(l => l.id === selectedLocationId)?.latency || '12ms'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Stats and Locations Column */}
        <div className="flex flex-col gap-6">
          {/* Data Speed Counters */}
          {isConnected ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-white/5 bg-white/2 flex flex-col justify-between h-24 shadow-xs">
                <div className="text-[10px] opacity-40 font-bold uppercase tracking-wider flex items-center gap-1">
                  <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                  Download Speed
                </div>
                <div className="font-mono text-xl font-bold tracking-tight text-blue-400">
                  {formatData(stats.down)}
                </div>
              </div>
              <div className="p-4 rounded-2xl border border-white/5 bg-white/2 flex flex-col justify-between h-24 shadow-xs">
                <div className="text-[10px] opacity-40 font-bold uppercase tracking-wider flex items-center gap-1">
                  <ArrowUp className="w-3.5 h-3.5 text-green-400" />
                  Upload Speed
                </div>
                <div className="font-mono text-xl font-bold tracking-tight text-green-400">
                  {formatData(stats.up)}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-red-500/10 bg-red-500/2 text-red-400 text-xs flex items-center gap-3">
              <Shield className="w-5 h-5 shrink-0 animate-bounce" />
              <div>
                <p className="font-bold">{language === 'fr' ? 'Alerte de sécurité' : 'Security Alert'}</p>
                <p className="opacity-70 mt-0.5">{language === 'fr' ? 'La navigation est actuellement non chiffrée' : 'Your current connection is unencrypted.'}</p>
              </div>
            </div>
          )}

          {/* Location Selector */}
          <div className="flex-1 flex flex-col min-h-[220px]">
            <h3 className="text-[11px] font-bold uppercase tracking-wider opacity-50 mb-3 pl-1">
              {language === 'fr' ? 'Serveurs ultra-rapides' : 'Premium Servers'}
            </h3>
            <div className={clsx(
              "flex-1 overflow-y-auto custom-scrollbar space-y-1.5 max-h-[300px] border border-white/5 rounded-2xl p-2",
              theme === 'dark' ? "bg-black/10" : "bg-gray-50 border-gray-150"
            )}>
              {locations.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => {
                    setSelectedLocation(loc.name);
                    setSelectedLocationId(loc.id);
                  }}
                  className={clsx(
                    "w-full flex items-center gap-3.5 p-3 rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md select-none",
                    selectedLocationId === loc.id
                      ? clsx(colors.bg, colors.text, "shadow-lg")
                      : theme === 'dark' 
                        ? "bg-white/2 hover:bg-white/5 border border-white/2 hover:border-white/5" 
                        : "bg-white hover:bg-gray-100/50 border border-gray-100"
                  )}
                >
                  <img 
                    src={`https://flagcdn.com/w40/${loc.id}.png`} 
                    alt={loc.name}
                    className="w-7 h-5 object-cover rounded shadow-sm border border-white/10"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-bold text-xs truncate leading-none">{loc.name}</div>
                    <div className="text-[10px] opacity-40 leading-none mt-1.5 truncate">{loc.city}</div>
                  </div>
                  <div className={clsx(
                    "text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border shadow-inner",
                    parseInt(loc.latency) < 30 ? "bg-green-500/20 text-green-400 border-green-500/20" :
                    parseInt(loc.latency) < 100 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/20" : 
                    "bg-red-500/20 text-red-400 border-red-500/20"
                  )}>
                    {loc.latency}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom encryption banner */}
      <div className={clsx("p-4 border-t text-[10px] text-center opacity-40 flex items-center justify-center gap-2", theme === 'dark' ? "border-white/5" : "border-gray-100")}>
        <Shield className="w-3.5 h-3.5" />
        {language === 'fr' ? 'Chiffrement AES-256 de bout en bout actif' : 'End-to-End AES-256 Encrypted Layer Active'}
      </div>
    </div>
  );

  if (isFullPage) {
    return (
      <div className="w-full h-full relative flex flex-col bg-transparent transition-all duration-300">
        {cockpitContent}
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
                "w-full max-w-sm rounded-3xl shadow-2xl border flex flex-col overflow-hidden relative backdrop-blur-2xl transition-all duration-300",
                theme === 'dark' ? "bg-[#12121e]/95 border-white/10 text-white" : "bg-white/95 border-gray-250 text-gray-900"
              )}
            >
              {cockpitContent}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
