import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer, X, QrCode, Settings2, Sliders, Layers } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/apiClient';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { QRLabelItem } from '../../types/api';
import {
  QR_PRINT_TEMPLATES,
  getSavedPrintTemplate,
  savePrintTemplate,
  printBatchQRCodes,
} from '../../utils/qrPrinter';
import { QRPrintSettingsModal } from '../../components/ui/QRPrintSettingsModal';

export interface QRLabelSheetModalProps {
  orderId: string | null;
  onClose: () => void;
}

export const QRLabelSheetModal: React.FC<QRLabelSheetModalProps> = ({
  orderId,
  onClose,
}) => {
  const { t } = useLanguage();
  const [showCodeSubtitle, setShowCodeSubtitle] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('CARD_40');
  const [activeSizeMm, setActiveSizeMm] = useState(40);
  const [layoutMode, setLayoutMode] = useState<'single_per_page' | 'grid'>('single_per_page');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const current = getSavedPrintTemplate();
    setSelectedTemplateId(current.templateId);
    setActiveSizeMm(current.sizeMm);
  }, []);

  const { data: labelsData, isLoading } = useQuery({
    queryKey: ['orderQRLabels', orderId],
    queryFn: () => (orderId ? api.getOrderQRLabels(orderId) : null),
    enabled: !!orderId,
  });

  if (!orderId) return null;

  const handlePrint = () => {
    if (!labelsData || labelsData.labels.length === 0) return;
    printBatchQRCodes(
      labelsData.labels.map((l: QRLabelItem) => ({
        qrImageUrl: l.qr_image_url,
        cardCode: l.card_code,
      })),
      {
        sizeMm: activeSizeMm,
        showCodeSubtitle,
        layoutMode,
      }
    );
  };

  const handleTemplateChange = (tmplId: string, sizeMm: number) => {
    setSelectedTemplateId(tmplId);
    setActiveSizeMm(sizeMm);
    savePrintTemplate(tmplId, sizeMm);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900">چاپ برگه بارکدهای QR</h3>
                {labelsData && (
                  <Badge variant="active">
                    {labelsData.total_labels} بارکد
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">چاپ خالص و مستقیم بارکدها برای پرینترهای لیبل‌زن و رومیزی</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Template Selector Quick Chips */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs">
              <span className="text-[10px] text-slate-400 font-bold px-1.5 flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                سایز:
              </span>
              {QR_PRINT_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleTemplateChange(tmpl.id, tmpl.widthMm)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    selectedTemplateId === tmpl.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title={tmpl.label}
                >
                  {tmpl.widthMm}mm
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                title="تنظیمات اندازه دلخواه"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Print CTA Button */}
            <Button
              variant="primary"
              size="sm"
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
              disabled={isLoading || !labelsData || labelsData.labels.length === 0}
              className="font-bold shadow-xs px-4 bg-blue-600 hover:bg-blue-700"
            >
              چاپ برگه ({activeSizeMm}mm)
            </Button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sheet Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400">{t.common.loading}</div>
          ) : !labelsData || labelsData.labels.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <QrCode className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">این سفارش بارکد QR ندارد (سفارش فقط NFC است).</p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center items-center gap-6">
              {labelsData.labels.map((lbl: QRLabelItem) => (
                <div
                  key={lbl.card_id}
                  className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center shadow-xs"
                >
                  <img
                    src={lbl.qr_image_url}
                    alt={`QR-${lbl.card_code}`}
                    style={{ width: `${Math.min(activeSizeMm * 3.5, 200)}px`, height: `${Math.min(activeSizeMm * 3.5, 200)}px` }}
                    className="object-contain"
                    loading="eager"
                  />

                  {showCodeSubtitle && (
                    <span className="text-xs font-mono font-bold text-slate-700 mt-2">
                      {lbl.card_code}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Configuration Bar */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            {/* Layout Mode Toggle */}
            <div className="flex items-center gap-2 font-medium">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>چیدمان چاپ:</span>
              <button
                type="button"
                onClick={() => setLayoutMode('single_per_page')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                  layoutMode === 'single_per_page'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                تک‌تک در هر صفحه (رول لیبل‌زن)
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('grid')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                  layoutMode === 'grid'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                شبکه‌ای در یک برگه (A4)
              </button>
            </div>

            {/* Code Subtitle Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-[11px]">
              <input
                type="checkbox"
                checked={showCodeSubtitle}
                onChange={(e) => setShowCodeSubtitle(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>نمایش کد کارت زیر هر بارکد</span>
            </label>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose}>
            {t.orders.closeSheet}
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      <QRPrintSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => {
          const current = getSavedPrintTemplate();
          setSelectedTemplateId(current.templateId);
          setActiveSizeMm(current.sizeMm);
        }}
      />
    </div>
  );
};
