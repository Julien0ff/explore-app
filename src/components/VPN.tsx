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
}

export function VPN({ isOpen, onClose, theme, accentColor, language }: VPNProps) {
  const colors = getAccentColorClass(accentColor, theme === 'dark');
  const [isConnected, setIsConnected] = useState(() => {
    return localStorage.getItem('vpn_connected') === 'true';
  });
  const [selectedLocation, setSelectedLocation] = useState(() => {
    return localStorage.getItem('vpn_location') || 'France';
  });
  const [duration, setDuration] = useState(0);
  const [stats, setStats] = useState({ up: 0, down: 0 });

  useEffect(() => {
    localStorage.setItem('vpn_connected', String(isConnected));
    localStorage.setItem('vpn_location', selectedLocation);
  }, [isConnected, selectedLocation]);

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
                "w-full max-w-sm rounded-2xl shadow-2xl border flex flex-col overflow-hidden relative max-h-[90vh]",
                theme === 'dark' ? "bg-[#1e1e2e] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
              )}
            >
               {/* Close Button */}
               <button 
                onClick={onClose}
                className={clsx(
                  "absolute top-4 right-4 p-2 rounded-full transition-colors z-10",
                  theme === 'dark' ? "hover:bg-white/10" : "hover:bg-gray-100"
                )}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Status Header */}
              <div className={clsx(
                "p-8 flex flex-col items-center justify-center transition-colors duration-500 relative overflow-hidden",
                isConnected ? (theme === 'dark' ? "bg-green-500/10" : "bg-green-50") : (theme === 'dark' ? "bg-red-500/10" : "bg-red-50")
              )}>
                {/* Background Map Effect */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <Globe className="w-full h-full absolute -right-10 -bottom-10" />
                </div>

                <div className={clsx(
                  "w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all duration-500 shadow-lg cursor-pointer z-10",
                  isConnected ? "bg-green-500 shadow-green-500/30 scale-110" : "bg-gray-400 dark:bg-gray-600 hover:scale-105"
                )}
                onClick={() => setIsConnected(!isConnected)}
                >
                  <Power className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-1 z-10">
                  {isConnected 
                    ? (language === 'fr' ? 'Protégé' : 'Protected') 
                    : (language === 'fr' ? 'Déconnecté' : 'Disconnected')
                  }
                </h2>
                <p className="text-sm opacity-60 z-10">
                  {isConnected 
                    ? (language === 'fr' ? `Connecté à ${selectedLocation}` : `Connected to ${selectedLocation}`) 
                    : (language === 'fr' ? 'Votre connexion n\'est pas sécurisée' : 'Your connection is not secure')
                  }
                </p>

                {isConnected && (
                  <div className="mt-4 flex items-center gap-6 text-xs font-mono opacity-80 z-10">
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {formatTime(duration)}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats (only when connected) */}
              <AnimatePresence>
                {isConnected && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={clsx("grid grid-cols-2 divide-x border-b", theme === 'dark' ? "divide-white/10 border-white/10" : "divide-gray-200 border-gray-200")}
                  >
                    <div className="p-3 text-center">
                      <div className="text-xs opacity-50 mb-1 flex items-center justify-center gap-1">
                        <ArrowDown className="w-3 h-3" /> Download
                      </div>
                      <div className="font-mono font-bold">{formatData(stats.down)}</div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-xs opacity-50 mb-1 flex items-center justify-center gap-1">
                        <ArrowUp className="w-3 h-3" /> Upload
                      </div>
                      <div className="font-mono font-bold">{formatData(stats.up)}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Location List */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 px-2">
                  {language === 'fr' ? 'Localisations' : 'Locations'}
                </h3>
                <div className="space-y-1">
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocation(loc.name)}
                      className={clsx(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                        selectedLocation === loc.name 
                          ? clsx(colors.bg, colors.text) 
                          : theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-100"
                      )}
                    >
                      <img 
                        src={`https://flagcdn.com/w40/${loc.id}.png`} 
                        alt={loc.name}
                        className="w-6 h-4 object-cover rounded shadow-sm"
                      />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{loc.name}</div>
                        <div className="text-xs opacity-60">{loc.city}</div>
                      </div>
                      <div className={clsx(
                        "text-xs font-mono px-2 py-0.5 rounded",
                        parseInt(loc.latency) < 50 ? "bg-green-500/20 text-green-500" :
                        parseInt(loc.latency) < 150 ? "bg-yellow-500/20 text-yellow-500" : "bg-red-500/20 text-red-500"
                      )}>
                        {loc.latency}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer Info */}
              <div className={clsx("p-4 border-t text-xs text-center opacity-50 flex items-center justify-center gap-2", theme === 'dark' ? "border-white/5" : "border-gray-100")}>
                <Shield className="w-3 h-3" />
                Explore VPN • AES-256 Encryption
              </div>

            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
