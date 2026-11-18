import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { t } from '../i18n/translations';
import { buildTelegramDispatchUrl, buildWhatsAppDispatchUrl } from '../utils/dispatch';
import { SavedOrder, OrderStatus } from '../types';
import {
  X,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  XCircle,
  Truck,
  Store,
  UtensilsCrossed,
  Utensils,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({ isOpen, onClose }) => {
  const { myOrders, activeOrdersCount, language, storeSettings } = useStore();
  const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleExpand = (id: string) => {
    setExpandedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Helper for single animated status icon, title, description, and badge
  const getOrderPresentation = (order: SavedOrder) => {
    const isDelivery = order.customer.deliveryType === 'delivery';
    const isDineIn = order.customer.deliveryType === 'dine_in';
    const isPickup = order.customer.deliveryType === 'pickup';

    // 1. Cancelled Status
    if (order.status === 'cancelled') {
      return {
        title: t('orderStatusCancelled', language),
        desc: order.cancellationReason
          ? order.cancellationReason
          : t('orderStatusDescCancelled', language),
        badgeText: t('orderStatusCancelled', language),
        badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        dotClass: 'bg-rose-500',
        cardBg: 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50',
        iconBg: 'bg-rose-500 text-white ring-4 ring-rose-500/20 shadow-lg shadow-rose-500/25',
        icon: <XCircle className="w-7 h-7 shrink-0" />,
        isAnimated: false,
      };
    }

    // 2. New / Received Status
    if (order.status === 'new') {
      return {
        title: t('orderStatusNew', language),
        desc: t('orderStatusDescNew', language),
        badgeText: language === 'tj' ? 'Қабул шуд' : language === 'ru' ? 'Заказ принят' : 'Order Placed',
        badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-500 animate-pulse',
        cardBg: 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50',
        iconBg: 'bg-amber-500 text-white ring-4 ring-amber-500/20 shadow-lg shadow-amber-500/25',
        icon: <CheckCircle2 className="w-7 h-7 shrink-0 animate-pulse" />,
        isAnimated: true,
      };
    }

    // 3. Preparing Status (Kitchen / Cooking)
    if (order.status === 'preparing') {
      return {
        title: t('orderStatusPreparing', language),
        desc: t('orderStatusDescPreparing', language),
        badgeText:
          isDineIn
            ? (language === 'tj' ? 'Омода барои миз' : language === 'ru' ? 'Готовится к столу' : 'Preparing for Table')
            : isPickup
            ? (language === 'tj' ? 'Омодаи бо худ' : language === 'ru' ? 'Сборка заказа' : 'Preparing Takeaway')
            : (language === 'tj' ? 'Дар ошхона' : language === 'ru' ? 'Готовится на кухне' : 'Cooking in Kitchen'),
        badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
        dotClass: 'bg-orange-500 animate-ping',
        cardBg: 'bg-orange-50/70 dark:bg-orange-950/20 border-orange-200/80 dark:border-orange-900/50',
        iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white ring-4 ring-orange-500/20 shadow-lg shadow-orange-500/30',
        icon: <ChefHat className="w-7 h-7 shrink-0 animate-bounce" />,
        isAnimated: true,
      };
    }

    // 4. Out for Delivery Status (Delivery only)
    if (order.status === 'out_for_delivery') {
      return {
        title: t('orderStatusOutForDelivery', language),
        desc: t('orderStatusDescOutForDelivery', language),
        badgeText: language === 'tj' ? 'Дар роҳ (Курер)' : language === 'ru' ? 'Курьер в пути' : 'Out for Delivery',
        badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
        dotClass: 'bg-blue-500 animate-pulse',
        cardBg: 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/50',
        iconBg: 'bg-gradient-to-tr from-blue-600 to-sky-500 text-white ring-4 ring-blue-500/20 shadow-lg shadow-blue-500/30',
        icon: <Truck className="w-7 h-7 shrink-0 animate-pulse" />,
        isAnimated: true,
      };
    }

    // 5. Delivered / Ready / Completed Status
    // For Dine-in: Ready / Served
    if (isDineIn) {
      return {
        title: t('orderStatusReadyDineIn', language),
        desc: t('orderStatusDescReadyDineIn', language),
        badgeText: language === 'tj' ? 'Ба миз оварда шуд' : language === 'ru' ? 'Подано к столу' : 'Served at Table',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-500',
        cardBg: 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50',
        iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30',
        icon: <Utensils className="w-7 h-7 shrink-0" />,
        isAnimated: false,
      };
    }

    // For Takeaway (Pickup): Ready for Pickup
    if (isPickup) {
      return {
        title: t('orderStatusReadyTakeaway', language),
        desc: t('orderStatusDescReadyTakeaway', language),
        badgeText: language === 'tj' ? 'Барои гирифтан тайёр' : language === 'ru' ? 'Готов к выдаче' : 'Ready for Pickup',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        dotClass: 'bg-emerald-500',
        cardBg: 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50',
        iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30',
        icon: <ShoppingBag className="w-7 h-7 shrink-0" />,
        isAnimated: false,
      };
    }

    // For Delivery: Delivered
    return {
      title: t('orderStatusDelivered', language),
      desc: t('orderStatusDescDelivered', language),
      badgeText: language === 'tj' ? 'Расонида шуд' : language === 'ru' ? 'Доставлен' : 'Delivered',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      dotClass: 'bg-emerald-500',
      cardBg: 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50',
      iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30',
      icon: <PackageCheck className="w-7 h-7 shrink-0" />,
      isAnimated: false,
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        onClick={onClose}
        className="fixed inset-0"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/70 dark:bg-neutral-900/70 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-white">
                  {t('myOrders', language)}
                </h3>
                {activeOrdersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white animate-pulse">
                    {activeOrdersCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {activeOrdersCount > 0
                  ? language === 'tj'
                    ? `${activeOrdersCount} фармоиш дар ҳоли иҷро`
                    : language === 'ru'
                    ? `${activeOrdersCount} активных заказов обновляются онлайн`
                    : `${activeOrdersCount} active order(s) updating live`
                  : language === 'tj'
                  ? 'Таърихи фармоишҳои шумо'
                  : language === 'ru'
                  ? 'История ваших заказов'
                  : 'Your orders history'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders List Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {myOrders.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 p-6 my-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-base text-neutral-800 dark:text-neutral-200">
                {t('noOrdersYet', language)}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-1 mb-5">
                {t('noOrdersDesc', language)}
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                {language === 'tj' ? 'Гузаштан ба Меню' : language === 'ru' ? 'Перейти в меню' : 'Explore Menu'}
              </button>
            </div>
          ) : (
            myOrders.map((order) => {
              const statusPres = getOrderPresentation(order);
              const isExpanded = expandedOrderIds.includes(order.id);
              const formattedDate = new Date(order.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-sm overflow-hidden transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
                >
                  {/* Order Top Summary Bar */}
                  <div className="p-4 sm:p-4.5 bg-neutral-50/70 dark:bg-neutral-800/40 border-b border-neutral-100 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm sm:text-base font-mono text-neutral-900 dark:text-white">
                            {order.orderNumber}
                          </span>
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formattedDate}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                          <span className="flex items-center gap-1 font-semibold">
                            {order.customer.deliveryType === 'delivery' ? (
                              <>
                                <Truck className="w-3.5 h-3.5 text-amber-500" />
                                <span>{language === 'tj' ? 'Бурдарасонӣ' : language === 'ru' ? 'Доставка' : 'Delivery'}</span>
                              </>
                            ) : order.customer.deliveryType === 'pickup' ? (
                              <>
                                <Store className="w-3.5 h-3.5 text-blue-500" />
                                <span>{language === 'tj' ? 'Бо худ' : language === 'ru' ? 'Самовывоз' : 'Takeaway'}</span>
                              </>
                            ) : (
                              <>
                                <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" />
                                <span>{language === 'tj' ? 'Дар ошхона' : language === 'ru' ? 'В заведении' : 'Dine-in'}</span>
                              </>
                            )}
                          </span>
                          <span>•</span>
                          <span className="font-extrabold text-neutral-900 dark:text-white">
                            {order.total} {storeSettings.currency}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(order.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <span>{isExpanded ? (language === 'tj' ? 'Маҳкам' : language === 'ru' ? 'Свернуть' : 'Collapse') : (language === 'tj' ? 'Тафсилот' : language === 'ru' ? 'Состав' : 'Details')}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* RE-IMAGINED SINGLE ICON STATUS HERO CARD */}
                  <div className="p-4 sm:p-5">
                    <div
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${statusPres.cardBg} flex items-center gap-4 sm:gap-5`}
                    >
                      {/* Single Hero Status Icon */}
                      <div
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${statusPres.iconBg}`}
                      >
                        {statusPres.icon}
                      </div>

                      {/* Status Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusPres.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusPres.dotClass}`} />
                            <span>{statusPres.badgeText}</span>
                          </span>

                          {order.customer.deliveryType === 'dine_in' && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                              {order.customer.addressOrTable}
                            </span>
                          )}
                        </div>

                        <h4 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-white leading-snug">
                          {statusPres.title}
                        </h4>

                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                          {statusPres.desc}
                        </p>

                        {/* Special Cancellation Reason Highlight */}
                        {order.status === 'cancelled' && order.cancellationReason && (
                          <div className="mt-2.5 pt-2 border-t border-rose-200/70 dark:border-rose-900/50 flex items-center gap-2 text-xs">
                            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                            <span className="font-bold text-rose-800 dark:text-rose-300">
                              {t('cancellationReasonTitle', language)}:
                            </span>
                            <span className="font-medium text-rose-700 dark:text-rose-200 bg-rose-100/80 dark:bg-rose-900/50 px-2 py-0.5 rounded-md">
                              {order.cancellationReason}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Details Accordion */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 space-y-3 animate-in fade-in duration-150">
                        <div className="text-xs space-y-1.5 text-neutral-600 dark:text-neutral-400">
                          <div className="flex justify-between">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                              {t('customerName', language)}:
                            </span>
                            <span>{order.customer.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                              {t('customerPhone', language)}:
                            </span>
                            <span>{order.customer.phone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                              {order.customer.deliveryType === 'dine_in'
                                ? t('tableNumber', language)
                                : t('deliveryAddress', language)}:
                            </span>
                            <span className="font-medium text-neutral-900 dark:text-white">
                              {order.customer.addressOrTable}
                            </span>
                          </div>
                          {order.customer.orderNotes && (
                            <div className="flex justify-between">
                              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                {language === 'tj' ? 'Эзоҳ:' : language === 'ru' ? 'Примечание:' : 'Notes:'}
                              </span>
                              <span className="italic">{order.customer.orderNotes}</span>
                            </div>
                          )}
                        </div>

                        {/* Items Breakdown */}
                        <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                            {language === 'tj' ? 'Таомҳои фармоиш' : language === 'ru' ? 'Состав заказа' : 'Order Items'}
                          </span>
                          <div className="space-y-1.5 text-xs">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="text-neutral-800 dark:text-neutral-200">
                                  {it.name} <span className="font-bold text-amber-600 dark:text-amber-400">×{it.quantity}</span>
                                </span>
                                <span className="font-medium tabular-nums text-neutral-700 dark:text-neutral-300">
                                  {it.subtotal} {storeSettings.currency}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between font-bold text-xs text-neutral-900 dark:text-white">
                            <span>{language === 'tj' ? 'Ҳамагӣ' : language === 'ru' ? 'Итого' : 'Total'}:</span>
                            <span className="text-sm text-amber-600 dark:text-amber-400 font-extrabold">
                              {order.total} {storeSettings.currency}
                            </span>
                          </div>
                        </div>

                        {/* Order Channel Indicator */}
                        <div className="flex items-center justify-end gap-3 pt-1 text-xs">
                          {order.channel === 'direct' ? (
                            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {language === 'tj'
                                  ? 'Фармоиши мустақим (App)'
                                  : language === 'ru'
                                  ? 'Прямой заказ (App)'
                                  : 'Direct In-App Order'}
                              </span>
                            </span>
                          ) : order.channel === 'whatsapp' ? (
                            <a
                              href={buildWhatsAppDispatchUrl(storeSettings.whatsappNumber) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[#25D366] hover:underline font-bold"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          ) : (
                            <a
                              href={buildTelegramDispatchUrl(storeSettings.telegramUsername) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[#0088cc] hover:underline font-bold"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Telegram</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
