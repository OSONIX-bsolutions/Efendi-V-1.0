import React from 'react';
import { useStore } from '../context/StoreContext';
import { t } from '../i18n/translations';
import { ShoppingBag, ChevronRight } from 'lucide-react';

interface BottomCartBarProps {
  onOpenCart: () => void;
}

export const BottomCartBar: React.FC<BottomCartBarProps> = ({ onOpenCart }) => {
  const { cart, cartTotal, cartCount, storeSettings, language } = useStore();

  if (cartCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="max-w-xl mx-auto pointer-events-auto">
        <button
          onClick={onOpenCart}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-neutral-900 dark:bg-amber-500 text-white shadow-xl shadow-neutral-900/25 dark:shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all group"
        >
          {/* Left: Bag & Count */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-amber-500 dark:bg-neutral-900 text-white flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-neutral-900 dark:border-amber-500">
                {cartCount}
              </span>
            </div>
            <div className="text-left">
              <div className="font-bold text-sm tracking-tight text-white dark:text-neutral-950 flex items-center gap-1.5">
                <span>{t('viewOrder', language)}</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-800 font-medium">
                {cartCount} {t('itemsCount', language)}
              </p>
            </div>
          </div>

          {/* Right: Total Price */}
          <div className="text-right">
            <span className="text-xs text-neutral-400 dark:text-neutral-800 uppercase tracking-wider block font-medium">
              {t('total', language)}
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-white dark:text-neutral-950 tabular-nums">
              {cartTotal} <span className="text-xs">{storeSettings.currency}</span>
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
