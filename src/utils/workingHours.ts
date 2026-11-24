import { Language, StoreSettings, WorkingHoursRow } from '../types.js';

export const DEFAULT_STORE_TIMEZONE = 'Asia/Dushanbe';

/**
 * Parse a time string like "08:00", "8:00", "08:00:00", "03:00", or "8:30 PM"
 * into minutes since midnight [0..1439]. Returns null if invalid.
 */
export function parseTimeToMinutes(raw?: string | null): number | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim().toUpperCase();
  if (!trimmed) return null;

  const amPmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/);
  if (amPmMatch) {
    let hour = Number(amPmMatch[1]);
    const min = Number(amPmMatch[2]);
    const period = amPmMatch[3];
    if (!Number.isInteger(hour) || !Number.isInteger(min) || hour < 1 || hour > 12 || min < 0 || min > 59) {
      return null;
    }
    if (period === 'AM') {
      hour = hour === 12 ? 0 : hour;
    } else {
      hour = hour === 12 ? 12 : hour + 12;
    }
    return hour * 60 + min;
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

/**
 * Format valid time inputs into 24-hour "HH:mm" form.
 */
export function formatTimeHHMM(raw?: string | null, fallback = ''): string {
  const mins = parseTimeToMinutes(raw);
  if (mins === null) return fallback;
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function buildDailyHoursNote(open: string, close: string): {
  tj: string;
  ru: string;
  en: string;
} {
  return {
    tj: `Ҳамарӯза аз ${open} то ${close} бе истироҳат`,
    ru: `Ежедневно с ${open} до ${close} без выходных`,
    en: `Every day from ${open} to ${close}`,
  };
}

function isAutoDailyTemplate(text?: string): boolean {
  if (!text || typeof text !== 'string') return true;
  const clean = text.trim();
  if (!clean) return true;
  return (
    /^Ҳамарӯза\s+аз\s+\S+\s+то\s+\S+/i.test(clean) ||
    /^Ежедневно\s+с\s+\S+\s+до\s+\S+/i.test(clean) ||
    /^Every\s+day\s+from\s+/i.test(clean)
  );
}

/**
 * Synchronize workingHours, workingHoursRows, daysNote, and manualStatusOverride
 * from Supabase JSONB/columns so single-schedule edits or DB updates never leave stale
 * hardcoded hours (e.g. 10:00–23:00) behind.
 */
export function normalizeWorkingHoursSettings<T extends Partial<StoreSettings>>(
  settings: T,
  rawRow?: Record<string, any> | null
): T {
  const s = (settings && typeof settings === 'object' ? settings : {}) as Record<string, any>;
  const rawWh =
    (s.workingHours && typeof s.workingHours === 'object' ? s.workingHours : null) ||
    (s.working_hours && typeof s.working_hours === 'object' ? s.working_hours : null) ||
    (rawRow?.working_hours && typeof rawRow.working_hours === 'object' ? rawRow.working_hours : null) ||
    {};

  const rows: WorkingHoursRow[] = Array.isArray(s.workingHoursRows)
    ? s.workingHoursRows.filter((r): r is WorkingHoursRow => Boolean(r && typeof r === 'object'))
    : Array.isArray(s.working_hours_rows)
    ? s.working_hours_rows.filter((r: any): r is WorkingHoursRow => Boolean(r && typeof r === 'object'))
    : [];

  const columnOpen =
    rawRow?.working_hours_open || rawRow?.open_time || s.openTime || s.open_time;
  const columnClose =
    rawRow?.working_hours_close || rawRow?.close_time || s.closeTime || s.close_time;

  const open = formatTimeHHMM(
    columnOpen || rawWh.open || rows[0]?.open,
    '08:00'
  );
  const close = formatTimeHHMM(
    columnClose || rawWh.close || rows[0]?.close,
    '03:00'
  );

  const generatedNote = buildDailyHoursNote(open, close);
  const existingNote = rawWh.daysNote && typeof rawWh.daysNote === 'object' ? rawWh.daysNote : {};
  const daysNote = {
    tj: isAutoDailyTemplate(existingNote.tj) ? generatedNote.tj : existingNote.tj,
    ru: isAutoDailyTemplate(existingNote.ru) ? generatedNote.ru : existingNote.ru,
    en: isAutoDailyTemplate(existingNote.en) ? generatedNote.en : existingNote.en,
  };

  let syncedRows: WorkingHoursRow[];
  if (rows.length <= 1) {
    syncedRows = [
      {
        id: rows[0]?.id || 'row-1',
        days: rows[0]?.days || 'Ҳамарӯза / Ежедневно',
        open,
        close,
      },
    ];
  } else {
    syncedRows = rows.map((row, idx) => ({
      ...row,
      id: row.id || `row-${idx + 1}`,
      open: formatTimeHHMM(row.open, open),
      close: formatTimeHHMM(row.close, close),
    }));
  }

  const rawOverride =
    rawRow?.manual_status_override ||
    s.manualStatusOverride ||
    s.manual_status_override;
  const manualStatusOverride: StoreSettings['manualStatusOverride'] =
    rawOverride === 'force_open' || rawOverride === 'force_closed' ? rawOverride : 'auto';

  const timezone =
    (typeof rawRow?.timezone === 'string' && rawRow.timezone.trim()) ||
    (typeof s.timezone === 'string' && s.timezone.trim()) ||
    DEFAULT_STORE_TIMEZONE;

  return {
    ...settings,
    timezone,
    manualStatusOverride,
    workingHours: {
      open,
      close,
      daysNote,
    },
    workingHoursRows: syncedRows,
  };
}

/**
 * Resolve effective open/close times directly from storeSettings.
 */
export function getEffectiveWorkingHours(settings: Partial<StoreSettings>): {
  open: string;
  close: string;
  daysNote: { tj: string; ru: string; en: string };
} {
  const normalized = normalizeWorkingHoursSettings(settings);
  return (
    normalized.workingHours || {
      open: '08:00',
      close: '03:00',
      daysNote: buildDailyHoursNote('08:00', '03:00'),
    }
  );
}

/**
 * Resolve display rows so single-row schedules always match workingHours.open & workingHours.close.
 */
export function getEffectiveWorkingHoursRows(
  settings: Partial<StoreSettings>,
  language: Language
): WorkingHoursRow[] {
  const normalized = normalizeWorkingHoursSettings(settings);
  const wh = getEffectiveWorkingHours(normalized);
  const fallbackDays = wh.daysNote[language] || wh.daysNote.en || wh.daysNote.ru;
  const rows = normalized.workingHoursRows;
  if (rows && rows.length > 1) {
    return rows.map((row, idx) => ({
      id: row.id || `row-${idx + 1}`,
      days: row.days || fallbackDays,
      open: formatTimeHHMM(row.open, wh.open),
      close: formatTimeHHMM(row.close, wh.close),
    }));
  }
  return [
    {
      id: rows?.[0]?.id || 'row-1',
      days: rows?.[0]?.days || fallbackDays,
      open: wh.open,
      close: wh.close,
    },
  ];
}

/**
 * Get current minutes since midnight in the store's timezone (default: Asia/Dushanbe).
 */
export function getCurrentMinutesInTimezone(
  now: Date = new Date(),
  timeZone: string = DEFAULT_STORE_TIMEZONE
): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
    const hourStr = parts.find((p) => p.type === 'hour')?.value;
    const minStr = parts.find((p) => p.type === 'minute')?.value;
    if (hourStr !== undefined && minStr !== undefined) {
      const h = Number(hourStr) % 24;
      const m = Number(minStr);
      if (Number.isInteger(h) && Number.isInteger(m)) {
        return h * 60 + m;
      }
    }
  } catch {
    // Fallback to browser/server local time if timezone string is unsupported
  }
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Evaluate whether the store is currently open using storeSettings from Supabase,
 * properly supporting overnight schedules (e.g. 08:00 to 03:00).
 */
export function isStoreCurrentlyOpen(
  settings: Partial<StoreSettings>,
  now: Date = new Date()
): boolean {
  const normalized = normalizeWorkingHoursSettings(settings);

  if (normalized.manualStatusOverride === 'force_open') return true;
  if (normalized.manualStatusOverride === 'force_closed') return false;

  const rows =
    normalized.workingHoursRows && normalized.workingHoursRows.length > 0
      ? normalized.workingHoursRows
      : [
          {
            id: 'default',
            days: '',
            open: normalized.workingHours?.open || '08:00',
            close: normalized.workingHours?.close || '03:00',
          },
        ];

  const nowMinutes = getCurrentMinutesInTimezone(
    now,
    normalized.timezone || DEFAULT_STORE_TIMEZONE
  );

  return rows.some((row) => {
    const openMinutes = parseTimeToMinutes(row.open);
    const closeMinutes = parseTimeToMinutes(row.close);
    if (openMinutes === null || closeMinutes === null) return false;

    // Same open and close time (e.g. 00:00 - 00:00) means open 24 hours
    if (openMinutes === closeMinutes) return true;

    // Same-day schedule (e.g. 08:00 - 23:00)
    if (closeMinutes > openMinutes) {
      return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
    }

    // Overnight schedule (e.g. 08:00 - 03:00)
    return nowMinutes >= openMinutes || nowMinutes <= closeMinutes;
  });
}
