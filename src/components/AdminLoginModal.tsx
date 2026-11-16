import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Lock, ShieldAlert, Mail, Shield, Loader2 } from 'lucide-react';
import { AdminRole } from '../types';
import { supabaseService } from '../supabase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: AdminRole) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { language, setIsAdminAuthenticated } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMessage(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage(
        language === 'tj'
          ? 'Лутфан почта ва паролро пур кунед'
          : language === 'ru'
          ? 'Пожалуйста, введите email и пароль'
          : 'Please enter both email and password'
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { role } = await supabaseService.signIn(email, password);
      setIsAdminAuthenticated(true, role);
      onSuccess(role);
    } catch (err: any) {
      console.warn('Supabase Auth error:', err);
      const msg = err?.message || 'Authentication error';
      setErrorMessage(
        msg.includes('Invalid login credentials')
          ? language === 'tj'
            ? 'Почта ё парол нодуруст аст!'
            : language === 'ru'
            ? 'Неверный email или пароль!'
            : 'Invalid email or password!'
          : msg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/75 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-7 z-10 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-lg sm:text-xl text-neutral-900 dark:text-white">
            {language === 'tj'
              ? 'Дастрасӣ ба Портали CMS'
              : language === 'ru'
              ? 'Вход в Панель Управления'
              : 'CMS Portal Access'}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {language === 'tj'
              ? 'Барои идоракунии мағоза ва фармоишҳо бо ҳисоби Supabase ворид шавед'
              : language === 'ru'
              ? 'Войдите через учётную запись Supabase для управления заказами и меню'
              : 'Sign in with your assigned Supabase team account to manage orders and menu'}
          </p>
        </div>

        {/* Auth Indicator Badge */}
        <div className="mb-4 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Supabase Auth (Role-Verified JWT)</span>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 border border-rose-500/30">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSupabaseSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="staff@efendi.tj"
                className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              {language === 'tj' ? 'Парол' : language === 'ru' ? 'Пароль' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="••••••••"
                className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {language === 'tj' ? 'Санҷиш...' : language === 'ru' ? 'Вход...' : 'Signing in...'}
                </span>
              </>
            ) : (
              <span>
                {language === 'tj'
                  ? 'Воридшавӣ ба CMS'
                  : language === 'ru'
                  ? 'Войти в CMS'
                  : 'Sign In with Supabase'}
              </span>
            )}
          </button>

          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center pt-2">
            {language === 'tj'
              ? 'Ҳисобҳои даста танҳо аз ҷониби Барномасоз дар панели Developer эҷод карда мешаванд.'
              : language === 'ru'
              ? 'Учётные записи команды создаются разработчиком в панели управления.'
              : 'Team accounts are provisioned exclusively by a Developer.'}
          </p>
        </form>
      </div>
    </div>
  );
};
