import React, { useState } from 'react';
import { X, Mail, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

import { getAccentColorClass } from '../lib/theme';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  onLogout?: () => void;
  user?: User | null;
  language: 'fr' | 'en';
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  initialMode?: 'login' | 'signup' | 'forgot-password' | 'reset-password';
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  onLogin, 
  onLogout, 
  user, 
  language, 
  theme, 
  accentColor,
  initialMode = 'login'
}: AuthModalProps) {
  type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password';

  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);

  React.useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, initialMode]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [useMagicLink, setUseMagicLink] = useState(false);

  const colors = getAccentColorClass(accentColor, theme === 'dark');
  const redColors = getAccentColorClass('red', theme === 'dark');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (authMode === 'login') {
        if (useMagicLink) {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: await window.electron.prepareOAuthRedirect(),
            }
          });
          if (error) throw error;
          setSuccess(language === 'fr' ? 'Lien magique envoyé ! Vérifiez votre boîte de réception.' : 'Magic link sent! Check your inbox.');
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          if (data.user) {
            onLogin({
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.full_name || data.user.email!.split('@')[0],
              avatar: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`
            });
            onClose();
          }
        }
      } else if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: await window.electron.prepareOAuthRedirect(),
          }
        });
        if (error) throw error;
        if (data.user) {
          setSuccess(language === 'fr' ? 'Vérifiez votre email pour le lien de confirmation !' : 'Check your email for confirmation link!');
        }
      } else if (authMode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: await window.electron.prepareOAuthRedirect(),
        });
        if (error) throw error;
        setSuccess(language === 'fr' ? 'Email de réinitialisation envoyé !' : 'Reset email sent!');
      } else if (authMode === 'reset-password') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setSuccess(language === 'fr' ? 'Mot de passe mis à jour !' : 'Password updated!');
        setTimeout(() => setAuthMode('login'), 2000);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(language === 'fr' ? 'Une erreur inconnue est survenue' : 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    setIsLoading(true);
    try {
      const redirectTo = await window.electron.prepareOAuthRedirect();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          skipBrowserRedirect: true,
          redirectTo
        }
      });
      if (error) throw error;
      if (data?.url) {
        await window.electron.openExternal(data.url);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const redirectTo = await window.electron.prepareOAuthRedirect();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo,
          skipBrowserRedirect: true
        },
      });
      if (error) throw error;
      if (data?.url) {
        await window.electron.openExternal(data.url);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
      setIsLoading(false);
    }
  };

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
                "w-full max-w-md p-6 rounded-2xl shadow-2xl border relative",
                theme === 'dark' ? "bg-[#1e1e2e] border-white/10 text-white" : "bg-white border-gray-200 text-gray-900"
              )}
            >
              <button
                onClick={onClose}
                className={clsx(
                  "absolute top-4 right-4 p-1 rounded-full transition-colors",
                  theme === 'dark' ? "hover:bg-white/10" : "hover:bg-gray-100"
                )}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              {user ? (
                // Logged In State (Profile)
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold mb-6 text-center">{language === 'fr' ? 'Mon Profil' : 'My Profile'}</h2>
                  <div className="relative mb-4">
                    <img src={user.avatar} className={clsx("w-24 h-24 rounded-full border-4", colors.borderSubtle)} alt={user.name} />
                    <div className={clsx("absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4", theme === 'dark' ? "border-[#1e1e2e]" : "border-white")}></div>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{user.name}</h3>
                  <p className="text-gray-400 mb-8">{user.email}</p>

                  <button
                    onClick={() => {
                      if (onLogout) onLogout();
                      onClose();
                    }}
                    className={clsx(
                      "w-full py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 border",
                      redColors.bg,
                      redColors.bgHover,
                      redColors.text,
                      redColors.borderSubtle
                    )}
                  >
                    <LogOut className="w-4 h-4" />
                    {language === 'fr' ? 'Se déconnecter' : 'Sign Out'}
                  </button>
                </div>
              ) : (
                // Login/Signup/Forgot Password State
                <>
                  <h2 className="text-2xl font-bold mb-2 text-center">
                    {authMode === 'login'
                      ? (language === 'fr' ? 'Bon retour' : 'Welcome Back')
                      : authMode === 'signup'
                        ? (language === 'fr' ? 'Créer un compte' : 'Create Account')
                        : authMode === 'forgot-password'
                          ? (language === 'fr' ? 'Mot de passe oublié' : 'Forgot Password')
                          : (language === 'fr' ? 'Nouveau mot de passe' : 'New Password')
                    }
                  </h2>
                  <p className="text-gray-400 text-center mb-6 text-sm">
                    {authMode === 'login'
                      ? (language === 'fr' ? 'Connectez-vous pour synchroniser votre historique et vos favoris' : 'Sign in to sync your history and bookmarks')
                      : authMode === 'signup'
                        ? (language === 'fr' ? 'Rejoignez Explore pour synchroniser sur tous vos appareils' : 'Join Explore to sync across devices')
                        : authMode === 'forgot-password'
                          ? (language === 'fr' ? 'Entrez votre email pour recevoir un lien de réinitialisation' : 'Enter your email to receive a reset link')
                          : (language === 'fr' ? 'Définissez votre nouveau mot de passe ci-dessous' : 'Set your new password below')
                    }
                  </p>

                  <div className="space-y-4">
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-4">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl text-sm mb-4">
                        {success}
                      </div>
                    )}

                    { (authMode !== 'forgot-password' && authMode !== 'reset-password') && (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleDiscordLogin}
                          disabled={isLoading}
                          className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.118.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.176 2.419 0 1.334-.956 2.42-2.176 2.42zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.176 2.419 0 1.334-.966 2.42-2.176 2.42z" />
                          </svg>
                          Discord
                        </button>

                        <button
                          onClick={handleGoogleLogin}
                          disabled={isLoading}
                          className="w-full bg-white hover:bg-gray-100 text-gray-900 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 border"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                          Google
                        </button>
                      </div>
                    )}

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className={clsx("w-full border-t", theme === 'dark' ? "border-white/10" : "border-gray-200")}></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className={clsx("px-2 text-gray-500", theme === 'dark' ? "bg-[#1e1e2e]" : "bg-white")}>
                          {authMode === 'forgot-password' 
                            ? (language === 'fr' ? 'Réinitialisation' : 'Reset') 
                            : authMode === 'reset-password'
                              ? (language === 'fr' ? 'Mise à jour' : 'Update')
                              : (language === 'fr' ? 'Ou email' : 'Or email')
                          }
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                      {authMode !== 'reset-password' && (
                        <div>
                          <input
                            type="email"
                            placeholder={language === 'fr' ? 'Adresse email' : 'Email address'}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={clsx(
                              "w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none transition-colors",
                              theme === 'dark' ? "bg-[#181825] border-white/10" : "bg-gray-50 border-gray-200",
                              colors.focusBorder
                            )}
                            required
                          />
                        </div>
                      )}
                      
                      {(authMode !== 'forgot-password' && !useMagicLink) && (
                        <div>
                          <input
                            type="password"
                            placeholder={authMode === 'reset-password' 
                              ? (language === 'fr' ? 'Nouveau mot de passe' : 'New password')
                              : (language === 'fr' ? 'Mot de passe' : 'Password')
                            }
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={clsx(
                              "w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none transition-colors",
                              theme === 'dark' ? "bg-[#181825] border-white/10" : "bg-gray-50 border-gray-200",
                              colors.focusBorder
                            )}
                            required={!useMagicLink}
                          />
                        </div>
                      )}

                      {authMode === 'login' && (
                        <div className="flex items-center justify-between px-1">
                          <button
                            type="button"
                            onClick={() => setUseMagicLink(!useMagicLink)}
                            className={clsx("text-xs font-medium hover:underline", colors.text)}
                          >
                            {useMagicLink 
                              ? (language === 'fr' ? 'Utiliser un mot de passe' : 'Use password')
                              : (language === 'fr' ? 'Lien magique (sans mot de passe)' : 'Magic link (no password)')
                            }
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setAuthMode('forgot-password')}
                            className="text-xs text-gray-500 hover:underline"
                          >
                            {language === 'fr' ? 'Oublié ?' : 'Forgot?'}
                          </button>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className={clsx(
                          "w-full py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-white shadow-lg",
                          colors.bgSolid,
                          colors.bgHover,
                          colors.shadow
                        )}
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            {authMode === 'login'
                              ? (useMagicLink 
                                  ? (language === 'fr' ? 'Envoyer le lien' : 'Send Link') 
                                  : (language === 'fr' ? 'Se connecter' : 'Sign In'))
                              : authMode === 'signup'
                                ? (language === 'fr' ? "S'inscrire" : 'Sign Up')
                                : authMode === 'forgot-password'
                                  ? (language === 'fr' ? 'Envoyer le mail' : 'Send Email')
                                  : (language === 'fr' ? 'Mettre à jour' : 'Update Password')
                            }
                          </>
                        )}
                      </button>
                    </form>

                    <div className="text-center text-xs text-gray-500 mt-4">
                      {authMode === 'login' && (
                        <>
                          {language === 'fr' ? "Vous n'avez pas de compte ? " : "Don't have an account? "}
                          <button
                            onClick={() => setAuthMode('signup')}
                            className={clsx("font-semibold hover:underline px-1", colors.text)}
                          >
                            {language === 'fr' ? "S'inscrire" : 'Sign up'}
                          </button>
                        </>
                      )}
                      
                      {authMode === 'signup' && (
                        <>
                          {language === 'fr' ? "Vous avez déjà un compte ? " : "Already have an account? "}
                          <button
                            onClick={() => setAuthMode('login')}
                            className={clsx("font-semibold hover:underline px-1", colors.text)}
                          >
                            {language === 'fr' ? 'Se connecter' : 'Log in'}
                          </button>
                        </>
                      )}

                      {(authMode === 'forgot-password' || authMode === 'reset-password') && (
                        <button
                          onClick={() => setAuthMode('login')}
                          className={clsx("font-semibold hover:underline", colors.text)}
                        >
                          {language === 'fr' ? 'Retour à la connexion' : 'Back to login'}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
