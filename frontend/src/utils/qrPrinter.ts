// ── TapNow QR Print Engine & Template Preferences ─────────────────────

export interface QRPrintTemplate {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
  description: string;
  isDefault?: boolean;
}

export const QR_PRINT_TEMPLATES: QRPrintTemplate[] = [
  {
    id: 'CARD_40',
    label: 'استیکر استاندارد کارت (۴۰ × ۴۰ mm)',
    widthMm: 40,
    heightMm: 40,
    description: 'سایز پیش‌فرض استاندارد کارت فیزیکی و استیکر',
    isDefault: true,
  },
  {
    id: 'DESK_50',
    label: 'برچسب رومیزی و استند (۵۰ × ۵۰ mm)',
    widthMm: 50,
    heightMm: 50,
    description: 'مناسب پایه‌های رومیزی، استند و پرینترهای حرارتی ۵۸/۸۰ میلی‌متری',
  },
  {
    id: 'WALL_70',
    label: 'تابلو و شیشه مغازه (۷۰ × ۷۰ mm)',
    widthMm: 70,
    heightMm: 70,
    description: 'مناسب تابلوهای ورودی، شیشه و برچسب‌های دیواری بزرگ',
  },
  {
    id: 'MINI_30',
    label: 'برچسب مینی (۳۰ × ۳۰ mm)',
    widthMm: 30,
    heightMm: 30,
    description: 'مناسب جاکلیدی و کارت‌های کوچک',
  },
];

const STORAGE_KEY_TEMPLATE = 'tapnow_qr_print_template_id';
const STORAGE_KEY_CUSTOM_MM = 'tapnow_qr_custom_size_mm';
const STORAGE_KEY_SHOW_CODE = 'tapnow_qr_show_code_subtitle';

export function getSavedPrintTemplate(): {
  templateId: string;
  sizeMm: number;
  showCodeSubtitle: boolean;
} {
  let showCode = false;
  try {
    showCode = localStorage.getItem(STORAGE_KEY_SHOW_CODE) === 'true';
    const savedId = localStorage.getItem(STORAGE_KEY_TEMPLATE);
    if (savedId === 'CUSTOM') {
      const customMm = parseInt(localStorage.getItem(STORAGE_KEY_CUSTOM_MM) || '40', 10);
      return {
        templateId: 'CUSTOM',
        sizeMm: isNaN(customMm) ? 40 : customMm,
        showCodeSubtitle: showCode,
      };
    }
    const found = QR_PRINT_TEMPLATES.find((t) => t.id === savedId);
    if (found) {
      return {
        templateId: found.id,
        sizeMm: found.widthMm,
        showCodeSubtitle: showCode,
      };
    }
  } catch {
    // fallback
  }
  // Default to 40mm (CARD_40)
  return { templateId: 'CARD_40', sizeMm: 40, showCodeSubtitle: showCode };
}

export function savePrintTemplate(
  templateId?: string,
  customMm?: number,
  showCodeSubtitle?: boolean
): void {
  try {
    if (templateId !== undefined) {
      localStorage.setItem(STORAGE_KEY_TEMPLATE, templateId);
    }
    if (customMm !== undefined) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_MM, customMm.toString());
    }
    if (showCodeSubtitle !== undefined) {
      localStorage.setItem(STORAGE_KEY_SHOW_CODE, showCodeSubtitle ? 'true' : 'false');
    }
  } catch {
    // ignore
  }
}

/**
 * Resolves a relative or absolute QR URL to an absolute URL that browser print contexts can load reliably.
 */
export function resolveAbsoluteQrUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }
  // Ensure starts with /
  const path = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  return `${window.location.origin}${path}`;
}

/**
 * Prints a single QR code with exact physical millimeter sizing and 0-margin clean page.
 * Uses an isolated hidden iframe for zero blank page bugs and instantaneous print dialog.
 */
export async function printQRCodeDirectly(
  rawQrUrl: string,
  cardCode: string,
  options?: {
    sizeMm?: number;
    showCodeSubtitle?: boolean;
  }
): Promise<void> {
  const fullUrl = resolveAbsoluteQrUrl(rawQrUrl);
  const saved = getSavedPrintTemplate();
  const sizeMm = options?.sizeMm || saved.sizeMm;
  const showCodeSubtitle = options?.showCodeSubtitle ?? saved.showCodeSubtitle;

  // Pre-load the image first to ensure it's in browser cache and avoid blank print preview
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve();
    img.onerror = () => resolve(); // continue anyway
    img.src = fullUrl;
  });

  // Remove any previous print iframe
  const existingIframe = document.getElementById('tapnow-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  // Create a hidden print iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'tapnow-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const totalHeightMm = sizeMm + (showCodeSubtitle ? 7 : 0);

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>QR-${cardCode}</title>
        <style>
          @page {
            size: ${sizeMm}mm ${totalHeightMm}mm;
            margin: 0mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: ${sizeMm}mm;
            height: ${totalHeightMm}mm;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #ffffff;
          }
          .qr-image {
            width: ${sizeMm}mm;
            height: ${sizeMm}mm;
            display: block;
            object-fit: contain;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
          }
          .qr-code-text {
            font-family: monospace;
            font-size: 9pt;
            font-weight: bold;
            color: #000000;
            text-align: center;
            margin-top: 1mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <img class="qr-image" src="${fullUrl}" alt="QR" />
        ${showCodeSubtitle ? `<div class="qr-code-text">${cardCode}</div>` : ''}
      </body>
    </html>
  `);
  doc.close();

  // Trigger print after iframe renders
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Print iframe error:', e);
    }
  }, 250);
}

/**
 * Prints a batch of QR codes reliably via an isolated print iframe.
 * Supports:
 * - single_per_page (Default): Each QR code on its own page/label, ideal for thermal roll printers.
 * - grid: Responsive grid on standard A4 sheet.
 */
export async function printBatchQRCodes(
  items: { qrImageUrl: string; cardCode: string }[],
  options?: {
    sizeMm?: number;
    showCodeSubtitle?: boolean;
    layoutMode?: 'single_per_page' | 'grid';
  }
): Promise<void> {
  if (!items || items.length === 0) return;

  const saved = getSavedPrintTemplate();
  const sizeMm = options?.sizeMm || saved.sizeMm;
  const showCodeSubtitle = options?.showCodeSubtitle ?? saved.showCodeSubtitle;
  const layoutMode = options?.layoutMode ?? 'single_per_page';

  // 1. Preload all images to prevent blank print previews
  await Promise.all(
    items.map(
      (item) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = resolveAbsoluteQrUrl(item.qrImageUrl);
        })
    )
  );

  // 2. Remove any previous print iframe
  const existingIframe = document.getElementById('tapnow-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  // 3. Create a hidden print iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'tapnow-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const itemsHtml = items
    .map(
      (item) => `
    <div class="qr-item">
      <img class="qr-image" src="${resolveAbsoluteQrUrl(item.qrImageUrl)}" alt="QR" />
      ${showCodeSubtitle ? `<div class="qr-code-text">${item.cardCode}</div>` : ''}
    </div>
  `
    )
    .join('');

  const totalHeightMm = sizeMm + (showCodeSubtitle ? 7 : 0);

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>QR-Labels-Batch</title>
        <style>
          @page {
            size: ${layoutMode === 'single_per_page' ? `${sizeMm}mm ${totalHeightMm}mm` : 'auto'};
            margin: ${layoutMode === 'single_per_page' ? '0mm' : '5mm'};
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            background: #ffffff;
            margin: 0;
            padding: 0;
          }
          ${
            layoutMode === 'single_per_page'
              ? `
          .qr-item {
            width: ${sizeMm}mm;
            height: ${totalHeightMm}mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            page-break-after: always;
            break-after: page;
            margin: 0 auto;
            overflow: hidden;
          }
          `
              : `
          body {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 8mm;
            padding: 5mm;
          }
          .qr-item {
            width: ${sizeMm}mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          `
          }
          .qr-image {
            width: ${sizeMm}mm;
            height: ${sizeMm}mm;
            display: block;
            object-fit: contain;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
          }
          .qr-code-text {
            font-family: monospace;
            font-size: 9pt;
            font-weight: bold;
            color: #000000;
            text-align: center;
            margin-top: 1mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${itemsHtml}
      </body>
    </html>
  `);
  doc.close();

  // Trigger print after iframe renders
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Print batch iframe error:', e);
    }
  }, 250);
}
