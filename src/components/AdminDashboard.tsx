import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { t } from '../i18n/translations';
import { AdminRole, Category, MenuItem, OrderStatus, SavedOrder, StoreSettings } from '../types';
import { getSupabaseProjectRef, supabaseService } from '../supabase';
import { resolveMenuItemImage, getFallbackImageForCategory } from '../utils/imageFallback';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import {
  X,
  TrendingUp,
  ShoppingBag,
  Layers,
  Settings,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Phone,
  MessageCircle,
  Send,
  Download,
  Upload,
  AlertTriangle,
  Flame,
  Sparkles,
  Eye,
  EyeOff,
  ImageIcon,
  Copy,
  Check,
  Link2,
  ShieldCheck,
  Smartphone,
  Keyboard,
  Calendar,
  ArrowUpDown,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Filter,
  FileSpreadsheet,
  Code2,
  UserCheck,
  Shield,
  Truck,
  Store,
  UtensilsCrossed,
  ArrowLeft,
  LogOut,
  HelpCircle,
  Award,
  Camera,
  Loader2,
  Hash,
  Cloud,
  ExternalLink,
  Mail,
  UserPlus,
  ShieldAlert,
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const supabaseProjectRef = getSupabaseProjectRef();
  const supabaseDashboardBase = supabaseProjectRef
    ? `https://supabase.com/dashboard/project/${supabaseProjectRef}`
    : 'https://supabase.com/dashboard/projects';
  const {
    language,
    storeSettings,
    updateStoreSettings,
    menuItems,
    saveMenuItem,
    deleteMenuItem,
    reorderMenuItems,
    toggleItemAvailability,
    toggleItemHidden,
    categories,
    saveCategory,
    deleteCategory,
    reorderCategories,
    orders,
    updateOrderStatus,
    deleteOrder,
    setIsAdminAuthenticated,
    currentAdminRole,
    bulkImportMenuItems,
    uploadItemImage,
  } = useStore();

  const activeRole: AdminRole = currentAdminRole || 'admin';

  // Allowed tabs based on role
  // Staff: only 'analytics'
  // Admin: 'analytics', 'menu', 'categories', 'settings'
  // Developer: all tabs
  const allowedTabs = useMemo<('analytics' | 'menu' | 'categories' | 'settings' | 'developer' | 'import')[]>(() => {
    if (activeRole === 'staff') {
      return ['analytics'];
    }
    if (activeRole === 'admin') {
      return ['analytics', 'menu', 'categories', 'settings'];
    }
    return ['analytics', 'menu', 'categories', 'settings', 'developer', 'import'];
  }, [activeRole]);

  const [activeTab, setActiveTab] = useState<'analytics' | 'menu' | 'categories' | 'settings' | 'developer' | 'import'>(() => {
    if (activeRole === 'developer') return 'developer';
    if (activeRole === 'staff') return 'analytics';
    return 'menu';
  });

  // Switch tab directly to dedicated panel whenever dashboard opens or role changes
  useEffect(() => {
    if (isOpen) {
      if (activeRole === 'developer') {
        setActiveTab('developer');
      } else if (activeRole === 'staff') {
        setActiveTab('analytics');
      } else {
        setActiveTab('menu');
      }
    }
  }, [isOpen, activeRole]);

  // Auto-switch to allowed tab if current role doesn't have access to activeTab
  useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0] || 'analytics');
    }
  }, [activeRole, allowedTabs, activeTab]);

  // Menu item modal state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDeviceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;

    if (!file.type.startsWith('image/')) {
      setUploadError(language === 'tj' ? 'Лутфан файли тасвириро интихоб кунед' : 'Please select a valid image file');
      return;
    }

    setUploadingImage(true);
    setUploadError('');
    try {
      const url = await uploadItemImage(file);
      setEditingItem((prev) => (prev ? { ...prev, imageUrl: url } : prev));
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload image from device');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Category modal state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [originalCategoryId, setOriginalCategoryId] = useState<string>('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Store settings form state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(() => ({
    ...storeSettings,
    whatsappEnabled: storeSettings.whatsappEnabled !== false,
    telegramEnabled: storeSettings.telegramEnabled !== false,
    directOrderingOnly: storeSettings.directOrderingOnly !== false,
    cmsAccessMode: storeSettings.cmsAccessMode || 'hidden',
  }));
  const [isSettingsFormDirty, setIsSettingsFormDirty] = useState(false);
  const [settingsSavedFeedback, setSettingsSavedFeedback] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);

  // Synchronize settingsForm whenever storeSettings updates, ONLY if user is not actively editing
  useEffect(() => {
    if (storeSettings && !isSettingsFormDirty) {
      setSettingsForm({
        ...storeSettings,
        whatsappEnabled: storeSettings.whatsappEnabled !== false,
        telegramEnabled: storeSettings.telegramEnabled !== false,
        directOrderingOnly: storeSettings.directOrderingOnly !== false,
        cmsAccessMode: storeSettings.cmsAccessMode || 'hidden',
      });
    }
  }, [storeSettings, isSettingsFormDirty]);

  // Legacy PIN state removed for production Supabase Auth enforcement

  // Bulk Excel Import state
  const [importRows, setImportRows] = useState<MenuItem[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importSuccessMessage, setImportSuccessMessage] = useState('');
  const [importErrorMessage, setImportErrorMessage] = useState('');

  // Date Filter & Sort state for Analytics & Orders
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [orderSortDirection, setOrderSortDirection] = useState<'newest' | 'oldest'>('newest');

  // Analytics status filter & Menu visibility filter
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [menuVisibilityFilter, setMenuVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  // Cancel Order with reason modal state
  const [cancellingOrder, setCancellingOrder] = useState<SavedOrder | null>(null);
  const [selectedReasonPreset, setSelectedReasonPreset] = useState<string>('');
  const [customReasonText, setCustomReasonText] = useState<string>('');

  const safeOrders = orders || [];

  // Filter orders by date
  const dateFilteredOrders = useMemo(() => {
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    return safeOrders.filter((o) => {
      if (!o || !o.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      if (dateFilter === 'today') {
        return orderDate.toDateString() === todayStr;
      }
      if (dateFilter === 'yesterday') {
        return orderDate.toDateString() === yesterdayStr;
      }
      if (dateFilter === 'custom') {
        const start = new Date(customStartDate + 'T00:00:00');
        const end = new Date(customEndDate + 'T23:59:59');
        return orderDate >= start && orderDate <= end;
      }
      return true; // 'all'
    });
  }, [safeOrders, dateFilter, customStartDate, customEndDate]);

  // Analytics metrics calculations based on dateFilteredOrders
  const totalSales = dateFilteredOrders.reduce(
    (sum, o) => (o && o.status !== 'cancelled' ? sum + (Number(o.total) || 0) : sum),
    0
  );
  const deliveredOrders = dateFilteredOrders.filter(
    (o) => o?.status === 'delivered' || o?.status === 'completed'
  ).length;
  const inProgressOrders = dateFilteredOrders.filter(
    (o) => o?.status === 'new' || o?.status === 'preparing' || o?.status === 'out_for_delivery'
  ).length;
  const averageTicket =
    dateFilteredOrders.length > 0 ? Math.round(totalSales / (dateFilteredOrders.length || 1)) : 0;

  // Channel breakdown
  const directOrders = dateFilteredOrders.filter((o) => o?.channel === 'direct').length;
  const whatsappOrders = dateFilteredOrders.filter((o) => o?.channel === 'whatsapp').length;
  const telegramOrders = dateFilteredOrders.filter((o) => o?.channel === 'telegram').length;

  // TOP SELLING ITEMS CALCULATION
  const topSellingItems = useMemo(() => {
    const itemMap = new Map<string, { id: string; name: string; quantity: number; revenue: number }>();
    dateFilteredOrders.forEach((o) => {
      if (o.status === 'cancelled') return;
      (o.items || []).forEach((it) => {
        const existing = itemMap.get(it.id) || { id: it.id, name: it.name, quantity: 0, revenue: 0 };
        existing.quantity += it.quantity;
        existing.revenue += it.subtotal;
        itemMap.set(it.id, existing);
      });
    });

    const sorted = Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);
    return sorted;
  }, [dateFilteredOrders]);

  const maxSoldQty = topSellingItems.length > 0 ? topSellingItems[0].quantity : 1;

  // Filtered orders list (date + status + sort)
  const filteredOrders = useMemo(() => {
    return dateFilteredOrders
      .filter((o) => {
        if (!o) return false;
        if (orderStatusFilter === 'all') return true;
        if (orderStatusFilter === 'delivered') return o.status === 'delivered' || o.status === 'completed';
        return o.status === orderStatusFilter;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return orderSortDirection === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [dateFilteredOrders, orderStatusFilter, orderSortDirection]);

  const handleStatusChange = (order: SavedOrder, newStatus: OrderStatus) => {
    if (newStatus === 'cancelled') {
      setCancellingOrder(order);
      setSelectedReasonPreset(t('reasonOutOfStock', language));
      setCustomReasonText('');
    } else {
      updateOrderStatus(order.id, newStatus);
    }
  };

  const handleConfirmCancellation = () => {
    if (!cancellingOrder) return;
    const finalReason = customReasonText.trim() || selectedReasonPreset || t('reasonCustomerRequested', language);
    updateOrderStatus(cancellingOrder.id, 'cancelled', finalReason);
    setCancellingOrder(null);
    setSelectedReasonPreset('');
    setCustomReasonText('');
  };

  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('all');
  const safeMenuItems = menuItems || [];
  const filteredMenuItems = safeMenuItems.filter((item) => {
    if (!item) return false;
    if (menuCategoryFilter !== 'all' && item.categoryId !== menuCategoryFilter) return false;
    if (menuVisibilityFilter === 'visible') return !item.isHidden;
    if (menuVisibilityFilter === 'hidden') return !!item.isHidden;
    return true;
  });

  // Drag and drop state for Categories
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);

  const handleCategoryDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCategoryId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleCategoryDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCategoryId !== id) {
      setDragOverCategoryId(id);
    }
  };

  const handleCategoryDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedCategoryId || draggedCategoryId === targetId) {
      setDraggedCategoryId(null);
      setDragOverCategoryId(null);
      return;
    }
    const sourceIndex = categories.findIndex((c) => c.id === draggedCategoryId);
    const targetIndex = categories.findIndex((c) => c.id === targetId);
    if (sourceIndex !== -1 && targetIndex !== -1) {
      const newCats = Array.from(categories);
      const [moved] = newCats.splice(sourceIndex, 1);
      newCats.splice(targetIndex, 0, moved);
      reorderCategories(newCats);
    }
    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
  };

  const handleCategoryDragEnd = () => {
    setDraggedCategoryId(null);
    setDragOverCategoryId(null);
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const newCats = Array.from(categories);
    const [moved] = newCats.splice(index, 1);
    newCats.splice(targetIndex, 0, moved);
    reorderCategories(newCats);
  };

  // Drag and drop state for Menu Items
  const [draggedMenuItemId, setDraggedMenuItemId] = useState<string | null>(null);
  const [dragOverMenuItemId, setDragOverMenuItemId] = useState<string | null>(null);

  const handleMenuItemDragStart = (e: React.DragEvent, id: string) => {
    setDraggedMenuItemId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleMenuItemDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverMenuItemId !== id) {
      setDragOverMenuItemId(id);
    }
  };

  const handleMenuItemDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedMenuItemId || draggedMenuItemId === targetId) {
      setDraggedMenuItemId(null);
      setDragOverMenuItemId(null);
      return;
    }
    const sourceIndex = safeMenuItems.findIndex((i) => i.id === draggedMenuItemId);
    const targetIndex = safeMenuItems.findIndex((i) => i.id === targetId);
    if (sourceIndex !== -1 && targetIndex !== -1) {
      const newItems = Array.from(safeMenuItems);
      const [moved] = newItems.splice(sourceIndex, 1);
      newItems.splice(targetIndex, 0, moved);
      reorderMenuItems(newItems);
    }
    setDraggedMenuItemId(null);
    setDragOverMenuItemId(null);
  };

  const handleMenuItemDragEnd = () => {
    setDraggedMenuItemId(null);
    setDragOverMenuItemId(null);
  };

  const handleMoveMenuItem = (itemId: string, direction: 'up' | 'down') => {
    const currentIndex = safeMenuItems.findIndex((i) => i.id === itemId);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= safeMenuItems.length) return;
    const newItems = Array.from(safeMenuItems);
    const [moved] = newItems.splice(currentIndex, 1);
    newItems.splice(targetIndex, 0, moved);
    reorderMenuItems(newItems);
  };

  const handleOpenNewItem = () => {
    setEditingItem({
      id: `item-${Date.now()}`,
      name: { tj: '', ru: '', en: '' },
      description: { tj: '', ru: '', en: '' },
      price: 0,
      categoryId: categories[0]?.id || 'burgers',
      imageUrl: '/src/assets/images/fastfood_burger_showcase_1792492325630.jpg',
      isAvailable: true,
      isHidden: false,
      isPopular: false,
      isSpicy: false,
      isHalal: true,
      isNew: false,
      calories: 0,
      prepTimeMinutes: 10,
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    saveMenuItem(editingItem);
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  const handleOpenNewCategory = () => {
    const defaultId = `cat-${Date.now()}`;
    setEditingCategory({
      id: defaultId,
      name: { tj: '', ru: '', en: '' },
      icon: '🍽️',
      sortOrder: categories.length + 1,
    });
    setOriginalCategoryId(defaultId);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const cleanId = editingCategory.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!cleanId) {
      alert(language === 'tj' ? 'Лутфан ID-и категорияро ворид кунед' : 'Please provide a valid Category ID');
      return;
    }

    const finalCategory = {
      ...editingCategory,
      id: cleanId,
    };

    if (originalCategoryId && originalCategoryId !== cleanId) {
      // If the ID was renamed, remove the obsolete ID and update associated menu items
      deleteCategory(originalCategoryId);
      menuItems.forEach((item) => {
        if (item.categoryId === originalCategoryId) {
          saveMenuItem({ ...item, categoryId: cleanId });
        }
      });
    }

    saveCategory(finalCategory);
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm.whatsappNumber.trim() && !settingsForm.telegramUsername.trim()) {
      setSettingsError(
        language === 'tj'
          ? 'Ҳадди ақал рақами WhatsApp ё Username-и Telegram-ро ворид кунед!'
          : language === 'ru'
          ? 'Укажите хотя бы номер WhatsApp или имя Telegram!'
          : 'Please provide at least a WhatsApp number or Telegram username!'
      );
      return;
    }
    setSettingsError('');
    setIsSettingsFormDirty(false);
    updateStoreSettings(settingsForm);
    setSettingsSavedFeedback(true);
    setTimeout(() => setSettingsSavedFeedback(false), 2500);
  };

  // DEVELOPER: Toggle Order Types (Delivery, Pickup, Dine-in)
  const handleToggleDeliveryType = (type: 'delivery' | 'pickup' | 'dine_in') => {
    const current = storeSettings.enabledDeliveryTypes || { delivery: true, pickup: true, dine_in: true };
    const updated = {
      ...current,
      [type]: !current[type],
    };
    // Ensure at least one type remains enabled
    if (!updated.delivery && !updated.pickup && !updated.dine_in) {
      alert(language === 'tj' ? 'Ҳадди ақал як навъи фармоиш бояд фаъол бошад!' : 'At least one order type must remain active!');
      return;
    }
    const updatedSettings = {
      ...storeSettings,
      enabledDeliveryTypes: updated,
    };
    updateStoreSettings(updatedSettings);
  };

  // DEVELOPER: Order number format toggle
  const handleSetOrderNumberFormat = (format: '4-digits' | '6-digits') => {
    const updatedSettings = {
      ...storeSettings,
      orderNumberFormat: format,
    };
    updateStoreSettings(updatedSettings);
  };

  // DEVELOPER: Order number starting point & counter
  const [orderStartingInput, setOrderStartingInput] = useState<string>(() =>
    String(storeSettings.nextOrderNumber ?? 1)
  );
  const [orderPrefixInput, setOrderPrefixInput] = useState<string>(() =>
    storeSettings.orderNumberPrefix || '#'
  );
  const [orderNumberSavedFeedback, setOrderNumberSavedFeedback] = useState(false);

  useEffect(() => {
    setOrderStartingInput(String(storeSettings.nextOrderNumber ?? 1));
    setOrderPrefixInput(storeSettings.orderNumberPrefix || '#');
  }, [storeSettings.nextOrderNumber, storeSettings.orderNumberPrefix]);

  const handleApplyOrderStartingPoint = (customNum?: number) => {
    const raw = customNum !== undefined ? customNum : parseInt(orderStartingInput.replace(/[^0-9]/g, '') || '1', 10);
    const validNum = Math.max(1, isNaN(raw) ? 1 : raw);
    const validPrefix = orderPrefixInput.trim() || '#';

    const updatedSettings = {
      ...storeSettings,
      nextOrderNumber: validNum,
      orderNumberPrefix: validPrefix,
    };
    updateStoreSettings(updatedSettings);
    setOrderStartingInput(String(validNum));
    setOrderNumberSavedFeedback(true);
    setTimeout(() => setOrderNumberSavedFeedback(false), 2500);
  };

  // DEVELOPER: Supabase Storage testing state
  const [testingStorage, setTestingStorage] = useState(false);
  const [storageStatusResult, setStorageStatusResult] = useState<{ ok: boolean; message: string; needsPolicy?: boolean } | null>(null);
  const [copiedStorageSql, setCopiedStorageSql] = useState(false);

  const supabaseStoragePolicySql = `-- =========================================================================
-- Least-Privilege Storage Policies for menu_images (Admin & Developer only)
-- =========================================================================
drop policy if exists "Allow all uploads to menu_images" on storage.objects;
drop policy if exists "Allow all updates to menu_images" on storage.objects;
drop policy if exists "Allow all deletes in menu_images" on storage.objects;
drop policy if exists "Allow public read menu_images" on storage.objects;
drop policy if exists "Public view menu_images" on storage.objects;
drop policy if exists "Admin upload menu_images" on storage.objects;
drop policy if exists "Admin update menu_images" on storage.objects;
drop policy if exists "Admin delete menu_images" on storage.objects;

create policy "Public view menu_images"
  on storage.objects for select
  using (bucket_id = 'menu_images');

create policy "Admin upload menu_images"
  on storage.objects for insert
  with check (bucket_id = 'menu_images' and public.get_my_role() in ('admin', 'developer'));

create policy "Admin update menu_images"
  on storage.objects for update
  using (bucket_id = 'menu_images' and public.get_my_role() in ('admin', 'developer'));

create policy "Admin delete menu_images"
  on storage.objects for delete
  using (bucket_id = 'menu_images' and public.get_my_role() in ('admin', 'developer'));`;

  const handleCopyStorageSql = () => {
    navigator.clipboard.writeText(supabaseStoragePolicySql);
    setCopiedStorageSql(true);
    setTimeout(() => setCopiedStorageSql(false), 2500);
  };

  const handleTestStorage = async () => {
    setTestingStorage(true);
    setStorageStatusResult(null);
    try {
      const res = await supabaseService.testStorageConnection();
      setStorageStatusResult(res);
    } catch (e: any) {
      setStorageStatusResult({ ok: false, message: e?.message || 'Storage error' });
    } finally {
      setTestingStorage(false);
    }
  };

  // DEVELOPER: Supabase Auth & RLS Management
  const [supabaseAuthUser, setSupabaseAuthUser] = useState<{ email?: string; role?: string; id?: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [newTeamEmail, setNewTeamEmail] = useState('');
  const [newTeamPassword, setNewTeamPassword] = useState('');
  const [newTeamRole, setNewTeamRole] = useState<AdminRole>('staff');
  const [creatingTeamMember, setCreatingTeamMember] = useState(false);
  const [teamMemberFeedback, setTeamMemberFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    supabaseService.getCurrentUser().then((res) => {
      if (res?.user) {
        setSupabaseAuthUser({
          email: res.user.email,
          role: res.role,
          id: res.user.id,
        });
      } else {
        setSupabaseAuthUser(null);
      }
    }).catch(() => {});
  }, [isOpen]);

  const supabaseRlsSql = `-- =========================================================================
-- Production Least-Privilege RLS (see supabase/migrations/001_security_hardening.sql)
-- =========================================================================
create table if not exists public.team_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('staff', 'admin', 'developer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_roles enable row level security;

create or replace function public.get_my_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    (select role from public.team_roles where user_id = auth.uid() limit 1)
  );
$$;

-- Categories & Menu Items (Public read visible items; Admin/Developer write)
alter table public.categories enable row level security;
drop policy if exists "Public read categories" on public.categories;
drop policy if exists "Admin write categories" on public.categories;
create policy "Public read categories" on public.categories for select using (true);
create policy "Admin write categories" on public.categories for all
  using (public.get_my_role() in ('admin', 'developer'))
  with check (public.get_my_role() in ('admin', 'developer'));

alter table public.menu_items enable row level security;
drop policy if exists "Public read menu_items" on public.menu_items;
drop policy if exists "Admin write menu_items" on public.menu_items;
create policy "Public read menu_items" on public.menu_items for select
  using (coalesce(is_hidden, false) = false or public.get_my_role() in ('staff', 'admin', 'developer'));
create policy "Admin write menu_items" on public.menu_items for all
  using (public.get_my_role() in ('admin', 'developer'))
  with check (public.get_my_role() in ('admin', 'developer'));

-- Store Settings (Public read; Admin/Developer write)
alter table public.store_settings enable row level security;
drop policy if exists "Public read store_settings" on public.store_settings;
drop policy if exists "Admin write store_settings" on public.store_settings;
create policy "Public read store_settings" on public.store_settings for select using (true);
create policy "Admin write store_settings" on public.store_settings for all
  using (public.get_my_role() in ('admin', 'developer'))
  with check (public.get_my_role() in ('admin', 'developer'));

-- Orders (Protect Customer PII: No public SELECT)
alter table public.orders enable row level security;
drop policy if exists "Authorized read orders" on public.orders;
drop policy if exists "Staff read orders" on public.orders;
drop policy if exists "Staff update orders" on public.orders;
drop policy if exists "Admin delete orders" on public.orders;
drop policy if exists "Public create orders" on public.orders;
create policy "Public create orders" on public.orders for insert with check (status = 'new');
create policy "Staff read orders" on public.orders for select
  using (public.get_my_role() in ('staff', 'admin', 'developer'));
create policy "Staff update orders" on public.orders for update
  using (public.get_my_role() in ('staff', 'admin', 'developer'))
  with check (public.get_my_role() in ('staff', 'admin', 'developer'));
create policy "Admin delete orders" on public.orders for delete
  using (public.get_my_role() in ('admin', 'developer'));`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseRlsSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCreateTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamEmail.trim() || !newTeamPassword) return;
    setCreatingTeamMember(true);
    setTeamMemberFeedback(null);
    try {
      const token = await supabaseService.getAccessToken();
      if (!token) {
        throw new Error('Developer authentication token is required.');
      }
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newTeamEmail.trim(),
          password: newTeamPassword,
          role: newTeamRole,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || `Request failed (${res.status})`);
      }
      setTeamMemberFeedback({
        ok: true,
        message: `Provisioned confirmed team account for ${json.user?.email || newTeamEmail} with role "${newTeamRole}".`,
      });
      setNewTeamEmail('');
      setNewTeamPassword('');
    } catch (err: any) {
      setTeamMemberFeedback({
        ok: false,
        message: err?.message || 'Error provisioning user in Supabase Auth',
      });
    } finally {
      setCreatingTeamMember(false);
    }
  };

  // DEVELOPER: Toggle Languages
  const handleToggleLanguage = (langKey: 'tj' | 'ru' | 'en') => {
    const current = storeSettings.enabledLanguages || { tj: true, ru: true, en: true };
    const updated = {
      ...current,
      [langKey]: !current[langKey],
    };
    // Ensure at least 1 language remains enabled
    if (!updated.tj && !updated.ru && !updated.en) {
      alert(language === 'tj' ? 'Ҳадди ақал як забон бояд фаъол бошад!' : 'At least one language must remain active!');
      return;
    }
    const updatedSettings = {
      ...storeSettings,
      enabledLanguages: updated,
    };
    updateStoreSettings(updatedSettings);
  };

  // ADMIN & DEVELOPER: Toggle Dispatch Channels (WhatsApp, Telegram)
  const handleToggleDispatchChannel = (channel: 'whatsapp' | 'telegram') => {
    const isWa = storeSettings.whatsappEnabled !== false;
    const isTg = storeSettings.telegramEnabled !== false;

    let newWa = isWa;
    let newTg = isTg;

    if (channel === 'whatsapp') {
      newWa = !isWa;
    } else {
      newTg = !isTg;
    }

    const orderChannel: 'whatsapp' | 'telegram' | 'both' =
      newWa && newTg ? 'both' : newWa ? 'whatsapp' : newTg ? 'telegram' : 'both';

    setSettingsForm((prev) => ({
      ...prev,
      whatsappEnabled: newWa,
      telegramEnabled: newTg,
      orderChannel,
    }));

    updateStoreSettings({
      ...storeSettings,
      whatsappEnabled: newWa,
      telegramEnabled: newTg,
      orderChannel,
    });
  };

  // ADMIN & DEVELOPER: Toggle Direct In-App Ordering (Single Button vs WhatsApp/Telegram redirect buttons)
  const handleToggleDirectOrdering = () => {
    const nextDirect = !(storeSettings.directOrderingOnly !== false);
    setSettingsForm((prev) => ({
      ...prev,
      directOrderingOnly: nextDirect,
    }));
    updateStoreSettings({
      ...storeSettings,
      directOrderingOnly: nextDirect,
    });
  };

  // DEVELOPER: Toggle CMS Button Visibility
  const handleToggleCmsButtonVisibility = (visible: boolean) => {
    updateStoreSettings({
      ...storeSettings,
      cmsButtonVisible: visible,
      cmsAccessMode: visible ? 'visible' : 'hidden',
    });
  };

  // DEVELOPER: Update Secret Access Shortcuts
  const handleToggleShortcut = (key: 'enableTripleClick' | 'enableLongPress' | 'enableKeyboardShortcut') => {
    const current = storeSettings.shortcutSettings || {
      enableTripleClick: true,
      enableLongPress: true,
      enableKeyboardShortcut: true,
      keyboardShortcut: 'ctrl+shift+a' as const,
    };

    updateStoreSettings({
      ...storeSettings,
      shortcutSettings: {
        ...current,
        [key]: !current[key],
      },
    });
  };

  const handleSelectKeyboardShortcut = (shortcut: 'ctrl+shift+a' | 'alt+shift+c' | 'ctrl+alt+m' | 'shift+esc') => {
    const current = storeSettings.shortcutSettings || {
      enableTripleClick: true,
      enableLongPress: true,
      enableKeyboardShortcut: true,
      keyboardShortcut: 'ctrl+shift+a' as const,
    };

    updateStoreSettings({
      ...storeSettings,
      shortcutSettings: {
        ...current,
        keyboardShortcut: shortcut,
      },
    });
  };

  // Security PIN configuration intentionally removed for production JWT authorization.

  // DEVELOPER: Download Excel Template
  const handleDownloadExcelTemplate = () => {
    const templateData = [
      {
        id: 'item-smash-burger',
        name_tj: 'Дубл Чизбургер Смэш',
        name_ru: 'Двойной Чизбургер Смэш',
        name_en: 'Double Smash Cheeseburger',
        price: 38,
        original_price: 45,
        category_id: categories[0]?.id || 'burgers',
        image_url: '/src/assets/images/fastfood_burger_showcase_1792492325630.jpg',
        is_available: true,
        is_popular: true,
        is_spicy: false,
        is_halal: true,
        is_new: true,
        prep_time_minutes: 12,
        calories: 620,
        description_tj: 'Гӯшти тару тозаи гов, панири чеддари гудохта ва соуси хоси ошпаз',
        description_ru: 'Сочная говяжья котлета, двойной сыр чеддер и фирменный соус',
        description_en: 'Two juicy beef smash patties, melted cheddar cheese & signature sauce',
      },
      {
        id: 'item-shawarma-special',
        name_tj: 'Шаурмаи махсус бо мурғ',
        name_ru: 'Фирменная шаурма с курицей',
        name_en: 'Special Chicken Shawarma Wrap',
        price: 26,
        original_price: 30,
        category_id: categories[1]?.id || categories[0]?.id || 'shawarma',
        image_url: '/src/assets/images/fastfood_shawarma_wrap_1792492327241.jpg',
        is_available: true,
        is_popular: true,
        is_spicy: true,
        is_halal: true,
        is_new: false,
        prep_time_minutes: 10,
        calories: 490,
        description_tj: 'Гӯшти мурғи бирён, бодиринг, помидор ва соуси сирдор дар лаваши тунук',
        description_ru: 'Нежное куриное филе, свежие овощи и чесночный соус в лаваше',
        description_en: 'Tender chicken breast, crisp vegetables and homemade garlic sauce',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'MenuTemplate');
    XLSX.writeFile(workbook, 'quickbite_menu_import_template.xlsx');
  };

  // DEVELOPER: Handle Excel / CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportSuccessMessage('');
    setImportErrorMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) {
          setImportErrorMessage('The selected file has no data rows.');
          return;
        }

        // Map spreadsheet rows to MenuItem objects
        const parsedItems: MenuItem[] = jsonData
          .map((row: any, idx: number) => {
            const tjName = String(row.name_tj || row.name || '').trim();
            const ruName = String(row.name_ru || row.name || '').trim();
            const enName = String(row.name_en || row.name || '').trim();

            if (!tjName && !ruName && !enName) return null;

            const price = Number(row.price) || 0;
            const originalPrice = row.original_price ? Number(row.original_price) : undefined;
            const catId = String(row.category_id || categories[0]?.id || 'burgers').trim();

            const isAvailable = row.is_available === undefined ? true : String(row.is_available).toLowerCase() === 'true' || row.is_available === 1;
            const isPopular = String(row.is_popular).toLowerCase() === 'true' || row.is_popular === 1;
            const isSpicy = String(row.is_spicy).toLowerCase() === 'true' || row.is_spicy === 1;
            const isHalal = row.is_halal === undefined ? true : String(row.is_halal).toLowerCase() === 'true' || row.is_halal === 1;
            const isNew = String(row.is_new).toLowerCase() === 'true' || row.is_new === 1;

            return {
              id: row.id ? String(row.id).trim() : `item-import-${Date.now()}-${idx}`,
              name: {
                tj: tjName || ruName || enName,
                ru: ruName || tjName || enName,
                en: enName || ruName || tjName,
              },
              description: {
                tj: String(row.description_tj || row.desc_tj || '').trim(),
                ru: String(row.description_ru || row.desc_ru || '').trim(),
                en: String(row.description_en || row.desc_en || '').trim(),
              },
              price,
              originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
              categoryId: catId,
              imageUrl: String(row.image_url || '/src/assets/images/fastfood_burger_showcase_1792492325630.jpg').trim(),
              isAvailable,
              isHidden: false,
              isPopular,
              isSpicy,
              isHalal,
              isNew,
              calories: row.calories ? Number(row.calories) : undefined,
              prepTimeMinutes: row.prep_time_minutes ? Number(row.prep_time_minutes) : 10,
            } as MenuItem;
          })
          .filter((item): item is MenuItem => item !== null);

        if (parsedItems.length === 0) {
          setImportErrorMessage('No valid items found. Please check columns: name_tj, name_ru, price, category_id.');
          return;
        }

        setImportRows(parsedItems);
      } catch (err: any) {
        setImportErrorMessage(`Failed to read file: ${err?.message || 'Unknown error'}`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // DEVELOPER: Execute Import
  const handleExecuteImport = () => {
    if (importRows.length === 0) return;
    bulkImportMenuItems(importRows, importMode);
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {}
    setImportSuccessMessage(
      language === 'tj'
        ? `Бомуваффақият ${importRows.length} таом ба меню ворид карда шуд!`
        : language === 'ru'
        ? `Успешно импортировано ${importRows.length} блюд в меню!`
        : `Successfully imported ${importRows.length} items into menu!`
    );
    setImportRows([]);
    setImportFileName('');
  };

  if (!isOpen) return null;

  return (
    <div className="min-h-screen w-full bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
      {/* ============================================================== */}
      {/* FULL WINDOW CMS HEADER                                         */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center font-extrabold shadow-md ${
                activeRole === 'developer'
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-purple-500/20'
                  : activeRole === 'staff'
                  ? 'bg-gradient-to-tr from-sky-600 to-blue-500 shadow-sky-500/20'
                  : 'bg-gradient-to-tr from-amber-600 to-amber-400 shadow-amber-500/20'
              }`}
            >
              {activeRole === 'developer' ? (
                <Code2 className="w-5 h-5" />
              ) : activeRole === 'staff' ? (
                <UserCheck className="w-5 h-5" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-neutral-900 dark:text-white">
                  {activeRole === 'developer'
                    ? (language === 'tj' ? 'Панели Барномасоз' : language === 'ru' ? 'Панель Разработчика' : 'Developer Panel')
                    : activeRole === 'staff'
                    ? (language === 'tj' ? 'Панели Персонал' : language === 'ru' ? 'Панель Персонала' : 'Staff Panel')
                    : (language === 'tj' ? 'Панели Администратор' : language === 'ru' ? 'Панель Администратора' : 'Admin Panel')}
                </h1>
                {/* Authority Role Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold border uppercase tracking-wider ${
                    activeRole === 'staff'
                      ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
                      : activeRole === 'admin'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 ring-1 ring-purple-500/20'
                  }`}
                >
                  {activeRole === 'staff' ? (
                    <UserCheck className="w-3.5 h-3.5" />
                  ) : activeRole === 'admin' ? (
                    <Shield className="w-3.5 h-3.5" />
                  ) : (
                    <Code2 className="w-3.5 h-3.5" />
                  )}
                  <span>{activeRole}</span>
                </div>

                {/* Supabase Live Status Badge */}
                <div
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  title="Database: Supabase PostgreSQL connected and real-time syncing"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Supabase Live</span>
                </div>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {activeRole === 'staff'
                  ? (language === 'tj' ? 'Мақоми Персонал (Танҳо Омор ва Фармоишҳои фаъол)' : language === 'ru' ? 'Роль Персонала (Только аналитика и живые заказы)' : 'Staff Role (Analytics & Live Orders Only)')
                  : activeRole === 'admin'
                  ? (language === 'tj' ? 'Мақоми Администратор (Идоракунии мукаммали меню ва мағоза)' : language === 'ru' ? 'Роль Администратора (Управление меню и заказами)' : 'Admin Role (Menu & Store Management)')
                  : (language === 'tj' ? 'Мақоми Барномасоз (Дастрасии комил, танзимоти системавӣ ва воридоти Excel)' : language === 'ru' ? 'Роль Разработчика (Полный доступ, системные настройки и Excel импорт)' : 'Developer Role (All Features, System Config & Excel Bulk Import)')}
              </p>
            </div>
          </div>

          {/* Actions: Exit to Customer Menu & Logout */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Back to Customer Menu */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>{language === 'tj' ? 'Бозгашт ба Меню' : language === 'ru' ? 'В меню клиентов' : 'Customer Menu'}</span>
            </button>

            {/* Logout */}
            <button
              onClick={() => {
                setIsAdminAuthenticated(false);
                onClose();
              }}
              className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Logout from CMS"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* CMS TAB NAVIGATION BAR                                         */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-[61px] z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Tab 1: Analytics & Orders (All roles) */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 py-3.5 px-4 border-b-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t('analytics', language)} & {language === 'tj' ? 'Фармоишҳо' : language === 'ru' ? 'Заказы' : 'Orders'}</span>
          </button>

          {/* Tab 2: Menu Management (Admin & Developer) */}
          {allowedTabs.includes('menu') && (
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-2 py-3.5 px-4 border-b-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'menu'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('manageMenu', language)}</span>
            </button>
          )}

          {/* Tab 3: Categories (Admin & Developer) */}
          {allowedTabs.includes('categories') && (
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 py-3.5 px-4 border-b-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t('manageCategories', language)}</span>
            </button>
          )}

          {/* Tab 4: Store Settings (Admin & Developer) */}
          {allowedTabs.includes('settings') && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 py-3.5 px-4 border-b-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{t('storeSettings', language)}</span>
            </button>
          )}

          {/* Tab 5: Developer Tools (Developer only) */}
          {allowedTabs.includes('developer') && (
            <button
              onClick={() => setActiveTab('developer')}
              className={`flex items-center gap-2 py-3.5 px-4 border-b-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'developer'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400 font-extrabold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Code2 className="w-4 h-4 text-purple-500" />
              <span>Developer Config</span>
            </button>
          )}

          {/* Tab 6: Bulk Menu Import (Developer only) */}
          {allowedTabs.includes('import') && (
            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-2 py-3.5 px-4 border-b-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'import'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Menu Import (Excel)</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA                                              */}
      {/* ============================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* ============================================================ */}
        {/* TAB 1: ANALYTICS & RECENT ORDERS                             */}
        {/* ============================================================ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Top Bar with Date Range Filters & Order Sort */}
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-neutral-500 flex items-center gap-1.5 mr-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>{language === 'tj' ? 'Давраи сана:' : language === 'ru' ? 'Период дат:' : 'Date Period:'}</span>
                </span>

                {/* Quick Date Filters */}
                {(['today', 'yesterday', 'all', 'custom'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setDateFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      dateFilter === filter
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {filter === 'today'
                      ? (language === 'tj' ? 'Имрӯз (Today)' : language === 'ru' ? 'Сегодня (Today)' : 'Today')
                      : filter === 'yesterday'
                      ? (language === 'tj' ? 'Дирӯз (Yesterday)' : language === 'ru' ? 'Вчера (Yesterday)' : 'Yesterday')
                      : filter === 'all'
                      ? (language === 'tj' ? 'Ҳама давр' : language === 'ru' ? 'За всё время' : 'All Time')
                      : (language === 'tj' ? 'Интихоби сана (Custom)' : language === 'ru' ? 'Календарь (Custom)' : 'Custom')}
                  </button>
                ))}
              </div>

              {/* Custom Date Pickers when 'custom' is active */}
              {dateFilter === 'custom' && (
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-mono"
                  />
                  <span>—</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-mono"
                  />
                </div>
              )}

              {/* Order Sort Toggle */}
              <button
                type="button"
                onClick={() => setOrderSortDirection((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200/80 dark:border-neutral-700/80 transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
                <span>{orderSortDirection === 'newest' ? 'Newest First' : 'Oldest First'}</span>
              </button>
            </div>

            {/* Top KPI Cards (Calculated on selected date range) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                  {language === 'tj' ? 'Фурӯши умумӣ' : language === 'ru' ? 'Выручка' : 'Total Revenue'}
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tabular-nums">
                    {totalSales}
                  </span>
                  <span className="text-xs font-bold text-amber-600">{storeSettings.currency}</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                  {language === 'tj' ? 'Шумораи фармоиш' : language === 'ru' ? 'Всего заказов' : 'Total Orders'}
                </span>
                <span className="mt-1 text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tabular-nums block">
                  {dateFilteredOrders.length}
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                  {language === 'tj' ? 'Чек миёна' : language === 'ru' ? 'Средний чек' : 'Avg Order Value'}
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tabular-nums">
                    {averageTicket}
                  </span>
                  <span className="text-xs font-bold text-neutral-500">{storeSettings.currency}</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                  {language === 'tj' ? 'Фармоишҳои фаъол' : language === 'ru' ? 'Активные заказы' : 'Active Orders'}
                </span>
                <span className="mt-1 text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums block">
                  {inProgressOrders}
                </span>
              </div>
            </div>

            {/* TOP SELLING ITEMS SECTION */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-neutral-900 dark:text-white">
                      {language === 'tj' ? 'Таомҳои серхаридортарин (Top Selling Items)' : language === 'ru' ? 'Хиты продаж (Top Selling Items)' : 'Top Selling Items'}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      {language === 'tj'
                        ? 'Рейтинги таомҳо аз рӯи шумораи фурӯш дар давраи интихобшуда'
                        : 'Рейтинг позиций по количеству заказов за выбранный период'}
                    </p>
                  </div>
                </div>
              </div>

              {topSellingItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  {language === 'tj' ? 'Дар ин давра фурӯш сабт нашудааст' : 'В этом периоде пока нет продаж'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {topSellingItems.slice(0, 6).map((item, idx) => {
                    const pct = Math.round((item.quantity / maxSoldQty) * 100);
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                                idx === 0
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : idx === 1
                                  ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                                  : idx === 2
                                  ? 'bg-amber-700/30 text-amber-700 dark:text-amber-400'
                                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 shrink-0">
                            {item.quantity} {language === 'tj' ? 'дона' : language === 'ru' ? 'шт' : 'pcs'}
                          </span>
                        </div>

                        {/* Progress Bar & Subtotal */}
                        <div className="space-y-1">
                          <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] text-neutral-500">
                            <span>{language === 'tj' ? 'Маблағи фурӯш:' : language === 'ru' ? 'Выручка:' : 'Revenue:'}</span>
                            <span className="font-bold text-neutral-700 dark:text-neutral-300">
                              {item.revenue} {storeSettings.currency}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Channels & Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white mb-3">
                  {language === 'tj' ? 'Каналҳои қабули фармоиш' : language === 'ru' ? 'Источники заказов' : 'Order Channels'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-amber-600">
                        <ShoppingBag className="w-3.5 h-3.5" /> Direct In-App ({directOrders})
                      </span>
                      <span>{dateFilteredOrders.length ? Math.round((directOrders / dateFilteredOrders.length) * 100) : 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${dateFilteredOrders.length ? (directOrders / dateFilteredOrders.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp ({whatsappOrders})
                      </span>
                      <span>{dateFilteredOrders.length ? Math.round((whatsappOrders / dateFilteredOrders.length) * 100) : 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${dateFilteredOrders.length ? (whatsappOrders / dateFilteredOrders.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="flex items-center gap-1.5 text-sky-600">
                        <Send className="w-3.5 h-3.5" /> Telegram ({telegramOrders})
                      </span>
                      <span>{dateFilteredOrders.length ? Math.round((telegramOrders / dateFilteredOrders.length) * 100) : 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${dateFilteredOrders.length ? (telegramOrders / dateFilteredOrders.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white mb-3">
                  {language === 'tj' ? 'Ҳолати фармоишҳо' : language === 'ru' ? 'Статусы выполнения' : 'Order Completion'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="text-lg font-extrabold text-blue-600 block">{dateFilteredOrders.filter((o) => o.status === 'new').length}</span>
                    <span className="text-[11px] font-medium text-neutral-500">1. Нав / New</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="text-lg font-extrabold text-amber-600 block">{dateFilteredOrders.filter((o) => o.status === 'preparing').length}</span>
                    <span className="text-[11px] font-medium text-neutral-500">2. Омодасозӣ</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="text-lg font-extrabold text-sky-600 block">{dateFilteredOrders.filter((o) => o.status === 'out_for_delivery').length}</span>
                    <span className="text-[11px] font-medium text-neutral-500">3. Дар роҳ</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="text-lg font-extrabold text-emerald-600 block">{deliveredOrders}</span>
                    <span className="text-[11px] font-medium text-neutral-500">4. Расонида шуд</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders List with Status Control */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-base text-neutral-900 dark:text-white">
                    {language === 'tj' ? 'Рӯйхати фармоишҳо' : language === 'ru' ? 'Лента заказов' : 'Recent Orders'} ({filteredOrders.length})
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {activeRole === 'developer'
                      ? 'Developer authority: You have full access including permanent order deletion'
                      : 'Staff/Admin authority: Manage real-time order statuses'}
                  </p>
                </div>

                {/* Status filter pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { key: 'all', label: language === 'tj' ? 'Ҳама' : language === 'ru' ? 'Все' : 'All' },
                    { key: 'new', label: '1. New' },
                    { key: 'preparing', label: '2. Preparing' },
                    { key: 'out_for_delivery', label: '3. Out for Delivery' },
                    { key: 'delivered', label: '4. Delivered / Ready' },
                    { key: 'cancelled', label: 'Cancelled' },
                  ].map((st) => (
                    <button
                      key={st.key}
                      onClick={() => setOrderStatusFilter(st.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        orderStatusFilter === st.key
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                  <div className="p-10 text-center text-xs text-neutral-400 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
                    {language === 'tj' ? 'Фармоише дар ин давра ёфт нашуд' : 'Заказов не найдено в этом периоде'}
                  </div>
                ) : (
                  filteredOrders.map((o) => (
                    <div
                      key={o.id}
                      className="p-4 sm:p-4.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200/80 dark:border-neutral-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-neutral-300 dark:hover:border-neutral-600"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm sm:text-base font-mono text-neutral-900 dark:text-white">
                            {o.orderNumber}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                            {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              o.channel === 'direct'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                : o.channel === 'whatsapp'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                : 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400'
                            }`}
                          >
                            {o.channel === 'direct' ? 'Direct App' : o.channel}
                          </span>
                        </div>

                        <div className="text-xs text-neutral-700 dark:text-neutral-300">
                          <span className="font-bold">{o.customer.name}</span> ({o.customer.phone || o.customer.telegramHandle || 'No contact'}) ·{' '}
                          <span className="font-semibold text-neutral-900 dark:text-white capitalize">
                            {o.customer.deliveryType === 'delivery'
                              ? 'Бурдарасонӣ (Delivery)'
                              : o.customer.deliveryType === 'pickup'
                              ? 'Бо худ (Takeaway)'
                              : 'Дар ошхона (Dine-in)'}
                          </span>{' '}
                          ({o.customer.addressOrTable})
                        </div>

                        <div className="text-xs text-neutral-500">
                          {o.items.map((it) => `${it.name} x${it.quantity}`).join(', ')}
                        </div>

                        {/* Cancellation Reason alert if cancelled */}
                        {o.status === 'cancelled' && o.cancellationReason && (
                          <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-lg px-2.5 py-1 w-fit mt-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{t('cancellationReasonTitle', language)}:</span>
                            <span className="font-medium text-rose-700 dark:text-rose-300">{o.cancellationReason}</span>
                          </div>
                        )}
                      </div>

                      {/* Price and Status Buttons */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-base font-extrabold text-neutral-900 dark:text-white tabular-nums">
                          {o.total} {storeSettings.currency}
                        </span>

                        {/* Status Dropdown (Tailored for delivery vs dine-in/takeaway) */}
                        <select
                          value={
                            o.customer.deliveryType !== 'delivery' && (o.status === 'delivered' || o.status === 'completed')
                              ? 'completed'
                              : o.status
                          }
                          onChange={(e) => handleStatusChange(o, e.target.value as OrderStatus)}
                          className={`text-xs font-bold px-3 py-2 rounded-xl border focus:outline-none cursor-pointer ${
                            o.status === 'delivered' || o.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400'
                              : o.status === 'out_for_delivery'
                              ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400'
                              : o.status === 'preparing'
                              ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400'
                              : o.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-400'
                              : 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400'
                          }`}
                        >
                          <option value="new">1. New (Қабул шуд)</option>
                          <option value="preparing">2. Preparing (Омодасозӣ)</option>
                          {o.customer.deliveryType === 'delivery' ? (
                            <>
                              <option value="out_for_delivery">3. Out for Delivery (Дар роҳ / Курер)</option>
                              <option value="delivered">4. Delivered (Расонида шуд)</option>
                            </>
                          ) : (
                            <option value="completed">
                              {o.customer.deliveryType === 'dine_in'
                                ? '3. Ready / Served (Тайёр / Ба миз)'
                                : '3. Ready / Completed (Тайёр / Барои гирифтан)'}
                            </option>
                          )}
                          <option value="cancelled">✕ Cancelled (Бекор кардан...)</option>
                        </select>

                        {/* Delete Order Record: KEPT ONLY FOR DEVELOPER ROLE */}
                        {activeRole === 'developer' && (
                          <button
                            onClick={() => deleteOrder(o.id)}
                            className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete order record (Developer only)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: MENU ITEMS MANAGEMENT (Admin & Developer)             */}
        {/* ============================================================ */}
        {activeTab === 'menu' && allowedTabs.includes('menu') && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3.5 p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-500" />
                    <span>{t('manageMenu', language)}</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {language === 'tj'
                      ? 'Таомҳоро кашола карда (Drag & Drop) ё бо тугмаҳои ↑ / ↓ ҷойиваз кунед, то пайдарпайии онҳо дар саҳифаи асосӣ тағйир ёбад'
                      : language === 'ru'
                      ? 'Перетаскивайте (Drag & Drop) или используйте стрелки для изменения порядка блюд на главной странице'
                      : 'Drag & drop or use arrows to rearrange the display order of menu items on the main page'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleOpenNewItem}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('addNewItem', language)}</span>
                  </button>
                </div>
              </div>

              {/* Filtering Controls: Category & Visibility */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                {/* Category Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none text-xs">
                  <button
                    type="button"
                    onClick={() => setMenuCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      menuCategoryFilter === 'all'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {t('allCategories', language)}
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setMenuCategoryFilter(c.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                        menuCategoryFilter === c.id
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <span>{c.icon}</span>
                      <span>{c.name[language] || c.name.en}</span>
                    </button>
                  ))}
                </div>

                {/* Visibility Filter */}
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setMenuVisibilityFilter('all')}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer ${menuVisibilityFilter === 'all' ? 'bg-white dark:bg-neutral-900 text-amber-600 shadow-xs font-bold' : 'text-neutral-500'}`}
                  >
                    All ({safeMenuItems.length})
                  </button>
                  <button
                    onClick={() => setMenuVisibilityFilter('visible')}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer ${menuVisibilityFilter === 'visible' ? 'bg-white dark:bg-neutral-900 text-amber-600 shadow-xs font-bold' : 'text-neutral-500'}`}
                  >
                    Visible ({safeMenuItems.filter((i) => !i.isHidden).length})
                  </button>
                  <button
                    onClick={() => setMenuVisibilityFilter('hidden')}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer ${menuVisibilityFilter === 'hidden' ? 'bg-white dark:bg-neutral-900 text-amber-600 shadow-xs font-bold' : 'text-neutral-500'}`}
                  >
                    Hidden ({safeMenuItems.filter((i) => i.isHidden).length})
                  </button>
                </div>
              </div>
            </div>

            {/* Drag & Drop Instruction Notice */}
            <div className="px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-semibold">
              <ArrowUpDown className="w-4 h-4 shrink-0" />
              <span>
                {language === 'tj'
                  ? 'Таомҳоро бо дастаки ⠿ кашола карда тартиб диҳед ё тирчаҳои ↑ / ↓-ро пахш намоед — тартиби онҳо фавран дар саҳифаи асосӣ тағйир меёбад'
                  : language === 'ru'
                  ? 'Перетаскивайте блюда за иконку ⠿ или используйте стрелки ↑ / ↓ — порядок сразу изменится на главной странице'
                  : 'Drag dishes by the ⠿ handle or use ↑ / ↓ arrows — the order changes immediately on the main page'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMenuItems.map((item, index) => {
                const isDragging = draggedMenuItemId === item.id;
                const isOver = dragOverMenuItemId === item.id && !isDragging;
                const globalIndex = safeMenuItems.findIndex((m) => m.id === item.id);

                return (
                  <div
                    key={item.id}
                    draggable={true}
                    onDragStart={(e) => handleMenuItemDragStart(e, item.id)}
                    onDragOver={(e) => handleMenuItemDragOver(e, item.id)}
                    onDrop={(e) => handleMenuItemDrop(e, item.id)}
                    onDragEnd={handleMenuItemDragEnd}
                    className={`p-4 rounded-3xl border bg-white dark:bg-neutral-900 transition-all duration-150 flex flex-col justify-between gap-3 select-none ${
                      isDragging
                        ? 'opacity-40 scale-95 border-amber-500 border-dashed ring-2 ring-amber-500/30 shadow-none'
                        : isOver
                        ? 'border-amber-500 ring-2 ring-amber-500/50 bg-amber-50/40 dark:bg-amber-950/20 scale-[1.02] shadow-md'
                        : item.isHidden
                        ? 'opacity-70 border-dashed border-neutral-300 dark:border-neutral-700'
                        : 'border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Drag Handle & Reorder Position */}
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                        <div
                          className="cursor-grab active:cursor-grabbing p-1.5 text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="Drag to reorder dish"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 px-1 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800">
                          #{globalIndex + 1}
                        </span>
                      </div>

                      <img
                        src={resolveMenuItemImage(item)}
                        alt={item.name[language] || item.name.en}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const fallback = getFallbackImageForCategory(item.categoryId);
                          if (!e.currentTarget.src.endsWith(fallback)) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                        className="w-16 h-16 rounded-2xl object-cover bg-neutral-200 dark:bg-neutral-700 shrink-0"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                            {item.name[language] || item.name.en}
                          </h4>
                          {item.isHidden && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20">
                              Hidden
                            </span>
                          )}
                          {item.isPopular && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5 fill-current" />
                              Popular
                            </span>
                          )}
                          {item.isSpicy && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 border border-red-500/20 flex items-center gap-0.5">
                              🌶️ Spicy
                            </span>
                          )}
                          {item.isNew && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 border border-sky-500/20 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              New
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                          {item.price} {storeSettings.currency}
                        </span>
                        <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                          {item.description[language] || item.description.en}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                      {/* Left: Availability & Hidden Toggles */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleItemAvailability(item.id)}
                          className={`px-2 py-0.5 rounded-lg font-bold text-[11px] cursor-pointer ${
                            item.isAvailable
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleItemHidden(item.id)}
                          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                          title={item.isHidden ? 'Make visible to customers' : 'Hide from customers'}
                        >
                          {item.isHidden ? <EyeOff className="w-4 h-4 text-rose-500" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Right: Move Up / Down, Edit, Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={globalIndex === 0}
                          onClick={() => handleMoveMenuItem(item.id, 'up')}
                          className="p-1 rounded-lg text-neutral-400 hover:text-amber-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                          title="Move Up"
                          aria-label="Move Up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          disabled={globalIndex === safeMenuItems.length - 1}
                          onClick={() => handleMoveMenuItem(item.id, 'down')}
                          className="p-1 rounded-lg text-neutral-400 hover:text-amber-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                          title="Move Down"
                          aria-label="Move Down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setIsItemModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteMenuItem(item.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: CATEGORIES MANAGEMENT (Admin & Developer)             */}
        {/* ============================================================ */}
        {activeTab === 'categories' && allowedTabs.includes('categories') && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
              <div>
                <h3 className="font-extrabold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-500" />
                  <span>{t('manageCategories', language)}</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {language === 'tj'
                    ? 'Категорияҳоро кашола карда (Drag & Drop) ё бо тугмаҳои ↑ / ↓ ҷойиваз намоед'
                    : language === 'ru'
                    ? 'Перетаскивайте (Drag & Drop) или используйте стрелки для изменения порядка категорий на главной странице'
                    : 'Drag & drop or use arrows to rearrange category order on the main page'}
                </p>
              </div>
              <button
                onClick={handleOpenNewCategory}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addCategory', language)}</span>
              </button>
            </div>

            {/* Drag & Drop Reorder Notice */}
            <div className="px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-semibold">
              <ArrowUpDown className="w-4 h-4 shrink-0" />
              <span>
                {language === 'tj'
                  ? 'Категорияҳоро бо дастаки ⠿ кашола карда тартиб диҳед — тартиби онҳо фавран дар саҳифаи муштариён нав мешавад'
                  : language === 'ru'
                  ? 'Перетаскивайте категории за иконку ⠿ — новый порядок сразу отображается у покупателей'
                  : 'Drag category cards by the ⠿ handle or use ↑ / ↓ arrows — changes reflect immediately on the customer menu'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat, index) => {
                const isDragging = draggedCategoryId === cat.id;
                const isOver = dragOverCategoryId === cat.id && !isDragging;
                return (
                  <div
                    key={cat.id}
                    draggable={true}
                    onDragStart={(e) => handleCategoryDragStart(e, cat.id)}
                    onDragOver={(e) => handleCategoryDragOver(e, cat.id)}
                    onDrop={(e) => handleCategoryDrop(e, cat.id)}
                    onDragEnd={handleCategoryDragEnd}
                    className={`p-4 rounded-3xl bg-white dark:bg-neutral-900 border transition-all duration-150 flex items-center justify-between gap-2.5 select-none ${
                      isDragging
                        ? 'opacity-40 scale-95 border-amber-500 border-dashed ring-2 ring-amber-500/30 shadow-none'
                        : isOver
                        ? 'border-amber-500 ring-2 ring-amber-500/50 bg-amber-50/40 dark:bg-amber-950/20 scale-[1.02] shadow-md'
                        : 'border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Drag Handle */}
                      <div
                        className="cursor-grab active:cursor-grabbing p-1.5 text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
                        title="Drag to reorder category"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Position Badge & Emoji */}
                      <span className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 shrink-0">
                        #{index + 1}
                      </span>
                      <span className="text-2xl shrink-0">{cat.icon}</span>

                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                          {cat.name[language] || cat.name.en}
                        </h4>
                        <span className="text-[11px] text-neutral-400 font-mono truncate block">ID: {cat.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Move Up / Down Buttons for quick click or touch screens */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveCategory(index, 'up')}
                        className="p-1 rounded-lg text-neutral-400 hover:text-amber-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        title="Move Up"
                        aria-label="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === categories.length - 1}
                        onClick={() => handleMoveCategory(index, 'down')}
                        className="p-1 rounded-lg text-neutral-400 hover:text-amber-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                        title="Move Down"
                        aria-label="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory({ ...cat });
                          setOriginalCategoryId(cat.id);
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => deleteCategory(cat.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: STORE SETTINGS (Admin & Developer)                    */}
        {/* ============================================================ */}
        {activeTab === 'settings' && allowedTabs.includes('settings') && (
          <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-6">
            <div>
              <h3 className="font-extrabold text-lg text-neutral-900 dark:text-white">
                {t('storeSettings', language)}
              </h3>
              <p className="text-xs text-neutral-500">
                {language === 'tj'
                  ? 'Ном, телефонҳо, соатҳои корӣ ва каналҳои қабули фармоиш'
                  : 'Название, контактные данные, рабочие часы и каналы приёма заказов'}
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {language === 'tj' ? 'Номи муассиса' : language === 'ru' ? 'Название заведения' : 'Store Name'}
                </label>
                <input
                  type="text"
                  value={settingsForm.name}
                  onChange={(e) => {
                    setIsSettingsFormDirty(true);
                    setSettingsForm({ ...settingsForm, name: e.target.value });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    WhatsApp (+992...)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.whatsappNumber}
                    onChange={(e) => {
                      setIsSettingsFormDirty(true);
                      setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Telegram (@username)
                  </label>
                  <input
                    type="text"
                    value={settingsForm.telegramUsername}
                    onChange={(e) => {
                      setIsSettingsFormDirty(true);
                      setSettingsForm({ ...settingsForm, telegramUsername: e.target.value });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Dispatch Channel Enable/Disable Toggles for Admin & Developer */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3">
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-sky-500" />
                    <span>{language === 'tj' ? 'Каналҳои қабули фармоиш' : language === 'ru' ? 'Каналы приёма заказов' : 'Ordering Dispatch Channels'}</span>
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    {language === 'tj'
                      ? 'Тугмаҳои зерро пахш намуда, қабули фармоишро тавассути WhatsApp ё Telegram фаъол ва ғайрифаъол кунед'
                      : language === 'ru'
                      ? 'Включайте и отключайте возможность оформления заказов через WhatsApp или Telegram'
                      : 'Enable or disable ordering options via WhatsApp or Telegram for customers'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-neutral-900 dark:text-white">
                        {language === 'tj'
                          ? 'Фармоиши мустақим (Бе WhatsApp)'
                          : language === 'ru'
                          ? 'Прямые заказы в приложении (Без редиректа)'
                          : 'Direct In-App Checkout (No WhatsApp Redirect)'}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {language === 'tj'
                          ? 'Фармоиш бевосита ба система меравад, бе гузариш ба WhatsApp'
                          : language === 'ru'
                          ? 'Заказ сразу сохраняется в систему без переадресации в WhatsApp'
                          : 'Orders go directly to your dashboard without redirecting customers'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleDirectOrdering}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                      storeSettings.directOrderingOnly !== false
                        ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                    }`}
                  >
                    {storeSettings.directOrderingOnly !== false
                      ? language === 'tj'
                        ? 'Фаъол'
                        : language === 'ru'
                        ? 'Включено'
                        : 'Enabled'
                      : language === 'tj'
                      ? 'Хомӯш'
                      : language === 'ru'
                      ? 'Отключено'
                      : 'Disabled'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* WhatsApp Enable/Disable */}
                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#25D366]/15 text-[#25D366] flex items-center justify-center font-bold shrink-0">
                        <MessageCircle className="w-4 h-4 fill-current" />
                      </div>
                      <div>
                        <span className="font-bold text-xs block text-neutral-900 dark:text-white">WhatsApp Ordering</span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {settingsForm.whatsappNumber || 'Not configured'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleDispatchChannel('whatsapp')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        storeSettings.whatsappEnabled !== false
                          ? 'bg-[#25D366] text-white shadow-xs hover:bg-[#20bd5a]'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                      }`}
                    >
                      {storeSettings.whatsappEnabled !== false
                        ? language === 'tj'
                          ? 'Фаъол'
                          : language === 'ru'
                          ? 'Включено'
                          : 'Enabled'
                        : language === 'tj'
                        ? 'Хомӯш'
                        : language === 'ru'
                        ? 'Отключено'
                        : 'Disabled'}
                    </button>
                  </div>

                  {/* Telegram Enable/Disable */}
                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#0088cc]/15 text-[#0088cc] flex items-center justify-center font-bold shrink-0">
                        <Send className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs block text-neutral-900 dark:text-white">Telegram Ordering</span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          @{settingsForm.telegramUsername || 'Not configured'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleDispatchChannel('telegram')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                        storeSettings.telegramEnabled !== false
                          ? 'bg-[#0088cc] text-white shadow-xs hover:bg-[#0077b5]'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                      }`}
                    >
                      {storeSettings.telegramEnabled !== false
                        ? language === 'tj'
                          ? 'Фаъол'
                          : language === 'ru'
                          ? 'Включено'
                          : 'Enabled'
                        : language === 'tj'
                        ? 'Хомӯш'
                        : language === 'ru'
                        ? 'Отключено'
                        : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {language === 'tj' ? 'Соати кушодашавӣ' : 'Время открытия'}
                  </label>
                  <input
                    type="time"
                    value={settingsForm.workingHours.open}
                    onChange={(e) => {
                      setIsSettingsFormDirty(true);
                      setSettingsForm({
                        ...settingsForm,
                        workingHours: { ...settingsForm.workingHours, open: e.target.value },
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {language === 'tj' ? 'Соати пӯшидашавӣ' : 'Время закрытия'}
                  </label>
                  <input
                    type="time"
                    value={settingsForm.workingHours.close}
                    onChange={(e) => {
                      setIsSettingsFormDirty(true);
                      setSettingsForm({
                        ...settingsForm,
                        workingHours: { ...settingsForm.workingHours, close: e.target.value },
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  {t('saveChanges', language)}
                </button>
                {settingsSavedFeedback && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    <span>{language === 'tj' ? 'Танзимот сабт шуд!' : 'Настройки сохранены!'}</span>
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: DEVELOPER CONFIG (Developer only)                     */}
        {/* ============================================================ */}
        {activeTab === 'developer' && allowedTabs.includes('developer') && (
          <div className="space-y-6">
            {/* Header */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-neutral-900 dark:text-white">
                  Developer Configuration
                </h3>
                <p className="text-xs text-neutral-500">
                  Control system-level order types, sequencing, supported languages, and security PINs for Staff and Admin.
                </p>
              </div>
            </div>

            {/* Section 1: Enable / Disable Order Types */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>Customer Order Types</span>
                </h4>
                <p className="text-xs text-neutral-500">
                  Enable or disable order options for customers. Disabled options will immediately disappear from checkout.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Delivery */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="font-bold text-xs block text-neutral-900 dark:text-white">Delivery</span>
                      <span className="text-[11px] text-neutral-400">Бурдарасонӣ</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleDeliveryType('delivery')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                      storeSettings.enabledDeliveryTypes?.delivery !== false
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                    }`}
                  >
                    {storeSettings.enabledDeliveryTypes?.delivery !== false ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Takeaway / Pickup */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Store className="w-4 h-4 text-blue-500" />
                    <div>
                      <span className="font-bold text-xs block text-neutral-900 dark:text-white">Takeaway</span>
                      <span className="text-[11px] text-neutral-400">Бо худ (Самовывоз)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleDeliveryType('pickup')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                      storeSettings.enabledDeliveryTypes?.pickup !== false
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                    }`}
                  >
                    {storeSettings.enabledDeliveryTypes?.pickup !== false ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Dine-in */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
                    <div>
                      <span className="font-bold text-xs block text-neutral-900 dark:text-white">Dine-in</span>
                      <span className="text-[11px] text-neutral-400">Дар ошхона</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleDeliveryType('dine_in')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                      storeSettings.enabledDeliveryTypes?.dine_in !== false
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                    }`}
                  >
                    {storeSettings.enabledDeliveryTypes?.dine_in !== false ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>

            {/* Section: Dispatch Channels (WhatsApp & Telegram) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-500" />
                  <span>Dispatch Channels (Order Redirection)</span>
                </h4>
                <p className="text-xs text-neutral-500">
                  Enable or disable dispatch channels for customer checkouts. When enabled, customers can submit orders through that platform.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-neutral-900 dark:text-white">Direct Single-Button Checkout</span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Enabled: Show 1 &quot;Place Order&quot; button. Disabled: Let customer choose WhatsApp or Telegram button.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleDirectOrdering}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                    storeSettings.directOrderingOnly !== false
                      ? 'bg-amber-500 text-white shadow-xs hover:bg-amber-600'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 hover:bg-neutral-300'
                  }`}
                >
                  {storeSettings.directOrderingOnly !== false ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* WhatsApp Dispatch */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center font-bold shrink-0">
                      <MessageCircle className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-neutral-900 dark:text-white">WhatsApp Dispatch</span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                        {storeSettings.whatsappNumber || 'Not set'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleDispatchChannel('whatsapp')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      storeSettings.whatsappEnabled !== false
                        ? 'bg-emerald-500 text-white shadow-xs hover:bg-emerald-600'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 hover:bg-neutral-300'
                    }`}
                  >
                    {storeSettings.whatsappEnabled !== false ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Telegram Dispatch */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0088cc]/15 text-[#0088cc] flex items-center justify-center font-bold shrink-0">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-neutral-900 dark:text-white">Telegram Dispatch</span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                        @{storeSettings.telegramUsername || 'Not set'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleDispatchChannel('telegram')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      storeSettings.telegramEnabled !== false
                        ? 'bg-emerald-500 text-white shadow-xs hover:bg-emerald-600'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 hover:bg-neutral-300'
                    }`}
                  >
                    {storeSettings.telegramEnabled !== false ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>

            {/* Section: Customer CMS Button Visibility */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Customer CMS Button Visibility</span>
                </h4>
                <p className="text-xs text-neutral-500">
                  Choose whether the CMS / Admin shield icon is visible to customers in the header and footer.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                <button
                  type="button"
                  onClick={() => handleToggleCmsButtonVisibility(false)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    storeSettings.cmsButtonVisible !== true && storeSettings.cmsAccessMode !== 'visible'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <EyeOff className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-extrabold text-sm">Hidden (Recommended)</span>
                  </div>
                  <span className="text-xs text-neutral-500 block leading-relaxed">
                    Shield button is completely invisible to public customers. Staff & Admin use gestures or shortcuts to log in.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleCmsButtonVisibility(true)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    storeSettings.cmsButtonVisible === true || storeSettings.cmsAccessMode === 'visible'
                      ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-extrabold text-sm">Visible</span>
                  </div>
                  <span className="text-xs text-neutral-500 block leading-relaxed">
                    CMS shield button is displayed openly in the header and footer for convenient access.
                  </span>
                </button>
              </div>
            </div>

            {/* Section: Secret Access Shortcuts for Login */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-purple-500" />
                  <span>Secret Login Shortcuts & Gestures</span>
                </h4>
                <p className="text-xs text-neutral-500">
                  Configure hidden gestures and key combinations that allow staff, admin, and developers to bring up the CMS login modal even when the CMS button is hidden.
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Triple Click on Logo */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs shrink-0">
                      3x
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-neutral-900 dark:text-white">
                        Triple-Click on Logo
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Tap or click restaurant logo 3 times rapidly to trigger login modal
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleShortcut('enableTripleClick')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      storeSettings.shortcutSettings?.enableTripleClick !== false
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                    }`}
                  >
                    {storeSettings.shortcutSettings?.enableTripleClick !== false ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* 2. Holding / Long-Press on Logo */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-neutral-900 dark:text-white">
                        Hold Logo (Long-Press 1.8s)
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Press & hold the logo icon for 1.8 seconds on desktop or mobile
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleShortcut('enableLongPress')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      storeSettings.shortcutSettings?.enableLongPress !== false
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                    }`}
                  >
                    {storeSettings.shortcutSettings?.enableLongPress !== false ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* 3. Keyboard Shortcut */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                        <Keyboard className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs block text-neutral-900 dark:text-white">
                          Keyboard Hotkey Shortcut
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          Press combination anywhere on customer page to prompt login
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleShortcut('enableKeyboardShortcut')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        storeSettings.shortcutSettings?.enableKeyboardShortcut !== false
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                      }`}
                    >
                      {storeSettings.shortcutSettings?.enableKeyboardShortcut !== false ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {storeSettings.shortcutSettings?.enableKeyboardShortcut !== false && (
                    <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60">
                      <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">
                        Selected Key Combination:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { key: 'ctrl+shift+a' as const, label: 'Ctrl + Shift + A' },
                          { key: 'alt+shift+c' as const, label: 'Alt + Shift + C' },
                          { key: 'ctrl+alt+m' as const, label: 'Ctrl + Alt + M' },
                          { key: 'shift+esc' as const, label: 'Shift + Escape' },
                        ].map((hk) => {
                          const isSelected = (storeSettings.shortcutSettings?.keyboardShortcut || 'ctrl+shift+a') === hk.key;
                          return (
                            <button
                              key={hk.key}
                              type="button"
                              onClick={() => handleSelectKeyboardShortcut(hk.key)}
                              className={`py-2 px-2.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer text-center ${
                                isSelected
                                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                                  : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-purple-400'
                              }`}
                            >
                              {hk.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Order Number Sequencing / Format */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-extrabold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                    <Hash className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span>
                      {language === 'tj'
                        ? 'Тартиб ва рақамгузории фармоишҳо'
                        : language === 'ru'
                        ? 'Нумерация и начальная точка заказов'
                        : 'Order Number Length & Sequencing'}
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                    {language === 'tj'
                      ? 'Рақами оғозро муайян кунед (масалан 0001 ё 0056). Ҳар як фармоиши нав ба таври худкор 1 рақам зиёд шуда (0057, 0058...) дар пойгоҳи маълумот сабт мегардад.'
                      : language === 'ru'
                      ? 'Задайте начальную точку нумерации (например 0001 или 0056). С каждым новым заказом номер будет увеличиваться на 1 (0057, 0058...) и синхронизироваться с базой данных.'
                      : 'Set the starting point for order numbers (e.g. 0001 or 0056). Every new order sequentially increments by 1 (0057, 0058...) and saves to the database for seamless tracking.'}
                  </p>
                </div>
              </div>

              {/* Step 1: Format Selector (4 Digits vs 6 Digits) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-2">
                  1. {language === 'tj' ? 'Дарозии рақам (Формат)' : language === 'ru' ? 'Длина номера (Формат)' : 'Digit Format'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  <button
                    type="button"
                    onClick={() => handleSetOrderNumberFormat('4-digits')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      storeSettings.orderNumberFormat !== '6-digits'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    <span className="font-extrabold text-sm block">4 Digits (0000)</span>
                    <span className="text-xs text-neutral-500 font-mono mt-0.5 block">
                      e.g. #0001, #0056, #0057
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetOrderNumberFormat('6-digits')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      storeSettings.orderNumberFormat === '6-digits'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    <span className="font-extrabold text-sm block">6 Digits (000000)</span>
                    <span className="text-xs text-neutral-500 font-mono mt-0.5 block">
                      e.g. #000001, #000056, #000057
                    </span>
                  </button>
                </div>
              </div>

              {/* Step 2: Set Starting Number & Counter */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-2">
                  2. {language === 'tj' ? 'Нуқтаи оғоз / Рақами навбатии фармоиш' : language === 'ru' ? 'Начальная точка / Следующий номер заказа' : 'Starting Point / Next Order Number'}
                </label>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
                  {/* Prefix Box */}
                  <div className="flex items-center">
                    <span className="px-3.5 py-3 rounded-l-2xl bg-neutral-100 dark:bg-neutral-800 border border-r-0 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 font-mono font-bold text-base select-none">
                      #
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={orderStartingInput}
                      onChange={(e) => setOrderStartingInput(e.target.value)}
                      placeholder="0001"
                      className="w-36 px-4 py-3 rounded-r-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white font-mono font-extrabold text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyOrderStartingPoint()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition-all shrink-0"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      {language === 'tj' ? 'Сабти нуқтаи оғоз' : language === 'ru' ? 'Применить и сохранить' : 'Set & Save Counter'}
                    </span>
                  </button>

                  {orderNumberSavedFeedback && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                      <Check className="w-4 h-4" />
                      <span>{language === 'tj' ? 'Дар пойгоҳ сабт шуд!' : language === 'ru' ? 'Сохранено в базе данных!' : 'Saved to database!'}</span>
                    </span>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-neutral-400">
                    {language === 'tj' ? 'Мисолҳои зуд:' : language === 'ru' ? 'Быстрый выбор:' : 'Quick Presets:'}
                  </span>
                  {[
                    { label: storeSettings.orderNumberFormat === '6-digits' ? '000001' : '0001', val: 1 },
                    { label: storeSettings.orderNumberFormat === '6-digits' ? '000050' : '0050', val: 50 },
                    { label: storeSettings.orderNumberFormat === '6-digits' ? '000056' : '0056', val: 56 },
                    { label: storeSettings.orderNumberFormat === '6-digits' ? '000100' : '0100', val: 100 },
                    { label: storeSettings.orderNumberFormat === '6-digits' ? '001000' : '1000', val: 1000 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => {
                        setOrderStartingInput(String(p.val));
                        handleApplyOrderStartingPoint(p.val);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-neutral-100 hover:bg-purple-100 dark:bg-neutral-800 dark:hover:bg-purple-950/60 text-neutral-700 dark:text-neutral-300 hover:text-purple-700 dark:hover:text-purple-300 border border-neutral-200 dark:border-neutral-700 transition-colors"
                    >
                      #{p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Live Sequence Visualizer */}
              {(() => {
                const num = parseInt(orderStartingInput.replace(/[^0-9]/g, '') || '1', 10) || 1;
                const isSix = storeSettings.orderNumberFormat === '6-digits';
                const p = storeSettings.orderNumberPrefix || '#';
                const f = (n: number) => `${p}${String(n).padStart(isSix ? 6 : 4, '0')}`;
                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/5 via-purple-500/10 to-indigo-500/5 border border-purple-500/20 space-y-2">
                    <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>
                          {language === 'tj' ? 'Пешнамоиши тартиби фармоишҳо:' : language === 'ru' ? 'Живой предпросмотр нумерации:' : 'Live Sequence Preview:'}
                        </span>
                      </span>
                      <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                        {isSix ? '6-digit pad' : '4-digit pad'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono">
                      <div className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-extrabold text-sm shadow-xs flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-sans tracking-wide bg-white/20 px-1.5 py-0.5 rounded-md">
                          {language === 'tj' ? 'Навбатӣ' : language === 'ru' ? 'Следующий' : 'Next'}
                        </span>
                        <span>{f(num)}</span>
                      </div>
                      <span className="text-neutral-400 dark:text-neutral-500 text-sm font-sans">→</span>
                      <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 text-xs font-bold">
                        {f(num + 1)}
                      </div>
                      <span className="text-neutral-400 dark:text-neutral-500 text-sm font-sans">→</span>
                      <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 text-xs font-bold">
                        {f(num + 2)}
                      </div>
                      <span className="text-neutral-400 dark:text-neutral-500 text-sm font-sans">→</span>
                      <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 text-xs font-bold">
                        {f(num + 3)}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Section 3: Enabled Customer Languages */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white">
                  Customer Languages
                </h4>
                <p className="text-xs text-neutral-500">
                  Choose which languages appear in the customer language dropdown on the main menu.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'tj' as const, label: 'Тоҷикӣ (TJ)', desc: 'Tajik language' },
                  { key: 'ru' as const, label: 'Русский (RU)', desc: 'Russian language' },
                  { key: 'en' as const, label: 'English (EN)', desc: 'English language' },
                ].map((l) => {
                  const isEnabled = storeSettings.enabledLanguages?.[l.key] !== false;
                  return (
                    <div
                      key={l.key}
                      className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-xs block text-neutral-900 dark:text-white">{l.label}</span>
                        <span className="text-[11px] text-neutral-400">{l.desc}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleLanguage(l.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                          isEnabled ? 'bg-emerald-500 text-white shadow-xs' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                        }`}
                      >
                        {isEnabled ? 'Active' : 'Hidden'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Role-Based Access Enforcement Notice */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-2">
              <h4 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>Server-Validated Role Authorization</span>
              </h4>
              <p className="text-xs text-neutral-500">
                Legacy quick PIN login has been removed. All privileged dashboard actions require a Supabase Auth session verified by the backend against <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">app_metadata.role</code>, <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">public.team_roles</code>, or server email allowlists.
              </p>
            </div>

            {/* Section 5: Supabase Cloud Storage for Images & Database */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-emerald-500" />
                    <span>
                      {language === 'tj'
                        ? 'Сабти расмҳо ва пойгоҳи додаҳо дар Supabase'
                        : language === 'ru'
                        ? 'Хранилище картинок и база данных Supabase'
                        : 'Supabase Cloud Storage & Database'}
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                    {language === 'tj'
                      ? 'Пойгоҳи додаҳо ва расмҳои таомҳо мустақиман бо лоиҳаи шумо дар Supabase пайваст шудаанд. Сабади «menu_images»-ро метавонед дар панели Supabase идора кунед.'
                      : language === 'ru'
                      ? 'База данных и изображения блюд напрямую подключены к вашему проекту Supabase. Управляйте бакетом «menu_images» в панели Supabase.'
                      : `Database and dish images connect directly to your configured Supabase project${supabaseProjectRef ? ` (${supabaseProjectRef})` : ''}. Dish uploads are stored in the "menu_images" bucket.`}
                  </p>
                </div>

                <a
                  href={`${supabaseDashboardBase}${supabaseProjectRef ? '/storage/buckets' : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
                >
                  <span>Supabase Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Bucket details and status check */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">Project / Bucket:</span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-white px-2 py-0.5 rounded-lg bg-neutral-200 dark:bg-neutral-700">
                      {supabaseProjectRef || 'env-configured'} / menu_images
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestStorage}
                    disabled={testingStorage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 font-bold text-xs transition-all cursor-pointer"
                  >
                    {testingStorage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                    <span>Test Storage Bucket</span>
                  </button>
                </div>

                {storageStatusResult && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      storageStatusResult.ok
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {storageStatusResult.ok ? <Check className="w-4 h-4 shrink-0 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />}
                    <span>{storageStatusResult.message}</span>
                  </div>
                )}

                {storageStatusResult && !storageStatusResult.ok && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <span>Storage RLS Policy Configuration</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyStorageSql}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        {copiedStorageSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedStorageSql ? 'Copied Storage SQL!' : 'Copy Storage SQL'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      Run this least-privilege script in your{' '}
                      <a
                        href={`${supabaseDashboardBase}${supabaseProjectRef ? '/sql/new' : ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline"
                      >
                        Supabase SQL Editor
                      </a>{' '}
                      so Admin &amp; Developer accounts can upload dish images:
                    </p>
                    <pre className="p-2.5 rounded-xl bg-neutral-900 text-neutral-300 font-mono text-[10px] overflow-x-auto">
                      {supabaseStoragePolicySql}
                    </pre>
                  </div>
                )}

                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1">
                  <p>
                    <strong>Cloud Storage Architecture:</strong> Dish images upload directly to Supabase Storage (<code className="bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 rounded">menu_images</code>) or through the authenticated <code className="bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 rounded">/api/upload</code> server proxy. Zero images are stored on container disk.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 6: Supabase Row Level Security (RLS) & Access Control */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span>
                      {language === 'tj'
                        ? 'Амнияти Supabase ва Сиёсатҳои RLS'
                        : language === 'ru'
                        ? 'Безопасность Supabase и Политики RLS'
                        : 'Supabase RLS Policies & Security Hardening'}
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                    {language === 'tj'
                      ? 'Сиёсатҳои кушодаро бекор намуда, тағйироти меню ва фармоишҳоро танҳо барои кормандон ва админҳои ваколатдор маҳдуд созед.'
                      : language === 'ru'
                      ? 'Отключите открытые публичные права на запись. Добавлять/изменять блюда и заказы смогут только авторизованные сотрудники.'
                      : 'Apply supabase/migrations/001_security_hardening.sql in Supabase SQL Editor so public users can browse visible items while PII orders and CMS writes require verified roles.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? (language === 'tj' ? 'Нусхабардорӣ шуд!' : language === 'ru' ? 'Скопировано!' : 'Copied SQL!') : (language === 'tj' ? 'Нусхабардории SQL' : language === 'ru' ? 'Копировать SQL' : 'Copy SQL Script')}</span>
                  </button>

                  <a
                    href={`${supabaseDashboardBase}${supabaseProjectRef ? '/sql/new' : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
                  >
                    <span>Supabase SQL Editor</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70">
                  <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] flex items-center justify-center font-mono">1</span>
                    <span>{language === 'tj' ? 'Нусхаи рамз' : language === 'ru' ? 'Скопируйте скрипт' : 'Copy Migration SQL'}</span>
                  </div>
                  <p className="text-neutral-500 text-[11px]">
                    {language === 'tj'
                      ? 'Тугмаи «Copy SQL Script»-ро пахш намоед'
                      : language === 'ru'
                      ? 'Нажмите оранжевую кнопку «Копировать SQL»'
                      : 'Run supabase/migrations/001_security_hardening.sql (or copy summary below)'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70">
                  <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] flex items-center justify-center font-mono">2</span>
                    <span>{language === 'tj' ? 'Кушодани SQL Editor' : language === 'ru' ? 'Вставьте в редактор' : 'Open SQL Editor'}</span>
                  </div>
                  <p className="text-neutral-500 text-[11px]">
                    {language === 'tj'
                      ? 'Барои кушодани саҳифаи SQL Editor-и Supabase тугмаи сабзро пахш намоед'
                      : language === 'ru'
                      ? 'Откройте SQL Editor в Supabase по зелёной ссылке и вставьте код'
                      : 'Click "Supabase SQL Editor" and paste into the query window'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70">
                  <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[11px] flex items-center justify-center font-mono">3</span>
                    <span>{language === 'tj' ? 'Иҷро кунед (Run)' : language === 'ru' ? 'Запустите (Run)' : 'Execute (Run)'}</span>
                  </div>
                  <p className="text-neutral-500 text-[11px]">
                    {language === 'tj'
                      ? 'Тугмаи «Run»-ро дар Supabase пахш кунед. Сиёсатҳои куҳна бекор ва сиёсатҳои нав фаъол мешаванд.'
                      : language === 'ru'
                      ? 'Нажмите «Run». Старые политики удалятся, а безопасные вступят в силу.'
                      : 'Press "Run". Least-privilege policies protect orders PII & admin tables.'}
                  </p>
                </div>
              </div>

              {/* SQL Code Preview */}
              <div className="relative rounded-2xl bg-neutral-950 border border-neutral-800 p-4 font-mono text-[11px] text-neutral-300 max-h-56 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{supabaseRlsSql}</pre>
              </div>
            </div>

            {/* Section 7: Supabase Team Accounts & Role Provisioning */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-500" />
                    <span>
                      {language === 'tj'
                        ? 'Идоракунии Корбарони Supabase ва Мақомҳо'
                        : language === 'ru'
                        ? 'Управление Командой и Ролями Supabase'
                        : 'Supabase Team Accounts & Roles'}
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xl">
                    {language === 'tj'
                      ? 'Эҷоди ҳисобҳои нав барои кормандон (staff), администраторон (admin) ва барномасозон (developer).'
                      : language === 'ru'
                      ? 'Создавайте аккаунты для сотрудников (staff), администраторов (admin) и разработчиков (developer).'
                      : 'Provision confirmed Supabase team accounts with trusted app_metadata roles (requires SUPABASE_SERVICE_ROLE_KEY on server).'}
                  </p>
                </div>

                <a
                  href={`${supabaseDashboardBase}${supabaseProjectRef ? '/auth/users' : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs shadow-xs transition-all shrink-0"
                >
                  <span>Supabase Auth Users</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Active Session Info */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <span>{supabaseAuthUser?.email || 'Verified Supabase Session'}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        {supabaseAuthUser?.role || activeRole}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      {supabaseAuthUser?.id
                        ? `Supabase User ID: ${supabaseAuthUser.id.substring(0, 12)}... (JWT server-verified)`
                        : 'Session verified against backend JWT authority.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Create Team Member Form */}
              <form onSubmit={handleCreateTeamMember} className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/70 space-y-3">
                <h5 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-amber-500" />
                  <span>{language === 'tj' ? 'Эҷоди корбари нави даста' : language === 'ru' ? 'Добавить нового члена команды' : 'Provision New Team Member'}</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={newTeamEmail}
                      onChange={(e) => setNewTeamEmail(e.target.value)}
                      placeholder="staff@efendi.tj"
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                      {language === 'tj' ? 'Парол' : language === 'ru' ? 'Пароль' : 'Password'}
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newTeamPassword}
                      onChange={(e) => setNewTeamPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                      {language === 'tj' ? 'Мақом (Role)' : language === 'ru' ? 'Роль' : 'Role'}
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['staff', 'admin', 'developer'] as AdminRole[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setNewTeamRole(r)}
                          className={`py-1.5 rounded-lg text-[11px] font-bold capitalize cursor-pointer transition-all ${
                            newTeamRole === r
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:text-neutral-900'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {teamMemberFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      teamMemberFeedback.ok
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {teamMemberFeedback.ok ? <Check className="w-4 h-4 shrink-0 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />}
                    <span>{teamMemberFeedback.message}</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={creatingTeamMember}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    {creatingTeamMember ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    <span>{language === 'tj' ? 'Сабти корбар' : language === 'ru' ? 'Создать пользователя' : 'Create Account'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: MENU BULK IMPORT VIA EXCEL (Developer only)           */}
        {/* ============================================================ */}
        {activeTab === 'import' && allowedTabs.includes('import') && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  <span>Bulk Menu Import via Excel / CSV</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Quickly add entire menus in bulk using a structured spreadsheet.
                </p>
              </div>

              {/* Download Excel Template Button */}
              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Excel Template (.xlsx)</span>
              </button>
            </div>

            {/* Category IDs Reference Table */}
            <div className="p-5 rounded-3xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-2">
              <span className="text-xs font-extrabold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Available Category IDs (use in "category_id" column):</span>
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {categories.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono"
                  >
                    <span>{c.icon}</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{c.id}</span>
                    <span className="text-neutral-400">({c.name[language] || c.name.en})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* File Upload Zone */}
            <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900 border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-base text-neutral-900 dark:text-white">
                  Upload Filled Excel / CSV File
                </h4>
                <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                  Supported formats: <strong>.xlsx</strong>, <strong>.xls</strong>, or <strong>.csv</strong>. Must contain headings like name_tj, name_ru, price, category_id.
                </p>
              </div>

              <div>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md cursor-pointer transition-all active:scale-95">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Choose Spreadsheet File</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {importFileName && (
                  <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-2 font-bold">
                    Selected: {importFileName}
                  </p>
                )}
              </div>

              {importErrorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-medium max-w-lg mx-auto">
                  {importErrorMessage}
                </div>
              )}

              {importSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold max-w-lg mx-auto">
                  {importSuccessMessage}
                </div>
              )}
            </div>

            {/* Live Preview Table & Execute Button */}
            {importRows.length > 0 && (
              <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-base text-neutral-900 dark:text-white">
                      Detected Items Preview ({importRows.length})
                    </h4>
                    <p className="text-xs text-neutral-500">
                      Verify the items parsed from your spreadsheet before confirming.
                    </p>
                  </div>

                  {/* Mode Selector & Execute Button */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="accent-amber-500"
                        />
                        <span>Append/Merge</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="accent-rose-500"
                        />
                        <span className="text-rose-600 dark:text-rose-400">Replace All</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      Import {importRows.length} Items Now
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-96 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Name (TJ / RU / EN)</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {importRows.map((it, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                          <td className="p-3 font-mono text-neutral-400">{idx + 1}</td>
                          <td className="p-3">
                            <span className="font-bold text-neutral-900 dark:text-white block">{it.name.tj}</span>
                            <span className="text-[11px] text-neutral-500 block">{it.name.ru} · {it.name.en}</span>
                          </td>
                          <td className="p-3 font-mono text-amber-600 dark:text-amber-400">{it.categoryId}</td>
                          <td className="p-3 font-extrabold tabular-nums">{it.price} {storeSettings.currency}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                              Ready
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* CANCELLATION REASON MODAL                                      */}
      {/* ============================================================== */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-extrabold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  {t('cancellationReasonTitle', language)}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {cancellingOrder.orderNumber} · {cancellingOrder.customer.name} ({cancellingOrder.total} {storeSettings.currency})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              {t('selectCancellationReason', language)}
            </p>

            <div className="space-y-1.5">
              {[
                t('reasonOutOfStock', language),
                t('reasonCustomerUnreachable', language),
                t('reasonOutsideZone', language),
                t('reasonCustomerRequested', language),
                t('reasonKitchenBusy', language),
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSelectedReasonPreset(preset);
                    setCustomReasonText('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    selectedReasonPreset === preset && !customReasonText
                      ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300 shadow-2xs'
                      : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                {language === 'tj' ? 'Ё сабаби дигар нависед' : language === 'ru' ? 'Или своя причина' : 'Or enter custom reason'}
              </label>
              <input
                type="text"
                value={customReasonText}
                onChange={(e) => {
                  setCustomReasonText(e.target.value);
                  if (e.target.value) setSelectedReasonPreset('');
                }}
                placeholder={t('customReasonPlaceholder', language)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                {language === 'tj' ? 'Бозгашт' : language === 'ru' ? 'Назад' : 'Back'}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                {t('confirmCancellation', language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT MENU ITEM MODAL                                           */}
      {/* ============================================================== */}
      {isItemModalOpen && editingItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl max-h-[90vh] rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 shadow-2xl overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base text-neutral-900 dark:text-white">
                {editingItem.name.en ? 'Edit Menu Item' : 'New Menu Item'}
              </h4>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">Ном (Тоҷикӣ)</label>
                  <input
                    type="text"
                    value={editingItem.name.tj}
                    onChange={(e) => setEditingItem({ ...editingItem, name: { ...editingItem.name, tj: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">Название (Русский)</label>
                  <input
                    type="text"
                    value={editingItem.name.ru}
                    onChange={(e) => setEditingItem({ ...editingItem, name: { ...editingItem.name, ru: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">Name (English)</label>
                  <input
                    type="text"
                    value={editingItem.name.en}
                    onChange={(e) => setEditingItem({ ...editingItem, name: { ...editingItem.name, en: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">Price ({storeSettings.currency})</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">Category</label>
                  <select
                    value={editingItem.categoryId}
                    onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name[language] || c.name.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Item Descriptions in 3 Languages */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">Тавсиф (Тоҷикӣ)</label>
                  <textarea
                    rows={2}
                    value={editingItem.description?.tj || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        description: { ...editingItem.description, tj: e.target.value },
                      })
                    }
                    placeholder="Масалан: Гӯшти гови ширадор, панири гудохта..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">Описание (Русский)</label>
                  <textarea
                    rows={2}
                    value={editingItem.description?.ru || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        description: { ...editingItem.description, ru: e.target.value },
                      })
                    }
                    placeholder="Например: Сочная говядина, фирменный соус..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">Description (English)</label>
                  <textarea
                    rows={2}
                    value={editingItem.description?.en || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        description: { ...editingItem.description, en: e.target.value },
                      })
                    }
                    placeholder="e.g. Smashed beef patties, secret sauce..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs resize-none"
                  />
                </div>
              </div>

              {/* ======================================================= */}
              {/* ITEM BADGES & STATUS BUTTONS ("Available, Hidden, Popular, Spicy, New") */}
              {/* ======================================================= */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      {language === 'tj'
                        ? 'Нишонҳо ва Ҳолати таом (Badges & Status)'
                        : language === 'ru'
                        ? 'Значки и статус блюда (Badges & Status)'
                        : 'Badges & Visibility Status'}
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      {language === 'tj'
                        ? 'Тугмаҳои зеринро пахш намуда, нишонҳои дилхоҳро фаъол кунед'
                        : language === 'ru'
                        ? 'Нажмите на кнопку, чтобы включить или отключить соответствующий значок'
                        : 'Click buttons below to toggle relative options and customer badges'}
                    </span>
                  </div>

                  {/* Active badges preview chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {editingItem.isAvailable === false && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                        {language === 'tj' ? 'Тамом шуд' : language === 'ru' ? 'Нет в наличии' : 'Out of Stock'}
                      </span>
                    )}
                    {editingItem.isHidden && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        Hidden
                      </span>
                    )}
                    {editingItem.isPopular && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white shadow-2xs">
                        ⭐ Popular
                      </span>
                    )}
                    {editingItem.isSpicy && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600 text-white shadow-2xs">
                        🌶️ Spicy
                      </span>
                    )}
                    {editingItem.isNew && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-500 text-white shadow-2xs">
                        ✨ New
                      </span>
                    )}
                  </div>
                </div>

                {/* 5 Toggle Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {/* 1. AVAILABLE BUTTON */}
                  <button
                    type="button"
                    onClick={() =>
                      setEditingItem({
                        ...editingItem,
                        isAvailable: editingItem.isAvailable === false ? true : false,
                      })
                    }
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer font-bold ${
                      editingItem.isAvailable !== false
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600 opacity-60'
                    }`}
                  >
                    <CheckCircle
                      className={`w-4 h-4 ${
                        editingItem.isAvailable !== false
                          ? 'text-emerald-500 fill-emerald-500/20'
                          : 'text-neutral-400'
                      }`}
                    />
                    <span className="text-[11px] leading-tight">
                      {editingItem.isAvailable !== false ? 'Available' : 'Out of Stock'}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                        editingItem.isAvailable !== false
                          ? 'bg-emerald-500 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                      }`}
                    >
                      {editingItem.isAvailable !== false ? 'In Stock' : 'Unavailable'}
                    </span>
                  </button>

                  {/* 2. HIDDEN BUTTON */}
                  <button
                    type="button"
                    onClick={() =>
                      setEditingItem({
                        ...editingItem,
                        isHidden: !editingItem.isHidden,
                      })
                    }
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer font-bold ${
                      editingItem.isHidden
                        ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-400 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    {editingItem.isHidden ? (
                      <EyeOff className="w-4 h-4 text-rose-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-neutral-400" />
                    )}
                    <span className="text-[11px] leading-tight">
                      {editingItem.isHidden ? 'Hidden' : 'Visible'}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                        editingItem.isHidden
                          ? 'bg-rose-500 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                      }`}
                    >
                      {editingItem.isHidden ? 'Private' : 'Public'}
                    </span>
                  </button>

                  {/* 3. POPULAR BUTTON */}
                  <button
                    type="button"
                    onClick={() =>
                      setEditingItem({
                        ...editingItem,
                        isPopular: !editingItem.isPopular,
                      })
                    }
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer font-bold ${
                      editingItem.isPopular
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <Flame
                      className={`w-4 h-4 ${
                        editingItem.isPopular ? 'text-amber-500 fill-amber-500' : 'text-neutral-400'
                      }`}
                    />
                    <span className="text-[11px] leading-tight">Popular</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                        editingItem.isPopular
                          ? 'bg-amber-500 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                      }`}
                    >
                      {editingItem.isPopular ? 'Bestseller' : 'Off'}
                    </span>
                  </button>

                  {/* 4. SPICY BUTTON */}
                  <button
                    type="button"
                    onClick={() =>
                      setEditingItem({
                        ...editingItem,
                        isSpicy: !editingItem.isSpicy,
                      })
                    }
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer font-bold ${
                      editingItem.isSpicy
                        ? 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-400 ring-2 ring-red-500/20 shadow-xs'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <span className="text-sm">🌶️</span>
                    <span className="text-[11px] leading-tight">Spicy</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                        editingItem.isSpicy
                          ? 'bg-red-600 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                      }`}
                    >
                      {editingItem.isSpicy ? 'Hot / Тӯнд' : 'Mild'}
                    </span>
                  </button>

                  {/* 5. NEW BUTTON */}
                  <button
                    type="button"
                    onClick={() =>
                      setEditingItem({
                        ...editingItem,
                        isNew: !editingItem.isNew,
                      })
                    }
                    className={`col-span-2 sm:col-span-1 p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer font-bold ${
                      editingItem.isNew
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-400 ring-2 ring-sky-500/20 shadow-xs'
                        : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <Sparkles
                      className={`w-4 h-4 ${
                        editingItem.isNew ? 'text-sky-500 fill-sky-500/20' : 'text-neutral-400'
                      }`}
                    />
                    <span className="text-[11px] leading-tight">New</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                        editingItem.isNew
                          ? 'bg-sky-500 text-white'
                          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
                      }`}
                    >
                      {editingItem.isNew ? 'New Item' : 'Standard'}
                    </span>
                  </button>
                </div>
              </div>

              {/* ======================================================= */}
              {/* ITEM IMAGE UPLOAD (DEVICE UPLOAD + DIRECT URL)          */}
              {/* ======================================================= */}
              <div className="space-y-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      {language === 'tj' ? 'Акси таом (Аз дастгоҳ боргирӣ кунед)' : language === 'ru' ? 'Фото блюда (Загрузка с устройства)' : 'Dish Image (Upload from device)'}
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      {language === 'tj' ? 'Аксро аз телефон ё компютер интихоб намоед' : language === 'ru' ? 'Выберите файл с телефона, планшета или компьютера' : 'Select a photo from your phone gallery, camera, or computer'}
                    </span>
                  </div>
                  {editingItem.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingItem({ ...editingItem, imageUrl: '' })}
                      className="text-[11px] text-rose-500 hover:underline font-bold"
                    >
                      {language === 'tj' ? 'Тоза кардан' : 'Remove'}
                    </button>
                  )}
                </div>

                {/* Hidden Native File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  onChange={handleDeviceImageUpload}
                  className="hidden"
                />

                {/* Image Preview & Upload Dropzone */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  {/* Preview Box */}
                  <div className="relative aspect-video sm:aspect-square rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-700 border-2 border-neutral-200 dark:border-neutral-700 flex items-center justify-center group shadow-xs">
                    {editingItem.imageUrl?.trim() ? (
                      <>
                        <img
                          src={editingItem.imageUrl.trim()}
                          alt="Dish Preview"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        />
                        <div className="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 rounded-xl bg-white text-neutral-900 font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <Camera className="w-4 h-4 text-amber-500" />
                            <span>Change</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-3 text-neutral-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-[11px] font-medium block">No image selected</span>
                      </div>
                    )}

                    {uploadingImage && (
                      <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 p-2 text-center animate-in fade-in">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                        <span className="text-[11px] font-bold">Uploading from device...</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Action Buttons */}
                  <div className="sm:col-span-2 space-y-2">
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>{language === 'tj' ? 'Интихоби Акс аз Дастгоҳ' : language === 'ru' ? 'Загрузить фото с устройства' : 'Upload Photo from Device'}</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-0.5">
                      <span>Supports JPG, PNG, WebP up to 25MB</span>
                      <button
                        type="button"
                        onClick={() => setShowCustomUrlInput((prev) => !prev)}
                        className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                      >
                        {showCustomUrlInput ? 'Hide URL input' : 'Or paste URL'}
                      </button>
                    </div>

                    {showCustomUrlInput && (
                      <div className="pt-1 animate-in fade-in">
                        <input
                          type="text"
                          value={editingItem.imageUrl}
                          onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                          placeholder="https://... or /assets/..."
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 font-mono text-[11px] text-neutral-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {uploadError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT CATEGORY MODAL                                            */}
      {/* ============================================================== */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base text-neutral-900 dark:text-white">
                {originalCategoryId
                  ? language === 'tj'
                    ? 'Таҳрири категория'
                    : language === 'ru'
                    ? 'Редактирование категории'
                    : 'Edit Category'
                  : language === 'tj'
                  ? 'Категорияи нав'
                  : language === 'ru'
                  ? 'Новая категория'
                  : 'New Category'}
              </h4>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategorySubmit} className="space-y-3.5 text-xs">
              {/* Custom Category ID Input */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center justify-between">
                  <span>
                    {language === 'tj'
                      ? 'ID-и категория (Category ID)'
                      : language === 'ru'
                      ? 'ID категории (Category ID)'
                      : 'Category ID'}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {language === 'tj' ? 'ҳарфҳои лотинӣ (масалан: doners)' : 'slug / id (e.g. doners)'}
                  </span>
                </label>
                <input
                  type="text"
                  value={editingCategory.id}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
                    })
                  }
                  placeholder="doners, burgers, drinks..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono font-bold text-xs text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  {language === 'tj'
                    ? 'Мушаххаскунандаи ягона барои пайваст кардани таомҳо ва филтратсия'
                    : language === 'ru'
                    ? 'Уникальный ID категории для привязки блюд и фильтрации меню'
                    : 'Unique category identifier used for grouping and filtering menu items'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {language === 'tj' ? 'Ном (Тоҷикӣ)' : 'Name (TJ)'}
                  </label>
                  <input
                    type="text"
                    value={editingCategory.name.tj}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        name: { ...editingCategory.name, tj: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Emoji Icon
                  </label>
                  <input
                    type="text"
                    value={editingCategory.icon}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, icon: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-center text-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {language === 'tj' ? 'Ном (Русӣ)' : 'Name (RU)'}
                  </label>
                  <input
                    type="text"
                    value={editingCategory.name.ru}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        name: { ...editingCategory.name, ru: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {language === 'tj' ? 'Ном (Англисӣ)' : 'Name (EN)'}
                  </label>
                  <input
                    type="text"
                    value={editingCategory.name.en}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        name: { ...editingCategory.name, en: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
