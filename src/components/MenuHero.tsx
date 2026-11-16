import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { t } from '../i18n/translations';
import { Heart, Clock, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface MenuHeroProps {
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (catId: string) => void;
  showOnlyFavorites: boolean;
  setShowOnlyFavorites: (fav: boolean) => void;
}

export const MenuHero: React.FC<MenuHeroProps> = ({
  selectedCategory,
  setSelectedCategory,
  showOnlyFavorites,
  setShowOnlyFavorites,
}) => {
  const { categories, favorites, language, storeSettings, isStoreOpen, isLoadingCatalog } = useStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Mouse drag-to-scroll state for desktop users
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const didDragRef = useRef(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories]
  );

  const updateScrollIndicators = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollIndicators();
    window.addEventListener('resize', updateScrollIndicators);
    return () => window.removeEventListener('resize', updateScrollIndicators);
  }, [updateScrollIndicators, sortedCategories.length, language]);

  const scrollCategoriesBy = (delta: number) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isPointerDownRef.current = true;
    didDragRef.current = false;
    startXRef.current = e.pageX;
    scrollStartRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const dx = e.pageX - startXRef.current;
    if (Math.abs(dx) > 6) {
      didDragRef.current = true;
    }
    if (didDragRef.current) {
      el.scrollLeft = scrollStartRef.current - dx;
    }
  };

  const stopDragging = () => {
    isPointerDownRef.current = false;
    setTimeout(() => {
      didDragRef.current = false;
    }, 0);
  };

  const handleCategoryButtonClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    action: () => void
  ) => {
    if (didDragRef.current) {
      e.preventDefault();
      return;
    }
    action();
    e.currentTarget.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  };

  return (
    <div className="pt-4 pb-4 space-y-3.5">
      {/* Top Banner Notice: Live Working Hours Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-xs">
        <div className="flex items-center gap-2">
          {/* Status Light Indicator */}
          <span className="relative flex h-3 w-3">
            {isStoreOpen && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isStoreOpen ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </span>

          <span className="font-bold text-neutral-900 dark:text-white">
            {isStoreOpen ? t('openNow', language) : t('closedNow', language)}
          </span>

          <span className="text-neutral-400">·</span>

          <span className="text-neutral-600 dark:text-neutral-300 flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>
              {storeSettings.workingHours.open} - {storeSettings.workingHours.close}
            </span>
          </span>
        </div>

        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
          {storeSettings.workingHours.daysNote[language] || storeSettings.workingHours.daysNote.en}
        </span>
      </div>

      {/* Scrollable Category Tabs with Left/Right Scroll Arrows */}
      <div className="relative group/cats">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollCategoriesBy(-240)}
            aria-label="Scroll categories left"
            className="hidden sm:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md border border-neutral-200/90 dark:border-neutral-700/80 text-neutral-700 dark:text-neutral-200 shadow-md hover:bg-white dark:hover:bg-neutral-800 hover:text-amber-600 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={updateScrollIndicators}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          className={`flex items-center gap-2 overflow-x-auto scroll-smooth pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0 select-none ${
            canScrollLeft ? 'sm:pl-10' : ''
          } ${canScrollRight ? 'sm:pr-10' : ''}`}
        >
          {/* All Items Tab */}
          <button
            type="button"
            onClick={(e) =>
              handleCategoryButtonClick(e, () => {
                setShowOnlyFavorites(false);
                setSelectedCategory('all');
              })
            }
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-2xs shrink-0 ${
              !showOnlyFavorites && selectedCategory === 'all'
                ? 'bg-amber-500 text-white shadow-amber-500/20'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:border-amber-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('allCategories', language)}</span>
          </button>

          {/* Favorites Tab */}
          <button
            type="button"
            onClick={(e) =>
              handleCategoryButtonClick(e, () => {
                setShowOnlyFavorites(!showOnlyFavorites);
                if (!showOnlyFavorites) setSelectedCategory('all');
              })
            }
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-2xs shrink-0 ${
              showOnlyFavorites
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:border-rose-400'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-current' : 'text-rose-500'}`} />
            <span>{t('favorites', language)}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 tabular-nums">
              {favorites.length}
            </span>
          </button>

          {/* Dynamic Category List or Loading Skeleton */}
          {isLoadingCatalog && sortedCategories.length === 0
            ? Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={`cat-skel-${idx}`}
                  aria-hidden="true"
                  className="h-8 w-24 rounded-xl bg-neutral-200/80 dark:bg-neutral-800 animate-pulse shrink-0"
                />
              ))
            : sortedCategories.map((cat) => {
                const isSelected = !showOnlyFavorites && selectedCategory === cat.id;
                const label = cat.name[language] || cat.name.en;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={(e) =>
                      handleCategoryButtonClick(e, () => {
                        setShowOnlyFavorites(false);
                        setSelectedCategory(cat.id);
                      })
                    }
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-2xs shrink-0 ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-amber-500/20'
                        : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:border-amber-400'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
        </div>

        {/* Right edge subtle fade & scroll arrow when overflowed */}
        {canScrollRight && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-neutral-50 dark:from-neutral-950 to-transparent sm:hidden"
            />
            <button
              type="button"
              onClick={() => scrollCategoriesBy(240)}
              aria-label="Scroll categories right"
              className="hidden sm:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md border border-neutral-200/90 dark:border-neutral-700/80 text-neutral-700 dark:text-neutral-200 shadow-md hover:bg-white dark:hover:bg-neutral-800 hover:text-amber-600 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
