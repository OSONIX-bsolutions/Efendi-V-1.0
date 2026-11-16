import { Language } from '../types';

export const translations = {
  // Navigation & General
  menu: {
    tj: 'Меню',
    ru: 'Меню',
    en: 'Menu',
  },
  searchPlaceholder: {
    tj: 'Ҷустуҷӯи таом ё нӯшокиҳо...',
    ru: 'Поиск блюд и напитков...',
    en: 'Search food or drinks...',
  },
  allCategories: {
    tj: 'Ҳама',
    ru: 'Все',
    en: 'All',
  },
  favorites: {
    tj: 'Дӯстдоштаҳо',
    ru: 'Избранное',
    en: 'Favorites',
  },
  favoritesEmpty: {
    tj: 'Шумо то ҳол таомеро ба дӯстдоштаҳо илова накардаед',
    ru: 'Вы пока не добавили блюда в избранное',
    en: 'You have not added any items to favorites yet',
  },
  noItemsFound: {
    tj: 'Таоми мувофиқ ёфт нашуд',
    ru: 'Ничего не найдено',
    en: 'No items match your search',
  },

  // Food Card
  add: {
    tj: 'Илова',
    ru: 'Добавить',
    en: 'Add',
  },
  inStock: {
    tj: 'Дар фурӯш',
    ru: 'В наличии',
    en: 'In stock',
  },
  outOfStock: {
    tj: 'Тамом шуд',
    ru: 'Нет в наличии',
    en: 'Out of stock',
  },
  popular: {
    tj: 'Машҳур',
    ru: 'Хит',
    en: 'Popular',
  },
  spicy: {
    tj: 'Тунд',
    ru: 'Острое',
    en: 'Spicy',
  },
  newItemBadge: {
    tj: 'НАВ',
    ru: 'НОВИНКА',
    en: 'NEW',
  },
  halal: {
    tj: 'Ҳалол',
    ru: 'Халяль',
    en: 'Halal',
  },

  // Store Hours & Status
  openNow: {
    tj: 'Кушода аст',
    ru: 'Открыто',
    en: 'Open Now',
  },
  closedNow: {
    tj: 'Ҳоло пӯшида аст',
    ru: 'Сейчас закрыто',
    en: 'Closed Now',
  },
  workingHours: {
    tj: 'Соатҳои корӣ',
    ru: 'Часы работы',
    en: 'Working Hours',
  },
  daily: {
    tj: 'Ҳар рӯз',
    ru: 'Ежедневно',
    en: 'Every day',
  },

  // Cart & Floating Bar
  viewOrder: {
    tj: 'Дидани фармоиш',
    ru: 'Смотреть заказ',
    en: 'View Order',
  },
  yourCart: {
    tj: 'Сабади Шумо',
    ru: 'Ваша корзина',
    en: 'Your Cart',
  },
  cartEmpty: {
    tj: 'Сабади Шумо холӣ аст',
    ru: 'Ваша корзина пуста',
    en: 'Your cart is empty',
  },
  total: {
    tj: 'Ҳамагӣ',
    ru: 'Итого',
    en: 'Total',
  },
  itemsCount: {
    tj: 'таом',
    ru: 'поз.',
    en: 'items',
  },
  clearCart: {
    tj: 'Тоза кардан',
    ru: 'Очистить',
    en: 'Clear',
  },
  specialNotesPlaceholder: {
    tj: 'Эзоҳ (бе пиёз, соуси иловагӣ ва ғайра)...',
    ru: 'Пожелания к заказу (без лука, острый соус и т.д.)...',
    en: 'Notes for kitchen (e.g., no onions, extra sauce)...',
  },

  // Checkout
  checkoutTitle: {
    tj: 'Ба расмият даровардани фармоиш',
    ru: 'Оформление заказа',
    en: 'Order Checkout',
  },
  deliveryType: {
    tj: 'Навъи қабул',
    ru: 'Способ получения',
    en: 'Order Type',
  },
  delivery: {
    tj: 'Бурдарасонӣ',
    ru: 'Доставка',
    en: 'Delivery',
  },
  pickup: {
    tj: 'Бо-худ-бурдан',
    ru: 'Самовывоз',
    en: 'Takeaway',
  },
  dineIn: {
    tj: 'Дар-ошхона',
    ru: 'В-заведении',
    en: 'Dine-in',
  },
  customerName: {
    tj: 'Номи Шумо',
    ru: 'Ваше имя',
    en: 'Your Name',
  },
  customerPhone: {
    tj: 'Рақами телефон',
    ru: 'Номер телефона',
    en: 'Phone Number',
  },
  deliveryAddress: {
    tj: 'Суроғаи дақиқ (кӯча, хона, ошёна)',
    ru: 'Адрес доставки (улица, дом, кв/офис)',
    en: 'Delivery Address (street, building, apt)',
  },
  tableNumber: {
    tj: 'Рақами миз',
    ru: 'Номер стола',
    en: 'Table Number',
  },
  paymentMethod: {
    tj: 'Тарзи пардохт',
    ru: 'Способ оплаты',
    en: 'Payment Method',
  },
  cash: {
    tj: 'Пули нақд',
    ru: 'Наличными при получении',
    en: 'Cash on Delivery',
  },
  cardOnDelivery: {
    tj: 'Корт (ҳангоми қабул)',
    ru: 'Картой курьеру / терминал',
    en: 'Card on Delivery',
  },
  sendWhatsApp: {
    tj: 'Фармоиш бо WhatsApp',
    ru: 'Заказать через WhatsApp',
    en: 'Send via WhatsApp',
  },
  sendTelegram: {
    tj: 'Фармоиш бо Telegram',
    ru: 'Заказать через Telegram',
    en: 'Send via Telegram',
  },
  orderSuccessMessage: {
    tj: 'Фармоиши Шумо таҳия шуд ва равона карда шуд!',
    ru: 'Заказ успешно сформирован и перенаправлен!',
    en: 'Order prepared and dispatched!',
  },

  // My Orders & Live Tracking
  myOrders: {
    tj: 'Фармоишҳои ман',
    ru: 'Мои заказы',
    en: 'My Orders',
  },
  activeOrders: {
    tj: 'Фармоишҳои фаъол',
    ru: 'Активные заказы',
    en: 'Active Orders',
  },
  trackOrder: {
    tj: 'Пайгирии фармоиш',
    ru: 'Отследить заказ',
    en: 'Track Order',
  },
  noOrdersYet: {
    tj: 'Шумо то ҳол фармоиш надоред',
    ru: 'У вас пока нет заказов',
    en: 'You have no orders yet',
  },
  noOrdersDesc: {
    tj: 'Таомҳои дилхоҳатонро ба сабад илова намуда, фармоиш диҳед ва дар ин ҷо ҳолати омодашавии онро мушоҳида намоед.',
    ru: 'Добавьте блюда в корзину и оформите заказ, чтобы отслеживать статус приготовления в реальном времени.',
    en: 'Add dishes to cart and place an order to track live preparation and delivery status here.',
  },
  orderStatusNew: {
    tj: 'Қабул шуд',
    ru: 'Принят',
    en: 'Order Placed',
  },
  orderStatusPreparing: {
    tj: 'Омода шуда истодааст',
    ru: 'Готовится на кухне',
    en: 'Preparing',
  },
  orderStatusOutForDelivery: {
    tj: 'Дар роҳ (Бо курер)',
    ru: 'В пути / Доставляется',
    en: 'Out for Delivery',
  },
  orderStatusDelivered: {
    tj: 'Расонида шуд',
    ru: 'Доставлен',
    en: 'Delivered',
  },
  orderStatusReadyDineIn: {
    tj: 'Тайёр шуд (Ба миз)',
    ru: 'Готово (К столу)',
    en: 'Ready / Served',
  },
  orderStatusReadyTakeaway: {
    tj: 'Тайёр шуд (Барои гирифтан)',
    ru: 'Готово к выдаче',
    en: 'Ready for Pickup',
  },
  orderStatusCompleted: {
    tj: 'Тайёр / Иҷро шуд',
    ru: 'Готов / Выполнен',
    en: 'Ready / Completed',
  },
  orderStatusCancelled: {
    tj: 'Бекор карда шуд',
    ru: 'Отменён',
    en: 'Cancelled',
  },
  orderStatusDescNew: {
    tj: 'Фармоиши шумо аз тарафи ошхона қабул гардид ва ба навбат гузошта шуд.',
    ru: 'Ваш заказ принят заведением и передан на кухню.',
    en: 'Your order was received and added to the kitchen queue.',
  },
  orderStatusDescPreparing: {
    tj: 'Ошпазҳо таомҳои шуморо бо маҳсулоти тару тоза омода намуда истодаанд.',
    ru: 'Повара готовят ваши блюда из свежих продуктов.',
    en: 'Our chefs are currently preparing your meal.',
  },
  orderStatusDescOutForDelivery: {
    tj: 'Курер фармоишро гирифт ва ба суроғаи шумо дар роҳ аст.',
    ru: 'Курьер забрал заказ и уже в пути к вам.',
    en: 'Courier has picked up your order and is on the way.',
  },
  orderStatusDescDelivered: {
    tj: 'Фармоиши шумо комилан расонида шуд! Бо иштиҳои том!',
    ru: 'Заказ успешно доставлен! Приятного аппетита!',
    en: 'Your order was delivered! Enjoy your meal!',
  },
  orderStatusDescReadyDineIn: {
    tj: 'Таомҳои шумо омода шуда ба мизи шумо оварда мешаванд! Бо иштиҳои том!',
    ru: 'Ваш заказ готов и подаётся к вашему столику! Приятного аппетита!',
    en: 'Your dishes are ready and being served at your table! Enjoy your meal!',
  },
  orderStatusDescReadyTakeaway: {
    tj: 'Фармоиши шумо омода ва бастабандӣ шуд! Метавонед аз пештахта гиред.',
    ru: 'Ваш заказ готов! Пожалуйста, подойдите к стойке выдачи.',
    en: 'Your order is ready! Please pick it up at the counter.',
  },
  orderStatusDescCompleted: {
    tj: 'Фармоиш бомуваффақият иҷро карда шуд! Бо иштиҳои том!',
    ru: 'Заказ успешно выполнен! Приятного аппетита!',
    en: 'Order successfully completed! Enjoy your meal!',
  },
  orderStatusDescCancelled: {
    tj: 'Ин фармоиш бекор карда шудааст.',
    ru: 'Этот заказ был отменён.',
    en: 'This order was cancelled.',
  },
  cancellationReasonTitle: {
    tj: 'Сабаби бекоркунӣ',
    ru: 'Причина отмены',
    en: 'Cancellation Reason',
  },
  selectCancellationReason: {
    tj: 'Лутфан сабаби бекоркунии фармоишро интихоб кунед:',
    ru: 'Пожалуйста, укажите причину отмены заказа:',
    en: 'Please select a reason for cancelling this order:',
  },
  reasonOutOfStock: {
    tj: 'Таом ё маҳсулот тамом шудааст',
    ru: 'Блюда или ингредиенты закончились',
    en: 'Items out of stock',
  },
  reasonCustomerUnreachable: {
    tj: 'Мизоҷ ба занг ё паёмҳо ҷавоб надод',
    ru: 'Клиент не выходит на связь',
    en: 'Customer unreachable',
  },
  reasonOutsideZone: {
    tj: 'Суроға берун аз минтақаи расонидан аст',
    ru: 'Адрес вне зоны доставки',
    en: 'Address outside delivery zone',
  },
  reasonCustomerRequested: {
    tj: 'Бо дархости худи мизоҷ бекор карда шуд',
    ru: 'По просьбе клиента',
    en: 'Customer requested cancellation',
  },
  reasonKitchenBusy: {
    tj: 'Сарбории зиёди ошхона',
    ru: 'Высокая нагрузка на кухне',
    en: 'Kitchen overloaded',
  },
  customReasonPlaceholder: {
    tj: 'Сабаби худро нависед...',
    ru: 'Укажите свою причину...',
    en: 'Type specific reason...',
  },
  confirmCancellation: {
    tj: 'Бекор кардан',
    ru: 'Подтвердить отмену',
    en: 'Confirm Cancellation',
  },
  trackAnotherOrder: {
    tj: 'Ҷустуҷӯ бо рақами фармоиш',
    ru: 'Найти заказ по номеру',
    en: 'Find by Order Number',
  },
  orderSearchPlaceholder: {
    tj: 'Масалан: #1042 ё 1042',
    ru: 'Например: #1042 или 1042',
    en: 'e.g. #1042 or 1042',
  },
  trackButton: {
    tj: 'Ёфтан',
    ru: 'Найти',
    en: 'Track',
  },
  orderNotFound: {
    tj: 'Фармоиш бо ин рақам ёфт нашуд',
    ru: 'Заказ с таким номером не найден',
    en: 'Order with this number was not found',
  },
  orderAddedSuccess: {
    tj: 'Фармоиш ёфт шуд ва ба рӯйхати шумо илова гардид!',
    ru: 'Заказ найден и добавлен в ваш список!',
    en: 'Order found and added to your list!',
  },
  mobileMenu: {
    tj: 'Менюи асосӣ',
    ru: 'Главное меню',
    en: 'Main Menu',
  },
  themeTitle: {
    tj: 'Намуди зоҳирӣ',
    ru: 'Тема оформления',
    en: 'Appearance',
  },
  lightTheme: {
    tj: 'Рӯшан',
    ru: 'Светлая',
    en: 'Light',
  },
  darkTheme: {
    tj: 'Торик',
    ru: 'Тёмная',
    en: 'Dark',
  },

  // Footer & Contacts
  contacts: {
    tj: 'Тамос бо мо',
    ru: 'Контакты',
    en: 'Contact Us',
  },
  address: {
    tj: 'Суроға',
    ru: 'Адрес',
    en: 'Address',
  },
  socialMedia: {
    tj: 'Шабакаҳои иҷтимоӣ',
    ru: 'Социальные сети',
    en: 'Social Media',
  },
  callUs: {
    tj: 'Занг задан',
    ru: 'Позвонить',
    en: 'Call us',
  },

  // QR Code Modal
  qrTitle: {
    tj: 'QR Коди Меню',
    ru: 'QR-код меню',
    en: 'Menu QR Code',
  },
  qrSubtitle: {
    tj: 'Барои кушодани меню дар телефон кодро скан кунед',
    ru: 'Отсканируйте камерой телефона, чтобы открыть меню',
    en: 'Scan with phone camera to open and view the digital menu',
  },
  copyLink: {
    tj: 'Нусхабардории пайванд',
    ru: 'Копировать ссылку',
    en: 'Copy Link',
  },
  linkCopied: {
    tj: 'Пайванд нусхабардорӣ шуд!',
    ru: 'Ссылка скопирована!',
    en: 'Link copied!',
  },
  downloadQR: {
    tj: 'Боргирии QR код',
    ru: 'Скачать QR-код',
    en: 'Download QR Code',
  },

  // Admin & CMS
  adminTitle: {
    tj: 'Панели идоракунӣ (CMS)',
    ru: 'Панель управления (CMS)',
    en: 'Admin CMS & Analytics',
  },
  enterPin: {
    tj: 'Рамзи воридшавӣ (PIN)-ро ворид кунед',
    ru: 'Введите PIN-код для входа',
    en: 'Enter Admin PIN to login',
  },
  defaultPinHint: {
    tj: 'Рамзи пешфарз: 1234',
    ru: 'PIN по умолчанию: 1234',
    en: 'Default PIN: 1234',
  },
  login: {
    tj: 'Воридшавӣ',
    ru: 'Войти',
    en: 'Login',
  },
  logout: {
    tj: 'Баромад',
    ru: 'Выйти',
    en: 'Logout',
  },
  analytics: {
    tj: 'Омор ва Фармоишҳо',
    ru: 'Аналитика и Заказы',
    en: 'Analytics & Orders',
  },
  manageMenu: {
    tj: 'Идораи меню',
    ru: 'Управление меню',
    en: 'Manage Menu',
  },
  categories: {
    tj: 'Категорияҳо',
    ru: 'Категории',
    en: 'Categories',
  },
  manageCategories: {
    tj: 'Категорияҳо',
    ru: 'Категории',
    en: 'Categories',
  },
  addCategory: {
    tj: 'Категорияи нав',
    ru: 'Новая категория',
    en: 'Add Category',
  },
  storeSettings: {
    tj: 'Танзимоти тарабхона',
    ru: 'Настройки заведения',
    en: 'Store Settings',
  },
  backupRestore: {
    tj: 'Нусхабардорӣ ва барқароркунӣ',
    ru: 'Бэкап и сброс',
    en: 'Backup & Reset',
  },
  saveChanges: {
    tj: 'Сабт кардан',
    ru: 'Сохранить изменения',
    en: 'Save Changes',
  },
  addNewItem: {
    tj: '+ Таоми нав',
    ru: '+ Новое блюдо',
    en: '+ Add Menu Item',
  },
  edit: {
    tj: 'Таҳрир',
    ru: 'Редактировать',
    en: 'Edit',
  },
  delete: {
    tj: 'Нобуд кардан',
    ru: 'Удалить',
    en: 'Delete',
  },
  cancel: {
    tj: 'Бекор кардан',
    ru: 'Отмена',
    en: 'Cancel',
  },

  // Hide / Visibility options
  hideFromMenu: {
    tj: 'Аз меню пинҳон кардан',
    ru: 'Скрыть из меню',
    en: 'Hide from menu',
  },
  showInMenu: {
    tj: 'Дар меню нишон додан',
    ru: 'Показать в меню',
    en: 'Show in menu',
  },
  itemHidden: {
    tj: 'Пинҳон',
    ru: 'Скрыто',
    en: 'Hidden',
  },
  itemVisible: {
    tj: 'Намоён',
    ru: 'Отображается',
    en: 'Visible',
  },
  uploadImage: {
    tj: 'Боргузории расм аз дастгоҳ',
    ru: 'Загрузить фото с устройства',
    en: 'Upload photo from device',
  },
  selectOrDropImage: {
    tj: 'Расмро интихоб намоед ё кашола кунед',
    ru: 'Выберите фото или перетащите файл',
    en: 'Select or drag photo file',
  },
  imageUploaded: {
    tj: 'Расм боргузорӣ шуд',
    ru: 'Фото загружено',
    en: 'Photo uploaded',
  },
  customerTelegram: {
    tj: 'Telegram (ихтиёрӣ)',
    ru: 'Telegram (необязательно)',
    en: 'Telegram handle (optional)',
  },
  atLeastOneContactRequired: {
    tj: 'Лутфан рақами телефон ё Telegram-ро ворид намоед',
    ru: 'Пожалуйста, укажите номер телефона или Telegram',
    en: 'Please enter a phone number or Telegram handle',
  },
  storeAccountRequired: {
    tj: 'Ҳадди ақал як аккаунт (WhatsApp ё Telegram) бояд фаъол бошад',
    ru: 'Как минимум один канал (WhatsApp или Telegram) должен быть включен',
    en: 'At least one account (WhatsApp or Telegram) must be active',
  },
  selectDispatchChannel: {
    tj: 'Интихоби тарзи ирсоли фармоиш',
    ru: 'Куда отправить заказ',
    en: 'Dispatch order to',
  },

  // View modes
  twoColumns: {
    tj: '2 Сутун',
    ru: '2 Колонки',
    en: '2 Columns',
  },
  listMode: {
    tj: 'Рӯйхат',
    ru: 'Список',
    en: 'List',
  },
  theme: {
    tj: 'Мавзӯъ',
    ru: 'Тема',
    en: 'Theme',
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language): string {
  const item = translations[key];
  if (!item) return key;
  return item[lang] || item.en;
}
