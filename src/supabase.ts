import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { AdminRole, Category, MenuItem, OrderStatus, SavedOrder, StoreSettings } from './types';
import { normalizeTelegramUsername, normalizeWhatsAppNumber } from './utils/dispatch';
import { normalizeWorkingHoursSettings } from './utils/workingHours';

declare global {
  interface Window {
    __PUBLIC_CONFIG__?: {
      supabaseUrl?: string;
      supabaseAnonKey?: string;
    };
  }
}

const runtimeCfg = typeof window !== 'undefined' ? window.__PUBLIC_CONFIG__ : undefined;

export const SUPABASE_URL: string =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ||
  runtimeCfg?.supabaseUrl?.trim() ||
  '';

export const SUPABASE_ANON_KEY: string =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  runtimeCfg?.supabaseAnonKey?.trim() ||
  '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function getSupabaseProjectRef(): string {
  try {
    if (!SUPABASE_URL) return '';
    return new URL(SUPABASE_URL).hostname.split('.')[0] || '';
  } catch {
    return '';
  }
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: { persistSession: false, autoRefreshToken: false },
    });

// Strip any legacy PIN fields if present in persisted settings rows
export function stripSensitiveSettingsFields<T extends Record<string, any>>(settings: T): T {
  if (!settings || typeof settings !== 'object') return settings;
  const { adminPin: _a, staffPin: _s, developerPin: _d, ...clean } = settings;
  return clean as T;
}

// Row converters
export function rowToCategory(row: any): Category {
  return {
    id: row.id,
    name: typeof row.name === 'string' ? JSON.parse(row.name) : row.name,
    icon: row.icon || '🍽️',
    sortOrder: row.sort_order ?? 9999,
  };
}

export function categoryToRow(cat: Category): any {
  return {
    id: cat.id,
    name: cat.name,
    icon: cat.icon || '🍽️',
    sort_order: cat.sortOrder ?? 9999,
  };
}

export function rowToMenuItem(row: any): MenuItem {
  return {
    id: row.id,
    categoryId: row.category_id || '',
    name: typeof row.name === 'string' ? JSON.parse(row.name) : row.name,
    description:
      typeof row.description === 'string'
        ? JSON.parse(row.description)
        : row.description || { tj: '', ru: '', en: '' },
    price: Number(row.price),
    imageUrl: row.image_url || '',
    isAvailable: row.is_available ?? true,
    isHidden: row.is_hidden ?? false,
    isPopular: row.is_popular ?? false,
    isNew: row.is_new ?? false,
    isSpicy: row.is_spicy ?? false,
    isHalal: row.is_halal ?? true,
    prepTimeMinutes: row.prep_time_minutes ?? 10,
    calories: row.calories ?? 0,
    sortOrder: row.sort_order ?? 9999,
  };
}

export function menuItemToRow(item: MenuItem): any {
  return {
    id: item.id,
    category_id: item.categoryId || null,
    name: item.name,
    description: item.description || {},
    price: Number(item.price),
    image_url: item.imageUrl || '',
    is_available: item.isAvailable ?? true,
    is_hidden: item.isHidden ?? false,
    is_popular: item.isPopular ?? false,
    is_new: item.isNew ?? false,
    is_spicy: item.isSpicy ?? false,
    prep_time_minutes: item.prepTimeMinutes ?? 10,
    calories: item.calories ?? 0,
    sort_order: item.sortOrder ?? 9999,
  };
}

export function rowToOrder(row: any): SavedOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    createdAt: row.created_at,
    customer: typeof row.customer === 'string' ? JSON.parse(row.customer) : row.customer,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    total: Number(row.total),
    channel: row.channel,
    status: row.status,
    cancellationReason: row.cancel_reason || undefined,
  };
}

export function orderToRow(order: SavedOrder): any {
  return {
    id: order.id,
    order_number: order.orderNumber,
    customer: order.customer,
    items: order.items,
    total: Number(order.total),
    channel: order.channel,
    status: order.status,
    cancel_reason: order.cancellationReason || null,
  };
}

export const supabaseService = {
  // Connection Test
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    if (!isSupabaseConfigured) {
      return { ok: false, message: 'Supabase environment variables not configured' };
    }
    try {
      const { error } = await supabase.from('store_settings').select('id').limit(1);
      if (error) throw error;
      return { ok: true, message: 'Supabase PostgreSQL connected' };
    } catch (e: any) {
      return { ok: false, message: e?.message || 'Supabase connection failed' };
    }
  },

  // 1. Categories
  async getCategories(): Promise<Category[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      console.warn('Error fetching categories from Supabase:', error);
      return [];
    }
    return (data || []).map(rowToCategory);
  },

  async setCategory(cat: Category): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('categories').upsert(categoryToRow(cat));
    if (error) console.warn('Error saving category to Supabase:', error);
  },

  async batchSetCategories(categories: Category[]): Promise<void> {
    if (!isSupabaseConfigured) return;
    const rows = categories.map(categoryToRow);
    const { error } = await supabase.from('categories').upsert(rows);
    if (error) console.warn('Error batch saving categories to Supabase:', error);
  },

  async deleteCategory(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) console.warn('Error deleting category from Supabase:', error);
  },

  subscribeCategories(onUpdate: (cats: Category[]) => void): () => void {
    if (!isSupabaseConfigured) return () => {};
    this.getCategories()
      .then((cats) => {
        if (cats && cats.length > 0) onUpdate(cats);
      })
      .catch(() => {});

    const channel: RealtimeChannel = supabase
      .channel('public:categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        this.getCategories()
          .then((cats) => {
            if (cats && cats.length > 0) onUpdate(cats);
          })
          .catch(() => {});
      })
      .subscribe();

    const interval = setInterval(() => {
      this.getCategories()
        .then((cats) => {
          if (cats && cats.length > 0) onUpdate(cats);
        })
        .catch(() => {});
    }, 6000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  },

  // 2. Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      console.warn('Error fetching menu items from Supabase:', error);
      return [];
    }
    return (data || []).map(rowToMenuItem);
  },

  async setMenuItem(item: MenuItem): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('menu_items').upsert(menuItemToRow(item));
    if (error) console.warn('Error saving menu item to Supabase:', error);
  },

  async batchSetMenuItems(items: MenuItem[]): Promise<void> {
    if (!isSupabaseConfigured) return;
    const rows = items.map(menuItemToRow);
    const { error } = await supabase.from('menu_items').upsert(rows);
    if (error) console.warn('Error batch saving menu items to Supabase:', error);
  },

  async deleteMenuItem(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) console.warn('Error deleting menu item from Supabase:', error);
  },

  async bulkImportMenuItems(items: MenuItem[], mode: 'merge' | 'replace'): Promise<void> {
    if (!isSupabaseConfigured) return;
    if (mode === 'replace') {
      await supabase.from('menu_items').delete().neq('id', '');
    }
    const rows = items.map(menuItemToRow);
    const { error } = await supabase.from('menu_items').upsert(rows);
    if (error) console.warn('Error bulk importing menu items to Supabase:', error);
  },

  subscribeMenuItems(onUpdate: (items: MenuItem[]) => void): () => void {
    if (!isSupabaseConfigured) return () => {};
    this.getMenuItems()
      .then((items) => {
        if (items && items.length > 0) onUpdate(items);
      })
      .catch(() => {});

    const channel: RealtimeChannel = supabase
      .channel('public:menu_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        this.getMenuItems()
          .then((items) => {
            if (items && items.length > 0) onUpdate(items);
          })
          .catch(() => {});
      })
      .subscribe();

    const interval = setInterval(() => {
      this.getMenuItems()
        .then((items) => {
          if (items && items.length > 0) onUpdate(items);
        })
        .catch(() => {});
    }, 6000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  },

  // 3. Settings
  async getSettings(): Promise<StoreSettings | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 'store_config')
      .single();
    if (error || !data) return null;
    const parsed =
      data.data && typeof data.data === 'string'
        ? JSON.parse(data.data)
        : data.data && typeof data.data === 'object'
        ? data.data
        : {};
    const clean = stripSensitiveSettingsFields<StoreSettings>({
      ...parsed,
      ...(data.whatsapp_number ? { whatsappNumber: data.whatsapp_number } : {}),
      ...(data.telegram_username ? { telegramUsername: data.telegram_username } : {}),
      ...(typeof data.whatsapp_enabled === 'boolean'
        ? { whatsappEnabled: data.whatsapp_enabled }
        : {}),
      ...(typeof data.telegram_enabled === 'boolean'
        ? { telegramEnabled: data.telegram_enabled }
        : {}),
      ...(typeof data.direct_ordering_only === 'boolean'
        ? { directOrderingOnly: data.direct_ordering_only }
        : {}),
    });
    return normalizeWorkingHoursSettings(
      {
        ...clean,
        whatsappNumber: clean.whatsappNumber ? normalizeWhatsAppNumber(clean.whatsappNumber) : '',
        telegramUsername: clean.telegramUsername
          ? normalizeTelegramUsername(clean.telegramUsername)
          : '',
      },
      data
    );
  },

  async setSettings(settings: StoreSettings): Promise<{ ok: boolean; error?: string }> {
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase is not configured' };
    }
    const clean = normalizeWorkingHoursSettings(
      stripSensitiveSettingsFields<StoreSettings>({
        ...settings,
        whatsappNumber: normalizeWhatsAppNumber(settings.whatsappNumber),
        telegramUsername: normalizeTelegramUsername(settings.telegramUsername),
      })
    );
    const { error } = await supabase.from('store_settings').upsert({
      id: 'store_config',
      data: clean,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn('Error saving settings to Supabase:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  },

  subscribeSettings(onUpdate: (settings: StoreSettings) => void): () => void {
    if (!isSupabaseConfigured) return () => {};
    this.getSettings()
      .then((s) => {
        if (s) onUpdate(s);
      })
      .catch(() => {});

    const channel: RealtimeChannel = supabase
      .channel('public:store_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => {
        this.getSettings()
          .then((s) => {
            if (s) onUpdate(s);
          })
          .catch(() => {});
      })
      .subscribe();

    const interval = setInterval(() => {
      this.getSettings()
        .then((s) => {
          if (s) onUpdate(s);
        })
        .catch(() => {});
    }, 6000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  },

  // 4. Orders (Admin/Staff/Developer only)
  async getOrders(): Promise<SavedOrder[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching orders from Supabase:', error);
      return [];
    }
    return (data || []).map(rowToOrder);
  },

  async updateOrderStatus(id: string, status: OrderStatus, cancelReason?: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const updateData: any = { status };
    if (cancelReason !== undefined) updateData.cancel_reason = cancelReason;
    const { error } = await supabase.from('orders').update(updateData).eq('id', id);
    if (error) console.warn('Error updating order status in Supabase:', error);
  },

  async deleteOrder(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) console.warn('Error deleting order from Supabase:', error);
  },

  subscribeOrders(onUpdate: (orders: SavedOrder[]) => void): () => void {
    if (!isSupabaseConfigured) return () => {};
    this.getOrders().then(onUpdate).catch(() => {});

    const channel: RealtimeChannel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        this.getOrders().then(onUpdate).catch(() => {});
      })
      .subscribe();

    const interval = setInterval(() => {
      this.getOrders().then(onUpdate).catch(() => {});
    }, 5000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  },

  // 5. Cloud Storage for Images
  async uploadImage(file: File, folder = 'dishes'): Promise<string> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase Storage is not configured');
    }
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanName}`;
    const { error } = await supabase.storage.from('menu_images').upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });
    if (error) {
      throw error;
    }
    const { data: urlData } = supabase.storage.from('menu_images').getPublicUrl(path);
    return urlData.publicUrl;
  },

  async testStorageConnection(): Promise<{ ok: boolean; message: string; needsPolicy?: boolean }> {
    if (!isSupabaseConfigured) {
      return { ok: false, message: 'Supabase is not configured' };
    }
    try {
      const { error: listErr } = await supabase.storage.from('menu_images').list('', { limit: 1 });
      if (listErr) {
        if (listErr.message.includes('Bucket not found') || listErr.message.includes('not found')) {
          return { ok: false, message: 'Bucket "menu_images" needs to be created in Supabase Storage' };
        }
        throw listErr;
      }

      const probePath = `.probe_${Date.now()}.txt`;
      const probeBlob = new Blob(['probe'], { type: 'text/plain' });
      const { error: uploadErr } = await supabase.storage
        .from('menu_images')
        .upload(probePath, probeBlob, { upsert: true });

      if (uploadErr) {
        if (uploadErr.message.includes('row-level security') || uploadErr.message.includes('policy')) {
          return {
            ok: false,
            needsPolicy: true,
            message:
              'Bucket exists, but uploads require authenticated Admin/Developer Storage RLS policy in Supabase.',
          };
        }
        throw uploadErr;
      }

      await supabase.storage.from('menu_images').remove([probePath]).catch(() => {});
      return { ok: true, message: 'Supabase Storage "menu_images" connected with authorized upload permissions' };
    } catch (e: any) {
      if (e?.message?.includes('row-level security') || e?.message?.includes('policy')) {
        return {
          ok: false,
          needsPolicy: true,
          message:
            'Bucket exists, but uploads require authenticated Admin/Developer Storage RLS policy in Supabase.',
        };
      }
      return { ok: false, message: e?.message || 'Storage error' };
    }
  },

  // 6. Server-Verified Supabase Authentication (Never trusts user_metadata or sessionStorage)
  async signIn(email: string, password: string): Promise<{ user: any; session: any; role: AdminRole }> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase Auth is not configured');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    const token = data.session?.access_token;
    if (!token) {
      throw new Error('No access token received from Supabase Auth');
    }

    const result = await this.verifyTokenWithServerDetailed(token, data.user);
    if (!result.verified) {
      await supabase.auth.signOut().catch(() => {});
      throw new Error(
        result.error || 'Your account does not have an assigned Staff, Admin, or Developer role.'
      );
    }

    return { user: data.user, session: data.session, role: result.verified.role };
  },

  async resolveRoleDirectlyFromSupabase(
    authUser?: { id?: string; email?: string; app_metadata?: Record<string, any> } | null
  ): Promise<AdminRole | null> {
    const parseRole = (val: unknown): AdminRole | null => {
      if (typeof val !== 'string') return null;
      const clean = val.trim().toLowerCase();
      return clean === 'staff' || clean === 'admin' || clean === 'developer' ? clean : null;
    };

    const appRole = parseRole(authUser?.app_metadata?.role);
    if (appRole) return appRole;

    try {
      const userId =
        authUser?.id || (await supabase.auth.getUser()).data?.user?.id;
      if (userId) {
        const { data: row, error } = await supabase
          .from('team_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        if (!error) {
          const tableRole = parseRole(row?.role);
          if (tableRole) return tableRole;
        }
      }

      const { data: rpcRole, error: rpcErr } = await supabase.rpc('get_my_role');
      if (!rpcErr) {
        const parsedRpc = parseRole(rpcRole);
        if (parsedRpc) return parsedRpc;
      }
    } catch {
      // Ignore fallback lookup errors
    }

    return null;
  },

  async verifyTokenWithServerDetailed(
    accessToken: string,
    authUser?: { id?: string; email?: string; app_metadata?: Record<string, any> } | null
  ): Promise<{
    verified: { user: { id: string; email?: string }; role: AdminRole } | null;
    error?: string;
  }> {
    const parseRole = (val: unknown): AdminRole | null => {
      if (typeof val !== 'string') return null;
      const clean = val.trim().toLowerCase();
      return clean === 'staff' || clean === 'admin' || clean === 'developer' ? clean : null;
    };

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const text = await res.text();
      const isHtml = text.trim().startsWith('<');
      let json: any = null;
      if (text && !isHtml) {
        try {
          json = JSON.parse(text);
        } catch {}
      }

      if (res.ok && json) {
        const role = parseRole(json.role);
        if (role) {
          return { verified: { user: json.user, role } };
        }
      }

      // Strict rejection from configured backend (401 / 403): do not bypass
      if (json && (res.status === 401 || res.status === 403)) {
        return {
          verified: null,
          error:
            json.error ||
            'Your account does not have an assigned Staff, Admin, or Developer role.',
        };
      }

      // If /api/auth/me returned HTML/404 (not deployed on Vercel yet) or 503 (missing server env vars),
      // check trusted app_metadata / RLS-protected team_roles / get_my_role directly via Supabase.
      if (isHtml || res.status === 404 || res.status === 503 || res.status >= 500) {
        const fallbackRole = await this.resolveRoleDirectlyFromSupabase(authUser);
        if (fallbackRole) {
          const userInfo = authUser?.id
            ? { id: authUser.id, email: authUser.email }
            : { id: (await supabase.auth.getUser()).data?.user?.id || '', email: authUser?.email };
          if (userInfo.id) {
            return { verified: { user: userInfo, role: fallbackRole } };
          }
        }
        return {
          verified: null,
          error: isHtml
            ? `Authentication API (/api/auth/me) returned HTML (HTTP ${res.status}). Push the latest vercel.json & api/index.ts to Vercel, or ensure your user exists in public.team_roles.`
            : json?.error || `Authentication API error (HTTP ${res.status}).`,
        };
      }

      return {
        verified: null,
        error:
          json?.error ||
          'Your account does not have an assigned Staff, Admin, or Developer role.',
      };
    } catch (err: any) {
      const fallbackRole = await this.resolveRoleDirectlyFromSupabase(authUser);
      if (fallbackRole) {
        const userInfo = authUser?.id
          ? { id: authUser.id, email: authUser.email }
          : { id: (await supabase.auth.getUser()).data?.user?.id || '', email: authUser?.email };
        if (userInfo.id) {
          return { verified: { user: userInfo, role: fallbackRole } };
        }
      }
      return {
        verified: null,
        error: err?.message || 'Unable to verify account role with authentication server.',
      };
    }
  },

  async verifyTokenWithServer(
    accessToken: string,
    authUser?: { id?: string; email?: string; app_metadata?: Record<string, any> } | null
  ): Promise<{ user: { id: string; email?: string }; role: AdminRole } | null> {
    const result = await this.verifyTokenWithServerDetailed(accessToken, authUser);
    return result.verified;
  },

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.warn('Supabase signOut error:', error);
  },

  async getSession() {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session;
  },

  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.access_token || null;
  },

  async getCurrentUser(): Promise<{ user: any; role: AdminRole } | null> {
    const session = await this.getSession();
    if (!session?.access_token || !session.user) return null;
    const verified = await this.verifyTokenWithServer(session.access_token, session.user);
    if (!verified) return null;
    return { user: session.user, role: verified.role };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!isSupabaseConfigured) return () => {};
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return () => {
      subscription.unsubscribe();
    };
  },
};

