import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { t } from '../i18n/translations';
import { MenuItem } from '../types';
import { Heart, Plus, Minus, Flame, Sparkles, AlertCircle } from 'lucide-react';
import { resolveMenuItemImage, getFallbackImageForCategory } from '../utils/imageFallback';

interface FoodCardProps {
  item: MenuItem;
  onOpenDetail?: (item: MenuItem) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ item, onOpenDetail }) => {
  const { language, storeSettings, cart, addToCart, updateCartQuantity, toggleFavorite, isFavorite, viewMode } =
    useStore();
  const [imageSrc, setImageSrc] = useState(() => resolveMenuItemImage(item));
  const [hasFailedAll, setHasFailedAll] = useState(false);

  useEffect(() => {
    setImageSrc(resolveMenuItemImage(item));
    setHasFailedAll(false);
  }, [item.imageUrl, item.categoryId]);

  const handleImageError = () => {
    const fallback = getFallbackImageForCategory(item.categoryId);
    if (imageSrc !== fallback) {
      setImageSrc(fallback);
    } else {
      setHasFailedAll(true);
    }
  };

  const cartItem = cart.find((ci) => ci.menuItem.id === item.id);
  const qtyInCart = cartItem?.quantity || 0;
  const isFav = isFavorite(item.id);

  const title = item.name[language] || item.name.en || item.name.ru;
  const description = item.description[language] || item.description.en || item.description.ru;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAvailable) return;
    addToCart(item, 1);
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (qtyInCart > 0) {
      updateCartQuantity(item.id, qtyInCart - 1);
    }
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAvailable) return;
    updateCartQuantity(item.id, qtyInCart + 1);
  };

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(item.id);
  };

  // List View Layout (1 column)
  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onOpenDetail?.(item)}
        className={`group relative flex flex-row items-center gap-3 sm:gap-4 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 transition-all hover:border-amber-400 dark:hover:border-amber-600/60 hover:shadow-md cursor-pointer ${
          !item.isAvailable ? 'opacity-70 grayscale-[30%]' : ''
        }`}
      >
        {/* Image Container */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {!hasFailedAll && imageSrc ? (
            <img
              src={imageSrc}
              alt={title}
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50 dark:bg-neutral-800 text-amber-600 dark:text-amber-400 p-2 text-center">
              <span className="text-2xl mb-1">🍽️</span>
              <span className="text-[10px] font-medium leading-tight">{title}</span>
            </div>
          )}

          {/* Out of Stock Overlay */}
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-2 text-center">
              <span className="text-xs font-bold text-white tracking-wide uppercase px-2 py-0.5 bg-rose-600/90 rounded">
                {t('outOfStock', language)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between self-stretch min-w-0 py-0.5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-base sm:text-lg text-neutral-900 dark:text-white line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {title}
              </h3>
              <button
                type="button"
                onClick={handleFav}
                className={`p-1.5 rounded-full transition-transform active:scale-125 shrink-0 ${
                  isFav
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                }`}
                title="Add to favorites"
                aria-label="Favorite item"
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
              </button>
            </div>

            <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
              {description}
            </p>

            {/* Tags (Popular, New, Spicy, Prep Time) */}
            {(item.isPopular || item.isNew || item.isSpicy || item.prepTimeMinutes) && (
              <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px] text-neutral-500 dark:text-neutral-400">
                {item.isPopular && (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-md">
                    <Flame className="w-3 h-3 fill-current" />
                    {language === 'tj' ? 'Маъмул' : language === 'ru' ? 'Хит' : 'Popular'}
                  </span>
                )}
                {item.isNew && (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-md">
                    <Sparkles className="w-3 h-3" />
                    {t('newItemBadge', language)}
                  </span>
                )}
                {item.isSpicy && (
                  <span className="inline-flex items-center gap-1 text-rose-500 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-md">
                    <span>🌶️</span>
                    {t('spicy', language)}
                  </span>
                )}
                {item.prepTimeMinutes && (
                  <span>· {item.prepTimeMinutes} мин</span>
                )}
              </div>
            )}
          </div>

          {/* Price & Quantity Controls */}
          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white tabular-nums tracking-tight">
                {item.price} <span className="text-xs font-semibold text-neutral-500">{storeSettings.currency}</span>
              </span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-xs text-neutral-400 line-through tabular-nums">
                  {item.originalPrice}
                </span>
              )}
            </div>

            {/* Add or Counter */}
            {qtyInCart > 0 ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center bg-amber-500 text-white rounded-xl shadow-xs overflow-hidden"
              >
                <button
                  type="button"
                  onClick={handleMinus}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 hover:bg-amber-600 active:bg-amber-700 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-2.5 text-xs sm:text-sm font-bold tabular-nums min-w-6 text-center">
                  {qtyInCart}
                </span>
                <button
                  type="button"
                  onClick={handlePlus}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 hover:bg-amber-600 active:bg-amber-700 transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={!item.isAvailable}
                onClick={handleAdd}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-xs ${
                  item.isAvailable
                    ? 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{item.isAvailable ? t('add', language) : t('outOfStock', language)}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2-Column Grid Card Layout (Default)
  return (
    <div
      onClick={() => onOpenDetail?.(item)}
      className={`group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 transition-all hover:border-amber-400 dark:hover:border-amber-600/60 hover:shadow-md cursor-pointer overflow-hidden ${
        !item.isAvailable ? 'opacity-75' : ''
      }`}
    >
      {/* Food Picture Header */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {!hasFailedAll && imageSrc ? (
          <img
            src={imageSrc}
            alt={title}
            referrerPolicy="no-referrer"
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50 dark:bg-neutral-800 text-amber-600 dark:text-amber-400 p-4 text-center">
            <span className="text-3xl mb-1">🍽️</span>
            <span className="text-xs font-semibold leading-tight">{title}</span>
          </div>
        )}

        {/* Favorite Heart Button (Top-Right) */}
        <button
          type="button"
          onClick={handleFav}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all active:scale-125 z-10 shadow-xs ${
            isFav
              ? 'bg-white text-rose-500 shadow-md'
              : 'bg-white/80 dark:bg-neutral-900/80 text-neutral-600 dark:text-neutral-300 hover:bg-white hover:text-rose-500'
          }`}
          title="Add to favorites"
          aria-label="Favorite item"
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
        </button>

        {/* Feature Badges (Top-Left) */}
        {(item.isPopular || item.isNew || item.isSpicy) && (
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10 pointer-events-none">
            {item.isPopular && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-extrabold text-[10px] tracking-wide uppercase shadow-xs flex items-center gap-1">
                <Flame className="w-2.5 h-2.5 fill-current" />
                {language === 'tj' ? 'Маъмул' : language === 'ru' ? 'Хит' : 'Popular'}
              </span>
            )}
            {item.isNew && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-extrabold text-[10px] tracking-wide uppercase shadow-xs flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                {t('newItemBadge', language)}
              </span>
            )}
            {item.isSpicy && (
              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px] tracking-wide uppercase shadow-xs flex items-center gap-1">
                <span>🌶️</span>
                {t('spicy', language)}
              </span>
            )}
          </div>
        )}

        {/* Out of Stock Overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-[2px] flex items-center justify-center p-3 text-center z-10">
            <span className="text-xs font-bold text-white tracking-wide uppercase px-2.5 py-1 bg-rose-600/90 rounded-lg flex items-center gap-1 shadow-md">
              <AlertCircle className="w-3.5 h-3.5" />
              {t('outOfStock', language)}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-1 mb-1">
            <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {title}
            </h3>
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed min-h-[2rem]">
            {description}
          </p>
        </div>

        {/* Bottom Price & Add Stepper */}
        <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white tabular-nums tracking-tight">
              {item.price}{' '}
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                {storeSettings.currency}
              </span>
            </span>
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="text-[10px] text-neutral-400 line-through tabular-nums -mt-0.5">
                {item.originalPrice} {storeSettings.currency}
              </span>
            )}
          </div>

          {qtyInCart > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center bg-amber-500 text-white rounded-xl shadow-xs overflow-hidden"
            >
              <button
                type="button"
                onClick={handleMinus}
                className="p-1 sm:p-1.5 hover:bg-amber-600 active:bg-amber-700 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-xs font-bold tabular-nums min-w-5 text-center">
                {qtyInCart}
              </span>
              <button
                type="button"
                onClick={handlePlus}
                className="p-1 sm:p-1.5 hover:bg-amber-600 active:bg-amber-700 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!item.isAvailable}
              onClick={handleAdd}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
                item.isAvailable
                  ? 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{item.isAvailable ? t('add', language) : t('outOfStock', language)}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
