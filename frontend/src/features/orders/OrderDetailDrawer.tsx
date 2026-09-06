import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Radio,
  QrCode,
  Sparkles,
  Check,
  Copy,
  ExternalLink,
  Building2,
  Layers,
  Clock,
  ShieldCheck,
  Download,
  AlertTriangle,
  Printer,
  CheckCircle2,
  FileSpreadsheet,
  Image as ImageIcon,
  Settings2,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/apiClient';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { QRLabelSheetModal } from './QRLabelSheetModal';
import { QRPrintSettingsModal } from '../../components/ui/QRPrintSettingsModal';
import { OrderStatus, CardInfo } from '../../types/api';
import { DEST_TYPE_META } from './NewOrderWizard';
import { printQRCodeDirectly, getSavedPrintTemplate } from '../../utils/qrPrinter';

export interface OrderDetailDrawerProps {
  orderId: string | null;
  onClose: () => void;
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  orderId,
  onClose,
}) => {
  const { t, language } = useLanguage();
  const isFa = language === 'fa';
  const queryClient = useQueryClient();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isQRSheetOpen, setIsQRSheetOpen] = useState(false);
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(false);
  const [showCodeMap, setShowCodeMap] = useState<Record<string, boolean>>({});
  const [exportingType, setExportingType] = useState<'cards' | 'nfc' | 'qr' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isCodeVisibleForCard = (cardId: string) => {
    if (showCodeMap[cardId] !== undefined) {
      return showCodeMap[cardId];
    }
    return false;
  };

  const toggleCodeForCard = (cardId: string, checked: boolean) => {
    setShowCodeMap((prev) => ({
      ...prev,
      [cardId]: checked,
    }));
  };

  // Queries
  const { data: order, isLoading: isOrderLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => (orderId ? api.getOrder(orderId) : null),
    enabled: !!orderId,
  });

  const { data: cards, isLoading: isCardsLoading } = useQuery({
    queryKey: ['orderCards', orderId],
    queryFn: () => (orderId ? api.listOrderCards(orderId) : []),
    enabled: !!orderId,
  });

  const { data: reconciliation, isLoading: isReconciliationLoading } = useQuery({
    queryKey: ['orderReconciliation', orderId],
    queryFn: () => (orderId ? api.getOrderReconciliation(orderId) : null),
    enabled: !!orderId,
  });

  // Generate Cards Mutation
  const generateMutation = useMutation({
    mutationFn: () => {
      if (!orderId) throw new Error('Order ID missing');
      return api.generateOrderCards(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orderCards', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orderReconciliation', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orderQRLabels', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      setActionError(null);
    },
    onError: (err: Error) => {
      setActionError(err.message);
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: OrderStatus) => {
      if (!orderId) throw new Error('Order ID missing');
      return api.updateOrder(orderId, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orderReconciliation', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setActionError(null);
    },
    onError: (err: Error) => {
      setActionError(err.message);
    },
  });

  // Inline QC Mutation
  const qcMutation = useMutation({
    mutationFn: (data: { id: string; updates: { qc_nfc_tested?: boolean; qc_qr_tested?: boolean; qc_destination_verified?: boolean } }) =>
      api.updateCard(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orderCards', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orderReconciliation', orderId] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
    },
  });

  const getCardQCStatus = (card: CardInfo, isNfcOnlyProd: boolean): { variant: BadgeVariant; label: string; status: 'APPROVED' | 'IN_PROGRESS' | 'NOT_TESTED' } => {
    const nfcOk = !!card.qc_nfc_tested;
    const destOk = !!card.qc_destination_verified;
    const qrOk = isNfcOnlyProd ? true : !!card.qc_qr_tested;

    const allApproved = isNfcOnlyProd ? (nfcOk && destOk) : (nfcOk && qrOk && destOk);
    const anyStarted = nfcOk || destOk || (!isNfcOnlyProd && card.qc_qr_tested);

    if (allApproved) {
      return { variant: 'qcPassed', label: isFa ? 'تایید QC' : 'QC Approved', status: 'APPROVED' };
    }
    if (anyStarted) {
      return { variant: 'qcIncomplete', label: isFa ? 'در حال بررسی' : 'QC In Progress', status: 'IN_PROGRESS' };
    }
    return { variant: 'untested', label: isFa ? 'تست نشده' : 'Not Tested', status: 'NOT_TESTED' };
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handlePrintQR = (qrImageUrl: string, cardCode: string, showCode: boolean) => {
    printQRCodeDirectly(qrImageUrl, cardCode, { showCodeSubtitle: showCode });
  };

  const handleExportCSV = async (exportType: 'cards' | 'nfc' | 'qr') => {
    if (!orderId) return;
    try {
      setExportingType(exportType);
      setActionError(null);
      await api.downloadOrderCSV(orderId, exportType);
    } catch (err: unknown) {
      const e = err as Error;
      setActionError(e.message);
    } finally {
      setExportingType(null);
    }
  };

  const getOrderStatusBadge = (status: OrderStatus): { variant: BadgeVariant; label: string } => {
    switch (status) {
      case 'CREATED':
        return { variant: 'untested', label: t.orders.statusCreated };
      case 'CARDS_GENERATED':
        return { variant: 'active', label: t.orders.statusGenerated };
      case 'PROVISIONING':
        return { variant: 'active', label: t.orders.statusProvisioning };
      case 'QC_PENDING':
        return { variant: 'qcIncomplete', label: t.orders.statusQcPending };
      case 'COMPLETED':
        return { variant: 'qcPassed', label: t.orders.statusCompleted };
      case 'CANCELLED':
        return { variant: 'disabled', label: t.orders.statusCancelled };
      default:
        return { variant: 'untested', label: status };
    }
  };

  const isNfcOnly = order?.product_type === 'NFC_ONLY';
  const hasCards = (cards && cards.length > 0) || (order && order.cards_generated_count > 0);

  return (
    <>
      <Drawer
        isOpen={!!orderId}
        onClose={onClose}
        title={order ? `${t.orders.orderNumber}: ${order.order_number}` : t.orders.detailDrawerTitle}
        subtitle={t.orders.detailDrawerSubtitle}
        maxWidth="3xl"
      >
        {isOrderLoading || !order ? (
          <div className="py-16 text-center text-xs text-slate-400">{t.common.loading}</div>
        ) : (
          <div className="space-y-6">
            {/* Order Header Summary Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-slate-900">
                        {order.order_number}
                      </span>
                      <Badge variant={getOrderStatusBadge(order.status).variant}>
                        {getOrderStatusBadge(order.status).label}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{order.business_name}</span>
                    </p>
                  </div>
                </div>

                {/* Status Update Quick Selector */}
                <div className="flex items-center gap-2">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatusMutation.mutate(e.target.value as OrderStatus)}
                    className="bg-white text-xs text-slate-900 rounded-xl border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold shadow-xs"
                  >
                    <option value="CREATED">{t.orders.statusCreated}</option>
                    <option value="CARDS_GENERATED">{t.orders.statusGenerated}</option>
                    <option value="PROVISIONING">{t.orders.statusProvisioning}</option>
                    <option value="QC_PENDING">{t.orders.statusQcPending}</option>
                    <option value="COMPLETED">{t.orders.statusCompleted}</option>
                    <option value="CANCELLED">{t.orders.statusCancelled}</option>
                  </select>
                </div>
              </div>

              {/* Product Type & Physical Template Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    {isNfcOnly ? <Radio className="w-3.5 h-3.5 text-blue-600" /> : <QrCode className="w-3.5 h-3.5 text-blue-600" />}
                    {t.orders.productType}
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    {isNfcOnly ? t.orders.nfcOnly : t.orders.nfcQr}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    {t.orders.physicalTemplate}
                  </span>
                  <p className="text-xs font-mono font-bold text-indigo-700">
                    {order.physical_template}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    تعداد کارت
                  </span>
                  <p className="text-xs font-mono font-extrabold text-blue-700">
                    {order.cards_generated_count} / {order.quantity} کارت
                  </p>
                </div>
              </div>

              {/* Destination Type + URL */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{DEST_TYPE_META[order.destination_type]?.emoji || '🔗'}</span>
                    <div>
                      <p className="text-xs font-black text-slate-900">
                        {DEST_TYPE_META[order.destination_type]?.label || order.destination_type || 'مقصد'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">مقصد هدایت</p>
                    </div>
                  </div>
                  <a
                    href={order.destination_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 font-mono text-[11px] font-bold"
                  >
                    تست لینک
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono truncate flex-1">{order.destination_url}</span>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(order.destination_url); }}
                    className="shrink-0 text-slate-400 hover:text-blue-600 transition-colors"
                    title="کپی لینک مقصد"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Error / Validation Gate Feedback */}
            {actionError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">خطای اعتبارسنجی عملیات:</span>
                  <span>{actionError}</span>
                </div>
              </div>
            )}

            {/* Packaging Reconciliation & Delivery Readiness */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">{t.orders.reconciliationTitle}</h3>
                </div>
                {reconciliation && (
                  <Badge variant={reconciliation.is_ready_for_delivery ? 'qcPassed' : 'qcIncomplete'}>
                    {reconciliation.is_ready_for_delivery ? t.orders.readyForDelivery : t.orders.notReady}
                  </Badge>
                )}
              </div>

              {isReconciliationLoading || !reconciliation ? (
                <div className="py-4 text-center text-xs text-slate-400">{t.common.loading}</div>
              ) : (
                <div className="space-y-4">
                  {/* Metrics Progress Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="text-[11px] text-slate-500 block">{t.orders.orderedVsGenerated}</span>
                      <span className="text-sm font-mono font-bold text-slate-900">
                        {reconciliation.cards_generated_count} / {reconciliation.ordered_quantity}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="text-[11px] text-emerald-700 block">{t.orders.nfcQcProgress}</span>
                      <span className="text-sm font-mono font-bold text-emerald-700">
                        {reconciliation.qc_nfc_passed_count} / {reconciliation.ordered_quantity}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="text-[11px] text-indigo-700 block">{t.orders.qrQcProgress}</span>
                      <span className="text-sm font-mono font-bold text-indigo-700">
                        {!reconciliation.is_nfc_only ? (
                          `${reconciliation.qc_qr_passed_count} / ${reconciliation.ordered_quantity}`
                        ) : (
                          'N/A (NFC Only)'
                        )}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="text-[11px] text-blue-700 block">{t.orders.destQcProgress}</span>
                      <span className="text-sm font-mono font-bold text-blue-700">
                        {reconciliation.qc_destination_verified_count} / {reconciliation.ordered_quantity}
                      </span>
                    </div>
                  </div>

                  {/* Blocking Reasons Alert */}
                  {reconciliation.blocking_reasons.length > 0 ? (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>{t.orders.blockingReasons}</span>
                      </div>
                      <ul className="space-y-1 ps-5 list-disc text-[11px] text-amber-800 font-mono">
                        {reconciliation.blocking_reasons.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>کلیه استانداردهای کنترل کیفیت، انکودینگ و تعداد سفارش با موفقیت تایید شد.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Batch Exports & Label Preparation Bar */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                {t.orders.exportSectionTitle}
              </h3>

              <div className="space-y-4">
                
                {/* 1. General Export */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-800">{t.orders.exportCardsTitle}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.orders.exportCardsDesc}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    icon={<Download className="w-3.5 h-3.5" />}
                    isLoading={exportingType === 'cards'}
                    onClick={() => handleExportCSV('cards')}
                  >
                    {t.orders.exportCardsBtn}
                  </Button>
                </div>

                {/* 2. NFC Hardware Encoding */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 text-blue-500" />
                      {t.orders.exportNfcTitle}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.orders.exportNfcDesc}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    icon={<Download className="w-3.5 h-3.5 text-blue-600" />}
                    isLoading={exportingType === 'nfc'}
                    onClick={() => handleExportCSV('nfc')}
                  >
                    {t.orders.exportNfcBtn}
                  </Button>
                </div>

                {/* 3. Printable QR Variable Data */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-indigo-500" />
                      {t.orders.exportQrTitle}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.orders.exportQrDesc}</p>
                  </div>
                  {!isNfcOnly ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      icon={<Download className="w-3.5 h-3.5 text-indigo-600" />}
                      isLoading={exportingType === 'qr'}
                      onClick={() => handleExportCSV('qr')}
                    >
                      {t.orders.exportQrBtn}
                    </Button>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg shrink-0">
                      {t.orders.exportQrDisabledNfcOnly}
                    </span>
                  )}
                </div>

              </div>

              {/* QR Label Sheet Trigger */}
              {!isNfcOnly && hasCards && (
                <div className="pt-3 border-t border-slate-200 mt-2">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <div className="flex-1">
                       <h4 className="font-bold text-sm text-blue-900">{t.orders.viewQrSheetBtn}</h4>
                       <p className="text-xs text-blue-700 mt-1 leading-relaxed">{t.orders.qrSheetSubtitle}</p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="shrink-0"
                      icon={<Printer className="w-4 h-4" />}
                      onClick={() => setIsQRSheetOpen(true)}
                    >
                      {isFa ? 'نمایش برگه' : 'View Sheet'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Card Generation Action Box */}
            {!hasCards ? (
              <div className="p-6 rounded-2xl bg-white border border-blue-200 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">آماده صدور هویت دیجیتال کارت‌ها</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    این سفارش ثبت شده است. برای تولید دقیق {order.quantity} کارت دیجیتال و آماده‌سازی انکود NFC، روی دکمه زیر کلیک کنید.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  isLoading={generateMutation.isPending}
                  icon={<Sparkles className="w-4 h-4" />}
                  onClick={() => generateMutation.mutate()}
                >
                  تولید {order.quantity} کارت دیجیتال
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{order.cards_generated_count} / {order.quantity} کارت با موفقیت تولید شد (محافظت در برابر تکرار)</span>
                </div>
                <Badge variant="qcPassed">کارت‌ها صادر شد</Badge>
              </div>
            )}

            {/* Generated Cards List */}
            {hasCards && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  {t.orders.cardsListHeading} ({cards?.length || order.cards_generated_count} کارت)
                </h3>

                {isCardsLoading ? (
                  <div className="py-8 text-center text-xs text-slate-400">{t.common.loading}</div>
                ) : cards && cards.length > 0 ? (
                  <div className="space-y-3">
                    {cards.map((c: CardInfo, idx: number) => {
                      const qcStatus = getCardQCStatus(c, isNfcOnly);
                      return (
                        <div
                          key={c.id}
                          className={`p-4 rounded-2xl bg-white border transition-all space-y-3.5 shadow-xs ${
                            qcStatus.status === 'APPROVED'
                              ? 'border-emerald-300 ring-1 ring-emerald-500/10'
                              : qcStatus.status === 'IN_PROGRESS'
                              ? 'border-amber-300 ring-1 ring-amber-500/10'
                              : 'border-slate-200'
                          }`}
                        >
                          {/* 1. Card Row Header & Status */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-mono">#{idx + 1}</span>
                              <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                                {c.code}
                              </span>
                              <Badge variant={c.status === 'ACTIVE' ? 'active' : 'disabled'}>
                                {c.status === 'ACTIVE' ? t.common.active : t.common.disabled}
                              </Badge>
                            </div>
                            <Badge variant={qcStatus.variant}>
                              {qcStatus.label}
                            </Badge>
                          </div>

                          {/* 2. Production / Preparation Section */}
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-blue-700">
                                <Radio className="w-3.5 h-3.5" />
                                {isFa ? 'آماده‌سازی سخت‌افزاری و تولید' : 'Production & Encoding'}
                              </span>
                              <span className="text-[10px] font-normal text-slate-400">
                                {isFa ? 'کپی لینک وضعیت QC را تغییر نمی‌دهد' : 'Copying URL does not pass QC'}
                              </span>
                            </div>

                            {/* NFC Provisioning Link */}
                            <div className="space-y-1">
                              <label className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                                لینک رایت چیپ NFC:
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={c.nfc_url}
                                  className="w-full bg-white text-xs font-mono text-slate-800 rounded-xl border border-slate-200 px-3 py-2 select-all shadow-xs"
                                />
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleCopy(c.nfc_url, `nfc-${c.id}`)}
                                  icon={copiedKey === `nfc-${c.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                >
                                  {copiedKey === `nfc-${c.id}` ? t.cards.copySuccess : t.common.copy}
                                </Button>
                              </div>
                            </div>

                            {/* QR Info / Conditional */}
                            {!isNfcOnly ? (
                              <div className="space-y-2 pt-2 border-t border-slate-200/60">
                                <label className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                                  <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                                  لینک اسکن QR:
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    readOnly
                                    value={c.qr_url}
                                    className="w-full bg-white text-xs font-mono text-slate-800 rounded-xl border border-slate-200 px-3 py-2 select-all shadow-xs"
                                  />
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleCopy(c.qr_url, `qr-${c.id}`)}
                                    icon={copiedKey === `qr-${c.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  >
                                    {copiedKey === `qr-${c.id}` ? t.cards.copySuccess : t.common.copy}
                                  </Button>
                                </div>
                                {/* QR Image Quick Access & Print */}
                                <div className="flex items-center gap-2">
                                  <a
                                    href={c.qr_url.replace('/q/', '/q/').replace(/\/?$/, '') + '/qr.png'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors shadow-xs"
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
                                          c.qr_url.replace('/q/', '/q/').replace(/\/?$/, '') + '/qr.png',
                                          c.code,
                                          isCodeVisibleForCard(c.id)
                                        )
                                      }
                                    >
                                      چاپ QR ({getSavedPrintTemplate().sizeMm}mm)
                                    </Button>
                                    <button
                                      type="button"
                                      onClick={() => setIsPrintSettingsOpen(true)}
                                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shadow-xs"
                                      title="تنظیم قالب و سایز پیش‌فرض چاپ"
                                    >
                                      <Settings2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                {/* Show Code Subtitle Checkbox (Independent Per Card) */}
                                <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-500 hover:text-slate-700 pt-0.5">
                                  <input
                                    type="checkbox"
                                    checked={isCodeVisibleForCard(c.id)}
                                    onChange={(e) => toggleCodeForCard(c.id, e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span>نمایش کد کارت زیر بارکد هنگام چاپ</span>
                                </label>
                              </div>
                            ) : (
                              <div className="p-2 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2 font-medium">
                                <Radio className="w-3.5 h-3.5 text-slate-400" />
                                <span>{t.orders.noQrOnCard}</span>
                              </div>
                            )}
                          </div>

                          {/* 3. Quality Control (کنترل کیفیت سخت‌افزاری کارت) */}
                          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                {isFa ? 'کنترل کیفیت فیزیکی کارت (QC)' : 'Physical Quality Control (QC)'}
                              </h4>
                              <span className="text-[10px] text-slate-400">
                                {isFa ? 'تغییر وضعیت با کلیک ثبت می‌شود' : 'Click to toggle test status'}
                              </span>
                            </div>

                            <div className={`grid gap-2 ${isNfcOnly ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'}`}>
                              {/* NFC Tap Test Checkbox */}
                              <div
                                onClick={() =>
                                  qcMutation.mutate({
                                    id: c.id,
                                    updates: { qc_nfc_tested: !c.qc_nfc_tested },
                                  })
                                }
                                className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${
                                  c.qc_nfc_tested
                                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 shadow-xs'
                                    : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-600'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Radio className={`w-4 h-4 shrink-0 ${c.qc_nfc_tested ? 'text-emerald-600' : 'text-slate-400'}`} />
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold truncate">تست چیپ NFC</p>
                                    <p className="text-[9px] text-slate-400 truncate">تست فیزیکی تماس آنتن</p>
                                  </div>
                                </div>
                                <div
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                    c.qc_nfc_tested
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {c.qc_nfc_tested && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>

                              {/* QR Scan Test Checkbox (Only if NOT NFC ONLY) */}
                              {!isNfcOnly && (
                                <div
                                  onClick={() =>
                                    qcMutation.mutate({
                                      id: c.id,
                                      updates: { qc_qr_tested: !c.qc_qr_tested },
                                    })
                                  }
                                  className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${
                                    c.qc_qr_tested
                                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 shadow-xs'
                                      : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-600'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <QrCode className={`w-4 h-4 shrink-0 ${c.qc_qr_tested ? 'text-emerald-600' : 'text-slate-400'}`} />
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-bold truncate">تست بارکد QR</p>
                                      <p className="text-[9px] text-slate-400 truncate">اسکن با دوربین و خوانایی</p>
                                    </div>
                                  </div>
                                  <div
                                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                      c.qc_qr_tested
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {c.qc_qr_tested && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                </div>
                              )}

                              {/* Destination Verified Checkbox */}
                              <div
                                onClick={() =>
                                  qcMutation.mutate({
                                    id: c.id,
                                    updates: { qc_destination_verified: !c.qc_destination_verified },
                                  })
                                }
                                className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${
                                  c.qc_destination_verified
                                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 shadow-xs'
                                    : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-600'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${c.qc_destination_verified ? 'text-emerald-600' : 'text-slate-400'}`} />
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold truncate">تایید صفحه مقصد</p>
                                    <p className="text-[9px] text-slate-400 truncate">هدایت به مقصد نهایی</p>
                                  </div>
                                </div>
                                <div
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                    c.qc_destination_verified
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {c.qc_destination_verified && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* QR Label Sheet Modal */}
      {isQRSheetOpen && (
        <QRLabelSheetModal
          orderId={orderId}
          onClose={() => setIsQRSheetOpen(false)}
        />
      )}

      {/* QR Print Settings Modal */}
      <QRPrintSettingsModal
        isOpen={isPrintSettingsOpen}
        onClose={() => setIsPrintSettingsOpen(false)}
      />
    </>
  );
};
