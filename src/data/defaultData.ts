import { Category, MenuItem, SavedOrder, StoreSettings } from '../types.js';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  name: 'EFENDI',
  tagline: {
    tj: 'Таомҳои болаззаттарин ва зудпаз бо сифати аъло',
    ru: 'Самый вкусный и быстрый фастфуд из отборных продуктов',
    en: 'Craving perfection: artisan burgers, crispy chicken & stone-baked pizza',
  },
  currency: 'TJS',
  whatsappNumber: '+992333300300',
  telegramUsername: 'efendi_doner',
  whatsappEnabled: true,
  telegramEnabled: true,
  directOrderingOnly: true,
  orderChannel: 'both',
  address: {
    tj: 'Душанбе, кӯчаи Айнӣ 46/2 (рӯ ба рӯи супермаркети "Relax")',
    ru: 'г. Душанбе, ул. Айни 46/2 (напротив супермаркет "Relax")',
    en: '46/2 Ayni, Dushanbe (opposite Relax supermarket)',
  },
  phones: ['+992 024 96 68 68'],
  instagram: 'https://instagram.com/efendi_doner.tj',
  facebook: '',
  telegramChannel: '',
  timezone: 'Asia/Dushanbe',
  workingHours: {
    open: '08:00',
    close: '03:00',
    daysNote: {
      tj: 'Ҳамарӯза аз 08:00 то 03:00 бе истироҳат',
      ru: 'Ежедневно с 08:00 до 03:00 без выходных',
      en: 'Every day from 08:00 to 03:00',
    },
  },
  workingHoursRows: [
    {
      id: 'row-1',
      days: 'Ҳамарӯза / Ежедневно',
      open: '08:00',
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

