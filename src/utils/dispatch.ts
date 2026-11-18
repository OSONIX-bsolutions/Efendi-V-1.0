export function normalizeWhatsAppNumber(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return trimmed.startsWith('+') ? `+${digits}` : `+${digits}`;
}

export function extractWhatsAppDigits(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(/[^0-9]/g, '');
}

export function normalizeTelegramUsername(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  let clean = raw.trim();
  if (!clean) return '';
  clean = clean
    .replace(/^https?:\/\/(www\.)?(t\.me|telegram\.me)\//i, '')
    .replace(/^(t\.me|telegram\.me)\//i, '')
    .split(/[?#]/)[0]
    .replace(/\/+$/, '')
    .replace(/^@+/, '')
    .trim();
  return clean;
}

export function buildWhatsAppDispatchUrl(
  whatsappNumber?: string | null,
  messageText?: string
): string {
  const digits = extractWhatsAppDigits(whatsappNumber);
  if (!digits) return '';
  if (messageText) {
    return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(messageText)}`;
  }
  return `https://wa.me/${digits}`;
}

export function buildTelegramDispatchUrl(
  telegramUsername?: string | null,
  messageText?: string
): string {
  const handle = normalizeTelegramUsername(telegramUsername);
  if (!handle) return '';
  if (messageText) {
    return `https://t.me/${handle}?text=${encodeURIComponent(messageText)}`;
  }
  return `https://t.me/${handle}`;
}
