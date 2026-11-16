import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useStore } from '../context/StoreContext';
import { t } from '../i18n/translations';
import { DeliveryType, PaymentMethod, SavedOrder } from '../types';
import { resolveMenuItemImage, getFallbackImageForCategory } from '../utils/imageFallback';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Send,
  MessageCircle,
  ShoppingBag,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Utensils,
  Truck,
  Package,
  Share2,
  CreditCard,
  FileText,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMyOrders?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOpenMyOrders }) => {
  const {
    cart,
    cartTotal,
    cartCount,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    storeSettings,
    language,
    createOrder,
  } = useStore();

  const isDeliveryEnabled = storeSettings.enabledDeliveryTypes?.delivery !== false;
  const isPickupEnabled = storeSettings.enabledDeliveryTypes?.pickup !== false;
  const isDineInEnabled = storeSettings.enabledDeliveryTypes?.dine_in !== false;

  const initialDeliveryType: DeliveryType = isDeliveryEnabled
    ? 'delivery'
    : isPickupEnabled
    ? 'pickup'
    : 'dine_in';

  const [step, setStep] = useState<'cart' | 'details' | 'success'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(initialDeliveryType);
  const [addressOrTable, setAddressOrTable] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<SavedOrder | null>(null);
  const [lastWhatsappLink, setLastWhatsappLink] = useState('');
  const [lastTelegramLink, setLastTelegramLink] = useState('');
  const [validationError, setValidationError] = useState('');

  // Auto-switch deliveryType if current selection becomes disabled
  React.useEffect(() => {
    if (deliveryType === 'delivery' && !isDeliveryEnabled) {
      setDeliveryType(isPickupEnabled ? 'pickup' : 'dine_in');
    } else if (deliveryType === 'pickup' && !isPickupEnabled) {
      setDeliveryType(isDeliveryEnabled ? 'delivery' : 'dine_in');
    } else if (deliveryType === 'dine_in' && !isDineInEnabled) {
      setDeliveryType(isDeliveryEnabled ? 'delivery' : 'pickup');
    }
  }, [isDeliveryEnabled, isPickupEnabled, isDineInEnabled, deliveryType]);

  // Direct in-app checkout (single Place Order button) vs showing WhatsApp/Telegram redirect buttons
  const isDirectOrderingOnly = storeSettings.directOrderingOnly !== false;

  // Determine available store order accounts strictly matching owner configuration
  const isWhatsAppAvailable = Boolean(
    storeSettings.whatsappEnabled !== false &&
    storeSettings.whatsappNumber?.trim()
  );

  const isTelegramAvailable = Boolean(
    storeSettings.telegramEnabled !== false &&
    storeSettings.telegramUsername?.trim()
  );

  if (!isOpen) return null;

  const handleProceedToDetails = () => {
    if (cart.length === 0) return;
    setStep('details');
  };

  const handlePlaceOrder = (channel: 'direct' | 'whatsapp' | 'telegram') => {
    // 1. Customer Name validation
    if (!customerName.trim()) {
      setValidationError(
        language === 'tj'
          ? 'Лутфан номи худро ворид намоед'
          : language === 'ru'
          ? 'Пожалуйста, введите ваше имя'
          : 'Please enter your name'
      );
      return;
    }

    // 2. Contact Phone validation (phone is required)
    if (!phone.trim()) {
      setValidationError(
        language === 'tj'
          ? 'Лутфан рақами телефони худро барои тамос ворид намоед'
          : language === 'ru'
          ? 'Пожалуйста, введите контактный номер телефона'
          : 'Please enter your contact phone number'
      );
      return;
    }

    // 3. Delivery address validation
    if (deliveryType === 'delivery' && !addressOrTable.trim()) {
      setValidationError(
        language === 'tj'
          ? 'Лутфан суроғаи бурдарасониро ворид намоед'
          : language === 'ru'
          ? 'Пожалуйста, укажите адрес доставки'
          : 'Please specify delivery address'
      );
      return;
    }

    setValidationError('');

    const customer = {
      name: customerName.trim(),
      phone: phone.trim(),
      deliveryType,
      addressOrTable:
        deliveryType === 'dine_in'
          ? addressOrTable.trim() || (language === 'tj' ? 'Миз' : 'Стол')
          : deliveryType === 'pickup'
          ? (language === 'tj' ? 'Бо худ бурдан / Takeaway' : 'Самовывоз / Takeaway')
          : addressOrTable.trim(),
      orderNotes: orderNotes.trim(),
      paymentMethod,
    };

    const { order, link, whatsappLink, telegramLink, orderPromise } = createOrder(
      customer,
      channel
    );
    setLastPlacedOrder(order);
    setLastWhatsappLink(whatsappLink);
    setLastTelegramLink(telegramLink);
    setStep('success');

    orderPromise
      .then((serverOrder) => {
        if (serverOrder) {
          setLastPlacedOrder(serverOrder);
        }
      })
      .catch(() => {});

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Safe fallback
    }

    // Simple redirecting API for WhatsApp / Telegram when customer chooses a messenger channel
    if (channel !== 'direct' && link) {
      try {
        const anchor = document.createElement('a');
        anchor.href = link;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      } catch {
        // Fallback links remain visible on the success receipt screen
      }
    }
  };

  const handleResetFlow = () => {
    setStep('cart');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 h-full flex flex-col shadow-2xl z-10 overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-neutral-900 dark:text-white">
                {step === 'cart'
                  ? t('yourCart', language)
                  : step === 'details'
                  ? t('checkoutTitle', language)
                  : t('orderSuccessMessage', language)}
              </h2>
              {step === 'cart' && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {cartCount} {t('itemsCount', language)} · {cartTotal} {storeSettings.currency}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* STEP 1: CART ITEMS LIST */}
          {step === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-base text-neutral-800 dark:text-neutral-200">
                    {t('cartEmpty', language)}
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-xs mt-1">
                    {language === 'tj'
                      ? 'Таомҳои писандидаи худро аз меню интихоб ва илова намоед'
                      : language === 'ru'
                      ? 'Выберите любимые блюда из меню и добавьте их в корзину'
                      : 'Choose your favorite fast-food items from the menu to start ordering'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      {t('yourCart', language)}
                    </span>
                    <button
                      onClick={clearCart}
                      className="text-xs font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('clearCart', language)}</span>
                    </button>
                  </div>

                  {cart.map((ci) => {
                    const itemName = ci.menuItem.name[language] || ci.menuItem.name.en;
                    return (
                      <div
                        key={ci.menuItem.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800 transition-all"
                      >
                        <img
                          src={resolveMenuItemImage(ci.menuItem)}
                          alt={itemName}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const fallback = getFallbackImageForCategory(ci.menuItem.categoryId);
                            if (!e.currentTarget.src.endsWith(fallback)) {
                              e.currentTarget.src = fallback;
                            }
                          }}
                          className="w-14 h-14 rounded-lg object-cover bg-neutral-200 dark:bg-neutral-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                            {itemName}
                          </h4>
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                            {ci.menuItem.price * ci.quantity} {storeSettings.currency}
                          </span>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden shrink-0 shadow-2xs">
                          <button
                            onClick={() => updateCartQuantity(ci.menuItem.id, ci.quantity - 1)}
                            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-xs font-bold tabular-nums min-w-5 text-center">
                            {ci.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(ci.menuItem.id, ci.quantity + 1)}
                            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* STEP 2: CUSTOMER DETAILS & CHANNEL OPTIONS */}
          {step === 'details' && (
            <div className="space-y-4">
              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-xs font-medium">
                  {validationError}
                </div>
              )}

              {/* Delivery Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                  {t('deliveryType', language)}
                </label>
                <div className={`grid gap-2 ${
                  [isDeliveryEnabled, isPickupEnabled, isDineInEnabled].filter(Boolean).length === 3
                    ? 'grid-cols-3'
                    : [isDeliveryEnabled, isPickupEnabled, isDineInEnabled].filter(Boolean).length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-1'
                }`}>
                  {isDeliveryEnabled && (
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        deliveryType === 'delivery'
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      <Truck className="w-4 h-4 mb-1" />
                      <span>{t('delivery', language).split(' ')[0]}</span>
                    </button>
                  )}
                  {isPickupEnabled && (
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        deliveryType === 'pickup'
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      <Package className="w-4 h-4 mb-1" />
                      <span>{t('pickup', language).split(' ')[0]}</span>
                    </button>
                  )}
                  {isDineInEnabled && (
                    <button
                      type="button"
                      onClick={() => setDeliveryType('dine_in')}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        deliveryType === 'dine_in'
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      <Utensils className="w-4 h-4 mb-1" />
                      <span>{t('dineIn', language).split(' ')[0]}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {language === 'tj' ? 'Номи Шумо' : language === 'ru' ? 'Ваше имя' : 'Name'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={
                      language === 'tj' ? 'Ном ва насаб (масалан: Рустам)' : language === 'ru' ? 'Имя (например: Рустам)' : 'Full Name (e.g. Alex)'
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Contact for phone number */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {language === 'tj'
                    ? 'Рақами телефон барои тамос'
                    : language === 'ru'
                    ? 'Контактный номер телефона'
                    : 'Contact for phone number'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+992 90 000 0000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Delivery address */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {deliveryType === 'dine_in'
                    ? t('tableNumber', language)
                    : deliveryType === 'pickup'
                    ? (language === 'tj' ? 'Нуқтаи қабул (Худи тарабхона)' : language === 'ru' ? 'Точка самовывоза' : 'Pickup Point')
                    : (language === 'tj' ? 'Суроғаи бурдарасонӣ' : language === 'ru' ? 'Адрес доставки' : 'Delivery address')}{' '}
                  {deliveryType === 'delivery' && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={addressOrTable}
                    onChange={(e) => setAddressOrTable(e.target.value)}
                    placeholder={
                      deliveryType === 'dine_in'
                        ? (language === 'tj' ? 'Миз № 3' : language === 'ru' ? 'Стол № 3' : 'Table #3')
                        : deliveryType === 'pickup'
                        ? (language === 'tj' ? 'Қабул аз тарабхона' : language === 'ru' ? 'Самовывоз из ресторана' : 'Pickup at restaurant')
                        : (language === 'tj'
                          ? 'кӯчаи Рӯдакӣ 45, бинои 2, ҳуҷраи 14'
                          : language === 'ru'
                          ? 'ул. Рудаки 45, дом 2, кв. 14'
                          : '45 Rudaki Ave, Bldg 2, Apt 14')
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 shadow-2xs"
                    required={deliveryType === 'delivery'}
                  />
                </div>
              </div>

              {/* Notes for kitchen ("notes for kutchen") */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {language === 'tj'
                    ? 'Эзоҳ барои ошхона (ихтиёрӣ)'
                    : language === 'ru'
                    ? 'Пожелания для кухни (по желанию)'
                    : 'Notes for kitchen (optional)'}
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder={
                    language === 'tj'
                      ? 'Масалан: бе пиёз, чошнии иловагӣ, хӯрок гарм бошад...'
                      : language === 'ru'
                      ? 'Например: без лука, острый соус, приборы...'
                      : 'e.g. no onions, sauce on the side, hot food...'
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 shadow-2xs"
                />
              </div>


              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                  {t('paymentMethod', language)}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                      paymentMethod === 'cash'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {t('cash', language)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card_on_delivery')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                      paymentMethod === 'card_on_delivery'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {t('cardOnDelivery', language)}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ORDER SUCCESS & RECEIPT */}
          {step === 'success' && lastPlacedOrder && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-neutral-900 dark:text-white">
                  🛎️ {t('orderSuccessMessage', language)}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {language === 'tj'
                    ? `Рақами фармоиш: ${lastPlacedOrder.orderNumber}`
                    : language === 'ru'
                    ? `Номер заказа: ${lastPlacedOrder.orderNumber}`
                    : `Order ID: ${lastPlacedOrder.orderNumber}`}
                </p>

                {/* Order Saved Confirmation Pill */}
                <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-bold">
                    ✅{' '}
                    {language === 'tj'
                      ? 'Фармоиш мустақиман ба тарабхона расид!'
                      : language === 'ru'
                      ? 'Заказ отправлен напрямую в ресторан!'
                      : 'Order saved directly to restaurant!'}
                  </span>
                </div>
              </div>

              {/* Order summary box with clear emojis */}
              <div className="text-left p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200/80 dark:border-neutral-700/80 text-xs space-y-2.5">
                <div className="flex justify-between items-center font-bold text-neutral-900 dark:text-white pb-2 border-b border-neutral-200 dark:border-neutral-700">
                  <span className="flex items-center gap-1.5">
                    <span>👤</span>
                    <span>{lastPlacedOrder.customer.name}</span>
                  </span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <span>📞</span>
                    <span>{lastPlacedOrder.customer.phone || lastPlacedOrder.customer.telegramHandle}</span>
                  </span>
                </div>

                <div className="flex items-start gap-2 text-neutral-600 dark:text-neutral-300">
                  <span className="shrink-0">
                    {lastPlacedOrder.customer.deliveryType === 'delivery'
                      ? '🚚'
                      : lastPlacedOrder.customer.deliveryType === 'pickup'
                      ? '🛍️'
                      : '🍽️'}
                  </span>
                  <div>
                    <span className="font-semibold">
                      {lastPlacedOrder.customer.deliveryType === 'delivery'
                        ? (language === 'tj' ? 'Бурдарасонӣ' : language === 'ru' ? 'Доставка' : 'Delivery')
                        : lastPlacedOrder.customer.deliveryType === 'pickup'
                        ? (language === 'tj' ? 'Бо худ' : language === 'ru' ? 'Самовывоз' : 'Takeaway')
                        : (language === 'tj' ? 'Дар ошхона' : language === 'ru' ? 'В заведении' : 'Dine-in')}
                    </span>
                    <span className="text-neutral-400 mx-1">·</span>
                    <span>
                      {lastPlacedOrder.customer.deliveryType === 'dine_in' ? '🪑 ' : '📍 '}
                      {lastPlacedOrder.customer.addressOrTable}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                  <span>{lastPlacedOrder.customer.paymentMethod === 'cash' ? '💵' : '💳'}</span>
                  <span>
                    {lastPlacedOrder.customer.paymentMethod === 'cash'
                      ? t('cash', language)
                      : t('cardOnDelivery', language)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                  <span>⏰</span>
                  <span>
                    {new Date(lastPlacedOrder.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {lastPlacedOrder.customer.orderNotes && (
                  <div className="flex items-start gap-2 text-neutral-600 dark:text-neutral-300 italic">
                    <span>📝</span>
                    <span>{lastPlacedOrder.customer.orderNotes}</span>
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  {lastPlacedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-neutral-700 dark:text-neutral-300">
                      <span>
                        🍔 {it.name}{' '}
                        <span className="font-bold text-amber-600 dark:text-amber-400">×{it.quantity}</span>
                      </span>
                      <span className="font-semibold tabular-nums">
                        {it.subtotal} {storeSettings.currency}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between font-extrabold text-neutral-900 dark:text-white text-sm">
                  <span>💰 {t('total', language)}:</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    {lastPlacedOrder.total} {storeSettings.currency}
                  </span>
                </div>
              </div>

              {/* Direct WhatsApp / Telegram Redirect Buttons */}
              {(isWhatsAppAvailable && lastWhatsappLink) || (isTelegramAvailable && lastTelegramLink) ? (
                <div className="pt-1 flex flex-wrap gap-2">
                  {isWhatsAppAvailable && lastWhatsappLink && (
                    <a
                      href={lastWhatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[140px] py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  {isTelegramAvailable && lastTelegramLink && (
                    <a
                      href={lastTelegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[140px] py-2.5 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-sky-100 dark:hover:bg-sky-950/60 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Telegram</span>
                    </a>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-3">
          {step === 'cart' && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                  {t('total', language)}:
                </span>
                <span className="text-xl font-extrabold text-neutral-900 dark:text-white tabular-nums">
                  {cartTotal} {storeSettings.currency}
                </span>
              </div>
              <button
                disabled={cart.length === 0}
                onClick={handleProceedToDetails}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 text-white font-bold text-sm shadow-md shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <span>{t('checkoutTitle', language)}</span>
                <Send className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'details' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs pb-1">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium"
                >
                  ← {t('yourCart', language)}
                </button>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {t('total', language)}: {cartTotal} {storeSettings.currency}
                </span>
              </div>

              {/* Direct In-App Order submission OR WhatsApp/Telegram redirection based on store settings */}
              <div className="w-full">
                {isDirectOrderingOnly ? (
                  <button
                    type="button"
                    onClick={() => handlePlaceOrder('direct')}
                    className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm sm:text-base shadow-md shadow-amber-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>
                      {language === 'tj'
                        ? 'Тасдиқи фармоиш'
                        : language === 'ru'
                        ? 'Оформить заказ'
                        : 'Place Order'}
                    </span>
                  </button>
                ) : isWhatsAppAvailable && isTelegramAvailable ? (
                  // Both channels enabled: Two responsive buttons stretching side-by-side to fill 100% width
                  <div className="flex items-center gap-2.5 w-full">
                    <button
                      type="button"
                      onClick={() => handlePlaceOrder('whatsapp')}
                      className="flex-1 min-w-0 py-3.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-md shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5 fill-white shrink-0" />
                      <span className="truncate">WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePlaceOrder('telegram')}
                      className="flex-1 min-w-0 py-3.5 px-3 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-sm shadow-md shadow-sky-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      title="Telegram"
                    >
                      <Send className="w-5 h-5 shrink-0" />
                      <span className="truncate">Telegram</span>
                    </button>
                  </div>
                ) : isWhatsAppAvailable ? (
                  // Only WhatsApp enabled: Single responsive button taking ALL empty space (100% width)
                  <button
                    type="button"
                    onClick={() => handlePlaceOrder('whatsapp')}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm sm:text-base shadow-md shadow-emerald-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5 fill-white shrink-0" />
                    <span>
                      {language === 'tj'
                        ? 'Ирсоли фармоиш тавассути WhatsApp'
                        : language === 'ru'
                        ? 'Отправить заказ через WhatsApp'
                        : 'Dispatch Order via WhatsApp'}
                    </span>
                  </button>
                ) : isTelegramAvailable ? (
                  // Only Telegram enabled: Single responsive button taking ALL empty space (100% width)
                  <button
                    type="button"
                    onClick={() => handlePlaceOrder('telegram')}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-sm sm:text-base shadow-md shadow-sky-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <Send className="w-5 h-5 shrink-0" />
                    <span>
                      {language === 'tj'
                        ? 'Ирсоли фармоиш тавассути Telegram'
                        : language === 'ru'
                        ? 'Отправить заказ через Telegram'
                        : 'Dispatch Order via Telegram'}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePlaceOrder('direct')}
                    className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm sm:text-base shadow-md shadow-amber-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>
                      {language === 'tj'
                        ? 'Тасдиқи фармоиш'
                        : language === 'ru'
                        ? 'Оформить заказ'
                        : 'Place Order'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-2 w-full">
              {onOpenMyOrders && (
                <button
                  type="button"
                  onClick={() => {
                    handleResetFlow();
                    onOpenMyOrders();
                  }}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t('trackOrder', language)}</span>
                </button>
              )}
              <button
                onClick={handleResetFlow}
                className="w-full py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
              >
                {language === 'tj' ? 'Бозгашт ба Меню' : language === 'ru' ? 'Вернуться в Меню' : 'Back to Menu'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
