import React, { useMemo, useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { MenuHero } from './components/MenuHero';
import { FoodCard } from './components/FoodCard';
import { BottomCartBar } from './components/BottomCartBar';
import { CartDrawer } from './components/CartDrawer';
import { QRCodeModal } from './components/QRCodeModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { FoodDetailModal } from './components/FoodDetailModal';
import { MyOrdersModal } from './components/MyOrdersModal';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { t } from './i18n/translations';
import { MenuItem } from './types';
import { Utensils, Heart, Sparkles, LayoutGrid, List, PlusCircle } from 'lucide-react';

const MainMenuApp: React.FC = () => {
  const {
    menuItems,
    categories,
    favorites,
    language,
    viewMode,
    setViewMode,
    isAdminAuthenticated,
    currentAdminRole,
    setIsAdminAuthenticated,
    storeSettings,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Modals
  const [isQROpen, setIsQROpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [selectedFoodDetail, setSelectedFoodDetail] = useState<MenuItem | null>(null);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // 0. Hide check: completely excluded from customer menu
      if (item.isHidden) {
        return false;
      }

      // 1. Favorites filter
      if (showOnlyFavorites && !favorites.includes(item.id)) {
        return false;
      }

      // 2. Category filter
      if (!showOnlyFavorites && selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameTJ = (item.name.tj || '').toLowerCase();
        const nameRU = (item.name.ru || '').toLowerCase();
        const nameEN = (item.name.en || '').toLowerCase();
        const descTJ = (item.description.tj || '').toLowerCase();
        const descRU = (item.description.ru || '').toLowerCase();
        const descEN = (item.description.en || '').toLowerCase();

        return (
          nameTJ.includes(q) ||
          nameRU.includes(q) ||
          nameEN.includes(q) ||
          descTJ.includes(q) ||
          descRU.includes(q) ||
          descEN.includes(q)
        );
      }

      return true;
    });
  }, [menuItems, searchQuery, selectedCategory, showOnlyFavorites, favorites]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories]
  );

  // Segregated menu sections by category when "All" is selected
  const groupedCategorySections = useMemo(() => {
    if (showOnlyFavorites || selectedCategory !== 'all') {
      return [];
    }

    const sections: { id: string; title: string; icon: string; items: MenuItem[]; isFallback?: boolean }[] = [];
    const matchedIds = new Set<string>();

    sortedCategories.forEach((cat) => {
      const catItems = filteredItems.filter((item) => item.categoryId === cat.id);
      if (catItems.length > 0) {
        catItems.forEach((item) => matchedIds.add(item.id));
        sections.push({
          id: cat.id,
          title: cat.name[language] || cat.name.en || cat.name.ru || cat.name.tj,
          icon: cat.icon,
          items: catItems,
        });
      }
    });

    const uncategorized = filteredItems.filter((item) => !matchedIds.has(item.id));
    if (uncategorized.length > 0) {
      sections.push({
        id: 'other',
        title: language === 'tj' ? 'Дигар таомҳо' : language === 'ru' ? 'Другое' : 'Other Dishes',
        icon: '🍽️',
        items: uncategorized,
        isFallback: true,
      });
    }

    return sections;
  }, [filteredItems, sortedCategories, showOnlyFavorites, selectedCategory, language]);

  const handleAdminTrigger = () => {
    if (isAdminAuthenticated) {
      setIsAdminDashboardOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  // URL Parameter Detection (?admin or #admin)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlHasAdmin =
        window.location.search.toLowerCase().includes('admin') ||
        window.location.hash.toLowerCase().includes('admin') ||
        window.location.search.toLowerCase().includes('cms');

      if (urlHasAdmin) {
        if (isAdminAuthenticated) {
          setIsAdminDashboardOpen(true);
        } else {
          setIsAdminLoginOpen(true);
        }
      }
    }
  }, [isAdminAuthenticated]);

  // Global Keyboard Shortcut: developer-configured shortcut (defaults to Ctrl + Shift + A)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (storeSettings.shortcutSettings?.enableKeyboardShortcut === false) return;
      const shortcut = storeSettings.shortcutSettings?.keyboardShortcut || 'ctrl+shift+a';

      let matched = false;
      if (shortcut === 'ctrl+shift+a') {
        matched = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A');
      } else if (shortcut === 'alt+shift+c') {
        matched = e.altKey && e.shiftKey && (e.key === 'c' || e.key === 'C');
      } else if (shortcut === 'ctrl+alt+m') {
        matched = (e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'm' || e.key === 'M');
      } else if (shortcut === 'shift+esc') {
        matched = e.shiftKey && (e.key === 'Escape' || e.key === 'Esc');
      }

      if (matched) {
        e.preventDefault();
        handleAdminTrigger();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminAuthenticated, storeSettings.shortcutSettings]);

  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);
  const currentCategoryTitle = showOnlyFavorites
    ? t('favorites', language)
    : selectedCategory === 'all'
    ? t('allCategories', language)
    : currentCategoryObj?.name[language] || currentCategoryObj?.name.en || '';

  if (isAdminDashboardOpen) {
    return (
      <ErrorBoundary fallbackTitle="CMS Error">
        <AdminDashboard
          isOpen={true}
          onClose={() => setIsAdminDashboardOpen(false)}
        />
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Header Bar */}
      <Header
        onOpenQR={() => setIsQROpen(true)}
        onOpenAdmin={handleAdminTrigger}
        onOpenMyOrders={() => setIsMyOrdersOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4">
        {/* Category Filter Controls */}
        <MenuHero
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          showOnlyFavorites={showOnlyFavorites}
          setShowOnlyFavorites={setShowOnlyFavorites}
        />

        {/* Section Title & Count & Layout View Switcher */}
        <div className="flex items-center justify-between pb-3 pt-1">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-white tracking-tight">
              {currentCategoryTitle}
            </h2>
            <span className="text-xs text-neutral-400 font-semibold">
              ({filteredItems.length})
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {showOnlyFavorites && (
              <button
                onClick={() => setShowOnlyFavorites(false)}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                ← {t('allCategories', language)}
              </button>
            )}

            {/* Menu Layout Switcher Button (Grid vs List) */}
            <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all select-none ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                title={language === 'tj' ? 'Шабака (2 сутун)' : language === 'ru' ? 'Сетка (2 колонки)' : 'Grid (2 columns)'}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {language === 'tj' ? 'Шабака' : language === 'ru' ? 'Сетка' : 'Grid'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all select-none ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                title={language === 'tj' ? 'Рӯйхат (1 сутун)' : language === 'ru' ? 'Список (1 колонка)' : 'List (1 column)'}
                aria-label="List view"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {language === 'tj' ? 'Рӯйхат' : language === 'ru' ? 'Список' : 'List'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Food Items Layout: 2 Columns Grid or 1 Column List */}
        {menuItems.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 my-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
              {language === 'tj'
                ? 'Хуш омадед ба EFENDI!'
                : language === 'ru'
                ? 'Добро пожаловать в EFENDI!'
                : 'Welcome to EFENDI!'}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mt-2 leading-relaxed">
              {language === 'tj'
                ? 'Менюи таомҳо дар ҳоли омодасозӣ аст. Вориди панели идоракунӣ шуда, аввалин таомҳои худро илова кунед ё файли Excel ворид созед.'
                : language === 'ru'
                ? 'Меню готово к добавлению ваших блюд. Войдите в панель управления, чтобы добавить блюда вручную или загрузить файл Excel.'
                : 'The menu is ready for your dishes. Access the control panel to add items manually or bulk import via Excel.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleAdminTrigger}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm shadow-md shadow-amber-500/25 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {isAdminAuthenticated
                    ? language === 'tj'
                      ? 'Кушодани панели идоракунӣ'
                      : language === 'ru'
                      ? 'Открыть панель управления'
                      : 'Open Control Panel'
                    : language === 'tj'
                    ? 'Ворид шудан ба панели идоракунӣ (CMS)'
                    : language === 'ru'
                    ? 'Войти в панель управления (CMS)'
                    : 'Log in to Admin Panel (CMS)'}
                </span>
              </button>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-8 my-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
              {showOnlyFavorites ? <Heart className="w-7 h-7" /> : <Utensils className="w-7 h-7" />}
            </div>
            <h3 className="font-bold text-base text-neutral-800 dark:text-neutral-200">
              {showOnlyFavorites ? t('favoritesEmpty', language) : t('noItemsFound', language)}
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
              {showOnlyFavorites
                ? language === 'tj'
                  ? 'Барои илова кардан тугмаи дилчаро дар таом пахш кунед'
                  : 'Нажмите иконку сердечка на карточке любого блюда, чтобы добавить его сюда'
                : language === 'tj'
                ? 'Номи дигареро ҷустуҷӯ кунед ё филтрро иваз намоед'
                : 'Попробуйте изменить поисковый запрос или выбрать другую категорию'}
            </p>
          </div>
        ) : !showOnlyFavorites && selectedCategory === 'all' ? (
          <div className="space-y-8 sm:space-y-10 pb-4">
            {groupedCategorySections.map((section) => (
              <section key={section.id} id={`category-section-${section.id}`}>
                <div className="flex items-center justify-between gap-3 mb-3.5 pb-2 border-b border-neutral-200/80 dark:border-neutral-800/90">
                  <div className="flex items-center gap-2 min-w-0">
                    {section.icon && (
                      <span className="text-lg sm:text-xl shrink-0" aria-hidden="true">
                        {section.icon}
                      </span>
                    )}
                    <h3 className="font-extrabold text-base sm:text-xl text-neutral-900 dark:text-white tracking-tight truncate">
                      {section.title}
                    </h3>
                    <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 tabular-nums shrink-0">
                      · {section.items.length}
                    </span>
                  </div>

                  {!section.isFallback && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(section.id)}
                      className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
                    >
                      {language === 'tj' ? 'Танҳо ин бахш' : language === 'ru' ? 'Только эта' : 'View only'} →
                    </button>
                  )}
                </div>

                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'
                      : 'flex flex-col gap-3 sm:gap-4'
                  }
                >
                  {section.items.map((item) => (
                    <FoodCard
                      key={item.id}
                      item={item}
                      onOpenDetail={(i) => setSelectedFoodDetail(i)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'
                : 'flex flex-col gap-3 sm:gap-4'
            }
          >
            {filteredItems.map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                onOpenDetail={(i) => setSelectedFoodDetail(i)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar (Sticky Order Total & Summary) */}
      <BottomCartBar onOpenCart={() => setIsCartOpen(true)} />

      {/* Slide-over / Modal Cart Drawer & Checkout */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenMyOrders={() => setIsMyOrdersOpen(true)}
      />

      {/* Customer My Orders & Live Status Tracking Modal */}
      <MyOrdersModal
        isOpen={isMyOrdersOpen}
        onClose={() => setIsMyOrdersOpen(false)}
      />

      {/* QR Code Sharing Modal */}
      <QRCodeModal
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
      />

      {/* Admin PIN Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={(role) => {
          setIsAdminLoginOpen(false);
          setIsAdminAuthenticated(true, role);
          setIsAdminDashboardOpen(true);
        }}
      />

      {/* Owner CMS & Analytics Dashboard */}
      {isAdminDashboardOpen && (
        <ErrorBoundary fallbackTitle="Admin Panel Error">
          <AdminDashboard
            isOpen={isAdminDashboardOpen}
            onClose={() => setIsAdminDashboardOpen(false)}
          />
        </ErrorBoundary>
      )}

      {/* Food Detail Modal */}
      <FoodDetailModal
        item={selectedFoodDetail}
        onClose={() => setSelectedFoodDetail(null)}
      />

      {/* Floating Admin Session Indicator (Only visible when user is logged in) */}
      {isAdminAuthenticated && (
        <div className="fixed bottom-4 left-4 z-40">
          <div className="flex items-center gap-2 p-1.5 pl-3 pr-2.5 rounded-full bg-neutral-900/95 dark:bg-white/95 text-white dark:text-neutral-900 shadow-xl border border-amber-500/50 backdrop-blur-md">
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              currentAdminRole === 'developer' ? 'bg-purple-500' : currentAdminRole === 'staff' ? 'bg-sky-500' : 'bg-amber-500'
            }`} />
            <button
              onClick={() => setIsAdminDashboardOpen(true)}
              className="text-xs font-bold hover:text-amber-400 dark:hover:text-amber-600 transition-colors uppercase tracking-wide cursor-pointer"
            >
              {currentAdminRole === 'developer'
                ? 'Developer Panel'
                : currentAdminRole === 'staff'
                ? 'Staff Panel'
                : 'Admin Panel'}
            </button>
            <span className="text-neutral-500 dark:text-neutral-400 text-xs select-none">|</span>
            <button
              onClick={() => {
                setIsAdminAuthenticated(false);
                setIsAdminDashboardOpen(false);
              }}
              className="text-[11px] font-semibold text-neutral-400 hover:text-rose-400 dark:hover:text-rose-600 transition-colors cursor-pointer"
              title="Logout from CMS"
            >
              {t('logout', language)}
            </button>
          </div>
        </div>
      )}

      {/* Footer with Working Hours, Live Status Light, Address & Socials */}
      <Footer onOpenAdmin={handleAdminTrigger} />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainMenuApp />
    </StoreProvider>
  );
}
