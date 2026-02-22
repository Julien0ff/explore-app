import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Moon, Sun, Monitor, Search, Globe, Layout } from 'lucide-react';
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

  const nextStep = () => setStep(s => s + 1);

  const steps = [
    {
      id: 'welcome',
      title: language === 'fr' ? 'Bienvenue sur Explore' : 'Welcome to Explore',
      description: language === 'fr' ? 'Découvrez le web d\'une nouvelle manière moderne.' : 'Experience the web in a new, modern way.',
      icon: <Logo className="w-24 h-24 mb-8" />
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-[#1e1e2e] text-gray-900 dark:text-white overflow-hidden">
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
            
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
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

              {step === 2 && (
                <div className="flex flex-col gap-3 w-full">
                  {[
                    { id: 'google', name: 'Google', icon: 'https://www.google.com/favicon.ico' },
                    { id: 'bing', name: 'Bing', icon: 'https://www.bing.com/favicon.ico' },
                    { id: 'duckduckgo', name: 'DuckDuckGo', icon: 'https://duckduckgo.com/favicon.ico' },
                    { id: 'ecosia', name: 'Ecosia', icon: 'https://ecosia.org/favicon.ico' }
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

              {step === 3 && (
                <button
                  onClick={onComplete}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-500/30 flex items-center gap-2"
                >
                  {language === 'fr' ? 'Commencer la navigation' : 'Start Browsing'}
                  <Globe className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Navigation (for Step 1) */}
            {step === 1 && (
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
