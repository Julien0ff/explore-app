import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Moon, Sun, Monitor, Search, Globe, Layout, Shield } from 'lucide-react';
import { Logo } from './Logo';
import { clsx } from 'clsx';

interface OnboardingProps {
  onComplete: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSearchEngine: (engine: string) => void;
  currentTheme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en';
}

export function Onboarding({ onComplete, setTheme, setSearchEngine, currentTheme, language }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);

  const nextStep = () => setStep(s => s + 1);

  const steps = [
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
      icon: <Check className="w-16 h-16 text-green-500 mb-6" />
    }
  ];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-white dark:bg-[#1e1e2e] text-gray-900 dark:text-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-2xl px-8 relative z-10">
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
            
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-blue-500 to-purple-600">
              {steps[step].title}
            </h1>
            
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-12 max-w-md">
              {steps[step].description}
            </p>

            {/* Step Content */}
            <div className="w-full max-w-md mb-12 min-h-[200px] flex flex-col items-center justify-center">
              {step === 0 && (
                <button
                  onClick={nextStep}
                  className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
                >
                  {language === 'fr' ? 'Commencer' : 'Get Started'}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {step === 1 && (
                <div className="w-full flex flex-col gap-4 text-left">
                  <div className={clsx(
                    "p-4 rounded-2xl border text-sm space-y-3 max-h-60 overflow-y-auto custom-scrollbar w-full",
                    currentTheme === 'dark' ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                  )}>
                    <div className="flex gap-3">
                      <span className="text-lg">🔒</span>
                      <div>
                        <strong className={currentTheme === 'dark' ? "text-white" : "text-gray-900"}>
                          {language === 'fr' ? 'Confidentialité absolue' : 'Absolute Privacy'}
                        </strong>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {language === 'fr' 
                            ? 'Zéro traçage, zéro télémétrie. Votre navigation reste totalement privée.' 
                            : 'Zero tracking, zero telemetry. Your browsing remains completely private.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-lg">📁</span>
                      <div>
                        <strong className={currentTheme === 'dark' ? "text-white" : "text-gray-900"}>
                          {language === 'fr' ? 'Données 100% Locales' : '100% Local Data'}
                        </strong>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {language === 'fr' 
                            ? 'Vos mots de passe (cryptés), favoris et historiques sont stockés uniquement sur votre machine.' 
                            : 'Your passwords (encrypted), bookmarks, and history are stored only on your machine.'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-lg">☁️</span>
                      <div>
                        <strong className={currentTheme === 'dark' ? "text-white" : "text-gray-900"}>
                          {language === 'fr' ? 'Données Essentielles Seules' : 'Essential Sync Only'}
                        </strong>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {language === 'fr' 
                            ? 'Si vous activez la synchronisation de compte, seules les données strictement nécessaires et chiffrées sont transmises à nos serveurs.' 
                            : 'If you enable account sync, only strictly necessary and encrypted data is transmitted to our servers.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer select-none py-1 group mt-2">
                    <input 
                      type="checkbox" 
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
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
                        : "bg-gray-200 dark:bg-white/5 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {language === 'fr' ? 'Accepter et Continuer' : 'Accept and Continue'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {step === 2 && (
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
                        "p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all",
                        currentTheme === t.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "border-transparent bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10"
                      )}
                    >
                      <t.icon className="w-8 h-8" />
                      <span className="font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-3 w-full">
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
                      className="p-4 rounded-xl flex items-center gap-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors group text-left"
                    >
                      <img src={engine.icon} alt={engine.name} className="w-8 h-8 rounded-full bg-white p-1" />
                      <span className="flex-1 font-medium text-lg">{engine.name}</span>
                      <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                    </button>
                  ))}
                </div>
              )}

              {step === 4 && (
                <button
                  onClick={onComplete}
                  className="px-8 py-4 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-500/30 flex items-center gap-2"
                >
                  {language === 'fr' ? 'Commencer la navigation' : 'Start Browsing'}
                  <Globe className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Navigation (for Step 2) */}
            {step === 2 && (
              <button
                onClick={nextStep}
                className="mt-4 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                {language === 'fr' ? 'Suivant' : 'Next'}
              </button>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="absolute bottom-[-60px] left-0 w-full flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={clsx(
                "w-2 h-2 rounded-full transition-all duration-300",
                i === step ? "w-8 bg-blue-500" : "bg-gray-300 dark:bg-gray-700"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
