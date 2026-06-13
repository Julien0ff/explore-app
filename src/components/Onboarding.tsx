import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Moon, Sun, Monitor, Search, Globe, Layout, Shield, AlertTriangle, X, Check } from 'lucide-react';
import { Logo } from './Logo';
import { clsx } from 'clsx';

// Animated checkbox — declared outside the component to avoid re-creation on render
function AnimatedCheckbox({ checked, onChange, isDark }: { checked: boolean; onChange: (val: boolean) => void; isDark: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={clsx(
        "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 shrink-0",
        checked
          ? "bg-blue-600 border-blue-600 shadow-md shadow-blue-500/30"
          : isDark 
            ? "border-white/20 hover:border-white/40 bg-transparent" 
            : "border-gray-300 hover:border-gray-400 bg-transparent"
      )}
    >
      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Check className="w-3 h-3 text-white stroke-[3.5px]" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

interface OnboardingProps {
  onComplete: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSearchEngine: (engine: string) => void;
  setLanguage: (lang: 'fr' | 'en') => void;
  currentTheme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en';
}

export function Onboarding({ onComplete, setTheme, setSearchEngine, setLanguage, currentTheme, language }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [showBetaPopup, setShowBetaPopup] = useState(false);

  const isDark = currentTheme === 'dark' || currentTheme === 'system';

  const nextStep = () => setStep(s => s + 1);

  const steps = [
    {
      id: 'language',
      title: 'Language',
      description: 'Choose your language / Choisissez votre langue',
      icon: <Globe className="w-16 h-16 text-indigo-500 mb-6" />
    },
    {
      id: 'welcome',
      title: language === 'fr' ? 'Bienvenue sur Explore' : 'Welcome to Explore',
      description: language === 'fr' ? 'Découvrez le web d\'une nouvelle manière moderne.' : 'Experience the web in a new, modern way.',
      icon: <Logo className="w-24 h-24 mb-8" />
    },
    {
      id: 'terms',
      title: language === 'fr' ? 'Confidentialité & CGU' : 'Privacy & Terms',
      description: language === 'fr' ? 'Découvrez notre engagement pour votre vie privée.' : 'Learn about our commitment to your privacy.',
      icon: <Shield className="w-16 h-16 text-emerald-500 mb-6" />
    },
    {
      id: 'theme',
      title: language === 'fr' ? 'Choisissez votre Style' : 'Choose your Style',
      description: language === 'fr' ? 'Sélectionnez un thème qui vous correspond.' : 'Select a theme that suits your vibe.',
      icon: <Layout className="w-16 h-16 text-blue-500 mb-6" />
    },
    {
      id: 'search',
      title: language === 'fr' ? 'Moteur de Recherche' : 'Search Engine',
      description: language === 'fr' ? 'Qui devrait guider votre exploration ?' : 'Who should guide your exploration?',
      icon: <Search className="w-16 h-16 text-purple-500 mb-6" />
    },
    {
      id: 'ready',
      title: language === 'fr' ? 'Tout est Prêt !' : "You're All Set!",
      description: language === 'fr' ? 'Prêt à explorer le web infini ?' : "Ready to explore the infinite web?",
      icon: (
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
          >
            <Check className="w-10 h-10 text-green-500 stroke-[3px]" />
          </motion.div>
        </div>
      )
    }
  ];

  const handleSelectExplore = () => {
    setShowBetaPopup(true);
  };

  const confirmExploreEngine = () => {
    setSearchEngine('explore');
    setShowBetaPopup(false);
    nextStep();
  };



  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-white dark:bg-[#0e0e1a] text-gray-900 dark:text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/3 -left-1/3 w-[80%] h-[80%] bg-blue-500/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-1/3 -right-1/3 w-[80%] h-[80%] bg-purple-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Glassmorphism Card */}
      <div className="w-full max-w-2xl px-6 relative z-10">
        <motion.div
          className={clsx(
            "rounded-4xl border p-10 md:p-12 shadow-2xl",
            isDark
              ? "bg-white/4 border-white/8 backdrop-blur-2xl shadow-black/30"
              : "bg-white/70 border-white/40 backdrop-blur-2xl shadow-gray-300/30"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center"
            >
              {steps[step].icon}
              
              <h1 className="text-4xl font-black mb-3 bg-clip-text text-transparent bg-linear-to-r from-blue-500 to-purple-600">
                {steps[step].title}
              </h1>
              
              <p className={clsx("text-lg mb-10 max-w-md", isDark ? "text-gray-400" : "text-gray-500")}>
                {steps[step].description}
              </p>

              {/* Step Content */}
              <div className="w-full max-w-md mb-8 min-h-[200px] flex flex-col items-center justify-center">
                
                {/* Step 0 — Language */}
                {step === 0 && (
                  <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    <button
                      onClick={() => {
                        setLanguage('fr');
                        nextStep();
                      }}
                      className={clsx(
                        "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all hover:scale-[1.03]",
                        isDark
                          ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20"
                          : "border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300"
                      )}
                    >
                      <img src="https://flagcdn.com/w80/fr.png" alt="Français" className="w-12 h-8 rounded shadow-sm object-cover" />
                      <span className="font-bold text-base">Français</span>
                    </button>
                    <button
                      onClick={() => {
                        setLanguage('en');
                        nextStep();
                      }}
                      className={clsx(
                        "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all hover:scale-[1.03]",
                        isDark
                          ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20"
                          : "border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300"
                      )}
                    >
                      <img src="https://flagcdn.com/w80/gb.png" alt="English" className="w-12 h-8 rounded shadow-sm object-cover" />
                      <span className="font-bold text-base">English</span>
                    </button>
                  </div>
                )}

                {/* Step 1 — Welcome */}
                {step === 1 && (
                  <button
                    onClick={nextStep}
                    className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
                  >
                    {language === 'fr' ? 'Commencer' : 'Get Started'}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                {/* Step 2 — Terms & Privacy */}
                {step === 2 && (
                  <div className="w-full flex flex-col gap-4 text-left">
                    <div className={clsx(
                      "p-5 rounded-2xl border text-sm space-y-4 max-h-60 overflow-y-auto custom-scrollbar w-full",
                      isDark ? "bg-white/[0.03] border-white/10" : "bg-gray-50/80 border-gray-200/80"
                    )}>
                      {[
                        { emoji: '🔒', titleFr: 'Confidentialité absolue', titleEn: 'Absolute Privacy', descFr: 'Zéro traçage, zéro télémétrie. Votre navigation reste totalement privée.', descEn: 'Zero tracking, zero telemetry. Your browsing remains completely private.' },
                        { emoji: '📁', titleFr: 'Données 100% Locales', titleEn: '100% Local Data', descFr: 'Vos mots de passe (cryptés), favoris et historiques sont stockés uniquement sur votre machine.', descEn: 'Your passwords (encrypted), bookmarks, and history are stored only on your machine.' },
                        { emoji: '☁️', titleFr: 'Données Essentielles Seules', titleEn: 'Essential Sync Only', descFr: 'Si vous activez la synchronisation de compte, seules les données strictement nécessaires et chiffrées sont transmises à nos serveurs.', descEn: 'If you enable account sync, only strictly necessary and encrypted data is transmitted to our servers.' }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-3">
                          <span className="text-lg">{item.emoji}</span>
                          <div>
                            <strong className={isDark ? "text-white" : "text-gray-900"}>
                              {language === 'fr' ? item.titleFr : item.titleEn}
                            </strong>
                            <p className={clsx("text-xs mt-0.5", isDark ? "text-gray-400" : "text-gray-500")}>
                              {language === 'fr' ? item.descFr : item.descEn}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer select-none py-1 group mt-2">
                      <AnimatedCheckbox checked={agreed} onChange={setAgreed} isDark={isDark} />
                      <span className={clsx("text-xs group-hover:text-gray-200 transition-colors", isDark ? "text-gray-400" : "text-gray-500")}>
                        {language === 'fr' 
                          ? "J'accepte les Conditions d'Utilisation et la Politique de Confidentialité" 
                          : "I accept the Terms of Use and the Privacy Policy"}
                      </span>
                    </label>

                    <button
                      disabled={!agreed}
                      onClick={nextStep}
                      className={clsx(
                        "mt-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all text-center flex items-center justify-center gap-2",
                        agreed 
                          ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:scale-105 active:scale-95 shadow-md shadow-blue-500/20" 
                          : isDark ? "bg-white/5 text-gray-500 cursor-not-allowed" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      )}
                    >
                      {language === 'fr' ? 'Accepter et Continuer' : 'Accept and Continue'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Step 3 — Theme */}
                {step === 3 && (
                  <div className="grid grid-cols-3 gap-4 w-full">
                    {[
                      { id: 'light', icon: Sun, label: language === 'fr' ? 'Clair' : 'Light' },
                      { id: 'dark', icon: Moon, label: language === 'fr' ? 'Sombre' : 'Dark' },
                      { id: 'system', icon: Monitor, label: language === 'fr' ? 'Système' : 'System' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id as 'light' | 'dark' | 'system')}
                        className={clsx(
                          "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all hover:scale-[1.03] relative",
                          currentTheme === t.id
                            ? "border-blue-500 bg-blue-500/10 text-blue-500 shadow-lg shadow-blue-500/10"
                            : isDark 
                              ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20" 
                              : "border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300"
                        )}
                      >
                        {/* Animated check badge */}
                        <AnimatePresence>
                          {currentTheme === t.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/30"
                            >
                              <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <t.icon className="w-8 h-8" />
                        <span className="font-semibold">{t.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 4 — Search Engine */}
                {step === 4 && (
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {/* Explore engine — special card */}
                    <button
                      onClick={handleSelectExplore}
                      className={clsx(
                        "col-span-2 p-4 rounded-2xl flex items-center gap-4 transition-all group text-left border-2 relative overflow-hidden",
                        isDark
                          ? "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/50"
                          : "border-purple-200 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-300"
                      )}
                    >
                      {/* Subtle gradient accent */}
                      <div className="absolute inset-0 bg-linear-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
                      <div className={clsx(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative z-10",
                        isDark ? "bg-white/10" : "bg-white shadow-sm"
                      )}>
                        <Logo className="w-6 h-6" />
                      </div>
                      <div className="flex-1 relative z-10">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base">Explore</span>
                          <span className={clsx(
                            "text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider",
                            isDark ? "bg-purple-500/20 text-purple-300" : "bg-purple-100 text-purple-600"
                          )}>
                            Bêta
                          </span>
                        </div>
                        <p className={clsx("text-xs mt-0.5", isDark ? "text-gray-400" : "text-gray-500")}>
                          {language === 'fr' ? 'Notre moteur maison — en développement' : 'Our in-house engine — in development'}
                        </p>
                      </div>
                      <ChevronRight className={clsx("w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity relative z-10", isDark ? "text-gray-400" : "text-gray-400")} />
                    </button>

                    {/* Standard engines */}
                    {[
                      { id: 'google', name: 'Google', icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=64' },
                      { id: 'bing', name: 'Bing', icon: 'https://www.google.com/s2/favicons?domain=bing.com&sz=64' },
                      { id: 'duckduckgo', name: 'DuckDuckGo', icon: 'https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=64' },
                      { id: 'ecosia', name: 'Ecosia', icon: 'https://www.google.com/s2/favicons?domain=ecosia.org&sz=64' },
                      { id: 'qwant', name: 'Qwant', icon: 'https://www.google.com/s2/favicons?domain=qwant.com&sz=64' },
                      { id: 'perplexity', name: 'Perplexity', icon: 'https://icons.duckduckgo.com/ip3/perplexity.ai.ico' }
                    ].map((engine) => (
                      <button
                        key={engine.id}
                        onClick={() => {
                          setSearchEngine(engine.id);
                          nextStep();
                        }}
                        className={clsx(
                          "p-4 rounded-2xl flex items-center gap-3 transition-all group text-left border",
                          isDark
                            ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20"
                            : "bg-gray-50/50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                        )}
                      >
                        <img src={engine.icon} alt={engine.name} className={clsx("w-8 h-8 rounded-lg p-1 shrink-0", isDark ? "bg-white/10" : "bg-white shadow-sm")} />
                        <span className="flex-1 font-semibold">{engine.name}</span>
                        <ChevronRight className={clsx("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", isDark ? "text-gray-500" : "text-gray-400")} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 5 — Ready */}
                {step === 5 && (
                  <button
                    onClick={onComplete}
                    className="px-8 py-4 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-500/30 flex items-center gap-2"
                  >
                    {language === 'fr' ? 'Commencer la navigation' : 'Start Browsing'}
                    <Globe className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Navigation (for Step 3 — Theme) */}
              {step === 3 && (
                <button
                  onClick={nextStep}
                  className={clsx(
                    "mt-2 px-8 py-3 rounded-xl font-medium hover:opacity-90 transition-all",
                    isDark ? "bg-white text-gray-900" : "bg-gray-900 text-white"
                  )}
                >
                  {language === 'fr' ? 'Suivant' : 'Next'}
                </button>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-10">
            {steps.map((_, i) => (
              <div
                key={i}
                className={clsx(
                  "h-2 rounded-full transition-all duration-300",
                  i === step ? "w-8 bg-blue-500" : clsx("w-2", isDark ? "bg-white/15" : "bg-gray-300")
                )}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Beta Popup Modal */}
      <AnimatePresence>
        {showBetaPopup && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowBetaPopup(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={clsx(
                "relative z-10 w-full max-w-md p-8 rounded-3xl border shadow-2xl",
                isDark 
                  ? "bg-[#1e1e2e] border-white/10 text-white" 
                  : "bg-white border-gray-200 text-gray-900"
              )}
            >
              <button
                onClick={() => setShowBetaPopup(false)}
                className={clsx(
                  "absolute top-4 right-4 p-2 rounded-full transition-colors",
                  isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                )}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className={clsx(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-5",
                  isDark ? "bg-amber-500/10" : "bg-amber-50"
                )}>
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>

                <h3 className="text-xl font-black mb-2">
                  {language === 'fr' ? 'Moteur Explore — Version Bêta' : 'Explore Engine — Beta Version'}
                </h3>
                <p className={clsx("text-sm leading-relaxed mb-6", isDark ? "text-gray-400" : "text-gray-500")}>
                  {language === 'fr'
                    ? 'Le moteur de recherche Explore est encore en développement actif. Les résultats peuvent être incomplets ou imprécis. Vous pourrez changer de moteur à tout moment dans les paramètres.'
                    : 'The Explore search engine is still under active development. Results may be incomplete or inaccurate. You can change your engine at any time in settings.'}
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowBetaPopup(false)}
                    className={clsx(
                      "flex-1 py-3 rounded-xl font-semibold text-sm transition-all",
                      isDark ? "bg-white/10 hover:bg-white/15 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    )}
                  >
                    {language === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    onClick={confirmExploreEngine}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-blue-500/20"
                  >
                    {language === 'fr' ? 'Utiliser Explore' : 'Use Explore'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
