import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { LogIn, ShieldCheck, User, LogOut, Bell, Code } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { UserProfile } from '../types';
import { signOut } from 'firebase/auth';
import { useLanguage } from '../lib/LanguageContext';
import { doc, setDoc } from 'firebase/firestore';

interface LoginProps {
  isAdmin?: boolean;
  isWaiter?: boolean;
  user?: any;
  profile?: UserProfile | null;
}

export default function Login({ isAdmin = false, isWaiter = false, user, profile }: LoginProps) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { t } = useLanguage();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user && profile) {
      if (isAdmin) {
        if (profile.role === 'admin') {
          navigate('/admin');
        }
      } else if (isWaiter) {
        if (profile.role === 'waiter') {
          navigate('/waiter');
        }
      } else if (profile.role === 'waiter') {
        navigate('/waiter');
      } else if (profile.role === 'staff') {
        navigate('/staff');
      } else {
        navigate('/');
      }
    }
  }, [user, profile, isAdmin, isWaiter, navigate]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      console.log('Starting Google login...');
      const result = await signInWithPopup(auth, provider);
      console.log('Login successful:', result.user.email);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError(t('popupBlocked'));
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError(t('popupCancelled'));
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Este domínio não está autorizado no Firebase. Por favor, adicione ' + window.location.hostname + ' aos domínios autorizados no Console do Firebase.');
      } else {
        setError(t('loginError') + ': ' + err.message);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('mock_user');
    localStorage.removeItem('mock_profile');
    await signOut(auth);
    navigate('/');
  };

  const handleDevLogin = async (role: 'admin' | 'waiter' | 'staff' | 'client') => {
    setIsLoggingIn(true);
    setError('');
    try {
      // Create a mock user object
      const mockUid = `dev_${role}_${Math.random().toString(36).substr(2, 9)}`;
      const devProfile: UserProfile = {
        uid: mockUid,
        email: `${role}_dev@restaurante.com`,
        role: role,
        displayName: `Dev ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        createdAt: new Date().toISOString()
      };
      
      // Save to localStorage to bypass Firebase Auth restrictions in dev
      localStorage.setItem('mock_user', JSON.stringify({
        uid: mockUid,
        email: devProfile.email,
        isAnonymous: true,
        displayName: devProfile.displayName
      }));
      localStorage.setItem('mock_profile', JSON.stringify(devProfile));
      
      console.log(`Mock Dev Login as ${role} successful`);
      
      // Reload to apply mock auth state
      window.location.reload();
      
    } catch (err: any) {
      console.error('Dev Login error:', err);
      setError('Erro no login de desenvolvimento: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const isAccessDenied = (isAdmin && user && profile?.role !== 'admin') || (isWaiter && user && profile?.role !== 'waiter');

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-xl p-8 text-center space-y-8 border border-transparent dark:border-slate-700">
        <div className="space-y-2">
          <div className="bg-sky-100 dark:bg-sky-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-sky-600 dark:text-sky-400">
            {isAdmin ? <ShieldCheck size={32} /> : isWaiter ? <Bell size={32} /> : <User size={32} />}
          </div>
          <h1 className="text-4xl font-black text-sky-600 dark:text-sky-400 tracking-tight">{t('appName')}</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium">
            {isAdmin ? t('adminPanel') : isWaiter ? 'Painel do Atendente' : t('welcome')}
          </p>
        </div>
        
        <div className="bg-sky-50 dark:bg-slate-700/50 p-6 rounded-2xl border border-sky-100 dark:border-slate-600">
          <p className="text-sm text-sky-800 dark:text-sky-200 leading-relaxed">
            {isAccessDenied 
              ? (isWaiter ? 'Ops! Você está logado, mas não tem permissão de atendente.' : t('accessDenied'))
              : isAdmin 
                ? t('adminDescription') 
                : isWaiter
                  ? 'Acesse para gerenciar pedidos e atender mesas em tempo real.'
                  : t('loginDescription')}
          </p>
        </div>

        {isAccessDenied && (
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-4 rounded-xl text-sm font-medium border border-amber-100 dark:border-amber-900/30">
            {t('loggedInAs')} <span className="font-bold">{user.email}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {isAccessDenied ? (
          <button 
            onClick={handleSignOut}
            disabled={isLoggingIn}
            className="w-full bg-amber-600 dark:bg-amber-500 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-amber-700 dark:hover:bg-amber-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <LogOut size={24} /> {t('tryAnotherAccount')}
          </button>
        ) : (
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-sky-600 dark:bg-sky-500 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-sky-700 dark:hover:bg-sky-600 transition-all shadow-lg shadow-sky-200 dark:shadow-none active:scale-95 disabled:opacity-50"
          >
            {isLoggingIn ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <LogIn size={24} />
            )}
            {isLoggingIn ? t('loading') : t('loginButton')}
          </button>
        )}

        <p className="text-xs text-gray-400 dark:text-slate-500">
          {isAdmin 
            ? t('restrictedAccess') 
            : t('termsAgreement')}
        </p>

        {/* Development Access Section */}
        <div className="pt-8 border-t border-gray-100 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-slate-500">
            <Code size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">Acesso de Desenvolvimento</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleDevLogin('admin')}
              className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all border border-purple-100 dark:border-purple-900/30"
            >
              Admin Dev
            </button>
            <button 
              onClick={() => handleDevLogin('waiter')}
              className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all border border-amber-100 dark:border-amber-900/30"
            >
              Atendente Dev
            </button>
            <button 
              onClick={() => handleDevLogin('staff')}
              className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all border border-blue-100 dark:border-blue-900/30"
            >
              Staff Dev
            </button>
            <button 
              onClick={() => handleDevLogin('client')}
              className="px-4 py-2 bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-400 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-slate-600 transition-all border border-gray-100 dark:border-slate-600"
            >
              Cliente Dev
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
