import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Radio,
  QrCode,
  Copy,
  Check,
  BarChart3,
  ExternalLink,
  Power,
  Link2,
  Image as ImageIcon,
  Layers,
  Printer,
  Settings2,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/apiClient';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { DateRangeFilter } from '../../components/analytics/DateRangeFilter';
import { AnalyticsCharts } from '../../components/analytics/AnalyticsCharts';
import { Destination, EntityStatus, CardProvisioning } from '../../types/api';
import { QRPrintSettingsModal } from '../../components/ui/QRPrintSettingsModal';
import { printQRCodeDirectly, getSavedPrintTemplate, savePrintTemplate } from '../../utils/qrPrinter';

export interface CardDetailDrawerProps {
  cardId: string | null;
  onClose: () => void;
}

export const CardDetailDrawer: React.FC<CardDetailDrawerProps> = ({
  cardId,
  onClose,
}) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'hardware' | 'analytics'>('hardware');
  const [dateRange, setDateRange] = useState<{ start_date?: string; end_date?: string }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(false);
  const [showCodeSubtitle, setShowCodeSubtitle] = useState<boolean>(() => getSavedPrintTemplate().showCodeSubtitle);

  // Queries
  const { data: cardInfo, isLoading: isInfoLoading } = useQuery({
    queryKey: ['cardInfo', cardId],
    queryFn: () => (cardId ? api.getCardInfo(cardId) : null),
    enabled: !!cardId,
  });

  const { data: linkedOrder } = useQuery({
    queryKey: ['order', cardInfo?.order_id],
    queryFn: () => (cardInfo?.order_id ? api.getOrder(cardInfo.order_id) : null),
    enabled: !!cardInfo?.order_id,
  });

  const { data: provisioning } = useQuery({
    queryKey: ['cardProvisioning', cardId],
    queryFn: () => (cardId ? api.getCardProvisioning(cardId) : null),
    enabled: !!cardId,
  });

  const { data: analytics, isLoading: isAnalyticsLoading, isError: isAnalyticsError } = useQuery({
    queryKey: ['cardAnalytics', cardId, dateRange],
    queryFn: () => (cardId ? api.getCardAnalytics(cardId, dateRange) : null),
    enabled: !!cardId,
  });

  const { data: destinations } = useQuery({
    queryKey: ['destinations'],
    queryFn: () => api.listDestinations({ limit: 100 }),
  });

  // Destination Change Mutation
  const changeDestMutation = useMutation({
    mutationFn: (newDestId: string) => {
      if (!cardId) throw new Error('Card ID missing');
      return api.updateCard(cardId, { destination_id: newDestId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardInfo', cardId] });
      queryClient.invalidateQueries({ queryKey: ['cardProvisioning', cardId] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });

  // Status Toggle Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (newStatus: EntityStatus) => {
      if (!cardId) throw new Error('Card ID missing');
      return api.updateCard(cardId, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardInfo', cardId] });
      queryClient.invalidateQueries({ queryKey: ['cardProvisioning', cardId] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
    },
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handlePrintQR = (qrImageUrl: string, cardCode: string) => {
    printQRCodeDirectly(qrImageUrl, cardCode, { showCodeSubtitle });
  };

  const getQcBadge = (prov: CardProvisioning | null | undefined): { variant: BadgeVariant; label: string } => {
    if (!prov) return { variant: 'untested', label: t.common.untested };
    const passed = prov.qc_nfc_tested && prov.qc_qr_tested && prov.qc_destination_verified;
    const partial = prov.qc_nfc_tested || prov.qc_qr_tested || prov.qc_destination_verified;
    if (passed) return { variant: 'qcPassed', label: t.common.qcPassed };
    if (partial) return { variant: 'qcIncomplete', label: t.common.qcIncomplete };
    return { variant: 'untested', label: t.common.untested };
  };

  const isNfcOnly = linkedOrder?.product_type === 'NFC_ONLY';

  return (
    <Drawer
      isOpen={!!cardId}
      onClose={onClose}
      title={cardInfo ? `کارت ${cardInfo.code}` : t.cards.title}
      subtitle={cardInfo ? `شناسه: ${cardInfo.id}` : undefined}
      maxWidth="2xl"
    >
      {isInfoLoading || !cardInfo ? (
        <div className="py-16 text-center text-slate-400">{t.common.loading}</div>
      ) : (
        <div className="space-y-6">
          {/* Header Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-slate-900">
                      {cardInfo.code}
                    </span>
                    <Badge variant={cardInfo.status === 'ACTIVE' ? 'active' : 'disabled'}>
                      {cardInfo.status === 'ACTIVE' ? t.common.active : t.common.disabled}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{cardInfo.business_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={getQcBadge(provisioning).variant}>
                  {getQcBadge(provisioning).label}
                </Badge>
                <Button
                  variant={cardInfo.status === 'ACTIVE' ? 'danger' : 'secondary'}
                  size="sm"
                  icon={<Power className="w-3.5 h-3.5" />}
                  isLoading={toggleStatusMutation.isPending}
                  onClick={() =>
                    toggleStatusMutation.mutate(
                      cardInfo.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
                    )
                  }
                >
                  {cardInfo.status === 'ACTIVE' ? t.common.disabled : t.common.active}
                </Button>
              </div>
            </div>

            {/* Product Type Identification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-medium block">نوع فیزیکی محصول:</span>
                {linkedOrder?.product_type === 'NFC_ONLY' ? (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold inline-flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5" />
                    📡 فقط NFC (NFC Only)
                  </span>
                ) : linkedOrder?.product_type === 'NFC_QR' ? (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold inline-flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5" />
                    📡 NFC + ▣ QR
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium inline-flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    کارت مستقل
                  </span>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-medium block">سفارش مربوطه:</span>
                {linkedOrder ? (
                  <span className="text-xs font-mono font-bold text-slate-900 block">
                    {linkedOrder.order_number}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">بدون سفارش متصل</span>
                )}
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('hardware')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'hardware'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Radio className="w-4 h-4 text-blue-600" />
              <span>مشخصات فنی و مقصد</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>آمار و تحلیل تعاملات</span>
            </button>
          </div>

          {/* TAB 1: HARDWARE & DESTINATION */}
          {activeTab === 'hardware' && (
            <div className="space-y-5">
              {/* Dynamic Destination Switcher */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-blue-600" />
                    تغییر فوری مقصد هدایت کارت
                  </h4>
                  <span className="text-xs text-blue-700 font-mono font-bold">[{cardInfo.destination_type}]</span>
                </div>

                <div className="space-y-2">
                  <select
                    value={provisioning?.destination.id || ''}
                    onChange={(e) => changeDestMutation.mutate(e.target.value)}
                    disabled={changeDestMutation.isPending}
                    className="w-full bg-white text-slate-900 text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs font-medium"
                  >
                    {destinations
                      ?.filter((d: Destination) => d.business_id === provisioning?.business.id)
                      .map((d: Destination) => (
                        <option key={d.id} value={d.id}>
                          [{d.type}] {d.url}
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    با تغییر مقصد، هر دو لینک NFC و QR بدون نیاز به رایت مجدد سخت‌افزار، فوراً به آدرس جدید هدایت می‌شوند.
                  </p>
                </div>
              </div>

              {/* Hardware Links Box */}
              {provisioning && (
                <div className="space-y-4">
                  {/* NFC Link */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5 text-blue-700">
                        <Radio className="w-4 h-4" />
                        لینک NFC (تپ مستقیم):
                      </span>
                      <a
                        href={provisioning.nfc_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        تست تپ
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={provisioning.nfc_url}
                        className="w-full bg-white text-xs font-mono text-slate-800 rounded-xl border border-slate-300 px-3 py-2 select-all shadow-xs"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(provisioning.nfc_url, 'nfc')}
                        icon={copiedKey === 'nfc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      >
                        {copiedKey === 'nfc' ? t.cards.copySuccess : t.common.copy}
                      </Button>
                    </div>
                  </div>

                  {/* QR Link & Image */}
                  {!isNfcOnly ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5 text-indigo-700">
                          <QrCode className="w-4 h-4" />
                          لینک اسکن بارکد QR:
                        </span>
                        <a
                          href={provisioning.qr_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          تست اسکن
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={provisioning.qr_url}
                          className="w-full bg-white text-xs font-mono text-slate-800 rounded-xl border border-slate-300 px-3 py-2 select-all shadow-xs"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCopy(provisioning.qr_url, 'qr')}
                          icon={copiedKey === 'qr' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        >
                          {copiedKey === 'qr' ? t.cards.copySuccess : t.common.copy}
                        </Button>
                      </div>

                      {/* View & Print QR image */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                        <a
                          href={provisioning.qr_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          مشاهده تصویر QR
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                        <div className="flex-1 flex items-center gap-1">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1 py-2 font-bold shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                            icon={<Printer className="w-3.5 h-3.5" />}
                            onClick={() =>
                              handlePrintQR(
                                provisioning.qr_image_url,
                                cardInfo.code
                              )
                            }
                          >
                            چاپ QR ({getSavedPrintTemplate().sizeMm}mm)
                          </Button>
                          <button
                            type="button"
                            onClick={() => setIsPrintSettingsOpen(true)}
                            className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="تنظیم قالب و سایز پیش‌فرض چاپ"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {/* Show Code Subtitle Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-500 hover:text-slate-700 pt-0.5">
                        <input
                          type="checkbox"
                          checked={showCodeSubtitle}
                          onChange={(e) => {
                            setShowCodeSubtitle(e.target.checked);
                            savePrintTemplate(undefined, undefined, e.target.checked);
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>نمایش کد کارت زیر بارکد هنگام چاپ</span>
                      </label>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-slate-400" />
                      <span>این کارت از نوع «فقط NFC» است و بارکد QR ندارد.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <DateRangeFilter value={dateRange} onChange={setDateRange} />
              <AnalyticsCharts
                total={analytics?.total ?? 0}
                nfc={analytics?.nfc ?? 0}
                qr={analytics?.qr ?? 0}
                recent={analytics?.recent ?? []}
                isLoading={isAnalyticsLoading}
                isError={isAnalyticsError}
              />
            </div>
          )}
        </div>
      )}

      {/* QR Print Settings Modal */}
      <QRPrintSettingsModal
        isOpen={isPrintSettingsOpen}
        onClose={() => setIsPrintSettingsOpen(false)}
        onSaved={() => {
          setShowCodeSubtitle(getSavedPrintTemplate().showCodeSubtitle);
        }}
      />
    </Drawer>
  );
};
