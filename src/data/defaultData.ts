import { Category, MenuItem, SavedOrder, StoreSettings } from '../types.js';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  name: 'EFENDI',
  tagline: {
    tj: 'Таомҳои болаззаттарин ва зудпаз бо сифати аъло',
    ru: 'Самый вкусный и быстрый фастфуд из отборных продуктов',
    en: 'Craving perfection: artisan burgers, crispy chicken & stone-baked pizza',
  },
  currency: 'TJS',
  whatsappNumber: '+992900123456',
  telegramUsername: 'quickbite_express',
  whatsappEnabled: true,
  telegramEnabled: true,
  directOrderingOnly: true,
  orderChannel: 'both',
  address: {
    tj: 'ш. Душанбе, хиёбони Рӯдакӣ 45 (рӯ ба рӯи Донишгоҳ)',
    ru: 'г. Душанбе, пр-т Рудаки 45 (напротив Университета)',
    en: '45 Rudaki Avenue, Dushanbe (opposite University)',
  },
  phones: ['+992 90 012 3456', '+992 98 765 4321'],
  instagram: 'https://instagram.com/quickbite.tj',
  facebook: 'https://facebook.com/quickbite.tj',
  telegramChannel: 'https://t.me/quickbite_express',
  workingHours: {
    open: '10:00',
    close: '03:00',
    daysNote: {
      tj: 'Ҳамарӯза аз 10:00 то 03:00 бе истироҳат',
      ru: 'Ежедневно с 10:00 до 03:00 без выходных',
      en: 'Every day from 10:00 AM to 03:00 AM',
    },
  },
  workingHoursRows: [
    {
      id: 'row-1',
      days: 'Ҳамарӯза / Ежедневно',
      open: '10:00',
      close: '03:00',
    },
  ],
  manualStatusOverride: 'auto',
  cmsAccessMode: 'hidden',
  cmsButtonVisible: false,
  shortcutSettings: {
    enableTripleClick: true,
    enableLongPress: true,
    enableKeyboardShortcut: true,
    keyboardShortcut: 'ctrl+shift+a',
  },
  enabledDeliveryTypes: {
    delivery: true,
    pickup: true,
    dine_in: true,
  },
  orderNumberFormat: '4-digits',
  nextOrderNumber: 1,
  orderNumberPrefix: '#',
  enabledLanguages: {
    tj: true,
    ru: true,
    en: true,
  },
};

export const DEFAULT_CATEGORIES: Category[] = [];

export const DEFAULT_MENU_ITEMS: MenuItem[] = [];

export const INITIAL_ORDERS: SavedOrder[] = [];

