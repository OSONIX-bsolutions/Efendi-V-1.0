import React from 'react';
import { useStore } from '../context/StoreContext';
import { t } from '../i18n/translations';
import {
  MapPin,
  Clock,
  Phone,
  Instagram,
  Facebook,
  Send,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  const { storeSettings, isStoreOpen, language, isAdminAuthenticated } = useStore();

  const [hasAdminUrlParam, setHasAdminUrlParam] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isParam =
        window.location.search.toLowerCase().includes('admin') ||
        window.location.hash.toLowerCase().includes('admin') ||
        window.location.search.toLowerCase().includes('cms');
      setHasAdminUrlParam(isParam);
    }
  }, []);

  const showAdminButton = Boolean(
    storeSettings.cmsButtonVisible === true ||
    (storeSettings.cmsAccessMode === 'visible' && storeSettings.cmsButtonVisible !== false) ||
    isAdminAuthenticated ||
    hasAdminUrlParam
  );

  const currentAddress =
    storeSettings.address[language] || storeSettings.address.en || storeSettings.address.ru;
  const daysNote =
    storeSettings.workingHours.daysNote[language] ||
    storeSettings.workingHours.daysNote.en ||
    storeSettings.workingHours.daysNote.ru;

  return (
    <footer className="mt-16 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 pt-12 pb-24 text-neutral-600 dark:text-neutral-400">
      <div className="max-w-6xl mx-auto px-4">
        {/* Top Grid: Restaurant Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-neutral-200/80 dark:border-neutral-800">
          {/* Col 1: Brand & Status Light */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 transform transition-transform hover:scale-105">
                <img
                  src="/assets/aistudio/a_clean_png_style_logo_image_with_transparent_back_dd231807.png"
                  alt={storeSettings.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-extrabold text-xl text-neutral-900 dark:text-white tracking-tight">
                {storeSettings.name}
              </span>
            </div>

            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {storeSettings.tagline[language] || storeSettings.tagline.en}
            </p>

            {/* LIVE STATUS LIGHT INDICATOR */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/80">
              <span
                className={`w-3 h-3 rounded-full ${
                  isStoreOpen
                    ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50 animate-pulse'
                    : 'bg-rose-500 shadow-xs shadow-rose-500/50'
                }`}
              />
              <span
                className={`text-xs font-bold ${
                  isStoreOpen
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isStoreOpen ? t('openNow', language) : t('closedNow', language)}
              </span>
            </div>
          </div>

          {/* Col 2: Working Hours & Address */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-sm mb-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{t('workingHours', language)}</span>
              </div>
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                {storeSettings.workingHours.open} — {storeSettings.workingHours.close}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {daysNote}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-sm mb-1.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>{t('address', language)}</span>
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {currentAddress}
              </p>
            </div>
          </div>

          {/* Col 3: Contacts & Social Accounts */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-sm mb-2">
                <Phone className="w-4 h-4 text-amber-500" />
                <span>{t('contacts', language)}</span>
              </div>
              <div className="space-y-1">
                {storeSettings.phones.map((phone, idx) => (
                  <a
                    key={idx}
                    href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    {phone}
                  </a>
                ))}
              </div>
            </div>

            {/* Social Accounts */}
            <div>
              <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                {t('socialMedia', language)}
              </span>
              <div className="flex items-center gap-2">
                {/* WhatsApp */}
                {storeSettings.whatsappEnabled !== false && storeSettings.whatsappNumber?.trim() && (
                  <a
                    href={`https://wa.me/${storeSettings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-[#25D366] hover:text-white dark:hover:bg-[#25D366] dark:hover:text-white flex items-center justify-center transition-colors"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}

                {/* Telegram */}
                {storeSettings.telegramEnabled !== false && storeSettings.telegramUsername?.trim() && (
                  <a
                    href={`https://t.me/${storeSettings.telegramUsername.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-[#0088cc] hover:text-white dark:hover:bg-[#0088cc] dark:hover:text-white flex items-center justify-center transition-colors"
                    title="Telegram"
                  >
                    <Send className="w-4 h-4" />
                  </a>
                )}

                {/* Instagram */}
                {storeSettings.instagram && (
                  <a
                    href={storeSettings.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-gradient-to-tr hover:from-amber-500 hover:to-rose-500 hover:text-white flex items-center justify-center transition-colors"
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}

                {/* Facebook */}
                {storeSettings.facebook && (
                  <a
                    href={storeSettings.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-[#1877F2] hover:text-white flex items-center justify-center transition-colors"
                    title="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright & Admin entry */}
        <div className={`pt-6 flex flex-col sm:flex-row items-center ${showAdminButton ? 'justify-between' : 'justify-center sm:justify-start'} gap-4 text-xs text-neutral-500`}>
          <p>© {new Date().getFullYear()} {storeSettings.name}. All rights reserved.</p>
          {showAdminButton && (
            <button
              onClick={onOpenAdmin}
              className={`flex items-center gap-1.5 transition-colors font-medium px-2.5 py-1 rounded-lg ${
                isAdminAuthenticated
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 font-bold'
                  : 'text-neutral-500 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('adminTitle', language)}</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
