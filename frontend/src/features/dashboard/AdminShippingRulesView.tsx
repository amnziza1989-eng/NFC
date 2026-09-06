import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sliders,
  MapPin,
  Check,
  Truck,
  Package,
  RefreshCw,
  Search,
  CheckSquare,
  Sparkles,
  Layers,
  Edit2,
  AlertCircle,
  X,
  Percent,
  PlusCircle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { useLanguage } from '../../i18n/LanguageContext';
import { ShippingRuleResponse, ShippingRuleBulkUpdate } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const AdminShippingRulesView: React.FC = () => {
  const { language } = useLanguage();
  const isFa = language === 'fa';
  const queryClient = useQueryClient();

  // Search & Selection State (Strict Set-Based Architecture)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Global Quick Price State
  const [quickGlobalPrice, setQuickGlobalPrice] = useState<number>(65000);
  const [isConfirmAllModalOpen, setIsConfirmAllModalOpen] = useState(false);

  // Bulk Edit Modes
  const [bulkMode, setBulkMode] = useState<'exact' | 'fixed' | 'percentage'>('exact');
  const [bulkExactPrice, setBulkExactPrice] = useState<number>(65000);
  const [bulkFixedAmount, setBulkFixedAmount] = useState<number>(10000);
  const [bulkPercentage, setBulkPercentage] = useState<number>(10);

  // Feedback State
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Single Province Edit Modal State
  const [editingRule, setEditingRule] = useState<ShippingRuleResponse | null>(null);
  const [modalPostalPrice, setModalPostalPrice] = useState<number>(45000);
  const [modalCourierAvailable, setModalCourierAvailable] = useState<boolean>(false);
  const [modalCourierPrice, setModalCourierPrice] = useState<number>(0);
  const [modalError, setModalError] = useState<string | null>(null);

  // Query Shipping Rules
  const {
    data: shippingRules = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['adminShippingRules'],
    queryFn: () => api.getAdminShippingRules(),
  });

  // Single Rule Update Mutation
  const updateRuleMutation = useMutation({
    mutationFn: (data: { id: string; postal_price: number; courier_available: boolean; courier_price: number }) =>
      api.updateAdminShippingRule(data.id, {
        postal_price: data.postal_price,
        courier_available: data.courier_available,
        courier_price: data.courier_price,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['adminShippingRules'] });
      setEditingRule(null);
      setSuccessMsg(isFa ? `تعرفه «${updated.province}» با موفقیت ذخیره شد.` : `Rate for ${updated.province} saved.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    },
    onError: (err: any) => {
      setModalError(err.message || (isFa ? 'خطا در ذخیره تعرفه' : 'Failed to save rate'));
    },
  });

  // Bulk Update Mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (data: ShippingRuleBulkUpdate) => api.bulkUpdateAdminShippingRules(data),
    onSuccess: (updatedRules) => {
      queryClient.invalidateQueries({ queryKey: ['adminShippingRules'] });
      setIsConfirmAllModalOpen(false);
      setSelectedIds(new Set());
      setSuccessMsg(
        isFa
          ? `تعرفه ${updatedRules.length} استان با موفقیت به‌روزرسانی شد.`
          : `Rates for ${updatedRules.length} provinces updated successfully.`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setSuccessMsg(null);
      alert(err.message || (isFa ? 'خطا در اعمال تغییرات گروهی' : 'Bulk update failed'));
    },
  });

  // Summary Statistics
  const stats = useMemo(() => {
    const total = shippingRules.length;
    const courierCount = shippingRules.filter((r) => r.courier_available).length;
    const avgPostal = total > 0 ? Math.round(shippingRules.reduce((acc, r) => acc + r.postal_price, 0) / total) : 0;
    return { total, courierCount, avgPostal };
  }, [shippingRules]);

  // Filtered Rules by Search
  const filteredRules = useMemo(() => {
    if (!searchQuery.trim()) return shippingRules;
    const query = searchQuery.trim().toLowerCase();
    return shippingRules.filter((r) => r.province.toLowerCase().includes(query));
  }, [shippingRules, searchQuery]);

  // Strict Set-Based Membership Evaluation
  const allFilteredSelected =
    filteredRules.length > 0 && filteredRules.every((r) => selectedIds.has(r.id));
  const someFilteredSelected =
    filteredRules.length > 0 && filteredRules.some((r) => selectedIds.has(r.id));

  // Selection Actions
  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllSystem = () => {
    setSelectedIds(new Set(shippingRules.map((r) => r.id)));
  };

  const handleSelectAllExceptTehran = () => {
    const nonTehran = shippingRules.filter((r) => !r.province.includes('تهران')).map((r) => r.id);
    setSelectedIds(new Set(nonTehran));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleToggleFilteredHeader = () => {
    if (allFilteredSelected) {
      // Remove currently filtered items from selection
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredRules.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      // Add all currently filtered items to selection
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredRules.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

  // Bulk Apply Handlers
  const handleApplyQuickGlobalToAll = () => {
    if (shippingRules.length === 0) return;
    const allIds = shippingRules.map((r) => r.id);
    bulkUpdateMutation.mutate({
      rule_ids: allIds,
      postal_price: Number(quickGlobalPrice) || 0,
    });
  };

  const handleApplyQuickGlobalToSelected = () => {
    if (selectedIds.size === 0) return;
    bulkUpdateMutation.mutate({
      rule_ids: Array.from(selectedIds),
      postal_price: Number(quickGlobalPrice) || 0,
    });
  };

  const handleApplyAdvancedBulk = () => {
    if (selectedIds.size === 0) return;
    const payload: ShippingRuleBulkUpdate = {
      rule_ids: Array.from(selectedIds),
    };

    if (bulkMode === 'exact') {
      payload.postal_price = Number(bulkExactPrice) || 0;
    } else if (bulkMode === 'fixed') {
      payload.price_adjustment_amount = Number(bulkFixedAmount) || 0;
    } else if (bulkMode === 'percentage') {
      payload.price_adjustment_percentage = Number(bulkPercentage) || 0;
    }

    bulkUpdateMutation.mutate(payload);
  };

  // Open Modal for Editing a Rule
  const handleOpenEditModal = (rule: ShippingRuleResponse) => {
    setEditingRule(rule);
    setModalPostalPrice(rule.postal_price);
    setModalCourierAvailable(rule.courier_available);
    setModalCourierPrice(rule.courier_price);
    setModalError(null);
  };

  const handleModalSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    if (modalPostalPrice < 0) {
      setModalError(isFa ? 'هزینه ارسال نمی‌تواند منفی باشد.' : 'Price cannot be negative.');
      return;
    }
    updateRuleMutation.mutate({
      id: editingRule.id,
      postal_price: Number(modalPostalPrice) || 0,
      courier_available: modalCourierAvailable,
      courier_price: modalCourierAvailable ? Number(modalCourierPrice) || 0 : 0,
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16" dir={isFa ? 'rtl' : 'ltr'}>
      {/* SECTION 1: Page Header & Quick Statistics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <span>{isFa ? 'مدیریت تعرفه ارسال' : 'Shipping & Delivery Rates'}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isFa
              ? 'هزینه ارسال پستی و پیک را برای استان‌های مختلف مدیریت کنید.'
              : 'Configure postal shipping and courier delivery fees across all provinces.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="cursor-pointer"
            icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            {isFa ? 'بروزرسانی داده‌ها' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">
              {isFa ? 'تعداد استان‌های فعال' : 'Active Provinces'}
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {stats.total.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-500">{isFa ? 'استان' : 'Provinces'}</span>
            </span>
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">
              {isFa ? 'مناطق دارای پیک فعال' : 'Courier Eligible'}
            </span>
            <span className="text-xl font-black text-emerald-600 font-mono">
              {stats.courierCount.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-500">{isFa ? 'منطقه (تهران)' : 'Zone'}</span>
            </span>
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">
              {isFa ? 'میانگین تعرفه پست کشور' : 'Average Postal Rate'}
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {stats.avgPostal.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-500">{isFa ? 'تومان' : 'Toman'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Global Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {/* SECTION 2: Dedicated Quick Global Postal Price Card */}
      <Card className="p-6 border-slate-200 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                {isFa ? 'عملیات سریع' : 'Quick Action'}
              </span>
              <h2 className="text-base font-black text-slate-900">
                {isFa ? 'تعرفه پستی سراسری' : 'Global Postal Shipping Rate'}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              {isFa
                ? 'برای تغییر سریع هزینه پست در چند یا همه استان‌ها، بدون نیاز به ویرایش تک‌تک آن‌ها.'
                : 'Instantly apply a standard postal rate across multiple or all provinces without editing individually.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {isFa ? 'هزینه جدید پست پیشتاز (تومان)' : 'New Postal Shipping Price (Toman)'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                value={quickGlobalPrice}
                onChange={(e) => setQuickGlobalPrice(Number(e.target.value) || 0)}
                className="w-full h-11 px-3.5 pe-12 text-sm font-mono font-bold rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white"
              />
              <span className="absolute end-3.5 top-3 text-xs text-slate-400 font-medium">
                {isFa ? 'تومان' : 'Toman'}
              </span>
            </div>
          </div>

          <div className="md:col-span-8 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsConfirmAllModalOpen(true)}
              disabled={bulkUpdateMutation.isPending || shippingRules.length === 0}
              className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 cursor-pointer text-xs"
              icon={<Sparkles className="w-4 h-4 text-white" />}
            >
              {isFa ? 'اعمال به تمام ۳۱ استان کشور' : 'Apply to All 31 Provinces'}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={handleApplyQuickGlobalToSelected}
              disabled={selectedIds.size === 0 || bulkUpdateMutation.isPending}
              className="border-slate-300 text-xs cursor-pointer"
            >
              {isFa
                ? `اعمال به ${selectedIds.size} استان انتخاب‌شده`
                : `Apply to ${selectedIds.size} Selected`}
            </Button>

            {selectedIds.size === 0 && (
              <button
                type="button"
                onClick={handleSelectAllSystem}
                className="text-xs text-blue-600 font-bold hover:underline cursor-pointer py-2"
              >
                {isFa ? 'انتخاب همه استان‌ها' : 'Select all provinces'}
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Confirmation Modal for Global 31-Province Overwrite */}
      {isConfirmAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900">
                {isFa ? 'تأیید تغییر تعرفه سراسری پست' : 'Confirm Global Postal Price Change'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isFa ? (
                  <>
                    شما در حال تغییر تعرفه پست پیشتاز <span className="font-bold text-blue-600">{shippingRules.length} استان کشور</span> به مبلغ{' '}
                    <span className="font-bold text-slate-900 font-mono">{quickGlobalPrice.toLocaleString('fa-IR')} تومان</span> هستید.
                    <br />
                    (توجه: تنظیمات پیک شهر تهران بدون تغییر باقی می‌ماند.)
                  </>
                ) : (
                  `You are about to update the postal rate for all ${shippingRules.length} provinces to ${quickGlobalPrice.toLocaleString()} Toman.`
                )}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsConfirmAllModalOpen(false)}
                disabled={bulkUpdateMutation.isPending}
                className="w-1/2 cursor-pointer text-xs"
              >
                {isFa ? 'انصراف' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleApplyQuickGlobalToAll}
                isLoading={bulkUpdateMutation.isPending}
                className="w-1/2 bg-blue-600 hover:bg-blue-700 cursor-pointer text-xs"
              >
                {isFa ? 'تأیید و اعمال نهایی' : 'Confirm & Apply'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: Advanced Bulk Action Panel (Active when 1+ rows selected) */}
      {selectedIds.size > 0 && (
        <Card className="p-6 border-blue-200 bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-3xl shadow-xl shadow-blue-900/20 space-y-5 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                <Layers className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-black flex items-center gap-2">
                  <span>{isFa ? 'عملیات پیشرفته گروهی' : 'Advanced Bulk Management'}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-xs font-mono font-black">
                    {selectedIds.size} {isFa ? 'استان انتخاب شده' : 'selected'}
                  </span>
                </h3>
                <p className="text-[11px] text-blue-200 mt-0.5">
                  {isFa
                    ? 'تعرفه پستی استان‌های انتخاب‌شده را به صورت دسته‌جمعی بر اساس قیمت دقیق، مبلغ ثابت، یا درصد تغییر دهید.'
                    : 'Bulk update selected postal fees via exact price, fixed adjustment, or percentage.'}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearSelection}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs cursor-pointer"
            >
              {isFa ? 'لغو انتخاب‌ها' : 'Deselect All'}
            </Button>
          </div>

          {/* Selected Provinces Chips */}
          <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl bg-white/5 border border-white/10">
            {Array.from(selectedIds).map((id) => {
              const rule = shippingRules.find((r) => r.id === id);
              if (!rule) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 text-white text-[11px] font-bold"
                >
                  <MapPin className="w-3 h-3 text-amber-300" />
                  <span>{rule.province}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleRow(id)}
                    className="hover:text-rose-300 transition-colors cursor-pointer"
                    title={isFa ? 'حذف از انتخاب' : 'Remove'}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>

          {/* Adjustment Modes Tabs */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => setBulkMode('exact')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  bulkMode === 'exact'
                    ? 'bg-amber-400 text-slate-900 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isFa ? '۱. تعیین قیمت دقیق' : '1. Set Exact Price'}</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkMode('fixed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  bulkMode === 'fixed'
                    ? 'bg-amber-400 text-slate-900 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isFa ? '۲. افزایش/کاهش مبلغی' : '2. Fixed +/- Amount'}</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkMode('percentage')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  bulkMode === 'percentage'
                    ? 'bg-amber-400 text-slate-900 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>{isFa ? '۳. افزایش/کاهش درصدی' : '3. Percentage +/-'}</span>
              </button>
            </div>

            {/* Input & Apply Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-6 space-y-1.5">
                {bulkMode === 'exact' && (
                  <>
                    <label className="block text-xs font-bold text-blue-100">
                      {isFa ? 'مبلغ جدید برای استان‌های انتخاب‌شده (تومان)' : 'Exact Price (Toman)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={bulkExactPrice}
                      onChange={(e) => setBulkExactPrice(Number(e.target.value) || 0)}
                      className="w-full h-10 px-3.5 text-sm font-mono font-bold rounded-xl bg-white text-slate-900 border-0 focus:ring-2 focus:ring-amber-400"
                    />
                  </>
                )}

                {bulkMode === 'fixed' && (
                  <>
                    <label className="block text-xs font-bold text-blue-100">
                      {isFa ? 'مبلغ افزایش (+) یا کاهش (-) به تومان' : 'Fixed Adjustment (+/- Toman)'}
                    </label>
                    <input
                      type="number"
                      step="1000"
                      value={bulkFixedAmount}
                      onChange={(e) => setBulkFixedAmount(Number(e.target.value) || 0)}
                      placeholder="+10000 یا -5000"
                      className="w-full h-10 px-3.5 text-sm font-mono font-bold rounded-xl bg-white text-slate-900 border-0 focus:ring-2 focus:ring-amber-400"
                    />
                  </>
                )}

                {bulkMode === 'percentage' && (
                  <>
                    <label className="block text-xs font-bold text-blue-100">
                      {isFa ? 'درصد افزایش (+) یا کاهش (-)' : 'Percentage Adjustment (+/- %)'}
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={bulkPercentage}
                      onChange={(e) => setBulkPercentage(Number(e.target.value) || 0)}
                      placeholder="+10 یا -10"
                      className="w-full h-10 px-3.5 text-sm font-mono font-bold rounded-xl bg-white text-slate-900 border-0 focus:ring-2 focus:ring-amber-400"
                    />
                  </>
                )}
              </div>

              <div className="sm:col-span-6">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleApplyAdvancedBulk}
                  disabled={bulkUpdateMutation.isPending}
                  className="w-full h-10 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black border-0 text-xs cursor-pointer shadow-md"
                  icon={<Sparkles className="w-4 h-4 text-slate-900" />}
                >
                  {bulkUpdateMutation.isPending
                    ? (isFa ? 'در حال اعمال...' : 'Applying...')
                    : (isFa ? `اعمال روی ${selectedIds.size} استان انتخاب‌شده` : `Apply to ${selectedIds.size} Provinces`)}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* SECTION 5: Province Table Filter & Quick Selection Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5" />
            <input
              type="text"
              placeholder={isFa ? 'جستجوی نام استان (مثلاً تهران، اصفهان، فارس، خراسان)...' : 'Search province...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
            />
          </div>

          {/* Quick Selection Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllSystem}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>{isFa ? 'انتخاب همه ۳۱ استان' : 'Select All 31'}</span>
            </button>

            <button
              type="button"
              onClick={handleSelectAllExceptTehran}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{isFa ? 'انتخاب همه به جز تهران' : 'Select All Except Tehran'}</span>
            </button>

            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isFa ? `لغو (${selectedIds.size})` : `Clear (${selectedIds.size})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* SECTION 7: Honest State Rendering */}
        <Card className="p-0 overflow-hidden shadow-xs border border-slate-200 bg-white">
          {isLoading ? (
            <div className="p-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">
                {isFa ? 'در حال دریافت اطلاعات تعرفه‌ها...' : 'Loading shipping rules...'}
              </p>
            </div>
          ) : isError ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900">
                  {isFa ? 'خطا در برقراری ارتباط با سرور' : 'Failed to Load Shipping Rules'}
                </h3>
                <p className="text-xs text-slate-500">
                  {(error as Error)?.message || (isFa ? 'امکان دریافت اطلاعات تعرفه‌ها وجود ندارد.' : 'Unable to connect to API.')}
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => refetch()} className="cursor-pointer">
                {isFa ? 'تلاش مجدد' : 'Retry'}
              </Button>
            </div>
          ) : shippingRules.length === 0 ? (
            <div className="p-16 text-center space-y-2 text-slate-400">
              <Package className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold">{isFa ? 'هیچ تعرفه‌ای در سیستم ثبت نشده است.' : 'No shipping rules found.'}</p>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="p-16 text-center space-y-2 text-slate-400">
              <Search className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold">
                {isFa ? `هیچ استانی با عنوان «${searchQuery}» یافت نشد.` : `No destinations match "${searchQuery}".`}
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                {isFa ? 'پاک کردن فیلتر جستجو' : 'Clear search'}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-4 px-4 text-center w-12">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected;
                        }}
                        onChange={handleToggleFilteredHeader}
                        className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
                        title={isFa ? 'انتخاب همه موارد این صفحه' : 'Select All'}
                      />
                    </th>
                    <th className="py-4 px-4 text-start">{isFa ? 'نام استان / منطقه' : 'Province / Destination'}</th>
                    <th className="py-4 px-4 text-start">{isFa ? 'هزینه ارسال با پست پیشتاز' : 'Postal Shipping Fee'}</th>
                    <th className="py-4 px-4 text-center">{isFa ? 'وضعیت پیک موتوری' : 'Courier Status'}</th>
                    <th className="py-4 px-4 text-start">{isFa ? 'هزینه ارسال با پیک' : 'Courier Fee'}</th>
                    <th className="py-4 px-4 text-center">{isFa ? 'عملیات' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRules.map((rule) => {
                    const isSelected = selectedIds.has(rule.id);
                    const isTehran = rule.province.includes('تهران');

                    return (
                      <tr
                        key={rule.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(rule.id)}
                            className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <MapPin className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span className="text-sm">{rule.province}</span>
                            {isTehran && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                {isFa ? 'مرکز / دارای پیک' : 'Capital Zone'}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                          {rule.postal_price.toLocaleString('fa-IR')} <span className="text-[11px] font-normal text-slate-500">{isFa ? 'تومان' : 'Toman'}</span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {rule.courier_available ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                              <Check className="w-3 h-3" />
                              <span>{isFa ? 'پیک فعال است' : 'Courier Active'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                              {isFa ? 'غیرفعال' : 'Inactive'}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                          {rule.courier_available ? (
                            <>
                              {rule.courier_price.toLocaleString('fa-IR')}{' '}
                              <span className="text-[11px] font-normal text-slate-500">{isFa ? 'تومان' : 'Toman'}</span>
                            </>
                          ) : (
                            <span className="text-slate-300 font-normal">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEditModal(rule)}
                            className="text-xs px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 border-slate-200 cursor-pointer"
                            icon={<Edit2 className="w-3.5 h-3.5" />}
                          >
                            {isFa ? 'ویرایش' : 'Edit'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* SECTION 6: Focused Single Province Edit Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {isFa ? `ویرایش تعرفه: ${editingRule.province}` : `Edit Rate: ${editingRule.province}`}
                  </h3>
                  <span className="text-[11px] text-slate-400">{isFa ? 'تنظیمات اختصاصی استان' : 'Province Override'}</span>
                </div>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSave} className="p-6 space-y-5">
              {modalError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-bold">{modalError}</span>
                </div>
              )}

              {/* Postal Price Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {isFa ? 'هزینه ارسال با پست پیشتاز (تومان)' : 'Postal Shipping Price (Toman)'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={modalPostalPrice}
                    onChange={(e) => setModalPostalPrice(Number(e.target.value) || 0)}
                    className="w-full h-11 px-3.5 pe-12 text-sm font-mono font-bold rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900"
                    required
                  />
                  <span className="absolute end-3.5 top-3 text-xs text-slate-400 font-medium">
                    {isFa ? 'تومان' : 'Toman'}
                  </span>
                </div>
              </div>

              {/* Courier Delivery Section (Clean Separation) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block">
                      {isFa ? 'امکان ارسال با پیک موتوری' : 'Enable Courier Delivery'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {isFa ? 'ارسال سریع درون‌شهری' : 'Same-day inner-city delivery'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalCourierAvailable}
                      onChange={(e) => setModalCourierAvailable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {modalCourierAvailable && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/80 animate-in fade-in duration-150">
                    <label className="block text-xs font-bold text-slate-700">
                      {isFa ? 'هزینه ارسال با پیک (تومان)' : 'Courier Price (Toman)'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={modalCourierPrice}
                        onChange={(e) => setModalCourierPrice(Number(e.target.value) || 0)}
                        className="w-full h-11 px-3.5 pe-12 text-sm font-mono font-bold rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 bg-white"
                        required={modalCourierAvailable}
                      />
                      <span className="absolute end-3.5 top-3 text-xs text-slate-400 font-medium">
                        {isFa ? 'تومان' : 'Toman'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  type="button"
                  onClick={() => setEditingRule(null)}
                  disabled={updateRuleMutation.isPending}
                  className="cursor-pointer text-xs"
                >
                  {isFa ? 'انصراف' : 'Cancel'}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  isLoading={updateRuleMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-xs"
                >
                  {isFa ? 'ذخیره تغییرات' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
