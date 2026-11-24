export type Language = 'tj' | 'ru' | 'en';

export interface LocalizedString {
  tj: string;
  ru: string;
  en: string;
}

export interface MenuItem {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number;
  originalPrice?: number;
  categoryId: string;
  imageUrl: string;
  isAvailable: boolean;
  isHidden?: boolean; // When true, completely hidden from customer menu
  isPopular?: boolean;
  isSpicy?: boolean;
  isNew?: boolean; // NEW / НАВ badge
  isHalal?: boolean;
  calories?: number;
  prepTimeMinutes?: number;
  sortOrder?: number;
}

export interface Category {
  id: string;
  name: LocalizedString;
  icon: string;
  sortOrder: number;
}

export type DeliveryType = 'delivery' | 'pickup' | 'dine_in';
export type PaymentMethod = 'cash' | 'card_on_delivery';

export type AdminRole = 'staff' | 'admin' | 'developer';

export interface SecretAccessShortcuts {
  enableTripleClick: boolean;
  enableLongPress: boolean;
  enableKeyboardShortcut: boolean;
  keyboardShortcut: 'ctrl+shift+a' | 'alt+shift+c' | 'ctrl+alt+m' | 'shift+esc';
}

export interface WorkingHoursRow {
  id: string;
  days?: string; // e.g. "Душанбе - Ҷумъа (Пн-Пт)", "Шанбе - Якшанбе", or custom
  open: string;  // e.g. "08:00"
  close: string; // e.g. "03:00"
}

export interface StoreSettings {
  name: string;
  tagline: LocalizedString;
  currency: string; // e.g. "TJS", "₽", "$"
  whatsappNumber: string; // e.g. "+992900000000"
  telegramUsername: string; // e.g. "quickbite_tj" or bot/link
  whatsappEnabled?: boolean;
  telegramEnabled?: boolean;
  directOrderingOnly?: boolean;
  orderChannel: 'whatsapp' | 'telegram' | 'both';
  address: LocalizedString;
  phones: string[];
  instagram: string;
  facebook: string;
  telegramChannel: string;
  timezone?: string; // e.g. "Asia/Dushanbe"
  workingHours: {
    open: string; // e.g. "08:00"
    close: string; // e.g. "03:00"
    daysNote: LocalizedString;
  };
  workingHoursRows?: WorkingHoursRow[];
  manualStatusOverride: 'auto' | 'force_open' | 'force_closed';
  cmsAccessMode?: 'hidden' | 'visible'; // 'hidden' hides admin buttons from public customers
  cmsButtonVisible?: boolean; // Direct boolean toggle for CMS button visibility
  shortcutSettings?: SecretAccessShortcuts;
  enabledDeliveryTypes?: {
    delivery: boolean;
    pickup: boolean;
    dine_in: boolean;
  };
  orderNumberFormat?: '4-digits' | '6-digits';
  nextOrderNumber?: number;
  orderNumberPrefix?: string;
  enabledLanguages?: {
    tj: boolean;
    ru: boolean;
    en: boolean;
  };
}

export interface CustomerOrderRef {
  id: string;
  token: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface OrderCustomerInfo {
  name: string;
  phone: string;
  telegramHandle?: string;
  deliveryType: DeliveryType;
  addressOrTable: string;
  orderNotes?: string;
  paymentMethod: PaymentMethod;
}

export type OrderStatus =
  | 'new'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface SavedOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  customer: OrderCustomerInfo;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  total: number;
  channel: 'direct' | 'whatsapp' | 'telegram';
  status: OrderStatus;
  cancellationReason?: string;
}
