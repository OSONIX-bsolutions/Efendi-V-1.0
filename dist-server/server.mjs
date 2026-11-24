// server.ts
import "dotenv/config";
import crypto from "crypto";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

// src/data/defaultData.ts
var DEFAULT_STORE_SETTINGS = {
  name: "EFENDI",
  tagline: {
    tj: "\u0422\u0430\u043E\u043C\u04B3\u043E\u0438 \u0431\u043E\u043B\u0430\u0437\u0437\u0430\u0442\u0442\u0430\u0440\u0438\u043D \u0432\u0430 \u0437\u0443\u0434\u043F\u0430\u0437 \u0431\u043E \u0441\u0438\u0444\u0430\u0442\u0438 \u0430\u044A\u043B\u043E",
    ru: "\u0421\u0430\u043C\u044B\u0439 \u0432\u043A\u0443\u0441\u043D\u044B\u0439 \u0438 \u0431\u044B\u0441\u0442\u0440\u044B\u0439 \u0444\u0430\u0441\u0442\u0444\u0443\u0434 \u0438\u0437 \u043E\u0442\u0431\u043E\u0440\u043D\u044B\u0445 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432",
    en: "Craving perfection: artisan burgers, crispy chicken & stone-baked pizza"
  },
  currency: "TJS",
  whatsappNumber: "+992900123456",
  telegramUsername: "quickbite_express",
  whatsappEnabled: true,
  telegramEnabled: true,
  directOrderingOnly: true,
  orderChannel: "both",
  address: {
    tj: "\u0448. \u0414\u0443\u0448\u0430\u043D\u0431\u0435, \u0445\u0438\u0451\u0431\u043E\u043D\u0438 \u0420\u04EF\u0434\u0430\u043A\u04E3 45 (\u0440\u04EF \u0431\u0430 \u0440\u04EF\u0438 \u0414\u043E\u043D\u0438\u0448\u0433\u043E\u04B3)",
    ru: "\u0433. \u0414\u0443\u0448\u0430\u043D\u0431\u0435, \u043F\u0440-\u0442 \u0420\u0443\u0434\u0430\u043A\u0438 45 (\u043D\u0430\u043F\u0440\u043E\u0442\u0438\u0432 \u0423\u043D\u0438\u0432\u0435\u0440\u0441\u0438\u0442\u0435\u0442\u0430)",
    en: "45 Rudaki Avenue, Dushanbe (opposite University)"
  },
  phones: ["+992 90 012 3456", "+992 98 765 4321"],
  instagram: "https://instagram.com/quickbite.tj",
  facebook: "https://facebook.com/quickbite.tj",
  telegramChannel: "https://t.me/quickbite_express",
  timezone: "Asia/Dushanbe",
  workingHours: {
    open: "08:00",
    close: "03:00",
    daysNote: {
      tj: "\u04B2\u0430\u043C\u0430\u0440\u04EF\u0437\u0430 \u0430\u0437 08:00 \u0442\u043E 03:00 \u0431\u0435 \u0438\u0441\u0442\u0438\u0440\u043E\u04B3\u0430\u0442",
      ru: "\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E \u0441 08:00 \u0434\u043E 03:00 \u0431\u0435\u0437 \u0432\u044B\u0445\u043E\u0434\u043D\u044B\u0445",
      en: "Every day from 08:00 to 03:00"
    }
  },
  workingHoursRows: [
    {
      id: "row-1",
      days: "\u04B2\u0430\u043C\u0430\u0440\u04EF\u0437\u0430 / \u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E",
      open: "08:00",
      close: "03:00"
    }
  ],
  manualStatusOverride: "auto",
  cmsAccessMode: "hidden",
  cmsButtonVisible: false,
  shortcutSettings: {
    enableTripleClick: true,
    enableLongPress: true,
    enableKeyboardShortcut: true,
    keyboardShortcut: "ctrl+shift+a"
  },
  enabledDeliveryTypes: {
    delivery: true,
    pickup: true,
    dine_in: true
  },
  orderNumberFormat: "4-digits",
  nextOrderNumber: 1,
  orderNumberPrefix: "#",
  enabledLanguages: {
    tj: true,
    ru: true,
    en: true
  }
};
var DEFAULT_CATEGORIES = [];
var DEFAULT_MENU_ITEMS = [];
var INITIAL_ORDERS = [];

// src/utils/workingHours.ts
var DEFAULT_STORE_TIMEZONE = "Asia/Dushanbe";
function parseTimeToMinutes(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim().toUpperCase();
  if (!trimmed) return null;
  const amPmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/);
  if (amPmMatch) {
    let hour2 = Number(amPmMatch[1]);
    const min2 = Number(amPmMatch[2]);
    const period = amPmMatch[3];
    if (!Number.isInteger(hour2) || !Number.isInteger(min2) || hour2 < 1 || hour2 > 12 || min2 < 0 || min2 > 59) {
      return null;
    }
    if (period === "AM") {
      hour2 = hour2 === 12 ? 0 : hour2;
    } else {
      hour2 = hour2 === 12 ? 12 : hour2 + 12;
    }
    return hour2 * 60 + min2;
  }
  const twentyFourMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!twentyFourMatch) return null;
  const hour = Number(twentyFourMatch[1]);
  const min = Number(twentyFourMatch[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(min) || min < 0 || min > 59) {
    return null;
  }
  if (hour === 24 && min === 0) return 0;
  if (hour < 0 || hour > 23) return null;
  return hour * 60 + min;
}
function formatTimeHHMM(raw, fallback = "") {
  const mins = parseTimeToMinutes(raw);
  if (mins === null) return fallback;
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function buildDailyHoursNote(open, close) {
  return {
    tj: `\u04B2\u0430\u043C\u0430\u0440\u04EF\u0437\u0430 \u0430\u0437 ${open} \u0442\u043E ${close} \u0431\u0435 \u0438\u0441\u0442\u0438\u0440\u043E\u04B3\u0430\u0442`,
    ru: `\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E \u0441 ${open} \u0434\u043E ${close} \u0431\u0435\u0437 \u0432\u044B\u0445\u043E\u0434\u043D\u044B\u0445`,
    en: `Every day from ${open} to ${close}`
  };
}
function isAutoDailyTemplate(text) {
  if (!text || typeof text !== "string") return true;
  const clean = text.trim();
  if (!clean) return true;
  return /^Ҳамарӯза\s+аз\s+\S+\s+то\s+\S+/i.test(clean) || /^Ежедневно\s+с\s+\S+\s+до\s+\S+/i.test(clean) || /^Every\s+day\s+from\s+/i.test(clean);
}
function normalizeWorkingHoursSettings(settings, rawRow) {
  const s = settings && typeof settings === "object" ? settings : {};
  const rawWh = (s.workingHours && typeof s.workingHours === "object" ? s.workingHours : null) || (s.working_hours && typeof s.working_hours === "object" ? s.working_hours : null) || (rawRow?.working_hours && typeof rawRow.working_hours === "object" ? rawRow.working_hours : null) || {};
  const rows = Array.isArray(s.workingHoursRows) ? s.workingHoursRows.filter((r) => Boolean(r && typeof r === "object")) : Array.isArray(s.working_hours_rows) ? s.working_hours_rows.filter((r) => Boolean(r && typeof r === "object")) : [];
  const columnOpen = rawRow?.working_hours_open || rawRow?.open_time || s.openTime || s.open_time;
  const columnClose = rawRow?.working_hours_close || rawRow?.close_time || s.closeTime || s.close_time;
  const open = formatTimeHHMM(
    columnOpen || rawWh.open || rows[0]?.open,
    "08:00"
  );
  const close = formatTimeHHMM(
    columnClose || rawWh.close || rows[0]?.close,
    "03:00"
  );
  const generatedNote = buildDailyHoursNote(open, close);
  const existingNote = rawWh.daysNote && typeof rawWh.daysNote === "object" ? rawWh.daysNote : {};
  const daysNote = {
    tj: isAutoDailyTemplate(existingNote.tj) ? generatedNote.tj : existingNote.tj,
    ru: isAutoDailyTemplate(existingNote.ru) ? generatedNote.ru : existingNote.ru,
    en: isAutoDailyTemplate(existingNote.en) ? generatedNote.en : existingNote.en
  };
  let syncedRows;
  if (rows.length <= 1) {
    syncedRows = [
      {
        id: rows[0]?.id || "row-1",
        days: rows[0]?.days || "\u04B2\u0430\u043C\u0430\u0440\u04EF\u0437\u0430 / \u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E",
        open,
        close
      }
    ];
  } else {
    syncedRows = rows.map((row, idx) => ({
      ...row,
      id: row.id || `row-${idx + 1}`,
      open: formatTimeHHMM(row.open, open),
      close: formatTimeHHMM(row.close, close)
    }));
  }
  const rawOverride = rawRow?.manual_status_override || s.manualStatusOverride || s.manual_status_override;
  const manualStatusOverride = rawOverride === "force_open" || rawOverride === "force_closed" ? rawOverride : "auto";
  const timezone = typeof rawRow?.timezone === "string" && rawRow.timezone.trim() || typeof s.timezone === "string" && s.timezone.trim() || DEFAULT_STORE_TIMEZONE;
  return {
    ...settings,
    timezone,
    manualStatusOverride,
    workingHours: {
      open,
      close,
      daysNote
    },
    workingHoursRows: syncedRows
  };
}

// server.ts
var __filename = typeof import.meta?.url === "string" && import.meta.url.startsWith("file:") ? fileURLToPath(import.meta.url) : "";
var __dirname = __filename ? path.dirname(__filename) : process.cwd();
var PORT = Number(process.env.PORT) || 3e3;
var isProduction = process.env.NODE_ENV === "production";
var isVercel = Boolean(process.env.VERCEL);
var SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
var SUPABASE_ANON_KEY = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "").trim();
var SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
var hasValidSupabaseUrl = /^https?:\/\/.+/i.test(SUPABASE_URL);
var isSupabaseConfigured = Boolean(hasValidSupabaseUrl && SUPABASE_ANON_KEY);
var HAS_EXPLICIT_TRACKING_SECRET = Boolean(process.env.ORDER_TRACKING_SECRET?.trim());
var ORDER_TRACKING_SECRET = process.env.ORDER_TRACKING_SECRET?.trim() || crypto.randomBytes(32).toString("hex");
if (isProduction && !HAS_EXPLICIT_TRACKING_SECRET) {
  console.warn(
    "\u26A0\uFE0F ORDER_TRACKING_SECRET is not set. Generated an ephemeral signing key; set ORDER_TRACKING_SECRET via Secret Manager for multi-instance Cloud Run tracking."
  );
}
if (!isSupabaseConfigured) {
  console.warn("\u26A0\uFE0F SUPABASE_URL / SUPABASE_ANON_KEY are not configured.");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "\u26A0\uFE0F SUPABASE_SERVICE_ROLE_KEY is not configured. Admin user provisioning and privileged server-only queries require this key."
  );
}
function safeCreateSupabaseClient(url, key) {
  if (!/^https?:\/\/.+/i.test(url) || !key) return null;
  try {
    return createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  } catch (err) {
    console.warn("Failed to initialize Supabase client:", err?.message);
    return null;
  }
}
var supabasePublic = isSupabaseConfigured ? safeCreateSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
var supabaseAdmin = hasValidSupabaseUrl && SUPABASE_SERVICE_ROLE_KEY ? safeCreateSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;
function createUserSupabaseClient(accessToken) {
  if (!isSupabaseConfigured || !accessToken) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
var menuItemsMemory = [...DEFAULT_MENU_ITEMS];
var categoriesMemory = [...DEFAULT_CATEGORIES];
var settingsMemory = { ...DEFAULT_STORE_SETTINGS };
var ordersMemory = [...INITIAL_ORDERS];
var lastSupabaseSyncAt = 0;
var pendingOrderCounterOverride = null;
function stripSensitiveSettingsFields(settings) {
  if (!settings || typeof settings !== "object") return settings;
  const { adminPin: _a, staffPin: _s, developerPin: _d, ...clean } = settings;
  return clean;
}
function normalizeWhatsAppNumber(raw) {
  if (!raw || typeof raw !== "string") return "";
  const digits = raw.trim().replace(/[^0-9]/g, "");
  return digits ? `+${digits}` : "";
}
function normalizeTelegramUsername(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw.trim().replace(/^https?:\/\/(www\.)?(t\.me|telegram\.me)\//i, "").replace(/^(t\.me|telegram\.me)\//i, "").split(/[?#]/)[0].replace(/\/+$/, "").replace(/^@+/, "").trim();
}
function normalizeDispatchSettings(settings, rawRow) {
  const whatsappEnabled = settings.whatsappEnabled !== false;
  const telegramEnabled = settings.telegramEnabled !== false;
  const orderChannel = whatsappEnabled && telegramEnabled ? "both" : whatsappEnabled ? "whatsapp" : telegramEnabled ? "telegram" : "both";
  return normalizeWorkingHoursSettings(
    {
      ...settings,
      whatsappNumber: settings.whatsappNumber !== void 0 ? normalizeWhatsAppNumber(settings.whatsappNumber) : "",
      telegramUsername: settings.telegramUsername !== void 0 ? normalizeTelegramUsername(settings.telegramUsername) : "",
      whatsappEnabled,
      telegramEnabled,
      directOrderingOnly: settings.directOrderingOnly !== false,
      orderChannel
    },
    rawRow
  );
}
function rowToCategory(row) {
  return {
    id: row.id,
    name: typeof row.name === "string" ? JSON.parse(row.name) : row.name,
    icon: row.icon || "\u{1F37D}\uFE0F",
    sortOrder: row.sort_order ?? 9999
  };
}
function categoryToRow(cat) {
  return {
    id: cat.id,
    name: cat.name,
    icon: cat.icon || "\u{1F37D}\uFE0F",
    sort_order: cat.sortOrder ?? 9999
  };
}
function rowToMenuItem(row) {
  return {
    id: row.id,
    categoryId: row.category_id || "",
    name: typeof row.name === "string" ? JSON.parse(row.name) : row.name,
    description: typeof row.description === "string" ? JSON.parse(row.description) : row.description || { tj: "", ru: "", en: "" },
    price: Number(row.price),
    imageUrl: row.image_url || "",
    isAvailable: row.is_available ?? true,
    isHidden: row.is_hidden ?? false,
    isPopular: row.is_popular ?? false,
    isNew: row.is_new ?? false,
    isSpicy: row.is_spicy ?? false,
    isHalal: row.is_halal ?? true,
    prepTimeMinutes: row.prep_time_minutes ?? 10,
    calories: row.calories ?? 0,
    sortOrder: row.sort_order ?? 9999
  };
}
function menuItemToRow(item) {
  return {
    id: item.id,
    category_id: item.categoryId || null,
    name: item.name,
    description: item.description || { tj: "", ru: "", en: "" },
    price: Number(item.price),
    image_url: item.imageUrl || "",
    is_available: item.isAvailable ?? true,
    is_hidden: item.isHidden ?? false,
    is_popular: item.isPopular ?? false,
    is_new: item.isNew ?? false,
    is_spicy: item.isSpicy ?? false,
    prep_time_minutes: item.prepTimeMinutes ?? 10,
    calories: item.calories ?? 0,
    sort_order: item.sortOrder ?? 9999
  };
}
function rowToOrder(row) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    createdAt: row.created_at,
    customer: typeof row.customer === "string" ? JSON.parse(row.customer) : row.customer,
    items: typeof row.items === "string" ? JSON.parse(row.items) : row.items,
    total: Number(row.total),
    channel: row.channel,
    status: row.status,
    cancellationReason: row.cancel_reason || void 0
  };
}
function orderToRow(order) {
  return {
    id: order.id,
    order_number: order.orderNumber,
    customer: order.customer,
    items: order.items,
    total: Number(order.total),
    channel: order.channel,
    status: order.status,
    cancel_reason: order.cancellationReason || null
  };
}
function signOrderId(orderId) {
  return crypto.createHmac("sha256", ORDER_TRACKING_SECRET).update(orderId).digest("hex");
}
function verifyOrderToken(orderId, token) {
  if (!orderId || !token || typeof token !== "string") return false;
  const expected = signOrderId(orderId);
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(token.trim(), "utf8");
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}
function parseEmailAllowlist(raw) {
  if (!raw) return /* @__PURE__ */ new Set();
  return new Set(
    raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
  );
}
var DEVELOPER_EMAILS = parseEmailAllowlist(process.env.DEVELOPER_EMAILS);
var ADMIN_EMAILS = parseEmailAllowlist(process.env.ADMIN_EMAILS);
var STAFF_EMAILS = parseEmailAllowlist(process.env.STAFF_EMAILS);
function normalizeRole(val) {
  if (typeof val !== "string") return null;
  const clean = val.trim().toLowerCase();
  return clean === "staff" || clean === "admin" || clean === "developer" ? clean : null;
}
function isValidRole(val) {
  return normalizeRole(val) !== null;
}
function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}
async function resolveTrustedRole(user, accessToken) {
  const appMetaRole = normalizeRole(user.app_metadata?.role);
  if (appMetaRole) {
    return appMetaRole;
  }
  const db = supabaseAdmin || createUserSupabaseClient(accessToken);
  if (db) {
    try {
      const { data, error } = await db.from("team_roles").select("role").eq("user_id", user.id).maybeSingle();
      if (error) {
        console.warn("team_roles user_id lookup warning:", error.message);
      }
      const rowRole = normalizeRole(data?.role);
      if (rowRole) {
        return rowRole;
      }
      if (!supabaseAdmin) {
        const { data: rpcRole, error: rpcErr } = await db.rpc("get_my_role");
        if (!rpcErr) {
          const parsedRpcRole = normalizeRole(rpcRole);
          if (parsedRpcRole) return parsedRpcRole;
        }
      } else if (user.email) {
        const { data: emailRow } = await supabaseAdmin.from("team_roles").select("role").ilike("email", user.email.trim()).maybeSingle();
        const emailRole = normalizeRole(emailRow?.role);
        if (emailRole) return emailRole;
      }
    } catch (e) {
      console.warn("resolveTrustedRole DB lookup skipped:", e?.message);
    }
  }
  const email = user.email?.trim().toLowerCase() || "";
  if (email) {
    if (DEVELOPER_EMAILS.has(email)) return "developer";
    if (ADMIN_EMAILS.has(email)) return "admin";
    if (STAFF_EMAILS.has(email)) return "staff";
  }
  return null;
}
async function tryAuthenticateRequest(req) {
  if (!supabasePublic) return false;
  const token = extractBearerToken(req);
  if (!token) return false;
  const { data, error } = await supabasePublic.auth.getUser(token);
  if (error || !data.user) return false;
  const role = await resolveTrustedRole(data.user, token);
  if (!role) return false;
  req.authUser = data.user;
  req.authRole = role;
  req.accessToken = token;
  return true;
}
async function requireAuth(req, res, next) {
  try {
    if (!supabasePublic) {
      return res.status(503).json({ error: "Authentication service is not configured" });
    }
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Missing Bearer authentication token" });
    }
    const { data, error } = await supabasePublic.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired authentication token" });
    }
    const role = await resolveTrustedRole(data.user, token);
    if (!role) {
      return res.status(403).json({
        error: "Authenticated account has no trusted staff/admin/developer role assigned."
      });
    }
    req.authUser = data.user;
    req.authRole = role;
    req.accessToken = token;
    return next();
  } catch (err) {
    return res.status(401).json({ error: err?.message || "Authentication failed" });
  }
}
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.authRole) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowedRoles.includes(req.authRole)) {
      return res.status(403).json({
        error: `Insufficient permissions. Required role: ${allowedRoles.join(" or ")}`
      });
    }
    return next();
  };
}
function getDbClient(req) {
  if (supabaseAdmin) return supabaseAdmin;
  if (req?.accessToken) {
    const userClient = createUserSupabaseClient(req.accessToken);
    if (userClient) return userClient;
  }
  return supabasePublic;
}
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  // 10MB max file size
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif"
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only raster image files (JPEG, PNG, WebP, GIF, AVIF) are allowed"));
    }
  }
});
async function syncFromSupabase(force = false) {
  const client = supabaseAdmin || supabasePublic;
  if (!client) return;
  if (!force && Date.now() - lastSupabaseSyncAt < 3e3 && menuItemsMemory.length > 0) {
    return;
  }
  try {
    const [catRes, itemRes, setRes] = await Promise.all([
      client.from("categories").select("*").order("sort_order", { ascending: true }),
      client.from("menu_items").select("*").order("sort_order", { ascending: true }),
      client.from("store_settings").select("*").eq("id", "store_config").maybeSingle()
    ]);
    if (!itemRes.error && Array.isArray(itemRes.data)) {
      menuItemsMemory = itemRes.data.map(rowToMenuItem);
    }
    if (!catRes.error && Array.isArray(catRes.data)) {
      categoriesMemory = catRes.data.map(rowToCategory);
    }
    if (!setRes.error && setRes.data) {
      const rowData = setRes.data.data;
      const parsed = rowData && typeof rowData === "string" ? JSON.parse(rowData) : rowData && typeof rowData === "object" ? rowData : {};
      const merged = normalizeDispatchSettings(
        stripSensitiveSettingsFields({
          ...DEFAULT_STORE_SETTINGS,
          ...parsed,
          ...setRes.data.whatsapp_number ? { whatsappNumber: setRes.data.whatsapp_number } : {},
          ...setRes.data.telegram_username ? { telegramUsername: setRes.data.telegram_username } : {},
          ...typeof setRes.data.whatsapp_enabled === "boolean" ? { whatsappEnabled: setRes.data.whatsapp_enabled } : {},
          ...typeof setRes.data.telegram_enabled === "boolean" ? { telegramEnabled: setRes.data.telegram_enabled } : {},
          ...typeof setRes.data.direct_ordering_only === "boolean" ? { directOrderingOnly: setRes.data.direct_ordering_only } : {}
        }),
        setRes.data
      );
      if (pendingOrderCounterOverride !== null) {
        const dbNext = typeof merged.nextOrderNumber === "number" && merged.nextOrderNumber > 0 ? merged.nextOrderNumber : 1;
        merged.nextOrderNumber = Math.max(dbNext, pendingOrderCounterOverride);
      }
      settingsMemory = merged;
    }
    lastSupabaseSyncAt = Date.now();
  } catch (e) {
    console.warn("Supabase sync skipped:", e);
  }
}
function injectPublicConfigIntoHtml(html) {
  const safeConfig = JSON.stringify({
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY
  }).replace(/</g, "\\u003c");
  const scriptTag = `<script>window.__PUBLIC_CONFIG__=${safeConfig};</script>`;
  if (html.includes("</head>")) {
    return html.replace("</head>", `${scriptTag}</head>`);
  }
  return `${scriptTag}${html}`;
}
function getAllowedOrigins() {
  const set = /* @__PURE__ */ new Set();
  const vercelHosts = [
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : ""
  ];
  const rawList = [
    process.env.ALLOWED_ORIGINS || "",
    process.env.APP_URL || "",
    ...vercelHosts
  ].join(",");
  for (const entry of rawList.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    try {
      set.add(new URL(trimmed).origin);
    } catch {
      set.add(trimmed.replace(/\/+$/, ""));
    }
  }
  return set;
}
async function createApp(options) {
  const shouldServeFrontend = options?.serveFrontend ?? !isVercel;
  if (shouldServeFrontend) {
    await syncFromSupabase(true).catch(() => {
    });
  }
  const app = express();
  app.set("trust proxy", 1);
  const allowedOrigins = getAllowedOrigins();
  const publicDir = path.resolve(process.cwd(), "public");
  const assetsDir = path.resolve(publicDir, "assets");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    const origin = req.headers.origin;
    if (origin) {
      const hostOrigin = req.headers.host ? `${req.protocol}://${req.headers.host}` : "";
      const isLocalDevOrigin = !isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
      if (origin === hostOrigin || allowedOrigins.has(origin) || isLocalDevOrigin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      }
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    return next();
  });
  app.use((req, _res, next) => {
    const desc = Object.getOwnPropertyDescriptor(req, "body");
    if (desc && "value" in desc && desc.value !== void 0) {
      req._body = true;
    }
    next();
  });
  app.use(express.json({ limit: "12mb" }));
  app.use(express.urlencoded({ limit: "12mb", extended: true }));
  if (!isProduction && fs.existsSync(assetsDir)) {
    app.use("/assets", express.static(assetsDir), (_req, res) => {
      res.status(404).type("text/plain").send("Asset not found");
    });
  }
  app.get("/api/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({
      status: "ok",
      service: "Efendi Restaurant API",
      environment: isProduction ? "production" : "development",
      supabaseConfigured: isSupabaseConfigured,
      adminClientConfigured: Boolean(supabaseAdmin),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({
      user: {
        id: req.authUser.id,
        email: req.authUser.email
      },
      role: req.authRole
    });
  });
  app.post(
    "/api/admin/users",
    requireAuth,
    requireRole("developer"),
    async (req, res) => {
      try {
        if (!supabaseAdmin) {
          return res.status(503).json({
            error: "SUPABASE_SERVICE_ROLE_KEY is required on the server to provision new Supabase Auth team accounts."
          });
        }
        const { email, password, role } = req.body;
        const cleanEmail = (email || "").trim().toLowerCase();
        if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          return res.status(400).json({ error: "Valid email address is required" });
        }
        if (!password || password.length < 8) {
          return res.status(400).json({ error: "Password must be at least 8 characters long" });
        }
        if (!isValidRole(role)) {
          return res.status(400).json({ error: "Role must be staff, admin, or developer" });
        }
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          app_metadata: { role }
        });
        if (createErr || !created.user) {
          return res.status(400).json({ error: createErr?.message || "Failed to create team account" });
        }
        const { error: roleErr } = await supabaseAdmin.from("team_roles").upsert(
          {
            user_id: created.user.id,
            email: cleanEmail,
            role,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          },
          { onConflict: "user_id" }
        );
        if (roleErr) {
          console.warn("team_roles upsert warning:", roleErr.message);
        }
        return res.status(201).json({
          success: true,
          user: {
            id: created.user.id,
            email: created.user.email,
            role
          }
        });
      } catch (err) {
        return res.status(500).json({ error: err?.message || "User provisioning failed" });
      }
    }
  );
  app.post(
    "/api/upload",
    requireAuth,
    requireRole("admin", "developer"),
    (req, res) => {
      upload.single("image")(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ error: err.message || "Image upload failed" });
        }
        if (!req.file) {
          return res.status(400).json({ error: "No image file uploaded" });
        }
        const db = getDbClient(req);
        if (!db) {
          return res.status(503).json({ error: "Supabase Storage is not configured" });
        }
        try {
          const cleanName = (req.file.originalname || "dish.jpg").replace(/[^a-zA-Z0-9.-]/g, "_");
          const storagePath = `dishes/${Date.now()}_${crypto.randomBytes(4).toString("hex")}_${cleanName}`;
          const { error: upErr } = await db.storage.from("menu_images").upload(storagePath, req.file.buffer, {
            upsert: true,
            contentType: req.file.mimetype || "image/jpeg"
          });
          if (upErr) {
            return res.status(400).json({ error: upErr.message });
          }
          const { data: urlData } = db.storage.from("menu_images").getPublicUrl(storagePath);
          return res.json({
            success: true,
            url: urlData.publicUrl,
            path: storagePath,
            size: req.file.size,
            mimetype: req.file.mimetype
          });
        } catch (uploadErr) {
          return res.status(500).json({ error: uploadErr?.message || "Storage upload failed" });
        }
      });
    }
  );
  app.get("/api/menu", async (req, res) => {
    await syncFromSupabase();
    const isTeamMember = await tryAuthenticateRequest(req);
    const items = isTeamMember ? menuItemsMemory : menuItemsMemory.filter((item) => !item.isHidden);
    const sorted = [...items].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
    res.json(sorted);
  });
  app.post(
    "/api/menu",
    requireAuth,
    requireRole("admin", "developer"),
    async (req, res) => {
      const item = req.body;
      if (!item || !item.id || typeof item.price !== "number" || item.price < 0) {
        return res.status(400).json({ error: "Valid menuItem with id and non-negative price is required" });
      }
      const db = getDbClient(req);
      if (db) {
        const { error } = await db.from("menu_items").upsert(menuItemToRow(item));
        if (error) {
          return res.status(400).json({ error: error.message });
        }
      }
      const index = menuItemsMemory.findIndex((i) => i.id === item.id);
      if (index >= 0) {
        menuItemsMemory = menuItemsMemory.map((i) => i.id === item.id ? item : i);
      } else {
        menuItemsMemory = [item, ...menuItemsMemory];
      }
      return res.json({ success: true, item });
    }
  );
  app.put(
    "/api/menu/reorder",
    requireAuth,
    requireRole("admin", "developer"),
    async (req, res) => {
      const { menuItems } = req.body;
      if (!Array.isArray(menuItems)) {
        return res.status(400).json({ error: "menuItems array is required" });
      }
      const updated = menuItems.map((m, index) => ({ ...m, sortOrder: index + 1 }));
      const db = getDbClient(req);
      if (db && updated.length > 0) {
        const { error } = await db.from("menu_items").upsert(updated.map(menuItemToRow));
        if (error) {
          return res.status(400).json({ error: error.message });
        }
      }
      menuItemsMemory = updated;
      return res.json({ success: true, count: updated.length });
    }
  );
  app.put(
    "/api/menu/:id",
    requireAuth,
    requireRole("admin", "developer"),
    async (req, res) => {
      const { id } = req.params;
      const patch = req.body;
      const index = menuItemsMemory.findIndex((i) => i.id === id);
      if (index < 0) {
        return res.status(404).json({ error: `Menu item ${id} not found` });
      }
      const merged = { ...menuItemsMemory[index], ...patch, id };
      const db = getDbClient(req);
      if (db) {
        const { error } = await db.from("menu_items").upsert(menuItemToRow(merged));
        if (error) {
          return res.status(400).json({ error: error.message });
        }
      }
      menuItemsMemory = menuItemsMemory.map((i) => i.id === id ? merged : i);
      return res.json({ success: true, item: merged });
    }
  );
  app.delete(
    "/api/menu/:id",
    requireAuth,
    requireRole("admin", "developer"),
    async (req, res) => {
      const { id } = req.params;
      const db = getDbClient(req);
      if (db) {
        const { error } = await db.from("menu_items").delete().eq("id", id);
        if (error) {
          return res.status(400).json({ error: error.message });
        }
      }
      menuItemsMemory = menuItemsMemory.filter((i) => i.id !== id);
      return res.json({ success: true, id });
    }
  );
  app.post(
    "/api/menu/bulk-import",
    requireAuth,
    requireRole("admin", "developer"),
    async (req, res) => {
      const { items, mode } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "items array is required" });
      }
      const db = getDbClient(req);
      if (db) {
        if (mode === "replace") {
          const { error: delErr } = await db.from("menu_items").delete().neq("id", "");
          if (delErr) {
            return res.status(400).json({ error: delErr.message });
          }
        }
        if (items.length > 0) {
          const { error: upsertErr } = await db.from("menu_items").upsert(items.map(menuItemToRow));
          if (upsertErr) {
            return res.status(400).json({ error: upsertErr.message });
          }
        }
      }
      if (mode === "replace") {
        menuItemsMemory = items;
      } else {
        const map = new Map(menuItemsMemory.map((it) => [it.id, it]));
        items.forEach((it) => map.set(it.id, it));
        menuItemsMemory = Array.from(map.values());
      }
      return res.json({ success: true, count: menuItemsMemory.length });
    }
  );
  app.get("/api/categories", async (_req, res) => {
    await syncFromSupabase();
    const sorted = [...categoriesMemory].sort(
      (a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999)
    );
    res.json(sorted);
  });
  app.put(
    "/api/categories/reorder",
    requireAuth,
    requireRole("admin", "developer"),
    async (req, res) => {
      const { categories } = req.body;
      if (!Array.isArray(categories)) {
        return res.status(400).json({ error: "categories array is required" });
      }
      const updated = categories.map((c, index) => ({ ...c, sortOrder: index + 1 }));
      const db = getDbClient(req);
      if (db && updated.length > 0) {
        const { error } = await db.from("categories").upsert(updated.map(categoryToRow));
        if (error) {
          return res.status(400).json({ error: error.message });
        }
      }
      categoriesMemory = updated;
      return res.json({ success: true, count: updated.length });
    }
  );
  app.post(
    "/api/categories",
    requireAuth,
    requireRole("admin", "developer"),
    async (req, res) => {
      const category = req.body;
      if (!category || !category.id) {
        return res.status(400).json({ error: "Valid category with id is required" });
      }
      const db = getDbClient(req);
      if (db) {
        const { error } = await db.from("categories").upsert(categoryToRow(category));
        if (error) {
          return res.status(400).json({ error: error.message });
        }
      }
      const index = categoriesMemory.findIndex((c) => c.id === category.id);
      if (index >= 0) {
        categoriesMemory = categoriesMemory.map((c) => c.id === category.id ? category : c);
      } else {
        categoriesMemory = [...categoriesMemory, category];
      }
      return res.json({ success: true, category });
    }
  );
  app.put(
    "/api/categories/:id",
    requireAuth,
    requireRole("admin", "developer"),
    async (req, res) => {
      const { id } = req.params;
      const patch = req.body;
      const index = categoriesMemory.findIndex((c) => c.id === id);
      if (index < 0) {
        return res.status(404).json({ error: `Category ${id} not found` });
      }
      const merged = { ...categoriesMemory[index], ...patch, id };
      const db = getDbClient(req);
      if (db) {
        const { error } = await db.from("categories").upsert(categoryToRow(merged));
        if (error) {
          return res.status(400).json({ error: error.message });
        }
      }
      categoriesMemory = categoriesMemory.map((c) => c.id === id ? merged : c);
      return res.json({ success: true, category: merged });
    }
  );
  app.delete(
    "/api/categories/:id",
    requireAuth,
    requireRole("admin", "developer"),
    async (req, res) => {
      const { id } = req.params;
      const db = getDbClient(req);
      if (db) {
        const { error } = await db.from("categories").delete().eq("id", id);
        if (error) {
          return res.status(400).json({ error: error.message });
        }
      }
      categoriesMemory = categoriesMemory.filter((c) => c.id !== id);
      return res.json({ success: true, id });
    }
  );
  app.get("/api/settings", async (_req, res) => {
    await syncFromSupabase(true);
    res.setHeader("Cache-Control", "no-store");
    res.json(stripSensitiveSettingsFields(settingsMemory));
  });
  app.put(
    "/api/settings",
    requireAuth,
    requireRole("admin", "developer"),
    async (req, res) => {
      const incoming = stripSensitiveSettingsFields(req.body || {});
      const updated = normalizeDispatchSettings(
        stripSensitiveSettingsFields({
          ...settingsMemory,
          ...incoming
        })
      );
      const db = getDbClient(req);
      if (db) {
        const { error } = await db.from("store_settings").upsert({
          id: "store_config",
          data: updated,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        });
        if (error) {
          return res.status(400).json({ error: error.message });
        }
      }
      settingsMemory = updated;
      pendingOrderCounterOverride = null;
      return res.json({ success: true, settings: updated });
    }
  );
  app.get(
    "/api/orders",
    requireAuth,
    requireRole("staff", "admin", "developer"),
    async (req, res) => {
      const db = getDbClient(req);
      if (db) {
        const { data, error } = await db.from("orders").select("*").order("created_at", { ascending: false });
        if (!error && Array.isArray(data)) {
          ordersMemory = data.map(rowToOrder);
        }
      }
      res.setHeader("Cache-Control", "no-store");
      res.json(ordersMemory);
    }
  );
  app.post("/api/orders", async (req, res) => {
    try {
      await syncFromSupabase(true);
      const body = req.body;
      const customer = body.customer;
      if (!customer || !customer.name?.trim() || !customer.phone?.trim()) {
        return res.status(400).json({ error: "Customer name and phone number are required" });
      }
      if (!["delivery", "pickup", "dine_in"].includes(customer.deliveryType)) {
        return res.status(400).json({ error: "Invalid deliveryType" });
      }
      if (customer.deliveryType === "delivery" && !customer.addressOrTable?.trim()) {
        return res.status(400).json({ error: "Delivery address is required" });
      }
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return res.status(400).json({ error: "Order must contain at least one item" });
      }
      const lang = body.language === "ru" || body.language === "en" ? body.language : "tj";
      const menuById = new Map(menuItemsMemory.map((m) => [m.id, m]));
      const verifiedItems = [];
      for (const reqItem of body.items) {
        const qty = Number(reqItem?.quantity);
        if (!reqItem?.id || !Number.isInteger(qty) || qty < 1 || qty > 100) {
          return res.status(400).json({ error: "Invalid item or quantity (must be 1-100)" });
        }
        const catalogItem = menuById.get(reqItem.id);
        if (!catalogItem || catalogItem.isHidden || !catalogItem.isAvailable) {
          return res.status(400).json({
            error: `Menu item "${reqItem.id}" is unavailable or no longer exists`
          });
        }
        const unitPrice = Number(catalogItem.price);
        verifiedItems.push({
          id: catalogItem.id,
          name: catalogItem.name?.[lang] || catalogItem.name?.en || catalogItem.name?.tj || catalogItem.id,
          price: unitPrice,
          quantity: qty,
          subtotal: Math.round(unitPrice * qty * 100) / 100
        });
      }
      const authoritativeTotal = Math.round(verifiedItems.reduce((sum, it) => sum + it.subtotal, 0) * 100) / 100;
      const db = supabaseAdmin || supabasePublic;
      let currentCounter = typeof settingsMemory.nextOrderNumber === "number" && settingsMemory.nextOrderNumber > 0 ? settingsMemory.nextOrderNumber : 1;
      if (pendingOrderCounterOverride !== null && pendingOrderCounterOverride > currentCounter) {
        currentCounter = pendingOrderCounterOverride;
      }
      let allocatedViaRpc = false;
      if (db) {
        try {
          const { data: rpcNum, error: rpcErr } = await db.rpc("allocate_next_order_number");
          if (!rpcErr && typeof rpcNum === "number" && rpcNum >= 1) {
            currentCounter = rpcNum;
            allocatedViaRpc = true;
            pendingOrderCounterOverride = null;
          }
        } catch {
        }
      }
      const isSixDigits = settingsMemory.orderNumberFormat === "6-digits";
      const padded = isSixDigits ? String(currentCounter).padStart(6, "0") : String(currentCounter).padStart(4, "0");
      const prefix = settingsMemory.orderNumberPrefix || "#";
      const orderNumber = `${prefix}${padded}`;
      const nextCounter = currentCounter + 1;
      const validChannel = body.channel === "whatsapp" || body.channel === "telegram" ? body.channel : "direct";
      const orderId = typeof body.clientOrderId === "string" && /^order-[a-zA-Z0-9_-]{4,48}$/.test(body.clientOrderId) ? body.clientOrderId : `order-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
      const cleanCustomer = {
        name: customer.name.trim().slice(0, 120),
        phone: customer.phone.trim().slice(0, 40),
        deliveryType: customer.deliveryType,
        addressOrTable: (customer.addressOrTable || "").trim().slice(0, 240),
        orderNotes: customer.orderNotes ? customer.orderNotes.trim().slice(0, 400) : "",
        paymentMethod: customer.paymentMethod === "card_on_delivery" ? "card_on_delivery" : "cash"
      };
      const newOrder = {
        id: orderId,
        orderNumber,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        customer: cleanCustomer,
        items: verifiedItems,
        total: authoritativeTotal,
        channel: validChannel,
        status: "new"
      };
      if (db) {
        const { error: insertErr } = await db.from("orders").insert(orderToRow(newOrder));
        if (insertErr) {
          return res.status(400).json({ error: insertErr.message });
        }
      }
      settingsMemory = stripSensitiveSettingsFields({
        ...settingsMemory,
        nextOrderNumber: nextCounter
      });
      if (!allocatedViaRpc) {
        if (supabaseAdmin) {
          try {
            const { error: upsertErr } = await supabaseAdmin.from("store_settings").upsert({
              id: "store_config",
              data: settingsMemory,
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            });
            pendingOrderCounterOverride = upsertErr ? nextCounter : null;
          } catch {
            pendingOrderCounterOverride = nextCounter;
          }
        } else {
          pendingOrderCounterOverride = nextCounter;
        }
      }
      ordersMemory = [newOrder, ...ordersMemory.filter((o) => o.id !== newOrder.id)];
      const trackingToken = signOrderId(newOrder.id);
      return res.status(201).json({
        success: true,
        order: newOrder,
        trackingToken,
        nextOrderNumber: nextCounter
      });
    } catch (err) {
      console.error("Order creation error:", err);
      return res.status(500).json({ error: err?.message || "Failed to place order" });
    }
  });
  app.post("/api/orders/track", async (req, res) => {
    try {
      const { refs } = req.body;
      if (!Array.isArray(refs) || refs.length === 0) {
        return res.json({ orders: [] });
      }
      const validIds = refs.slice(0, 30).filter((ref) => ref && typeof ref.id === "string" && verifyOrderToken(ref.id, ref.token)).map((ref) => ref.id);
      if (validIds.length === 0) {
        return res.json({ orders: [] });
      }
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin.from("orders").select("*").in("id", validIds).order("created_at", { ascending: false });
        if (!error && Array.isArray(data)) {
          return res.json({ orders: data.map(rowToOrder) });
        }
      }
      const matched = ordersMemory.filter((o) => validIds.includes(o.id));
      return res.json({ orders: matched });
    } catch (err) {
      return res.status(500).json({ error: err?.message || "Failed to look up tracked orders" });
    }
  });
  app.patch(
    "/api/orders/:id/status",
    requireAuth,
    requireRole("staff", "admin", "developer"),
    async (req, res) => {
      const { id } = req.params;
      const { status, cancellationReason } = req.body;
      const validStatuses = [
        "new",
        "preparing",
        "out_for_delivery",
        "delivered",
        "completed",
        "cancelled"
      ];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: "Valid order status is required" });
      }
      const updateData = { status };
      if (status === "cancelled") {
        updateData.cancel_reason = cancellationReason || null;
      } else {
        updateData.cancel_reason = null;
      }
      const db = getDbClient(req);
      if (db) {
        const { error } = await db.from("orders").update(updateData).eq("id", id);
        if (error) {
          return res.status(400).json({ error: error.message });
        }
      }
      const index = ordersMemory.findIndex((o) => o.id === id);
      if (index >= 0) {
        ordersMemory[index] = {
          ...ordersMemory[index],
          status,
          cancellationReason: status === "cancelled" ? cancellationReason || ordersMemory[index].cancellationReason : void 0
        };
        return res.json({ success: true, order: ordersMemory[index] });
      }
      return res.json({ success: true, id, status });
    }
  );
  app.delete(
    "/api/orders/:id",
    requireAuth,
    requireRole("admin", "developer"),
    async (req, res) => {
      const { id } = req.params;
      const db = getDbClient(req);
      if (db) {
        const { error } = await db.from("orders").delete().eq("id", id);
        if (error) {
          return res.status(400).json({ error: error.message });
        }
      }
      ordersMemory = ordersMemory.filter((o) => o.id !== id);
      return res.json({ success: true, id });
    }
  );
  app.all("/api/*", (_req, res) => {
    res.status(404).json({ error: "API route not found" });
  });
  app.use((err, _req, res, _next) => {
    console.error("Express error:", err);
    if (!res.headersSent) {
      res.status(err?.status || 500).json({
        error: err?.message || "Internal server error"
      });
    }
  });
  if (shouldServeFrontend) {
    if (!isProduction) {
      const vitePkg = "vite";
      const { createServer: createViteServer } = await import(
        /* @vite-ignore */
        vitePkg
      );
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false
        },
        appType: "spa"
      });
      app.use(async (req, res, next) => {
        if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/src") && !req.path.startsWith("/@") && !req.path.includes(".") && req.headers.accept?.includes("text/html")) {
          try {
            const indexPath = path.resolve(process.cwd(), "index.html");
            let template = fs.readFileSync(indexPath, "utf-8");
            template = await vite.transformIndexHtml(req.originalUrl, template);
            template = injectPublicConfigIntoHtml(template);
            return res.status(200).set({ "Content-Type": "text/html" }).end(template);
          } catch (e) {
            return next(e);
          }
        }
        return next();
      });
      app.use(vite.middlewares);
      console.log("[Dev] Vite middlewares mounted to Express app");
    } else {
      const distPath = path.resolve(__dirname, "..", "dist");
      const fallbackDistPath = path.resolve(process.cwd(), "dist");
      const resolvedDistPath = fs.existsSync(distPath) ? distPath : fallbackDistPath;
      const indexHtmlPath = path.join(resolvedDistPath, "index.html");
      const rawHtml = fs.existsSync(indexHtmlPath) ? fs.readFileSync(indexHtmlPath, "utf-8") : "";
      app.use(express.static(resolvedDistPath, { index: false }));
      app.use("/assets", (_req, res) => {
        res.status(404).type("text/plain").send("Asset not found");
      });
      app.get("*", (_req, res) => {
        if (!rawHtml) {
          return res.status(500).send("Production build missing. Run npm run build.");
        }
        res.setHeader("Cache-Control", "no-store");
        return res.type("html").send(injectPublicConfigIntoHtml(rawHtml));
      });
    }
  }
  return app;
}
var isDirectExecution = !isVercel && Boolean(__filename) && Boolean(process.argv[1]) && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isDirectExecution) {
  createApp({ serveFrontend: true }).then((app) => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `\u{1F680} Efendi Full-Stack Server (${isProduction ? "production" : "development"}) running on http://0.0.0.0:${PORT}`
      );
    });
  }).catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}
export {
  createApp
};
