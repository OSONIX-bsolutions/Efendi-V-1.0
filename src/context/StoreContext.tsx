import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_STORE_SETTINGS } from '../data/defaultData';
import {
  AdminRole,
  CartItem,
  Category,
  CustomerOrderRef,
  Language,
  MenuItem,
  OrderCustomerInfo,
  OrderStatus,
  SavedOrder,
  StoreSettings,
} from '../types';
import { stripSensitiveSettingsFields, supabaseService } from '../supabase';
import { formatOrderReceiptText } from '../utils/orderFormatter';

interface StoreContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  menuItems: MenuItem[];
  categories: Category[];
  storeSettings: StoreSettings;
  orders: SavedOrder[];
  myOrders: SavedOrder[];
  activeOrdersCount: number;
  favorites: string[];
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;
  isStoreOpen: boolean;
  isAdminAuthenticated: boolean;
  currentAdminRole: AdminRole | null;
  isLoadingCatalog: boolean;
  isLoadingOrders: boolean;
  setCurrentAdminRole: (role: AdminRole | null) => void;
  setIsAdminAuthenticated: (auth: boolean, role?: AdminRole) => void;
  bulkImportMenuItems: (items: MenuItem[], mode: 'merge' | 'replace') => void;
  uploadItemImage: (file: File) => Promise<string>;

  // Actions
  addToCart: (item: MenuItem, qty?: number, notes?: string) => void;
  updateCartQuantity: (itemId: string, qty: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  toggleFavorite: (itemId: string) => void;
  isFavorite: (itemId: string) => boolean;

  // CMS Actions
  saveMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (itemId: string) => void;
  toggleItemAvailability: (itemId: string) => void;
  toggleItemHidden: (itemId: string) => void;
  saveCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  reorderCategories: (newCategories: Category[]) => void;
  reorderMenuItems: (newMenuItems: MenuItem[]) => void;
  updateStoreSettings: (settings: StoreSettings) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, cancellationReason?: string) => void;
  deleteOrder: (orderId: string) => void;
  createOrder: (
    customer: OrderCustomerInfo,
    channel: 'direct' | 'whatsapp' | 'telegram'
  ) => {
    order: SavedOrder;
    link: string;
    whatsappLink: string;
    telegramLink: string;
    formattedMessage: string;
    orderPromise: Promise<SavedOrder | null>;
  };
}

const StoreContext = createContext<StoreContextValue | null>(null);

// Only non-sensitive customer UI preferences, cart/favorites, and HMAC-signed order tracking refs live in browser storage.
const STORAGE_KEYS = {
  LANG: 'quickbite_lang',
  THEME: 'quickbite_theme',
  VIEW_MODE: 'quickbite_view_mode',
  CUSTOMER_ORDERS: 'quickbite_customer_orders_v1',
  FAVORITES: 'quickbite_favorites',
  CART: 'quickbite_cart',
};

const LEGACY_STORAGE_KEYS_TO_PURGE = [
  'quickbite_menu_items_v2',
  'quickbite_categories_v2',
  'quickbite_settings_v2',
  'quickbite_orders_v2',
];

async function authFetch(url: string, options: RequestInit = {}): Promise<globalThis.Response> {
  const token = await supabaseService.getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please sign in again.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, { ...options, headers });
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge legacy localStorage caches & sessionStorage auth flags on startup
  useEffect(() => {
    try {
      for (const k of LEGACY_STORAGE_KEYS_TO_PURGE) {
        localStorage.removeItem(k);
      }
      sessionStorage.removeItem('quickbite_admin_auth');
      sessionStorage.removeItem('quickbite_admin_role');
    } catch {}
  }, []);

  // 1. Language
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return saved === 'tj' || saved === 'ru' || saved === 'en' ? saved : 'tj';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  };

  // 2. Theme (Dark/Light)
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // 3. View Mode ('grid' for 2 columns, 'list' for 1 column)
  const [viewMode, setViewModeState] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
    return saved === 'list' ? 'list' : 'grid';
  });

  const setViewMode = (mode: 'grid' | 'list') => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
  };

  // 4. Server/Supabase-backed Menu, Categories, Settings & Authenticated Orders (React memory only)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [orders, setOrders] = useState<SavedOrder[]>([]);

  // 5. Server-verified Admin Authentication State & Loading Indicators
  const [isAdminAuthenticated, setIsAdminAuthenticatedState] = useState<boolean>(false);
  const [currentAdminRole, setCurrentAdminRoleState] = useState<AdminRole | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const hasBootstrappedCatalogRef = useRef<boolean>(false);

  const setCurrentAdminRole = (role: AdminRole | null) => {
    setCurrentAdminRoleState(role);
  };

  const setIsAdminAuthenticated = (auth: boolean, role?: AdminRole) => {
    if (auth && role) {
      setIsLoadingCatalog(true);
      setIsLoadingOrders(true);
      setIsAdminAuthenticatedState(true);
      setCurrentAdminRoleState(role);
    } else {
      setIsAdminAuthenticatedState(false);
      setCurrentAdminRoleState(null);
      setIsLoadingOrders(false);
      setOrders([]);
      supabaseService.signOut().catch(() => {});
    }
  };

  // Guard against background polling overwriting fresh local edits before DB commit completes
  const lastLocalMutationRef = useRef<number>(0);
  const localMinOrderCounterRef = useRef<number | null>(null);

  // Verify existing Supabase Auth session on mount & auth state transitions
  useEffect(() => {
    let active = true;

    const verifyCurrentSession = async () => {
      const current = await supabaseService.getCurrentUser();
      if (!active) return;
      if (current) {
        setIsAdminAuthenticatedState(true);
        setCurrentAdminRoleState(current.role);
      } else {
        setIsAdminAuthenticatedState(false);
        setCurrentAdminRoleState(null);
        setOrders([]);
      }
    };

    verifyCurrentSession();

    const unsubAuth = supabaseService.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'SIGNED_OUT' || !session?.access_token) {
        setIsAdminAuthenticatedState(false);
        setCurrentAdminRoleState(null);
        setOrders([]);
        return;
      }
      supabaseService
        .verifyTokenWithServer(session.access_token)
        .then((verified) => {
          if (!active) return;
          if (verified) {
            setIsAdminAuthenticatedState(true);
            setCurrentAdminRoleState(verified.role);
          } else {
            setIsAdminAuthenticatedState(false);
            setCurrentAdminRoleState(null);
            setOrders([]);
          }
        })
        .catch(() => {});
    });

    return () => {
      active = false;
      unsubAuth();
    };
  }, []);

  // Load & subscribe to public catalog (Menu, Categories, Settings) from Supabase & Express API
  useEffect(() => {
    let active = true;

    if (!hasBootstrappedCatalogRef.current || isAdminAuthenticated) {
      setIsLoadingCatalog(true);
    }

    const loadInitialFromApi = async () => {
      try {
        const token = await supabaseService.getAccessToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const [menuRes, catRes, setRes] = await Promise.all([
          fetch('/api/menu', { headers }),
          fetch('/api/categories'),
          fetch('/api/settings'),
        ]);
        if (!active) return;

        if (menuRes.ok) {
          const items = await menuRes.json();
          if (Array.isArray(items) && items.length > 0) {
            setMenuItems(items);
          }
        }
        if (catRes.ok) {
          const cats = await catRes.json();
          if (Array.isArray(cats) && cats.length > 0) {
            setCategories(cats);
          }
        }
        if (setRes.ok) {
          const settings = await setRes.json();
          if (settings && typeof settings === 'object') {
            setStoreSettings((prev) =>
              stripSensitiveSettingsFields({ ...prev, ...settings })
            );
          }
        }
      } catch (err) {
        console.warn('Initial catalog load error:', err);
      } finally {
        hasBootstrappedCatalogRef.current = true;
        if (active) {
          setIsLoadingCatalog(false);
        }
      }
    };

    loadInitialFromApi();

    const unsubMenu = supabaseService.subscribeMenuItems((items) => {
      if (!active || Date.now() - lastLocalMutationRef.current < 4000) return;
      if (items && items.length > 0) {
        setMenuItems(items);
      }
    });

    const unsubCats = supabaseService.subscribeCategories((cats) => {
      if (!active || Date.now() - lastLocalMutationRef.current < 4000) return;
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    });

    const unsubSettings = supabaseService.subscribeSettings((settings) => {
      if (!active || Date.now() - lastLocalMutationRef.current < 4000) return;
      if (settings && Object.keys(settings).length > 0) {
        const clean = stripSensitiveSettingsFields(settings);
        if (
          localMinOrderCounterRef.current !== null &&
          typeof clean.nextOrderNumber === 'number' &&
          clean.nextOrderNumber < localMinOrderCounterRef.current
        ) {
          clean.nextOrderNumber = localMinOrderCounterRef.current;
        }
        setStoreSettings((prev) => stripSensitiveSettingsFields({ ...prev, ...clean }));
      }
    });

    return () => {
      active = false;
      unsubMenu();
      unsubCats();
      unsubSettings();
    };
  }, [isAdminAuthenticated]);

  // Subscribe to customer orders ONLY when authenticated as staff/admin/developer
  useEffect(() => {
    if (!isAdminAuthenticated) {
      setOrders([]);
      setIsLoadingOrders(false);
      return;
    }

    let active = true;
    setIsLoadingOrders(true);

    const loadOrders = async () => {
      try {
        const res = await authFetch('/api/orders');
        if (res.ok && active) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setOrders(data);
          }
        }
      } catch {
      } finally {
        if (active) {
          setIsLoadingOrders(false);
        }
      }
    };

    loadOrders();

    const unsubOrders = supabaseService.subscribeOrders((liveOrders) => {
      if (!active || Date.now() - lastLocalMutationRef.current < 4000) return;
      if (Array.isArray(liveOrders)) {
        setOrders(liveOrders);
      }
    });

    return () => {
      active = false;
      unsubOrders();
    };
  }, [isAdminAuthenticated]);

  // 6. Customer Orders Tracking via HMAC-verified refs (no other customers' PII exposed)
  const [customerOrderRefs, setCustomerOrderRefs] = useState<CustomerOrderRef[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMER_ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (ref): ref is CustomerOrderRef =>
              Boolean(ref && typeof ref.id === 'string' && typeof ref.token === 'string')
          );
        }
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_ORDERS, JSON.stringify(customerOrderRefs));
    } catch {}
  }, [customerOrderRefs]);

  const [myOrders, setMyOrders] = useState<SavedOrder[]>([]);

  useEffect(() => {
    if (customerOrderRefs.length === 0) {
      setMyOrders([]);
      return;
    }

    let active = true;
    const fetchTrackedOrders = async () => {
      try {
        const res = await fetch('/api/orders/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refs: customerOrderRefs }),
        });
        if (!res.ok || !active) return;
        const json = await res.json();
        if (Array.isArray(json?.orders)) {
          setMyOrders(json.orders);
        }
      } catch {}
    };

    fetchTrackedOrders();
    const interval = setInterval(fetchTrackedOrders, 8000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [customerOrderRefs]);

  // Cross-tab sync only for non-sensitive customer tracking refs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.CUSTOMER_ORDERS && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setCustomerOrderRefs(
              parsed.filter(
                (ref): ref is CustomerOrderRef =>
                  Boolean(ref && typeof ref.id === 'string' && typeof ref.token === 'string')
              )
            );
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const activeOrdersCount = useMemo(() => {
    return myOrders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'completed' && o.status !== 'cancelled'
    ).length;
  }, [myOrders]);

  // 7. Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const isFavorite = (itemId: string) => favorites.includes(itemId);

  // 8. Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: MenuItem, qty = 1, notes?: string) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === item.id
            ? { ...ci, quantity: ci.quantity + qty, notes: notes !== undefined ? notes : ci.notes }
            : ci
        );
      }
      return [...prev, { menuItem: item, quantity: qty, notes }];
    });
  };

  const updateCartQuantity = (itemId: string, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) {
        return prev.filter((ci) => ci.menuItem.id !== itemId);
      }
      return prev.map((ci) => (ci.menuItem.id === itemId ? { ...ci, quantity: qty } : ci));
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.menuItem.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // 9. Live store hours
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const isStoreOpen = useMemo(() => {
    if (storeSettings.manualStatusOverride === 'force_open') return true;
    if (storeSettings.manualStatusOverride === 'force_closed') return false;

    try {
      const rows =
        storeSettings.workingHoursRows && storeSettings.workingHoursRows.length > 0
          ? storeSettings.workingHoursRows
          : [
              {
                id: 'default',
                days: '',
                open: storeSettings.workingHours?.open || '10:00',
                close: storeSettings.workingHours?.close || '23:30',
              },
            ];

      const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

      return rows.some((row) => {
        if (!row.open || !row.close) return false;
        const [openHour, openMin] = row.open.split(':').map(Number);
        const [closeHour, closeMin] = row.close.split(':').map(Number);

        const openMinutes = (openHour || 0) * 60 + (openMin || 0);
        const closeMinutes = (closeHour || 0) * 60 + (closeMin || 0);

        if (closeMinutes >= openMinutes) {
          return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
        }
        return nowMinutes >= openMinutes || nowMinutes <= closeMinutes;
      });
    } catch {
      return true;
    }
  }, [storeSettings, currentTime]);

  // 10. Upload Image -> Supabase Storage (direct authenticated upload OR authenticated backend proxy)
  const uploadItemImage = async (file: File): Promise<string> => {
    try {
      const supabaseUrl = await supabaseService.uploadImage(file, 'dishes');
      if (supabaseUrl) return supabaseUrl;
    } catch (err: any) {
      console.warn('Direct Supabase Storage upload fallback to authenticated server upload:', err?.message);
    }

    const formData = new FormData();
    formData.append('image', file);
    const res = await authFetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data?.url) {
      throw new Error(data?.error || 'Failed to upload image to Supabase Storage');
    }
    return data.url;
  };

  // 11. Authenticated CMS Mutations
  const bulkImportMenuItems = (items: MenuItem[], mode: 'merge' | 'replace') => {
    lastLocalMutationRef.current = Date.now();
    if (mode === 'replace') {
      setMenuItems(items);
    } else {
      setMenuItems((prev) => {
        const itemMap = new Map(prev.map((it) => [it.id, it]));
        items.forEach((it) => itemMap.set(it.id, it));
        return Array.from(itemMap.values());
      });
    }

    authFetch('/api/menu/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ items, mode }),
    }).catch((e) => console.warn('Bulk import sync error:', e));
  };

  const saveMenuItem = (item: MenuItem) => {
    lastLocalMutationRef.current = Date.now();
    setMenuItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        return prev.map((i) => (i.id === item.id ? item : i));
      }
      return [item, ...prev];
    });

    authFetch('/api/menu', {
      method: 'POST',
      body: JSON.stringify(item),
    }).catch((e) => console.warn('Menu save sync error:', e));
  };

  const deleteMenuItem = (itemId: string) => {
    lastLocalMutationRef.current = Date.now();
    setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
    removeFromCart(itemId);

    authFetch(`/api/menu/${itemId}`, { method: 'DELETE' }).catch((e) =>
      console.warn('Menu delete sync error:', e)
    );
  };

  const toggleItemAvailability = (itemId: string) => {
    lastLocalMutationRef.current = Date.now();
    setMenuItems((prev) => {
      const item = prev.find((i) => i.id === itemId);
      const nextAvailable = item ? !item.isAvailable : true;
      authFetch(`/api/menu/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ isAvailable: nextAvailable }),
      }).catch((e) => console.warn('Item availability sync error:', e));

      return prev.map((i) => (i.id === itemId ? { ...i, isAvailable: !i.isAvailable } : i));
    });
  };

  const toggleItemHidden = (itemId: string) => {
    lastLocalMutationRef.current = Date.now();
    setMenuItems((prev) => {
      const item = prev.find((i) => i.id === itemId);
      const nextHidden = item ? !item.isHidden : true;
      authFetch(`/api/menu/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ isHidden: nextHidden }),
      }).catch((e) => console.warn('Item hidden sync error:', e));

      return prev.map((i) => (i.id === itemId ? { ...i, isHidden: !i.isHidden } : i));
    });
  };

  const saveCategory = (category: Category) => {
    lastLocalMutationRef.current = Date.now();
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === category.id);
      if (exists) {
        return prev.map((c) => (c.id === category.id ? category : c));
      }
      return [...prev, category];
    });

    authFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    }).catch((e) => console.warn('Category save sync error:', e));
  };

  const deleteCategory = (categoryId: string) => {
    lastLocalMutationRef.current = Date.now();
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));

    authFetch(`/api/categories/${categoryId}`, { method: 'DELETE' }).catch((e) =>
      console.warn('Category delete sync error:', e)
    );
  };

  const reorderCategories = (newCategories: Category[]) => {
    lastLocalMutationRef.current = Date.now();
    const updated = newCategories.map((c, index) => ({
      ...c,
      sortOrder: index + 1,
    }));
    setCategories(updated);

    authFetch('/api/categories/reorder', {
      method: 'PUT',
      body: JSON.stringify({ categories: updated }),
    }).catch((e) => console.warn('Categories reorder sync error:', e));
  };

  const reorderMenuItems = (newMenuItems: MenuItem[]) => {
    lastLocalMutationRef.current = Date.now();
    const updated = newMenuItems.map((item, index) => ({
      ...item,
      sortOrder: index + 1,
    }));
    setMenuItems(updated);

    authFetch('/api/menu/reorder', {
      method: 'PUT',
      body: JSON.stringify({ menuItems: updated }),
    }).catch((e) => console.warn('Menu reorder sync error:', e));
  };

  const updateStoreSettings = (settings: StoreSettings) => {
    lastLocalMutationRef.current = Date.now();
    const wa = settings.whatsappEnabled !== false;
    const tg = settings.telegramEnabled !== false;
    const channel: 'whatsapp' | 'telegram' | 'both' =
      wa && tg ? 'both' : wa ? 'whatsapp' : tg ? 'telegram' : 'whatsapp';

    const normalized = stripSensitiveSettingsFields<StoreSettings>({
      ...settings,
      whatsappEnabled: wa,
      telegramEnabled: tg,
      directOrderingOnly: settings.directOrderingOnly !== false,
      orderChannel: channel,
    });
    localMinOrderCounterRef.current =
      typeof normalized.nextOrderNumber === 'number' ? normalized.nextOrderNumber : null;
    setStoreSettings(normalized);

    authFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(normalized),
    }).catch((e) => console.warn('Settings sync error:', e));
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, cancellationReason?: string) => {
    lastLocalMutationRef.current = Date.now();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              cancellationReason:
                status === 'cancelled'
                  ? cancellationReason || o.cancellationReason || ''
                  : undefined,
            }
          : o
      )
    );

    authFetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, cancellationReason }),
    }).catch((e) => console.warn('Order status sync error:', e));
  };

  const deleteOrder = (orderId: string) => {
    lastLocalMutationRef.current = Date.now();
    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    authFetch(`/api/orders/${orderId}`, { method: 'DELETE' }).catch((e) =>
      console.warn('Order delete sync error:', e)
    );
  };

  // 12. Create & Server-Validated Dispatch Order
  const createOrder = (customer: OrderCustomerInfo, channel: 'direct' | 'whatsapp' | 'telegram') => {
    const currentCounter =
      typeof storeSettings.nextOrderNumber === 'number' && storeSettings.nextOrderNumber > 0
        ? storeSettings.nextOrderNumber
        : 1;

    const isSixDigits = storeSettings.orderNumberFormat === '6-digits';
    const padded = isSixDigits
      ? String(currentCounter).padStart(6, '0')
      : String(currentCounter).padStart(4, '0');
    const prefix = storeSettings.orderNumberPrefix || '#';
    const orderNumber = `${prefix}${padded}`;

    const itemNotesMap: Record<string, string> = {};
    cart.forEach((c) => {
      if (c.notes?.trim()) {
        itemNotesMap[c.menuItem.id] = c.notes.trim();
      }
    });

    const optimisticOrderId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newOrder: SavedOrder = {
      id: optimisticOrderId,
      orderNumber,
      createdAt: new Date().toISOString(),
      customer,
      items: cart.map((c) => ({
        id: c.menuItem.id,
        name: c.menuItem.name[language] || c.menuItem.name.en,
        price: c.menuItem.price,
        quantity: c.quantity,
        subtotal: c.menuItem.price * c.quantity,
      })),
      total: cartTotal,
      channel,
      status: 'new',
    };

    const requestItems = cart.map((c) => ({
      id: c.menuItem.id,
      quantity: c.quantity,
      notes: c.notes?.trim() || undefined,
    }));

    setMyOrders((prev) => [newOrder, ...prev]);

    const messageText = formatOrderReceiptText(newOrder, storeSettings.currency, itemNotesMap);

    const cleanPhone = (storeSettings.whatsappNumber || '').replace(/[^0-9]/g, '');
    const cleanUser = (storeSettings.telegramUsername || '').replace('@', '');
    const whatsappLink = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`
      : '';
    const telegramLink = cleanUser
      ? `https://t.me/${cleanUser}?text=${encodeURIComponent(messageText)}`
      : '';

    const link =
      channel === 'whatsapp' ? whatsappLink : channel === 'telegram' ? telegramLink : '';

    clearCart();

    const dispatchOrder = async (): Promise<SavedOrder | null> => {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientOrderId: optimisticOrderId,
            customer,
            items: requestItems,
            channel,
            language,
          }),
        });
        if (!res.ok) return null;
        const json = await res.json();
        if (!json?.order) return null;
        const serverOrder = json.order as SavedOrder;
        if (json.trackingToken) {
          setCustomerOrderRefs((prev) => [
            { id: serverOrder.id, token: json.trackingToken },
            ...prev.filter((r) => r.id !== serverOrder.id),
          ]);
        }
        if (typeof json.nextOrderNumber === 'number') {
          lastLocalMutationRef.current = Date.now();
          localMinOrderCounterRef.current = json.nextOrderNumber;
          setStoreSettings((prev) => ({ ...prev, nextOrderNumber: json.nextOrderNumber }));
        }
        setMyOrders((prev) => [
          serverOrder,
          ...prev.filter((o) => o.id !== optimisticOrderId && o.id !== serverOrder.id),
        ]);
        return serverOrder;
      } catch (err) {
        console.warn('Order submission error:', err);
        return null;
      }
    };

    const orderPromise = dispatchOrder();

    return {
      order: newOrder,
      link,
      whatsappLink,
      telegramLink,
      formattedMessage: messageText,
      orderPromise,
    };
  };

  return (
    <StoreContext.Provider
      value={{
        language,
        setLanguage,
        theme,
        toggleTheme,
        viewMode,
        setViewMode,
        menuItems,
        categories,
        storeSettings,
        orders,
        myOrders,
        activeOrdersCount,
        favorites,
        cart,
        cartTotal,
        cartCount,
        isStoreOpen,
        isAdminAuthenticated,
        currentAdminRole,
        isLoadingCatalog,
        isLoadingOrders,
        setCurrentAdminRole,
        setIsAdminAuthenticated,
        bulkImportMenuItems,
        uploadItemImage,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        toggleFavorite,
        isFavorite,
        saveMenuItem,
        deleteMenuItem,
        toggleItemAvailability,
        toggleItemHidden,
        saveCategory,
        deleteCategory,
        reorderCategories,
        reorderMenuItems,
        updateStoreSettings,
        updateOrderStatus,
        deleteOrder,
        createOrder,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
