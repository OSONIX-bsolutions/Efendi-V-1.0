import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Language } from '../types';
import { t } from '../i18n/translations';
import {
  Moon,
  Sun,
  QrCode,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Globe,
  ChevronDown,
  Menu,
  X,
  Check,
  Clock,
} from 'lucide-react';

interface HeaderProps {
  onOpenQR: () => void;
  onOpenAdmin: () => void;
  onOpenMyOrders: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQR, onOpenAdmin, onOpenMyOrders }) => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    storeSettings,
    isAdminAuthenticated,
    myOrders,
    activeOrdersCount,
  } = useStore();

  const [hasAdminUrlParam, setHasAdminUrlParam] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const langDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isParam =
        window.location.search.toLowerCase().includes('admin') ||
        window.location.hash.toLowerCase().includes('admin') ||
        window.location.search.toLowerCase().includes('cms');
      setHasAdminUrlParam(isParam);
    }
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(e.target as Node)
      ) {
        setIsLangDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        // If clicking outside mobile menu, close it
        const target = e.target as HTMLElement;
        if (!target.closest('[data-mobile-burger="true"]')) {
          setIsMobileMenuOpen(false);
        }
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Multi-tap & long-press gesture detection on logo for secret admin access
  const tapCountRef = useRef(0);
  const lastTapTimeRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = () => {
    if (storeSettings.shortcutSettings?.enableTripleClick === false) return;
    const now = Date.now();
    if (now - lastTapTimeRef.current < 450) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapTimeRef.current = now;

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate?.([30, 50, 30]); } catch {}
      }
      onOpenAdmin();
    }
  };

  const handlePointerDown = () => {
    if (storeSettings.shortcutSettings?.enableLongPress === false) return;
    longPressTimerRef.current = setTimeout(() => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate?.(60); } catch {}
      }
      onOpenAdmin();
    }, 1800); // 1.8 second hold
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const showAdminButton = Boolean(
    storeSettings.cmsButtonVisible === true ||
    (storeSettings.cmsAccessMode === 'visible' && storeSettings.cmsButtonVisible !== false) ||
    isAdminAuthenticated ||
    hasAdminUrlParam
  );

  const allLanguages: { code: Language; label: string; name: string }[] = [
    { code: 'tj', label: 'TJ', name: 'Тоҷикӣ' },
    { code: 'ru', label: 'RU', name: 'Русский' },
    { code: 'en', label: 'EN', name: 'English' },
  ];

  const languages = allLanguages.filter(
    (l) => storeSettings.enabledLanguages?.[l.code] !== false
  );

  const currentLangObj =
    languages.find((l) => l.code === language) || languages[0] || allLanguages[0];

  return (
    <>
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-[41] md:hidden bg-neutral-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        />
      )}
      <header className={`sticky top-0 ${isMobileMenuOpen ? 'z-[45]' : 'z-30'} px-2.5 sm:px-4 pt-2 sm:pt-3 pointer-events-none transition-[z-index]`}>
      <div className="pointer-events-auto relative max-w-6xl mx-auto rounded-2xl sm:rounded-3xl bg-gradient-to-b from-white/75 via-white/60 to-white/45 dark:from-white/[0.12] dark:via-neutral-900/65 dark:to-neutral-950/75 backdrop-blur-2xl backdrop-saturate-180 border border-white/70 dark:border-white/15 shadow-[0_10px_36px_-10px_rgba(15,23,42,0.14),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:shadow-[0_14px_40px_-10px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-all">
        {/* Subtle liquid refraction specular edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/95 dark:via-white/35 to-transparent"
        />

        <div className="px-3.5 sm:px-5 min-h-[3.85rem] sm:min-h-[4.35rem] py-2 sm:py-2.5 flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand Zone */}
          <div
            onClick={handleLogoTap}
            onMouseDown={handlePointerDown}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchEnd={handlePointerUp}
            className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 cursor-pointer select-none"
            title="Efendi"
          >
            <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-white/50 dark:bg-white/[0.06] border border-white/70 dark:border-white/10 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transform transition-transform hover:scale-105 active:scale-95">
              <img
                src="/assets/aistudio/a_clean_png_style_logo_image_with_transparent_back_dd231807.png"
                alt={storeSettings.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">
                {storeSettings.name}
              </h1>
              <p className="text-xs text-neutral-600/90 dark:text-neutral-300/80 hidden sm:block truncate max-w-xs lg:max-w-sm">
                {storeSettings.tagline[language] || storeSettings.tagline.en}
              </p>
            </div>
          </div>

          {/* ============================================================== */}
          {/* DESKTOP CONTROLS ZONE (Hidden on mobile screens < md)           */}
          {/* ============================================================== */}
          <div className="hidden md:flex items-center gap-2">
            {/* My Orders Button */}
            <button
              onClick={onOpenMyOrders}
              className={`relative flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeOrdersCount > 0 ? 'px-3 py-2' : 'p-2.5'
              } text-xs font-bold rounded-xl transition-all backdrop-blur-md ${
                activeOrdersCount > 0
                  ? 'bg-amber-500/90 text-white border border-amber-300/60 shadow-[0_6px_20px_-4px_rgba(245,158,11,0.45),inset_0_1px_0_rgba(255,255,255,0.45)] hover:bg-amber-500'
                  : 'bg-white/55 dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-100 hover:bg-white/85 dark:hover:bg-white/[0.14] border border-white/70 dark:border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
              }`}
              title={t('myOrders', language)}
              aria-label={t('myOrders', language)}
            >
              <ShoppingBag className="w-4 h-4" />
              {activeOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[11px] font-extrabold tabular-nums leading-tight bg-white text-amber-600">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            {/* Minimal Language Dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 bg-white/55 dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-100 hover:bg-white/85 dark:hover:bg-white/[0.14] transition-all backdrop-blur-md border border-white/70 dark:border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                aria-expanded={isLangDropdownOpen}
                aria-label="Change language"
                title="Change language"
              >
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>{currentLangObj.label}</span>
                <ChevronDown className={`w-3 h-3 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-white/85 dark:bg-neutral-900/85 backdrop-blur-2xl backdrop-saturate-180 border border-white/75 dark:border-white/15 shadow-[0_18px_40px_-10px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_18px_44px_-10px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.14)] py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                  {languages.map((l) => {
                    const isActive = language === l.code;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLanguage(l.code);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 text-xs font-bold flex items-center justify-between transition-colors ${
                          isActive
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-extrabold'
                            : 'text-neutral-700 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-left text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase">
                            {l.label}
                          </span>
                          <span>{l.name}</span>
                        </div>
                        {isActive && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl whitespace-nowrap shrink-0 bg-white/55 dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 hover:bg-white/85 dark:hover:bg-white/[0.14] transition-all backdrop-blur-md border border-white/70 dark:border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-neutral-700" />
              )}
            </button>

            {/* Share QR Code Button */}
            <button
              onClick={onOpenQR}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap shrink-0 bg-amber-500/15 dark:bg-amber-400/15 text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 dark:hover:bg-amber-400/25 border border-amber-400/40 dark:border-amber-400/25 backdrop-blur-md transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
              title="Scan & Share Menu QR"
            >
              <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="inline font-bold">QR</span>
            </button>

            {/* Admin CMS Access: Conditionally shown */}
            {showAdminButton && (
              <button
                onClick={onOpenAdmin}
                className={`p-2.5 rounded-xl transition-all backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  isAdminAuthenticated
                    ? 'bg-amber-500/90 hover:bg-amber-500 text-white border border-amber-300/60 shadow-[0_6px_20px_-4px_rgba(245,158,11,0.45),inset_0_1px_0_rgba(255,255,255,0.45)]'
                    : 'bg-white/55 dark:bg-white/[0.08] text-neutral-700 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white/85 dark:hover:bg-white/[0.14] border border-white/70 dark:border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                }`}
                title={isAdminAuthenticated ? 'Admin CMS (Logged in)' : 'Owner CMS & Analytics'}
                aria-label="Admin CMS"
              >
                {isAdminAuthenticated ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span className="text-[11px] font-black tracking-wider uppercase inline">CMS</span>
                  </>
                ) : (
                  <Shield className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* ============================================================== */}
          {/* MOBILE VIEW (Screen < md): ONLY Logo and Burger Button         */}
          {/* ============================================================== */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Burger Button */}
            <button
              data-mobile-burger="true"
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className={`relative p-2.5 rounded-xl transition-all backdrop-blur-md ${
                isMobileMenuOpen
                  ? 'bg-amber-500/90 text-white border border-amber-300/60 shadow-[0_6px_20px_-4px_rgba(245,158,11,0.45),inset_0_1px_0_rgba(255,255,255,0.45)]'
                  : 'bg-white/55 dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-100 hover:bg-white/85 dark:hover:bg-white/[0.14] border border-white/70 dark:border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
              }`}
              aria-label="Open mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}

              {/* Notification Badge on Burger if active orders exist */}
              {!isMobileMenuOpen && activeOrdersCount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white dark:border-neutral-900 animate-ping" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-neutral-900" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MOBILE MENU DROPDOWN DRAWER (Appears on burger button click)    */}
        {/* ============================================================== */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t border-white/60 dark:border-white/10 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl rounded-b-2xl px-4 py-4 space-y-3.5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45)] animate-in slide-in-from-top-2 duration-200"
          >
          {/* Item 1: My Orders with live active badge */}
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenMyOrders();
            }}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
              activeOrdersCount > 0
                ? 'bg-amber-500/90 text-white border-amber-300/60 shadow-md shadow-amber-500/25'
                : 'bg-white/60 dark:bg-white/[0.06] border-white/65 dark:border-white/10 text-neutral-900 dark:text-white hover:bg-white/85 dark:hover:bg-white/[0.12]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  activeOrdersCount > 0 ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block font-bold text-sm leading-tight">
                  {t('myOrders', language)}
                </span>
                <span
                  className={`text-[11px] ${
                    activeOrdersCount > 0 ? 'text-white/80' : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {activeOrdersCount > 0
                    ? `${activeOrdersCount} ${language === 'tj' ? 'дар ҳоли иҷро' : language === 'ru' ? 'в процессе' : 'in progress'}`
                    : language === 'tj'
                    ? 'Таърихи фармоишҳо'
                    : language === 'ru'
                    ? 'История заказов'
                    : 'Order history'}
                </span>
              </div>
            </div>

            {activeOrdersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-amber-600 animate-pulse">
                {activeOrdersCount}
              </span>
            )}
          </button>

          {/* Item 2: Language Switch in Menu */}
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/[0.06] border border-white/65 dark:border-white/10 space-y-2">
            <span className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>Забон / Язык / Language</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              {languages.map((l) => {
                const isActive = language === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLanguage(l.code)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${
                      isActive
                        ? 'bg-amber-500/90 text-white border-amber-300/60 shadow-sm shadow-amber-500/25'
                        : 'bg-white/75 dark:bg-neutral-900/70 text-neutral-700 dark:text-neutral-300 border-white/70 dark:border-white/10 hover:border-amber-400'
                    }`}
                  >
                    <span className="text-[11px] font-mono uppercase">{l.label}</span>
                    <span className="text-[10px] opacity-80">{l.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Item 3 & 4: Theme Switch & QR Code in Mobile Menu */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Theme Switch */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-white/[0.06] border border-white/65 dark:border-white/10 text-left hover:bg-white/85 dark:hover:bg-white/[0.12] transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-white/80 dark:bg-white/10 flex items-center justify-center shrink-0">
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-neutral-600" />
                )}
              </div>
              <div className="truncate">
                <span className="block text-xs font-bold text-neutral-900 dark:text-white">
                  {t('themeTitle', language)}
                </span>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  {theme === 'dark' ? t('darkTheme', language) : t('lightTheme', language)}
                </span>
              </div>
            </button>

            {/* QR Code Button */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenQR();
              }}
              className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-500/15 dark:bg-amber-400/15 border border-amber-400/35 dark:border-amber-400/20 text-left hover:bg-amber-500/25 dark:hover:bg-amber-400/25 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="block text-xs font-bold text-neutral-900 dark:text-white">
                  QR Code
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                  {t('downloadQR', language)}
                </span>
              </div>
            </button>
          </div>

          {/* Working Hours Info in Mobile Menu Drawer */}
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/[0.06] border border-white/65 dark:border-white/10 space-y-1.5">
            <span className="block text-xs font-bold text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('workingHours', language)}</span>
            </span>
            <div className="space-y-1 text-xs">
              {(storeSettings.workingHoursRows && storeSettings.workingHoursRows.length > 0
                ? storeSettings.workingHoursRows
                : [
                    {
                      id: 'default',
                      days: storeSettings.workingHours.daysNote[language] || storeSettings.workingHours.daysNote.en,
                      open: storeSettings.workingHours.open,
                      close: storeSettings.workingHours.close,
                    },
                  ]
              ).map((row, idx) => (
                <div key={row.id || idx} className="flex items-center justify-between text-neutral-700 dark:text-neutral-300">
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {row.days || (storeSettings.workingHours.daysNote[language] || storeSettings.workingHours.daysNote.en)}
                  </span>
                  <span className="font-bold tabular-nums">
                    {row.open} — {row.close}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Admin CMS Button in mobile menu if active */}
          {showAdminButton && (
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/60 dark:bg-white/[0.08] text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:text-amber-600 border border-white/70 dark:border-white/15"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAdminAuthenticated ? 'Admin CMS (Logged in)' : 'Owner CMS'}</span>
            </button>
          )}
        </div>
        )}
      </div>
      </header>
    </>
  );
};
