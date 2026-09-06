import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Layers,
  ArrowRight,
  QrCode,
  Radio,
  Clock,
  Send,
  User,
  Sparkles,
  Printer,
  ChevronRight,
  Search,
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { useLanguage } from '../../i18n/LanguageContext';
import { ShopCheckoutResponse } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card as CardUI } from '../../components/ui/Card';

export const AdminShopOrdersView: React.FC = () => {
  const { language } = useLanguage();
  const isFa = language === 'fa';
  const queryClient = useQueryClient();
  const { orderNumber } = useParams<{ orderNumber?: string }>();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activationFilter, setActivationFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(orderNumber || null);

  const [trackingCode, setTrackingCode] = useState('');
  const [courierPhone, setCourierPhone] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // QR Label Modal state
  const [qrModalCode, setQrModalCode] = useState<string | null>(null);

  // Link verification inputs per item
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});

  // Sync route param
  useEffect(() => {
    if (orderNumber) {
      setSelectedOrderNumber(orderNumber);
    }
  }, [orderNumber]);

  // Fetch shop orders list
  const { data: orders = [], isLoading: isListLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['adminShopOrders', statusFilter],
    queryFn: () => api.getAdminShopOrders({ status: statusFilter !== 'ALL' ? statusFilter : undefined }),
  });

  // Fetch single active order if selected
  const { data: activeOrder, isLoading: isOrderLoading } = useQuery({
    queryKey: ['adminShopOrder', selectedOrderNumber],
    queryFn: () => (selectedOrderNumber ? api.getShopOrder(selectedOrderNumber) : null),
    enabled: !!selectedOrderNumber,
  });

  // Initialize verified URL input for items
  useEffect(() => {
    if (activeOrder) {
      const inputs: Record<string, string> = {};
      activeOrder.items.forEach((it) => {
        inputs[it.id] = it.final_verified_url || it.customer_submitted_url || '';
      });
      setLinkInputs(inputs);
      setTrackingCode(activeOrder.shipping_tracking_code || '');
    }
  }, [activeOrder]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── Mutations ────────────────────────────────────────────────────────

  // Confirm final link
  const confirmLinkMutation = useMutation({
    mutationFn: ({ itemId, finalUrl }: { itemId: string; finalUrl: string }) =>
      api.confirmShopOrderItemLink(itemId, finalUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminShopOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminShopOrder', selectedOrderNumber] });
      setActionSuccess(isFa ? 'لینک نهایی با موفقیت تایید و ذخیره شد.' : 'Final link confirmed successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setActionError(err.message || (isFa ? 'خطا در تایید لینک' : 'Failed to confirm link'));
      setTimeout(() => setActionError(null), 5000);
    },
  });

  // Update card QC
  const updateQcMutation = useMutation({
    mutationFn: ({ cardId, qc }: { cardId: string; qc: { qc_nfc_tested?: boolean; qc_qr_tested?: boolean; qc_destination_verified?: boolean } }) =>
      api.updateCardQC(cardId, qc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminShopOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminShopOrder', selectedOrderNumber] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Error updating QC status');
      setTimeout(() => setActionError(null), 4000);
    },
  });

  // Bulk complete item production
  const completeItemProductionMutation = useMutation({
    mutationFn: (itemId: string) =>
      api.updateShopOrderItemProduction(itemId, 'COMPLETED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminShopOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminShopOrder', selectedOrderNumber] });
      setActionSuccess(isFa ? 'کنترل کیفیت کلیه کارت‌ها با موفقیت ثبت شد.' : 'All cards QC marked as completed.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
  });

  // Generate cards inline
  const generateCardsMutation = useMutation({
    mutationFn: (fulfillmentOrderId: string) =>
      api.generateOrderCards(fulfillmentOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminShopOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminShopOrder', selectedOrderNumber] });
      setActionSuccess(isFa ? 'کارت‌ها با موفقیت ایجاد شدند.' : 'Cards generated successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
    onError: (err: any) => {
      setActionError(err.message || (isFa ? 'خطا در ایجاد کارت‌ها' : 'Failed to generate cards'));
      setTimeout(() => setActionError(null), 4000);
    },
  });

  // Ship order mutation
  const shipMutation = useMutation({
    mutationFn: ({ orderNum, tracking, phone }: { orderNum: string; tracking?: string; phone?: string }) =>
      api.shipShopOrder(orderNum, tracking, false, phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminShopOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminShopOrder', selectedOrderNumber] });
      setActionSuccess(isFa ? 'سفارش با موفقیت ارسال شد و پیامک برای مشتری ارسال گردید.' : 'Order dispatched successfully!');
      setTimeout(() => setActionSuccess(null), 5000);
    },
    onError: (err: any) => {
      setActionError(err.message || (isFa ? 'خطا در ارسال سفارش' : 'Failed to dispatch shipment'));
      setTimeout(() => setActionError(null), 5000);
    },
  });

  // Filter orders by search term and activation status
  const filteredOrders = orders.filter((ord) => {
    // 1. Activation Status Filter
    if (activationFilter !== 'ALL') {
      const isActivated = ord.items.length > 0 && ord.items.every(
        i => i.link_status === 'VERIFIED' || i.link_status === 'CUSTOMER_SUBMITTED' || i.destination_configured
      );
      if (activationFilter === 'ACTIVATED' && !isActivated) return false;
      if (activationFilter === 'PENDING' && isActivated) return false;
    }

    // 2. Search Term Filter
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      ord.shop_order_number.toLowerCase().includes(term) ||
      ord.customer_name.toLowerCase().includes(term) ||
      ord.customer_phone.includes(term) ||
      (ord.shipping_city && ord.shipping_city.toLowerCase().includes(term))
    );
  });

  // ── Helper Badge Renderers ───────────────────────────────────────────

  const renderPaymentBadge = (status: string) => {
    const isPaid = status === 'PAID' || status === 'MOCK_PAID';
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
          isPaid
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        {isPaid ? (isFa ? 'پرداخت شده' : 'Paid') : (isFa ? 'در انتظار پرداخت' : 'Pending Payment')}
      </span>
    );
  };

  const renderActivationBadge = (items: any[]) => {
    const activatedItems = items.filter(i => i.link_status === 'VERIFIED' || i.link_status === 'CUSTOMER_SUBMITTED' || i.destination_configured);
    
    if (activatedItems.length === items.length && items.length > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isFa ? 'فعال شده' : 'Activated'}
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        {isFa ? 'در انتظار فعال‌سازی' : 'Pending Activation'}
      </span>
    );
  };

  const renderFulfillmentBadge = (status: string, readyToShip: boolean) => {
    if (status === 'SHIPPED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Truck className="w-3.5 h-3.5" />
          {isFa ? 'ارسال شده' : 'Shipped'}
        </span>
      );
    }
    if (readyToShip || status === 'READY_TO_SHIP') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 animate-pulse">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {isFa ? 'آماده ارسال' : 'Ready to Ship'}
        </span>
      );
    }
    if (status === 'PARTIALLY_COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          {isFa ? 'تولید بخشی از کارت‌ها' : 'Partially Produced'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
        <Sparkles className="w-3.5 h-3.5" />
        {isFa ? 'در انتظار تولید' : 'Awaiting Production'}
      </span>
    );
  };

  const renderProductTypeBadge = (productType: string) => {
    switch (productType) {
      case 'NFC_QR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Radio className="w-3 h-3" /> NFC + QR
          </span>
        );
      case 'NFC_ONLY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Radio className="w-3 h-3" /> NFC اختصاصی
          </span>
        );
      case 'QR_ONLY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <QrCode className="w-3 h-3" /> QR استند/کارت
          </span>
        );
      case 'RAW_CARD':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Layers className="w-3 h-3" /> کارت خام (خالی)
          </span>
        );
    }
  };

  // Determine the next step banner message
  const getNextStepBanner = (order: ShopCheckoutResponse) => {
    if (order.status === 'SHIPPED') {
      return {
        type: 'success',
        title: isFa ? 'سفارش ارسال شده است' : 'Order Dispatched',
        message: isFa
          ? `این سفارش در تاریخ ${new Date(order.shipped_at || '').toLocaleDateString('fa-IR')} ارسال و فرآیند تکمیل گردیده است.`
          : 'This order has been shipped and completed.',
      };
    }

    if (order.ready_to_ship) {
      return {
        type: 'ready',
        title: isFa ? 'گام بعدی: ارسال بسته پستی / تحویل به پیک' : 'Next Step: Dispatch Shipment',
        message: isFa
          ? 'تمامی کارت‌ها بررسی، برنامه‌ریزی و تست شده‌اند. می‌توانید کد رهگیری یا شماره پیک را ثبت و بسته را ارسال نمایید.'
          : 'All cards have passed QC testing. You can now dispatch the shipment.',
      };
    }

    // Check if any link is pending confirmation
    const pendingLinkItem = order.items.find(
      (it) => it.destination_configured && !it.final_verified_url
    );
    if (pendingLinkItem) {
      return {
        type: 'link',
        title: isFa ? `گام بعدی: بررسی و تایید لینک مقصد "${pendingLinkItem.product_title}"` : 'Next Step: Confirm Destination Link',
        message: isFa
          ? 'لینک ارسالی مشتری را بررسی و تست کنید، سپس بر روی «تایید لینک نهایی و تولید لینک اختصاصی» کلیک کنید.'
          : 'Review and confirm the final destination link before programming NFC chips and generating QR labels.',
      };
    }

    // Check if cards need QC testing
    const pendingQcItem = order.items.find((it) => (it.cards_completed_count || 0) < (it.cards_count || it.quantity));
    if (pendingQcItem) {
      return {
        type: 'qc',
        title: isFa ? `گام بعدی: رایت چیپ NFC، چاپ QR و تست کنترل کیفیت "${pendingQcItem.product_title}"` : 'Next Step: Program NFC & QC Test',
        message: isFa
          ? 'لینک اختصاصی سیستم را روی چیپ رایت کرده و برچسب QR را چاپ کنید، سپس تیک‌های کنترل کیفیت هر کارت را بزنید.'
          : 'Program the internal URL to physical NFC cards, print QR labels, and verify redirect testing per card.',
      };
    }

    return {
      type: 'general',
      title: isFa ? 'در حال تکمیل مراحل تولید' : 'Processing Production',
      message: isFa ? 'موارد باقیمانده را طبق راهنمای هر آیتم تکمیل کنید.' : 'Complete remaining item tasks.',
    };
  };

  // ── VIEW 1: ORDER WORKSPACE (Single Order Details) ───────────────────

  if (selectedOrderNumber) {
    if (isOrderLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500 text-sm">{isFa ? 'در حال بارگذاری اطلاعات سفارش...' : 'Loading order details...'}</p>
        </div>
      );
    }

    if (!activeOrder) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <AlertCircle className="w-12 h-12 text-rose-500" />
          <h2 className="text-lg font-bold text-slate-900">{isFa ? 'سفارش مورد نظر یافت نشد' : 'Order Not Found'}</h2>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedOrderNumber(null);
              navigate('/shop-orders');
            }}
          >
            {isFa ? 'بازگشت به لیست سفارشات' : 'Back to Orders List'}
          </Button>
        </div>
      );
    }

    const nextStep = getNextStepBanner(activeOrder);

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Navigation Breadcrumb & Back Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 text-slate-700 bg-white border-slate-200 hover:bg-slate-50"
              onClick={() => {
                setSelectedOrderNumber(null);
                navigate('/shop-orders');
              }}
            >
              <ArrowRight className="w-4 h-4" />
              {isFa ? 'بازگشت به لیست سفارشات' : 'Back to Orders'}
            </Button>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{isFa ? 'شماره سفارش:' : 'Order:'}</span>
              <span className="font-mono font-bold text-slate-900 text-base bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                {activeOrder.shop_order_number}
              </span>
              <button
                onClick={() => copyToClipboard(activeOrder.shop_order_number, 'ord_num')}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Copy Order Number"
              >
                {copiedKey === 'ord_num' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {renderPaymentBadge(activeOrder.payment_status)}
            {renderFulfillmentBadge(activeOrder.fulfillment_status, activeOrder.ready_to_ship)}
          </div>
        </div>

        {/* Action Alerts */}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-sm font-medium">{actionError}</span>
          </div>
        )}

        {/* Operational Next-Step Banner */}
        <div
          className={`p-5 rounded-2xl border transition-all shadow-sm ${
            nextStep.type === 'ready'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : nextStep.type === 'link'
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : nextStep.type === 'qc'
              ? 'bg-blue-50/80 border-blue-200 text-blue-950'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm shrink-0 mt-0.5">
              {nextStep.type === 'ready' ? (
                <Truck className="w-5 h-5 text-emerald-600" />
              ) : nextStep.type === 'link' ? (
                <ExternalLink className="w-5 h-5 text-amber-600" />
              ) : nextStep.type === 'qc' ? (
                <Radio className="w-5 h-5 text-blue-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-1">{nextStep.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{nextStep.message}</p>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Customer & Delivery Info vs Fulfillment Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer & Shipping Summary (Left/Top on mobile) */}
          <CardUI className="lg:col-span-1 p-5 space-y-4 bg-white border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-blue-600" />
              {isFa ? 'اطلاعات مشتری و ارسال' : 'Customer & Delivery Info'}
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">{isFa ? 'نام و نام خانوادگی:' : 'Customer Name:'}</span>
                <span className="font-bold text-slate-900">{activeOrder.customer_name}</span>
                {activeOrder.company_name && (
                  <span className="text-xs text-slate-500 block">({activeOrder.company_name})</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">{isFa ? 'شماره تماس:' : 'Phone:'}</span>
                  <span className="font-mono text-slate-800 font-semibold">{activeOrder.customer_phone}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(activeOrder.customer_phone, 'phone')}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <Copy className="w-3 h-3" />
                  {isFa ? 'کپی' : 'Copy'}
                </button>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-0.5">{isFa ? 'ایمیل:' : 'Email:'}</span>
                <span className="font-mono text-xs text-slate-700 break-all">{activeOrder.customer_email}</span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 block mb-0.5">{isFa ? 'روش ارسال:' : 'Shipping Method:'}</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-xs text-slate-800 font-bold border border-slate-200">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  {activeOrder.shipping_method === 'COURIER'
                    ? (isFa ? 'پیک موتوری (ویژه تهران)' : 'Tehran Courier')
                    : (isFa ? 'پست پیشتاز سراسری' : 'Express Post')}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block mb-0.5">{isFa ? 'آدرس کامل گیرنده:' : 'Delivery Address:'}</span>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {activeOrder.shipping_province && `${activeOrder.shipping_province}، `}
                  {activeOrder.shipping_city}، {activeOrder.shipping_address}
                  <span className="block mt-1.5 font-mono text-[11px] text-slate-500">
                    {isFa ? 'کد پستی:' : 'Postal Code:'} {activeOrder.shipping_postal_code}
                  </span>
                </p>
              </div>

              {activeOrder.shipping_notes && (
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">{isFa ? 'یادداشت خریدار:' : 'Customer Notes:'}</span>
                  <p className="text-xs text-amber-800 italic bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    "{activeOrder.shipping_notes}"
                  </p>
                </div>
              )}
            </div>
          </CardUI>

          {/* Fulfillment Dispatch Panel (Right Column) */}
          <CardUI className="lg:col-span-2 p-5 space-y-5 bg-white border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Truck className="w-4 h-4 text-emerald-600" />
                {isFa ? 'وضعیت نهایی ارسال و تحویل' : 'Shipment & Dispatch'}
              </div>
              <div className="text-xs text-slate-500">
                {isFa ? 'مبلغ کل پرداخت شده:' : 'Total Paid:'}{' '}
                <span className="font-bold text-slate-900 text-sm font-mono">
                  {activeOrder.total_amount.toLocaleString('fa-IR')} {isFa ? 'تومان' : 'IRR'}
                </span>
              </div>
            </div>

            {/* If order is already shipped */}
            {activeOrder.status === 'SHIPPED' ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  {isFa ? 'مرسوله با موفقیت ارسال شده است' : 'Shipment Dispatched'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-500 block">{isFa ? 'کد رهگیری / پیک:' : 'Tracking / Courier:'}</span>
                    <span className="font-mono text-sm text-slate-900 font-bold">
                      {activeOrder.shipping_tracking_code || (isFa ? 'ثبت شده' : 'Registered')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{isFa ? 'زمان ارسال:' : 'Dispatched At:'}</span>
                    <span className="font-medium">{new Date(activeOrder.shipped_at || '').toLocaleString('fa-IR')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{isFa ? 'وضعیت پیامک مشتری:' : 'SMS Status:'}</span>
                    <span className="text-emerald-700 font-bold">
                      {activeOrder.shipping_notification_status === 'SENT' ? (isFa ? 'ارسال شده به مشتری' : 'Sent') : activeOrder.shipping_notification_status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* If order is not yet shipped: Show readiness or blocking reasons */
              <div className="space-y-4">
                {!activeOrder.ready_to_ship ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      {isFa ? 'موارد باقیمانده تا فعال‌سازی دکمه ارسال:' : 'Blocking Items Before Dispatch:'}
                    </div>
                    <ul className="list-disc list-inside text-xs text-amber-900 space-y-1 mr-1">
                      {activeOrder.blocking_reasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{isFa ? 'سفارش ۱۰۰٪ آماده ارسال است' : 'Order Ready for Dispatch'}</h4>
                      <p className="text-xs text-emerald-800">
                        {isFa ? 'تمام مراحل تایید لینک، رایت چیپ، چاپ و تست با موفقیت پاس شدند.' : 'All link verification and card QC passed.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Dispatch Form */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">
                    {activeOrder.shipping_method === 'COURIER'
                      ? (isFa ? 'ثبت اعزام پیک موتوری' : 'Tehran Courier Dispatch')
                      : (isFa ? 'ثبت بارنامه و ارسال پستی' : 'Express Post Dispatch')}
                  </h4>

                  {activeOrder.shipping_method === 'COURIER' ? (
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-600 font-medium">{isFa ? 'شماره تماس راننده پیک (اختیاری):' : 'Courier Phone:'}</label>
                      <Input
                        value={courierPhone}
                        onChange={(e) => setCourierPhone(e.target.value)}
                        placeholder="0912..."
                        className="font-mono text-sm bg-white border-slate-200 text-slate-900"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-600 font-medium">{isFa ? 'کد رهگیری پستی (۲۴ رقمی):' : 'Postal Tracking Code:'}</label>
                      <Input
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                        placeholder="123456789012345678901234"
                        className="font-mono text-sm bg-white border-slate-200 text-slate-900"
                      />
                    </div>
                  )}

                  <Button
                    variant="primary"
                    disabled={!activeOrder.ready_to_ship || shipMutation.isPending}
                    isLoading={shipMutation.isPending}
                    className="w-full gap-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    onClick={() => {
                      if (!activeOrder.ready_to_ship) return;
                      shipMutation.mutate({
                        orderNum: activeOrder.shop_order_number,
                        tracking: trackingCode,
                        phone: courierPhone,
                      });
                    }}
                  >
                    <Send className="w-4 h-4" />
                    {isFa ? 'تایید ارسال سفارش و پیامک به مشتری' : 'Confirm Dispatch & Send SMS'}
                  </Button>
                </div>
              </div>
            )}
          </CardUI>
        </div>

        {/* ── Per-Item & Per-Card Production Workflow Section ──────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              {isFa ? 'اقلام سفارش و جریان تولید فیزیکی کارت‌ها' : 'Order Items & Physical Card Production'}
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {activeOrder.items.length} {isFa ? 'آیتم سفارش داده شده' : 'Items'}
            </span>
          </div>

          {activeOrder.items.map((item, itemIdx) => {
            const isRawBlankProduct = item.product_type === 'RAW_CARD';
            const currentFinalUrl = linkInputs[item.id] !== undefined ? linkInputs[item.id] : item.final_verified_url || '';
            const isLinkConfirmed = !!item.final_verified_url;
            const cards = item.cards || [];
            const completedCards = item.cards_completed_count || 0;
            const totalCards = item.cards_count || item.quantity;

            return (
              <CardUI key={item.id} className="p-6 space-y-6 bg-white border-slate-200 shadow-sm">
                {/* Item Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-sm">
                      {itemIdx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{item.product_title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {renderProductTypeBadge(item.product_type)}
                        <span className="text-xs text-slate-500 font-medium">
                          {isFa ? 'تعداد:' : 'Qty:'} <strong className="text-slate-900">{item.quantity} عدد</strong>
                        </span>
                        {item.customization_color && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: item.customization_color }} />
                            {item.customization_template}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">
                      {isFa ? 'وضعیت تولید کارت‌ها:' : 'Production Progress:'}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        completedCards === totalCards && totalCards > 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : completedCards > 0
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {completedCards} از {totalCards} کارت تکمیل شده
                    </span>
                  </div>
                </div>

                {/* Workflow Step 1: Destination Link Status & Review */}
                {!isRawBlankProduct ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ExternalLink className="w-4 h-4 text-amber-600" />
                        {isFa ? 'مرحله ۱: وضعیت لینک مقصد و فعال‌سازی هوشمند' : 'Step 1: Destination Link & Smart Activation Status'}
                      </span>
                      {isLinkConfirmed ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> {isFa ? 'لینک نهایی مقصد تایید شده' : 'Final Destination Confirmed'}
                        </span>
                      ) : !item.destination_configured ? (
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> {isFa ? 'فعال‌سازی هوشمند آتی توسط خریدار (/activate)' : 'Self-Service Activation'}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          {isFa ? 'نیاز به بررسی و تایید اپراتور' : 'Action Required'}
                        </span>
                      )}
                    </div>

                    {/* If Customer Submitted a Link */}
                    {item.destination_configured ? (
                      <div className="text-xs space-y-1">
                        <span className="text-slate-500 font-medium">{isFa ? 'لینک ارسالی مشتری در زمان خرید:' : 'Submitted URL:'}</span>
                        <div className="font-mono text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 break-all flex items-center justify-between gap-2 shadow-2xs">
                          <span>{item.customer_submitted_url || (isFa ? 'مشتری لینکی ارسال نکرده است' : 'None')}</span>
                          {item.customer_submitted_url && (
                            <a
                              href={item.customer_submitted_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 shrink-0 font-medium"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {isFa ? 'تست' : 'Test'}
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* If Customer Purchased Without Initial Link (Setup Later) */
                      <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-blue-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          {isFa ? 'خرید بدون ثبت لینک اولیه (فعال‌سازی خودکار)' : 'Purchased Without Initial Link'}
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {isFa
                            ? 'چیپ NFC و بارکد QR این کارت‌ها باید با لینک اختصاصی سیستم رایت شوند. خریدار پس از دریافت بسته، با اولین اسکن کارت به صفحه فعال‌سازی هدایت شده و مقصد خود را ثبت می‌نماید.'
                            : 'Cards must be programmed with internal URLs. Customer will activate them upon first tap/scan.'}
                        </p>
                      </div>
                    )}

                    {/* Operator Final Verified URL Input */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs text-slate-700 font-bold">
                        {item.destination_configured
                          ? (isFa ? 'لینک نهایی تایید شده مقصد (Verified Destination URL):' : 'Verified Destination URL:')
                          : (isFa ? 'در صورت دریافت لینک مقصد از خریدار (پشتیبانی/تلفنی) می‌توانید در اینجا ثبت کنید:' : 'Optional: Set Destination URL If Provided via Phone:')}
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={currentFinalUrl}
                          onChange={(e) => setLinkInputs({ ...linkInputs, [item.id]: e.target.value })}
                          placeholder={isFa ? 'https://google.com/... (اختیاری برای کارت‌های خودکار)' : 'https://...'}
                          className="font-mono text-xs bg-white border-slate-200 text-slate-900"
                        />
                        {currentFinalUrl && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="shrink-0 gap-1 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            onClick={() => window.open(currentFinalUrl, '_blank')}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            {isFa ? 'تست آدرس' : 'Test'}
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={confirmLinkMutation.isPending}
                          disabled={!currentFinalUrl.trim()}
                          className="shrink-0 text-xs font-bold gap-1 bg-amber-600 hover:bg-amber-700 text-white shadow-sm disabled:opacity-50"
                          onClick={() => {
                            if (!currentFinalUrl.trim()) return;
                            confirmLinkMutation.mutate({ itemId: item.id, finalUrl: currentFinalUrl.trim() });
                          }}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {isFa ? 'تایید لینک نهایی مقصد' : 'Confirm Destination Link'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Genuinely Blank Plastic Product Notice */
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5 text-slate-500 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {isFa ? 'محصول کارت خام بدون چیپ و بارکد' : 'Blank Plastic Card Product'}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {isFa ? 'صرفاً بررسی فیزیکی و بسته‌بندی لازم است.' : 'Physical inspection and packaging only.'}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant={item.production_status === 'COMPLETED' ? 'secondary' : 'primary'}
                      size="sm"
                      isLoading={completeItemProductionMutation.isPending}
                      className="text-xs font-bold gap-1.5"
                      onClick={() => completeItemProductionMutation.mutate(item.id)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {item.production_status === 'COMPLETED'
                        ? (isFa ? 'آماده‌سازی فیزیکی تایید شده' : 'Inspected')
                        : (isFa ? 'تایید بازرسی و آماده‌سازی فیزیکی' : 'Confirm Physical Preparation')}
                    </Button>
                  </div>
                )}

                {/* Workflow Step 2: Per-Physical-Card Granular Testing & QC (Always Available for Smart Cards) */}
                {cards.length === 0 && !isRawBlankProduct && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-amber-900">
                          {isFa ? 'کارت‌های این آیتم ایجاد نشده‌اند' : 'Cards not generated yet'}
                        </div>
                        <div className="text-xs text-amber-700 leading-relaxed">
                          {isFa ? 'برای شروع فرآیند تولید و کنترل کیفیت، لطفاً کارت‌ها را ایجاد نمایید.' : 'Please generate cards to start the production and QC process.'}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={generateCardsMutation.isPending}
                      className="text-xs font-bold gap-2"
                      onClick={() => {
                        if (item.fulfillment_order_id) {
                          generateCardsMutation.mutate(item.fulfillment_order_id);
                        } else {
                          setActionError('خطا: شناسه سفارش مرجع یافت نشد.');
                        }
                      }}
                    >
                      <Sparkles className="w-4 h-4" />
                      {isFa ? 'ایجاد کارت‌ها برای تولید' : 'Generate Cards'}
                    </Button>
                  </div>
                )}

                {cards.length > 0 && !isRawBlankProduct && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Radio className="w-4 h-4 text-blue-600" />
                        {isFa ? 'مرحله ۲: رایت تگ NFC، چاپ بارکد QR و تست کنترل کیفیت هر کارت' : 'Step 2: NFC Chip Programming, QR Print & QC Testing'}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-[11px] gap-1 text-slate-700 bg-white border-slate-200 hover:bg-slate-100"
                        onClick={() => completeItemProductionMutation.mutate(item.id)}
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {isFa ? 'تایید کنترل کیفیت همه کارت‌های این آیتم' : 'Mark All Cards QC Passed'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cards.map((card, cardIndex) => {
                        const isNfcReq = item.is_nfc_required !== false && item.product_type !== 'QR_ONLY';
                        const isQrReq = item.is_qr_required !== false && item.product_type !== 'NFC_ONLY';

                        const isCardDone =
                          (!isNfcReq || card.qc_nfc_tested) &&
                          (!isQrReq || card.qc_qr_tested) &&
                          card.qc_destination_verified;

                        return (
                          <div
                            key={card.id}
                            className={`p-4 rounded-xl border transition-all space-y-3 ${
                              isCardDone
                                ? 'bg-emerald-50/60 border-emerald-200'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            {/* Card Code & Quick Links */}
                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                  کارت #{cardIndex + 1}: {card.code}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(card.nfc_url, `card_url_${card.id}`)}
                                  className="text-slate-500 hover:text-slate-800 p-1 text-[11px] flex items-center gap-1 font-medium"
                                  title="Copy NFC Redirect URL"
                                >
                                  {copiedKey === `card_url_${card.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                  <span className="text-[10px]">کپی لینک NFC</span>
                                </button>
                              </div>

                              {isCardDone ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> {isFa ? 'کارت تایید شده' : 'Complete'}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                  {isFa ? 'در انتظار تست' : 'QC Pending'}
                                </span>
                              )}
                            </div>

                            {/* Internal Direct Links with Test & QR preview buttons */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {isNfcReq && (
                                <a
                                  href={card.nfc_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] px-2 py-1 rounded bg-white border border-slate-200 text-sky-700 hover:bg-sky-50 font-medium flex items-center gap-1"
                                >
                                  <Radio className="w-3 h-3 text-sky-600" />
                                  {isFa ? 'تست ریدایرکت NFC' : 'Test NFC'}
                                </a>
                              )}
                              {isQrReq && (
                                <>
                                  <a
                                    href={card.qr_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] px-2 py-1 rounded bg-white border border-slate-200 text-teal-700 hover:bg-teal-50 font-medium flex items-center gap-1"
                                  >
                                    <QrCode className="w-3 h-3 text-teal-600" />
                                    {isFa ? 'تست ریدایرکت QR' : 'Test QR'}
                                  </a>
                                  <button
                                    onClick={() => setQrModalCode(card.code)}
                                    className="text-[11px] px-2 py-1 rounded bg-white border border-slate-200 text-purple-700 hover:bg-purple-50 font-medium flex items-center gap-1"
                                  >
                                    <Printer className="w-3 h-3 text-purple-600" />
                                    {isFa ? 'مشاهده / چاپ برچسب QR' : 'QR Label'}
                                  </button>
                                </>
                              )}
                            </div>

                            {/* QC Checkboxes */}
                            <div className="space-y-2 pt-1">
                              <span className="text-[11px] text-slate-500 block font-medium">
                                {isFa ? 'چک‌لیست کنترل کیفیت (QC Testing):' : 'QC Verification Checklist:'}
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {isNfcReq && (
                                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                                    <input
                                      type="checkbox"
                                      checked={card.qc_nfc_tested}
                                      onChange={(e) =>
                                        updateQcMutation.mutate({
                                          cardId: card.id,
                                          qc: { qc_nfc_tested: e.target.checked },
                                        })
                                      }
                                      className="rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                    />
                                    <span className={card.qc_nfc_tested ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                                      {isFa ? 'تست رایت چیپ NFC' : 'NFC Tested'}
                                    </span>
                                  </label>
                                )}

                                {isQrReq && (
                                  <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                                    <input
                                      type="checkbox"
                                      checked={card.qc_qr_tested}
                                      onChange={(e) =>
                                        updateQcMutation.mutate({
                                          cardId: card.id,
                                          qc: { qc_qr_tested: e.target.checked },
                                        })
                                      }
                                      className="rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                    />
                                    <span className={card.qc_qr_tested ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                                      {isFa ? 'تست اسکن بارکد QR' : 'QR Tested'}
                                    </span>
                                  </label>
                                )}

                                <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 sm:col-span-2">
                                  <input
                                    type="checkbox"
                                    checked={card.qc_destination_verified}
                                    onChange={(e) =>
                                      updateQcMutation.mutate({
                                        cardId: card.id,
                                        qc: { qc_destination_verified: e.target.checked },
                                      })
                                    }
                                    className="rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                  />
                                  <span className={card.qc_destination_verified ? 'text-emerald-700 font-bold' : 'text-slate-600'}>
                                    {isFa ? 'تایید صحت ریدایرکت و لود صفحه' : 'Destination / Activation Page Verified'}
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardUI>
            );
          })}
        </div>

        {/* QR Code Label Print Modal */}
        {qrModalCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-sm w-full space-y-4 text-center shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  {isFa ? `برچسب بارکد QR (کد: ${qrModalCode})` : `QR Label: ${qrModalCode}`}
                </h3>
                <button onClick={() => setQrModalCode(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  ✕
                </button>
              </div>

              <div className="p-4 bg-white border border-slate-100 rounded-xl inline-block shadow-inner mx-auto">
                <img
                  src={`http://localhost:8000/q/${qrModalCode}/qr.png`}
                  alt={`QR code ${qrModalCode}`}
                  className="w-48 h-48 object-contain"
                />
              </div>

              <p className="text-xs font-mono text-slate-500 break-all bg-slate-50 p-2 rounded-lg border border-slate-200">
                http://localhost:8000/q/{qrModalCode}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="w-full gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.open(`http://localhost:8000/q/${qrModalCode}/qr.png`, '_blank')}
                >
                  <Printer className="w-4 h-4" />
                  {isFa ? 'چاپ مستقیم برچسب' : 'Print QR Label'}
                </Button>
                <Button variant="secondary" className="text-xs bg-white border-slate-200" onClick={() => setQrModalCode(null)}>
                  {isFa ? 'بستن' : 'Close'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── VIEW 2: ORDERS LIST (Comprehensive Workspace View) ───────────────

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-blue-600" />
            {isFa ? 'مدیریت سفارشات آنلاین و خط تولید' : 'Online Shop Orders & Fulfillment'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isFa
              ? 'بررسی لینک‌های ارسالی مشتری، رایت چیپ NFC، چاپ بارکد QR و آماده‌سازی بسته‌های ارسالی'
              : 'Review customer links, program NFC chips, print QR labels, and dispatch orders.'}
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="gap-2 bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
          onClick={() => refetchOrders()}
          isLoading={isListLoading}
        >
          <RefreshCw className="w-4 h-4" />
          {isFa ? 'بروزرسانی لیست' : 'Refresh'}
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <CardUI className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border-slate-200 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { id: 'ALL', label: isFa ? 'همه سفارشات' : 'All' },
            { id: 'PENDING', label: isFa ? 'در انتظار بررسی و تولید' : 'Awaiting Production' },
            { id: 'READY_TO_SHIP', label: isFa ? 'آماده ارسال' : 'Ready to Ship' },
            { id: 'SHIPPED', label: isFa ? 'ارسال شده' : 'Shipped' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Activation Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-t-0 sm:border-s border-slate-200 sm:ps-3 pt-2 sm:pt-0">
          {[
            { id: 'ALL', label: isFa ? 'همه وضعیت‌ها' : 'All' },
            { id: 'ACTIVATED', label: isFa ? 'لینک فعال/تایید شده' : 'Activated' },
            { id: 'PENDING', label: isFa ? 'در انتظار لینک' : 'Pending Link' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivationFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activationFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute inset-y-0 start-3.5 my-auto text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isFa ? 'جستجو براساس شماره، نام یا تلفن...' : 'Search orders...'}
            className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 ps-10 pe-4 py-2 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-all"
          />
        </div>
      </CardUI>

      {/* Orders List */}
      {isListLoading ? (
        <CardUI className="p-12 text-center bg-white border-slate-200 shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">{isFa ? 'در حال بارگذاری سفارشات...' : 'Loading orders...'}</p>
        </CardUI>
      ) : filteredOrders.length === 0 ? (
        <CardUI className="p-12 text-center space-y-3 bg-white border-slate-200 shadow-sm">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">{isFa ? 'هیچ سفارشی یافت نشد' : 'No Orders Found'}</h3>
          <p className="text-xs text-slate-500">
            {isFa ? 'با فیلترهای انتخابی در حال حاضر سفارشی ثبت نشده است.' : 'No orders match your filter criteria.'}
          </p>
        </CardUI>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredOrders.map((ord) => {
            const nextBanner = getNextStepBanner(ord);
            return (
              <div
                key={ord.shop_order_number}
                onClick={() => {
                  setSelectedOrderNumber(ord.shop_order_number);
                  navigate(`/shop-orders/${ord.shop_order_number}`);
                }}
                className="group p-4 sm:p-5 rounded-2xl bg-white hover:bg-slate-50/90 border border-slate-200 hover:border-blue-400 transition-all cursor-pointer shadow-sm hover:shadow space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 group-hover:border-blue-300 transition-colors">
                      {ord.shop_order_number}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{ord.customer_name}</span>
                    <span className="text-xs text-slate-500 font-mono">({ord.customer_phone})</span>
                    {ord.shipping_city && (
                      <>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {ord.shipping_city}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {renderPaymentBadge(ord.payment_status)}
                    {renderActivationBadge(ord.items)}
                    {renderFulfillmentBadge(ord.fulfillment_status, ord.ready_to_ship)}
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-[-2px] transition-all" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-2">
                    {ord.items.map((it) => (
                      <span key={it.id} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                        {it.product_title} ({it.quantity})
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 font-medium">
                    <span>
                      {isFa ? 'مبلغ:' : 'Amount:'}{' '}
                      <strong className="text-slate-900 font-mono">
                        {ord.total_amount.toLocaleString('fa-IR')} {isFa ? 'تومان' : 'IRR'}
                      </strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-mono">{new Date(ord.created_at).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>

                {/* Prompt summary */}
                <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span>{nextBanner.title}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
