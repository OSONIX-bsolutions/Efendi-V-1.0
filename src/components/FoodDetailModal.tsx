import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { t } from '../i18n/translations';
import { MenuItem } from '../types';
import {
  X,
  Plus,
  Minus,
  Heart,
  Flame,
  Sparkles,
  Clock,
  Check,
} from 'lucide-react';
import { resolveMenuItemImage, getFallbackImageForCategory } from '../utils/imageFallback';

interface FoodDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ item, onClose }) => {
  const { language, storeSettings, addToCart, toggleFavorite, isFavorite } = useStore();
  const [qty, setQty] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(() => (item ? resolveMenuItemImage(item) : ''));

  useEffect(() => {
    if (item) {
      setImageSrc(resolveMenuItemImage(item));
    } else {
      setImageSrc('');
    }
  }, [item?.id, item?.imageUrl, item?.categoryId]);

  const handleImageError = () => {
    if (item) {
      const fallback = getFallbackImageForCategory(item.categoryId);
      setImageSrc(fallback);
    }
  };

  if (!item) return null;

  const resolvedImageSrc = imageSrc || resolveMenuItemImage(item);
  const isFav = isFavorite(item.id);
  const title = item.name[language] || item.name.en || item.name.ru || item.name.tj;
  const description = item.description[language] || item.description.en || item.description.ru || item.description.tj;

  const handleAdd = () => {
    if (!item.isAvailable) return;
    addToCart(item, qty, itemNotes);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Top Image & Floating Buttons */}
        <div className="relative aspect-16/10 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
          {resolvedImageSrc ? (
            <img
              src={resolvedImageSrc}
              alt={title}
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="w-full h-full object-cover"
            />
          ) : null}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            onClick={() => toggleFavorite(item.id)}
            className="absolute top-3 left-3 p-2 rounded-full bg-white/90 dark:bg-neutral-900/90 text-rose-500 shadow-md backdrop-blur-md transition-transform active:scale-125"
            aria-label="Favorite"
          >
            <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-xl text-neutral-900 dark:text-white">
                {title}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {item.prepTimeMinutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{item.prepTimeMinutes} мин</span>
                  </span>
                )}
                {item.calories && (
                  <span>· {item.calories} ккал</span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-2xl font-extrabold text-neutral-900 dark:text-white tabular-nums block">
                {item.price} <span className="text-sm font-semibold">{storeSettings.currency}</span>
              </span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-xs text-neutral-400 line-through tabular-nums">
                  {item.originalPrice} {storeSettings.currency}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {description}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-2 pt-1">
            {item.isNew && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {t('newItemBadge', language)}
              </span>
            )}
            {item.isPopular && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                {t('popular', language)}
              </span>
            )}
            {item.isSpicy && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {t('spicy', language)}
              </span>
            )}
            <span
              className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                item.isAvailable
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-500/15 text-rose-600'
              }`}
            >
              {item.isAvailable ? t('inStock', language) : t('outOfStock', language)}
            </span>
          </div>

          {/* Special Instructions Input */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
              {t('specialNotesPlaceholder', language)}
            </label>
            <input
              type="text"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder={
                language === 'tj'
                  ? 'Масалан: бе пиёз, чошнии тундтар'
                  : language === 'ru'
                  ? 'Например: без лука, соус отдельно'
                  : 'e.g., extra crispy, sauce on the side'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Modal Footer: Quantity Stepper & Add Button */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden shadow-2xs">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="p-2 sm:px-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-3 font-bold text-sm tabular-nums min-w-6 text-center">
              {qty}
            </span>
            <button
              onClick={() => setQty(qty + 1)}
              className="p-2 sm:px-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            disabled={!item.isAvailable}
            onClick={handleAdd}
            className={`flex-1 py-3 px-5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              addedAnimation
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white shadow-amber-500/20'
            } disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-5 h-5" />
                <span>
                  {language === 'tj' ? 'Илова шуд!' : language === 'ru' ? 'Добавлено!' : 'Added!'}
                </span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>
                  {t('add', language)} · {item.price * qty} {storeSettings.currency}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
