import React, { useState, useEffect } from 'react';
import { Settings2, Check, Sliders, Hash } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import {
  QR_PRINT_TEMPLATES,
  getSavedPrintTemplate,
  savePrintTemplate,
} from '../../utils/qrPrinter';

interface QRPrintSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const QRPrintSettingsModal: React.FC<QRPrintSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [selectedId, setSelectedId] = useState('CARD_40');
  const [customMm, setCustomMm] = useState(40);
  const [showCodeSubtitle, setShowCodeSubtitle] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getSavedPrintTemplate();
      setSelectedId(current.templateId);
      setCustomMm(current.sizeMm);
      setShowCodeSubtitle(current.showCodeSubtitle);
    }
  }, [isOpen]);

  const handleSave = () => {
    savePrintTemplate(selectedId, customMm, showCodeSubtitle);
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تنظیم قالب پیش‌فرض چاپ QR"
      subtitle="سایز پیش‌فرض برای دکمه‌های «چاپ بارکد QR» ذخیره می‌شود و نیازی به تنظیم مجدد نخواهید داشت."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Template List */}
        <div className="space-y-2.5">
          {QR_PRINT_TEMPLATES.map((tmpl) => {
            const isSelected = selectedId === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => {
                  setSelectedId(tmpl.id);
                  setCustomMm(tmpl.widthMm);
                }}
                className={`w-full p-3.5 rounded-2xl border-2 text-start transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{tmpl.label}</span>
                    {tmpl.isDefault && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        پیش‌فرض سیستم
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{tmpl.description}</p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}

          {/* Custom Size Option */}
          <div
            onClick={() => setSelectedId('CUSTOM')}
            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-2.5 ${
              selectedId === 'CUSTOM'
                ? 'bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-black text-slate-900">سایز دلخواه دستی (بر حسب میلی‌متر)</span>
              </div>
              {selectedId === 'CUSTOM' && (
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>

            {selectedId === 'CUSTOM' && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-slate-600 font-bold">اندازه ضلع مربع:</span>
                <input
                  type="number"
                  min={15}
                  max={200}
                  value={customMm}
                  onChange={(e) => setCustomMm(Math.max(10, Math.min(250, parseInt(e.target.value, 10) || 40)))}
                  className="w-24 bg-white text-center font-bold text-sm text-slate-900 rounded-xl border border-blue-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-xs text-slate-500 font-mono">میلی‌متر (mm)</span>
              </div>
            )}
          </div>
        </div>

        {/* Show Code Subtitle Option */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCodeSubtitle}
              onChange={(e) => setShowCodeSubtitle(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-800">
                چاپ کد شناسه کارت زیر تصویر بارکد QR
              </span>
            </div>
          </label>
          <p className="text-[10px] text-slate-500 mt-1 mr-6">
            در صورت فعال بودن، کد ۸ رقمی کارت (مانند md9s2tri) با فونت خوانا زیر بارکد پرینت می‌شود.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <Button variant="ghost" size="sm" onClick={onClose}>
            انصراف
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            icon={<Settings2 className="w-3.5 h-3.5" />}
          >
            ذخیره به عنوان پیش‌فرض
          </Button>
        </div>
      </div>
    </Modal>
  );
};
