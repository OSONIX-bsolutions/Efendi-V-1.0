import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useStore } from '../context/StoreContext';
import { t } from '../i18n/translations';
import { Category, Language, LocalizedString, MenuItem } from '../types';
import { normalizeTelegramUsername, normalizeWhatsAppNumber } from '../utils/dispatch';
import { getEffectiveWorkingHoursRows } from '../utils/workingHours';
import {
  X,
  Download,
  Copy,
  Check,
  QrCode,
  Clock,
  MapPin,
  Phone,
  FileImage,
  UtensilsCrossed,
} from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LOGO_URL =
  '/assets/aistudio/a_clean_png_style_logo_image_with_transparent_back_dd231807.webp';

function getLocalized(
  loc: LocalizedString | undefined,
  language: Language,
  fallback = ''
): string {
  if (!loc) return fallback;
  return loc[language] || loc.en || loc.ru || loc.tj || fallback;
}

function getCleanMenuUrl(): string {
  if (typeof window === 'undefined') return 'https://menu.quickbite.tj';
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    url.searchParams.delete('cms');
    if (url.hash.toLowerCase().includes('admin')) {
      url.hash = '';
    }
    return url.toString();
  } catch {
    return window.location.origin;
  }
}

interface MenuSection {
  category: Category;
  items: MenuItem[];
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose }) => {
  const { storeSettings, language, menuItems, categories } = useStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExportingPoster, setIsExportingPoster] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);

  const menuUrl = useMemo(() => getCleanMenuUrl(), [isOpen]);

  const labels = useMemo(() => {
    if (language === 'tj') {
      return {
        scanHeading: 'Менюи рақамӣ',
        scanCaption: 'Барои фармоиш ва нархҳои рӯз скан кунед',
        downloadMenu: 'Боргирии меню',
        downloadQrOnly: 'Танҳо QR',
        outOfStockNote: 'Тамом шуд',
        otherCategory: 'Дигар таомҳо',
        categoriesUnit: 'категория',
        dishesUnit: 'таом',
        emptyMenu: 'Дар айни замон таомҳои намоён нестанд',
      };
    }
    if (language === 'ru') {
      return {
        scanHeading: 'Цифровое меню',
        scanCaption: 'Сканируйте для заказа и просмотра меню',
        downloadMenu: 'Скачать меню',
        downloadQrOnly: 'Только QR',
        outOfStockNote: 'Нет в наличии',
        otherCategory: 'Другие блюда',
        categoriesUnit: 'катег.',
        dishesUnit: 'блюд',
        emptyMenu: 'Нет доступных позиций для отображения',
      };
    }
    return {
      scanHeading: 'Digital Menu',
      scanCaption: 'Scan to view menu & order online',
      downloadMenu: 'Download Menu',
      downloadQrOnly: 'QR Only',
      outOfStockNote: 'Out of stock',
      otherCategory: 'More Items',
      categoriesUnit: 'categories',
      dishesUnit: 'items',
      emptyMenu: 'No visible menu items available',
    };
  }, [language]);

  const sections = useMemo<MenuSection[]>(() => {
    const visibleItems = menuItems.filter((item) => !item.isHidden);
    const sortedCategories = [...categories].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
    const knownCategoryIds = new Set(sortedCategories.map((c) => c.id));

    const result: MenuSection[] = [];
    for (const cat of sortedCategories) {
      const catItems = visibleItems
        .filter((item) => item.categoryId === cat.id)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      if (catItems.length > 0) {
        result.push({ category: cat, items: catItems });
      }
    }

    const uncategorized = visibleItems.filter(
      (item) => !knownCategoryIds.has(item.categoryId)
    );
    if (uncategorized.length > 0) {
      result.push({
        category: {
          id: '__other__',
          name: { tj: 'Дигар таомҳо', ru: 'Другие блюда', en: 'More Items' },
          icon: '🍽️',
          sortOrder: 9999,
        },
        items: uncategorized,
      });
    }

    return result;
  }, [menuItems, categories]);

  const totalVisibleItems = useMemo(
    () => sections.reduce((sum, s) => sum + s.items.length, 0),
    [sections]
  );

  const workingHoursList = useMemo(
    () => getEffectiveWorkingHoursRows(storeSettings, language),
    [storeSettings, language]
  );

  const currentAddress = useMemo(
    () => getLocalized(storeSettings.address, language),
    [storeSettings.address, language]
  );

  const currentTagline = useMemo(
    () => getLocalized(storeSettings.tagline, language),
    [storeSettings.tagline, language]
  );

  const cleanPhones = useMemo(
    () => (storeSettings.phones || []).map((p) => p.trim()).filter(Boolean),
    [storeSettings.phones]
  );

  const contactHandles = useMemo(() => {
    const items: string[] = [];
    const wa = normalizeWhatsAppNumber(storeSettings.whatsappNumber);
    if (storeSettings.whatsappEnabled !== false && wa) {
      items.push(`WhatsApp: ${wa}`);
    }
    const handle = normalizeTelegramUsername(storeSettings.telegramUsername);
    if (storeSettings.telegramEnabled !== false && handle) {
      items.push(`Telegram: @${handle}`);
    }
    return items;
  }, [
    storeSettings.whatsappEnabled,
    storeSettings.whatsappNumber,
    storeSettings.telegramEnabled,
    storeSettings.telegramUsername,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        menuUrl,
        {
          width: 272,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#171717',
            light: '#ffffff',
          },
        },
        (err) => {
          if (err) console.error(err);
        }
      );
    }
  }, [isOpen, menuUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  const handleDownloadQR = async () => {
    try {
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, menuUrl, {
        width: 512,
        margin: 3,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#171717',
          light: '#ffffff',
        },
      });
      const url = qrCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${storeSettings.name.replace(/\s+/g, '_')}_QR.png`;
      a.click();
    } catch (err) {
      console.error('QR download error:', err);
    }
  };

  const handleDownloadPoster = async () => {
    if (isExportingPoster) return;
    setIsExportingPoster(true);

    try {
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        await document.fonts.ready;
      }

      const posterWidth = 1440;
      const padX = 72;
      const colGap = 60;
      const colWidth = (posterWidth - padX * 2 - colGap) / 2;
      const fontFamily = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';

      // Create temporary measurement canvas
      const measureCanvas = document.createElement('canvas');
      const mCtx = measureCanvas.getContext('2d');
      if (!mCtx) return;

      // Measure header height
      const logoSize = 96;
      const headerTextMaxW = 620;
      mCtx.font = `800 40px ${fontFamily}`;
      const nameLines = wrapCanvasText(mCtx, storeSettings.name, headerTextMaxW);
      mCtx.font = `500 18px ${fontFamily}`;
      const taglineLines = currentTagline
        ? wrapCanvasText(mCtx, currentTagline, headerTextMaxW)
        : [];
      const leftHeaderHeight = Math.max(
        logoSize,
        nameLines.length * 46 + taglineLines.length * 26 + 8
      );
      const rightHeaderHeight = 28 + workingHoursList.length * 28;
      const headerHeight = Math.max(leftHeaderHeight, rightHeaderHeight) + 84;

      // Measure sections & balance across 2 columns
      interface MeasuredItem {
        nameLines: string[];
        priceText: string;
        originalPriceText: string | null;
        isAvailable: boolean;
        height: number;
      }
      interface MeasuredSection {
        title: string;
        countText: string;
        items: MeasuredItem[];
        totalHeight: number;
      }

      const measuredSections: MeasuredSection[] = sections.map((section) => {
        const title = `${section.category.icon ? `${section.category.icon}  ` : ''}${getLocalized(
          section.category.name,
          language,
          labels.otherCategory
        ).toUpperCase()}`;
        const countText = String(section.items.length);

        const items: MeasuredItem[] = section.items.map((item) => {
          const itemName = getLocalized(item.name, language);
          const priceText = `${item.price} ${storeSettings.currency}`;
          const originalPriceText =
            item.originalPrice && item.originalPrice > item.price
              ? `${item.originalPrice} ${storeSettings.currency}`
              : null;

          mCtx.font = `700 18px ${fontFamily}`;
          const priceW = mCtx.measureText(priceText).width;
          const origW = originalPriceText
            ? mCtx.measureText(originalPriceText).width + 12
            : 0;
          const reservedRightW = priceW + origW + 24;

          mCtx.font = `600 18px ${fontFamily}`;
          const lines = wrapCanvasText(
            mCtx,
            itemName,
            Math.max(220, colWidth - reservedRightW)
          );
          const extraStatusH = !item.isAvailable ? 22 : 0;
          const rowH = Math.max(38, lines.length * 24 + 14 + extraStatusH);
          return {
            nameLines: lines,
            priceText,
            originalPriceText,
            isAvailable: item.isAvailable,
            height: rowH,
          };
        });

        const sectionHeaderH = 44;
        const itemsHeight = items.reduce((s, it) => s + it.height, 0);
        return {
          title,
          countText,
          items,
          totalHeight: sectionHeaderH + itemsHeight + 30,
        };
      });

      const leftCol: MeasuredSection[] = [];
      const rightCol: MeasuredSection[] = [];
      let leftH = 0;
      let rightH = 0;

      for (const sec of measuredSections) {
        if (leftH <= rightH) {
          leftCol.push(sec);
          leftH += sec.totalHeight;
        } else {
          rightCol.push(sec);
          rightH += sec.totalHeight;
        }
      }

      const menuBodyHeight = Math.max(leftH, rightH, 140) + 40;

      // Measure footer height
      const footerLeftMaxW = 760;
      mCtx.font = `500 18px ${fontFamily}`;
      const addrLines = currentAddress
        ? wrapCanvasText(mCtx, currentAddress, footerLeftMaxW)
        : [];
      const phonesLine = cleanPhones.join('  ·  ');
      const phoneLines = phonesLine
        ? wrapCanvasText(mCtx, phonesLine, footerLeftMaxW)
        : [];
      const channelsLine = contactHandles.join('  ·  ');

      const footerTextHeight =
        34 +
        (addrLines.length > 0 ? 28 + addrLines.length * 26 + 18 : 0) +
        (phoneLines.length > 0 ? 28 + phoneLines.length * 26 + 18 : 0) +
        (channelsLine ? 28 : 0) +
        28;
      const footerHeight = Math.max(270, footerTextHeight + 64);

      const totalHeight = 10 + headerHeight + menuBodyHeight + footerHeight;

      // Allocate final poster canvas
      const canvas = document.createElement('canvas');
      canvas.width = posterWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background sheet
      ctx.fillStyle = '#FCFBF8';
      ctx.fillRect(0, 0, posterWidth, totalHeight);

      // Top brand hairline bar
      ctx.fillStyle = '#D97706';
      ctx.fillRect(0, 0, posterWidth, 8);

      // Outer subtle border
      ctx.strokeStyle = '#E5E0D5';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, posterWidth - 2, totalHeight - 2);

      // Load logo + generate QR in parallel
      const qrCanvas = document.createElement('canvas');
      const [logoImg] = await Promise.all([
        loadImageSafe(LOGO_URL),
        QRCode.toCanvas(qrCanvas, menuUrl, {
          width: 176,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#171717', light: '#ffffff' },
        }),
      ]);

      // --- Draw Header ---
      let headerLeftX = padX;
      const headerTopY = 48;
      if (logoImg) {
        ctx.drawImage(logoImg, padX, headerTopY, logoSize, logoSize);
        headerLeftX += logoSize + 24;
      }

      let nameY = headerTopY + 38;
      ctx.fillStyle = '#171717';
      ctx.font = `800 40px ${fontFamily}`;
      for (const line of nameLines) {
        ctx.fillText(line, headerLeftX, nameY);
        nameY += 46;
      }

      if (taglineLines.length > 0) {
        ctx.fillStyle = '#525252';
        ctx.font = `500 18px ${fontFamily}`;
        let tagY = nameY - 10;
        for (const line of taglineLines) {
          ctx.fillText(line, headerLeftX, tagY);
          tagY += 26;
        }
      }

      // Header Right: Working Hours
      ctx.textAlign = 'right';
      ctx.fillStyle = '#B45309';
      ctx.font = `800 14px ${fontFamily}`;
      ctx.fillText(
        t('workingHours', language).toUpperCase(),
        posterWidth - padX,
        headerTopY + 18
      );

      let whY = headerTopY + 46;
      for (const row of workingHoursList) {
        const timeStr = `${row.open} — ${row.close}`;
        ctx.font = `700 18px ${fontFamily}`;
        ctx.fillStyle = '#171717';
        ctx.fillText(timeStr, posterWidth - padX, whY);
        const timeW = ctx.measureText(timeStr).width;

        if (row.days) {
          ctx.font = `500 16px ${fontFamily}`;
          ctx.fillStyle = '#737373';
          ctx.fillText(`${row.days}  · `, posterWidth - padX - timeW - 8, whY);
        }
        whY += 28;
      }
      ctx.textAlign = 'left';

      // Header bottom divider
      const bodyStartY = headerHeight;
      ctx.strokeStyle = '#E5E0D5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padX, bodyStartY - 12);
      ctx.lineTo(posterWidth - padX, bodyStartY - 12);
      ctx.stroke();

      // --- Draw Menu Columns ---
      const drawColumn = (colSections: MeasuredSection[], startX: number) => {
        let cursorY = bodyStartY + 26;
        for (const sec of colSections) {
          // Category heading
          ctx.fillStyle = '#B45309';
          ctx.font = `800 16px ${fontFamily}`;
          ctx.textAlign = 'left';
          ctx.fillText(sec.title, startX, cursorY);

          ctx.fillStyle = '#A3A3A3';
          ctx.font = `600 14px ${fontFamily}`;
          ctx.textAlign = 'right';
          ctx.fillText(sec.countText, startX + colWidth, cursorY);
          ctx.textAlign = 'left';

          // Category underline
          ctx.strokeStyle = '#D4CEC3';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(startX, cursorY + 12);
          ctx.lineTo(startX + colWidth, cursorY + 12);
          ctx.stroke();

          cursorY += 42;

          sec.items.forEach((item, idx) => {
            // Right-aligned price
            ctx.textAlign = 'right';
            ctx.font = `700 18px ${fontFamily}`;
            ctx.fillStyle = item.isAvailable ? '#171717' : '#737373';
            ctx.fillText(item.priceText, startX + colWidth, cursorY);
            const priceW = ctx.measureText(item.priceText).width;

            if (item.originalPriceText) {
              ctx.font = `500 15px ${fontFamily}`;
              ctx.fillStyle = '#A3A3A3';
              const origX = startX + colWidth - priceW - 12;
              const origW = ctx.measureText(item.originalPriceText).width;
              ctx.fillText(item.originalPriceText, origX, cursorY);
              ctx.strokeStyle = '#A3A3A3';
              ctx.lineWidth = 1.25;
              ctx.beginPath();
              ctx.moveTo(origX - origW, cursorY - 5);
              ctx.lineTo(origX, cursorY - 5);
              ctx.stroke();
            }

            // Left-aligned dish name
            ctx.textAlign = 'left';
            ctx.font = `600 18px ${fontFamily}`;
            ctx.fillStyle = item.isAvailable ? '#171717' : '#737373';
            let lineY = cursorY;
            for (const line of item.nameLines) {
              ctx.fillText(line, startX, lineY);
              lineY += 24;
            }

            if (!item.isAvailable) {
              ctx.font = `500 13px ${fontFamily}`;
              ctx.fillStyle = '#DC2626';
              ctx.fillText(labels.outOfStockNote, startX, lineY - 2);
            }

            // Dotted separator between items
            if (idx < sec.items.length - 1) {
              const sepY = cursorY + item.height - 18;
              ctx.save();
              ctx.setLineDash([2, 5]);
              ctx.strokeStyle = '#E5E0D5';
              ctx.lineWidth = 1.25;
              ctx.beginPath();
              ctx.moveTo(startX, sepY);
              ctx.lineTo(startX + colWidth, sepY);
              ctx.stroke();
              ctx.restore();
            }

            cursorY += item.height;
          });

          cursorY += 30;
        }
      };

      drawColumn(leftCol, padX);
      drawColumn(rightCol, padX + colWidth + colGap);

      // --- Draw Footer ---
      const footerTopY = totalHeight - footerHeight;
      ctx.fillStyle = '#F4EFE4';
      ctx.fillRect(2, footerTopY, posterWidth - 4, footerHeight - 2);

      ctx.strokeStyle = '#E5E0D5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, footerTopY);
      ctx.lineTo(posterWidth, footerTopY);
      ctx.stroke();

      // Footer Left: Address, Phones, Channels, URL
      let fy = footerTopY + 52;
      ctx.textAlign = 'left';

      if (currentAddress) {
        ctx.fillStyle = '#B45309';
        ctx.font = `800 13px ${fontFamily}`;
        ctx.fillText(t('address', language).toUpperCase(), padX, fy);
        fy += 26;
        ctx.fillStyle = '#171717';
        ctx.font = `600 18px ${fontFamily}`;
        for (const line of addrLines) {
          ctx.fillText(line, padX, fy);
          fy += 26;
        }
        fy += 14;
      }

      if (phoneLines.length > 0) {
        ctx.fillStyle = '#B45309';
        ctx.font = `800 13px ${fontFamily}`;
        ctx.fillText(t('contacts', language).toUpperCase(), padX, fy);
        fy += 26;
        ctx.fillStyle = '#171717';
        ctx.font = `600 18px ${fontFamily}`;
        for (const line of phoneLines) {
          ctx.fillText(line, padX, fy);
          fy += 26;
        }
        fy += 10;
      }

      if (channelsLine) {
        ctx.fillStyle = '#525252';
        ctx.font = `500 15px ${fontFamily}`;
        ctx.fillText(channelsLine, padX, fy);
        fy += 26;
      }

      ctx.fillStyle = '#737373';
      ctx.font = `500 14px "JetBrains Mono", monospace`;
      ctx.fillText(menuUrl.replace(/^https?:\/\//, ''), padX, fy + 4);

      // Footer Right: Attached QR Card + Caption
      const qrBoxSize = 196;
      const qrBoxX = posterWidth - padX - qrBoxSize;
      const qrBoxY = footerTopY + Math.round((footerHeight - qrBoxSize) / 2);

      // Caption to left of QR box
      const captionX = qrBoxX - 24;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#171717';
      ctx.font = `800 20px ${fontFamily}`;
      ctx.fillText(labels.scanHeading, captionX, qrBoxY + qrBoxSize / 2 - 6);

      ctx.fillStyle = '#525252';
      ctx.font = `500 15px ${fontFamily}`;
      const scanLines = wrapCanvasText(ctx, labels.scanCaption, 280);
      let scanY = qrBoxY + qrBoxSize / 2 + 20;
      for (const line of scanLines) {
        ctx.fillText(line, captionX, scanY);
        scanY += 20;
      }
      ctx.textAlign = 'left';

      // Crisp white QR frame
      ctx.fillStyle = '#FFFFFF';
      drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 16);
      ctx.fill();
      ctx.strokeStyle = '#E5E0D5';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.drawImage(qrCanvas, qrBoxX + 10, qrBoxY + 10, qrBoxSize - 20, qrBoxSize - 20);

      // Trigger PNG download
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${storeSettings.name.replace(/\s+/g, '_')}_Full_Menu_QR.png`;
      a.click();
    } catch (err) {
      console.error('Menu poster download failed:', err);
    } finally {
      setIsExportingPoster(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={t('qrTitle', language)}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/75 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Shell */}
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
        {/* Top Modal Control Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <QrCode className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate">
                {t('qrTitle', language)}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums truncate">
                {sections.length} {labels.categoriesUnit} · {totalVisibleItems}{' '}
                {labels.dishesUnit}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Editorial Menu & QR Poster Preview */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-neutral-100/80 dark:bg-neutral-950/70">
          <div className="max-w-[820px] mx-auto rounded-2xl bg-[#FCFBF8] dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-sm overflow-hidden">
            {/* Top accent hairline */}
            <div className="h-1.5 bg-amber-600 dark:bg-amber-500 w-full" />

            {/* Restaurant Poster Header: Logo, Name, Tagline, Working Hours */}
            <header className="px-5 sm:px-8 py-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center rounded-xl bg-white dark:bg-neutral-800/70 border border-neutral-200/80 dark:border-neutral-700/70 p-1.5">
                  {!logoLoadError ? (
                    <img
                      src={LOGO_URL}
                      alt={storeSettings.name}
                      referrerPolicy="no-referrer"
                      onError={() => setLogoLoadError(true)}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <UtensilsCrossed className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
                    {storeSettings.name}
                  </h3>
                  {currentTagline && (
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-snug">
                      {currentTagline}
                    </p>
                  )}
                </div>
              </div>

              {/* Working Hours */}
              <div className="sm:text-right shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-200/70 dark:border-neutral-800">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t('workingHours', language)}</span>
                </div>
                <div className="mt-1.5 space-y-1">
                  {workingHoursList.map((row) => (
                    <div
                      key={row.id}
                      className="flex sm:justify-end items-baseline gap-2 text-xs sm:text-sm"
                    >
                      {row.days && (
                        <span className="text-neutral-500 dark:text-neutral-400">
                          {row.days} ·
                        </span>
                      )}
                      <span className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums whitespace-nowrap">
                        {row.open} — {row.close}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </header>

            {/* Categorized Full Menu Body */}
            <div className="px-5 sm:px-8 py-6">
              {sections.length === 0 ? (
                <p className="text-center py-10 text-sm text-neutral-500 dark:text-neutral-400">
                  {labels.emptyMenu}
                </p>
              ) : (
                <div className="columns-1 md:columns-2 gap-8">
                  {sections.map((section) => {
                    const catName = getLocalized(
                      section.category.name,
                      language,
                      labels.otherCategory
                    );
                    return (
                      <section
                        key={section.category.id}
                        className="break-inside-avoid mb-6 last:mb-0"
                      >
                        {/* Category Header */}
                        <div className="flex items-baseline justify-between gap-2 pb-1.5 mb-2 border-b border-neutral-300/85 dark:border-neutral-700">
                          <h4 className="text-xs font-extrabold uppercase tracking-[0.13em] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            {section.category.icon && (
                              <span aria-hidden="true">{section.category.icon}</span>
                            )}
                            <span>{catName}</span>
                          </h4>
                          <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 tabular-nums">
                            {section.items.length}
                          </span>
                        </div>

                        {/* Dish Rows */}
                        <ul className="divide-y divide-dotted divide-neutral-200 dark:divide-neutral-800">
                          {section.items.map((item) => {
                            const dishName = getLocalized(item.name, language);
                            const hasDiscount =
                              typeof item.originalPrice === 'number' &&
                              item.originalPrice > item.price;

                            return (
                              <li
                                key={item.id}
                                className="py-2 flex items-baseline justify-between gap-3"
                              >
                                <div className="min-w-0">
                                  <span
                                    className={`text-[13.5px] font-semibold leading-snug ${
                                      item.isAvailable
                                        ? 'text-neutral-900 dark:text-neutral-100'
                                        : 'text-neutral-400 dark:text-neutral-500 line-through'
                                    }`}
                                  >
                                    {dishName}
                                  </span>
                                  {!item.isAvailable && (
                                    <span className="ml-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                                      · {labels.outOfStockNote}
                                    </span>
                                  )}
                                </div>

                                <div className="shrink-0 text-right tabular-nums whitespace-nowrap">
                                  {hasDiscount && (
                                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 line-through mr-1.5">
                                      {item.originalPrice} {storeSettings.currency}
                                    </span>
                                  )}
                                  <span
                                    className={`text-[13.5px] font-bold ${
                                      item.isAvailable
                                        ? 'text-neutral-900 dark:text-white'
                                        : 'text-neutral-400 dark:text-neutral-500'
                                    }`}
                                  >
                                    {item.price} {storeSettings.currency}
                                  </span>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Poster Footer: Restaurant Address, Contact Details & Attached QR Code */}
            <footer className="px-5 sm:px-8 py-6 bg-[#F4EFE4] dark:bg-neutral-950/75 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                {/* Contact Details */}
                <div className="space-y-3.5 min-w-0 flex-1">
                  {currentAddress && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.13em] text-amber-700 dark:text-amber-400">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{t('address', language)}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                        {currentAddress}
                      </p>
                    </div>
                  )}

                  {cleanPhones.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.13em] text-amber-700 dark:text-amber-400">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{t('contacts', language)}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                        {cleanPhones.map((phone, idx) => (
                          <React.Fragment key={`${phone}-${idx}`}>
                            {idx > 0 && (
                              <span className="text-neutral-400" aria-hidden="true">
                                ·
                              </span>
                            )}
                            <a
                              href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                              className="hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                            >
                              {phone}
                            </a>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {(contactHandles.length > 0 || menuUrl) && (
                    <div className="pt-0.5 space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                      {contactHandles.length > 0 && (
                        <p className="font-medium">{contactHandles.join(' · ')}</p>
                      )}
                      <p className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {menuUrl.replace(/^https?:\/\//, '')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Attached Digital Menu QR Code */}
                <div className="flex items-center gap-4 sm:gap-5 shrink-0 self-start sm:self-center">
                  <div className="sm:text-right order-2 sm:order-1">
                    <p className="text-sm font-extrabold text-neutral-900 dark:text-white leading-tight">
                      {labels.scanHeading}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 max-w-[170px]">
                      {labels.scanCaption}
                    </p>
                  </div>

                  <div className="order-1 sm:order-2 p-2.5 bg-white rounded-xl border border-neutral-200 shadow-xs shrink-0">
                    <canvas
                      ref={canvasRef}
                      className="block w-[124px] h-[124px] sm:w-[136px] sm:h-[136px]"
                    />
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </div>

        {/* Bottom Modal Action Bar */}
        <div className="px-4 sm:px-5 py-3.5 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block truncate">
            {t('qrSubtitle', language)}
          </p>

          <div className="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition-colors border border-neutral-200/80 dark:border-neutral-700 whitespace-nowrap shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{t('linkCopied', language)}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t('copyLink', language)}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadQR}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs transition-colors border border-neutral-200/80 dark:border-neutral-700 whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{labels.downloadQrOnly}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPoster}
              disabled={isExportingPoster}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold text-xs transition-colors shadow-xs whitespace-nowrap shrink-0"
            >
              <FileImage className="w-4 h-4" />
              <span>
                {isExportingPoster ? '...' : labels.downloadMenu}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
