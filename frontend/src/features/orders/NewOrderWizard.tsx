import React, { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  ChevronRight,
  Radio,
  QrCode,
  Star,
  Link2,
  Check,
  X,
  Sparkles,
  Zap,
  Save,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Business, Destination, ProductType } from '../../types/api';

// ── Destination type helpers ─────────────────────────────────────────

export const DEST_TYPE_META: Record<string, { label: string; emoji: string; placeholder: string; desc: string }> = {
  GOOGLE_REVIEW: {
    label: 'ثبت نظر گوگل (Google Review)',
    emoji: '⭐',
    placeholder: 'https://g.page/r/... یا https://search.google.com/local/writereview?...',
    desc: 'لینک مستقیم صفحه بازخورد و ثبت ستاره مشتری در گوگل مپس',
  },
  GOOGLE_MAPS: {
    label: 'مسیریابی گوگل مپس',
    emoji: '📍',
    placeholder: 'https://maps.app.goo.gl/...',
    desc: 'لینک مکان فیزیکی کسب‌وکار روی نقشه گوگل',
  },
  INSTAGRAM: {
    label: 'صفحه اینستاگرام',
    emoji: '📸',
    placeholder: 'https://instagram.com/your_page',
    desc: 'صفحه رسمی اینستاگرام کسب‌وکار',
  },
  WEBSITE: {
    label: 'وب‌سایت اختصاصی',
    emoji: '🌐',
    placeholder: 'https://example.com',
    desc: 'آدرس وب‌سایت یا لندینگ پیج اختصاصی',
  },
  WHATSAPP: {
    label: 'واتساپ پشتیبانی',
    emoji: '💬',
    placeholder: 'https://wa.me/98912...',
    desc: 'لینک چت مستقیم واتساپ',
  },
  CUSTOM_URL: {
    label: 'لینک سفارشی دلخواه',
    emoji: '🔗',
    placeholder: 'https://...',
    desc: 'هر آدرس اینترنتی معتبر دیگر',
  },
};

// ── Wizard state types ────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4;

interface WizardState {
  step: WizardStep;
  productType: ProductType;
  quantity: number;
  selectedBusiness: Business | null;
  newBizName: string;
  showNewBizForm: boolean;
  selectedDestination: Destination | null;
  newDestType: string;
  newDestUrl: string;
  showNewDestForm: boolean;
}

const INITIAL_STATE: WizardState = {
  step: 1,
  productType: 'NFC_QR',
  quantity: 1,
  selectedBusiness: null,
  newBizName: '',
  showNewBizForm: false,
  selectedDestination: null,
  newDestType: 'GOOGLE_REVIEW',
  newDestUrl: '',
  showNewDestForm: false,
};

// ── Props ─────────────────────────────────────────────────────────────

interface NewOrderWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (orderId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────

export const NewOrderWizard: React.FC<NewOrderWizardProps> = ({ isOpen, onClose, onOrderCreated }) => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [bizSearch, setBizSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreatingBiz, setIsCreatingBiz] = useState(false);
  const [isCreatingDest, setIsCreatingDest] = useState(false);

  const update = useCallback((patch: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...patch }));
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
    setBizSearch('');
    setError(null);
    setIsCreatingBiz(false);
    setIsCreatingDest(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // Queries
  const { data: businesses = [], isLoading: bizLoading } = useQuery({
    queryKey: ['businesses', bizSearch],
    queryFn: () => api.listBusinesses({ search: bizSearch || undefined, limit: 20 }),
    enabled: isOpen && state.step === 2,
  });

  const { data: destinations = [], isLoading: destLoading } = useQuery({
    queryKey: ['destinations', state.selectedBusiness?.id],
    queryFn: () =>
      state.selectedBusiness
        ? api.listDestinations({ business_id: state.selectedBusiness.id, limit: 50 })
        : Promise.resolve([]),
    enabled: isOpen && !!state.selectedBusiness && state.step === 3,
  });

  // Create Order mutation
  const createOrderMutation = useMutation({
    mutationFn: (data: { business_id: string; destination_id: string; product_type: ProductType; quantity: number }) =>
      api.createOrder(data),
    onError: (err: Error) => setError(err.message),
  });

  // Generate cards mutation
  const generateCardsMutation = useMutation({
    mutationFn: (orderId: string) => api.generateOrderCards(orderId),
    onError: (err: Error) => setError(err.message),
  });

  // ── Step 2: Business inline creation ──────────────────────────────
  const handleCreateBusiness = async () => {
    if (!state.newBizName.trim()) {
      setError('نام کسب‌وکار الزامی است');
      return;
    }
    try {
      setIsCreatingBiz(true);
      setError(null);
      const biz = await api.createBusiness({ name: state.newBizName.trim() });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      update({ selectedBusiness: biz, showNewBizForm: false, newBizName: '', step: 3 });
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsCreatingBiz(false);
    }
  };

  // ── Step 3: Destination inline creation ───────────────────────────
  const handleCreateDestination = async () => {
    if (!state.newDestUrl.trim()) {
      setError('آدرس اینترنتی مقصد الزامی است');
      return;
    }
    try {
      const parsed = new URL(state.newDestUrl.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setError('آدرس مقصد باید با http:// یا https:// شروع شود');
        return;
      }
    } catch {
      setError('آدرس اینترنتی وارد شده نامعتبر است');
      return;
    }
    if (!state.selectedBusiness) return;
    try {
      setIsCreatingDest(true);
      setError(null);
      const dest = await api.createDestination({
        business_id: state.selectedBusiness.id,
        type: state.newDestType,
        url: state.newDestUrl.trim(),
        source_url: state.newDestUrl.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ['destinations', state.selectedBusiness.id] });
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      update({ selectedDestination: dest, showNewDestForm: false, newDestUrl: '', step: 4 });
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsCreatingDest(false);
    }
  };

  // ── Final submit ──────────────────────────────────────────────────
  const handleSubmit = async (autoGenerate: boolean) => {
    if (!state.selectedBusiness || !state.selectedDestination) {
      setError('اطلاعات کسب‌وکار و مقصد الزامی است');
      return;
    }
    setError(null);
    try {
      const order = await createOrderMutation.mutateAsync({
        business_id: state.selectedBusiness.id,
        destination_id: state.selectedDestination.id,
        product_type: state.productType,
        quantity: state.quantity,
      });

      if (autoGenerate) {
        await generateCardsMutation.mutateAsync(order.id);
      }

      // Invalidate all related query keys AFTER generation completes
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['order', order.id] }),
        queryClient.invalidateQueries({ queryKey: ['orderCards', order.id] }),
        queryClient.invalidateQueries({ queryKey: ['orderReconciliation', order.id] }),
        queryClient.invalidateQueries({ queryKey: ['orderQRLabels', order.id] }),
        queryClient.invalidateQueries({ queryKey: ['cards'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] }),
      ]);

      reset();
      onOrderCreated(order.id);
    } catch {
      // error set by mutation onError
    }
  };

  const isSubmitting = createOrderMutation.isPending || generateCardsMutation.isPending;

  // ── 4 Wizard Steps Definition ─────────────────────────────────────
  const STEPS = [
    { n: 1, label: '۱. نوع محصول' },
    { n: 2, label: '۲. کسب‌وکار' },
    { n: 3, label: '۳. مقصد هدایت' },
    { n: 4, label: '۴. تأیید و ثبت' },
  ];

  const canGoNext = () => {
    if (state.step === 1) return state.quantity >= 1;
    if (state.step === 2) return !!state.selectedBusiness && !state.showNewBizForm;
    if (state.step === 3) return !!state.selectedDestination && !state.showNewDestForm;
    return true;
  };

  const goNext = () => {
    if (!canGoNext()) return;
    if (state.step < 4) update({ step: (state.step + 1) as WizardStep });
  };

  const goBack = () => {
    if (state.step > 1) update({ step: (state.step - 1) as WizardStep });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="➕ ثبت سفارش کارت فیزیکی جدید"
      subtitle="سفارش سریع کارت‌های هوشمند NFC و QR"
      maxWidth="xl"
    >
      {/* Step Progress Bar */}
      <div className="flex items-center justify-between mb-6">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  state.step > s.n
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : state.step === s.n
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {state.step > s.n ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <span
                className={`text-[10px] font-bold ${
                  state.step === s.n ? 'text-blue-700 font-black' : state.step > s.n ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 transition-all ${
                  state.step > s.n ? 'bg-emerald-400' : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 shadow-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP 1: PRODUCT TYPE & QUANTITY
          ═══════════════════════════════════════════════════════════════ */}
      {state.step === 1 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-1">
              <Radio className="w-4 h-4 text-blue-600" />
              مرحله ۱ — انتخاب نوع محصول و تعداد
            </h3>
            <p className="text-xs text-slate-500">
              ابتدا نوع کارت فیزیکی و تعداد مورد نیاز را مشخص کنید.
            </p>
          </div>

          {/* Product Type Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* NFC + QR Option */}
            <button
              type="button"
              onClick={() => update({ productType: 'NFC_QR' })}
              className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col gap-2.5 cursor-pointer relative ${
                state.productType === 'NFC_QR'
                  ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <Radio className="w-4 h-4 text-blue-600" />
                  <span>NFC</span>
                  <span className="text-slate-400 font-normal">+</span>
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <span>QR</span>
                </div>
                {state.productType === 'NFC_QR' && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                کارت دوگانه استاندارد: تپ مستقیم NFC + بارکد QR اختصاصی تپ‌ناو برای چاپ روی کارت.
              </p>
              <div className="flex gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold">📡 چیپ NFC</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold">▣ بارکد QR</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black ms-auto">پیشنهادی</span>
              </div>
            </button>

            {/* NFC Only Option */}
            <button
              type="button"
              onClick={() => update({ productType: 'NFC_ONLY' })}
              className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col gap-2.5 cursor-pointer relative ${
                state.productType === 'NFC_ONLY'
                  ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                  <Radio className="w-4 h-4 text-blue-600" />
                  <span>فقط NFC (NFC Only)</span>
                </div>
                {state.productType === 'NFC_ONLY' && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                کارت لوکس بدون چاپ بارکد QR: تعامل صرفاً از طریق تپ چیپ NFC با گوشی هوشمند.
              </p>
              <div className="flex gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold">📡 چیپ NFC</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px] font-medium line-through">بدون QR</span>
              </div>
            </button>
          </div>

          {/* Quantity Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                تعداد کارت‌های سفارش:
              </span>
              <span className="text-xs font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {state.quantity} عدد
              </span>
            </div>

            {/* Quick quantity selector chips */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 5, 10].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => update({ quantity: q })}
                  className={`py-2 rounded-xl border-2 text-center font-black text-xs transition-all cursor-pointer ${
                    state.quantity === q
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                  }`}
                >
                  {q} عدد
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-[11px] text-slate-500 shrink-0">یا تعداد دلخواه:</span>
              <input
                type="number"
                min={1}
                max={500}
                value={state.quantity}
                onChange={e => update({ quantity: Math.max(1, Math.min(500, parseInt(e.target.value, 10) || 1)) })}
                className="w-full bg-white text-slate-900 text-center text-base font-black rounded-xl border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP 2: BUSINESS SELECTION / CREATION
          ═══════════════════════════════════════════════════════════════ */}
      {state.step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-blue-600" />
              مرحله ۲ — انتخاب یا ایجاد کسب‌وکار
            </h3>
            <p className="text-xs text-slate-500">کسب‌وکار مشتری را انتخاب کنید یا به سادگی یک کسب‌وکار جدید ثبت نمایید.</p>
          </div>

          {/* Business Search & List */}
          {!state.showNewBizForm && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute inset-y-0 start-3 my-auto text-slate-400" />
                <input
                  type="text"
                  value={bizSearch}
                  onChange={e => setBizSearch(e.target.value)}
                  placeholder="جستجوی نام کسب‌وکار..."
                  className="w-full bg-slate-50 text-sm text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 ps-9 pe-4 py-2.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {bizLoading ? (
                <div className="py-4 text-center text-xs text-slate-400">در حال جستجو...</div>
              ) : businesses.length > 0 ? (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {businesses.map((biz: Business) => (
                    <button
                      key={biz.id}
                      type="button"
                      onClick={() => update({ selectedBusiness: biz })}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-start transition-colors hover:bg-slate-50 cursor-pointer ${
                        state.selectedBusiness?.id === biz.id
                          ? 'bg-blue-50/80 border-l-4 border-blue-600'
                          : ''
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{biz.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{biz.id.substring(0, 12)}...</p>
                      </div>
                      {state.selectedBusiness?.id === biz.id && (
                        <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ) : bizSearch ? (
                <div className="py-5 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  کسب‌وکاری با نام «{bizSearch}» یافت نشد.
                </div>
              ) : (
                <div className="py-5 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  برای جستجو تایپ کنید یا از دکمه زیر کسب‌وکار جدید ایجاد کنید.
                </div>
              )}

              <button
                type="button"
                onClick={() => update({ showNewBizForm: true, selectedBusiness: null })}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                ایجاد کسب‌وکار جدید (درون همین فرم)
              </button>
            </div>
          )}

          {/* Inline New Business Form */}
          {state.showNewBizForm && (
            <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/70 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-blue-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  ایجاد کسب‌وکار جدید
                </h4>
                <button
                  type="button"
                  onClick={() => update({ showNewBizForm: false })}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={state.newBizName}
                onChange={e => update({ newBizName: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleCreateBusiness()}
                placeholder="نام کسب‌وکار (مثال: کافه رستوران صدف)"
                autoFocus
                className="w-full bg-white text-slate-900 text-sm rounded-xl border border-blue-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateBusiness}
                  isLoading={isCreatingBiz}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  ثبت و ادامه
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => update({ showNewBizForm: false })}
                >
                  انصراف
                </Button>
              </div>
            </div>
          )}

          {state.selectedBusiness && !state.showNewBizForm && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">کسب‌وکار انتخاب‌شده:</span>
                <span className="font-black text-slate-900">{state.selectedBusiness.name}</span>
              </div>
              <button
                type="button"
                onClick={() => update({ selectedBusiness: null })}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline"
              >
                تغییر
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP 3: DESTINATION (STREAMLINED FOR GOOGLE REVIEW)
          ═══════════════════════════════════════════════════════════════ */}
      {state.step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-1">
              <Link2 className="w-4 h-4 text-blue-600" />
              مرحله ۳ — آدرس مقصد (صفحه ثبت نظر گوگل)
            </h3>
            <p className="text-xs text-slate-500">
              مقصدی نهایی که مشتری پس از تپ NFC یا اسکن QR به آن هدایت می‌شود.
            </p>
          </div>

          {/* Product-specific Architecture Banner */}
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-blue-800">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>معماری ریدایرکت هوشمند تپ‌ناو:</span>
            </div>
            {state.productType === 'NFC_QR' ? (
              <p className="text-[11px] leading-relaxed text-blue-800">
                ✅ <strong>نیازی به آپلود بارکد QR گوگل نیست!</strong> فقط آدرس اینترنتی گوگل ریویو مشتری را وارد کنید. سیستم تپ‌ناو به صورت خودکار بارکد QR اختصاصی با تصویر باکیفیت چاپ (<code className="font-mono text-blue-900">/q/&#123;code&#125;</code>) و لینک NFC (<code className="font-mono text-blue-900">/n/&#123;code&#125;</code>) را تولید می‌نماید.
              </p>
            ) : (
              <p className="text-[11px] leading-relaxed text-blue-800">
                ✅ <strong>کارت فقط NFC:</strong> آدرس گوگل ریویو را وارد کنید. پس از ثبت سفارش، لینک هوشمند اختصاصی NFC (<code className="font-mono text-blue-900">/n/&#123;code&#125;</code>) جهت رایت روی چیپ صادر خواهد شد.
              </p>
            )}
          </div>

          {/* Destination Selector / Creator */}
          {!state.showNewDestForm && (
            <div className="space-y-3">
              {destLoading ? (
                <div className="py-4 text-center text-xs text-slate-400">در حال بارگذاری مقاصد...</div>
              ) : destinations.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700">مقاصد موجود برای «{state.selectedBusiness?.name}»:</p>
                  <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {destinations.map((dest: Destination) => {
                      const meta = DEST_TYPE_META[dest.type] || DEST_TYPE_META.CUSTOM_URL;
                      const url = dest.source_url || dest.url;
                      return (
                        <button
                          key={dest.id}
                          type="button"
                          onClick={() => update({ selectedDestination: dest })}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-start transition-colors hover:bg-slate-50 cursor-pointer ${
                            state.selectedDestination?.id === dest.id
                              ? 'bg-blue-50/80 border-l-4 border-blue-600'
                              : ''
                          }`}
                        >
                          <span className="text-lg shrink-0">{meta.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900">{meta.label}</p>
                            <p className="text-[10px] text-slate-500 truncate font-mono">{url}</p>
                          </div>
                          {state.selectedDestination?.id === dest.id && (
                            <Check className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  هنوز مقصدی برای این کسب‌وکار ثبت نشده است.
                </div>
              )}

              <button
                type="button"
                onClick={() => update({ showNewDestForm: true, selectedDestination: null })}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                ثبت آدرس مقصد جدید (گوگل ریویو)
              </button>
            </div>
          )}

          {/* Inline New Destination Form */}
          {state.showNewDestForm && (
            <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/70 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-blue-900 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  تنظیم آدرس مقصد جدید
                </h4>
                <button
                  type="button"
                  onClick={() => update({ showNewDestForm: false })}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Destination Type Select (Default: GOOGLE_REVIEW) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">نوع مقصد:</label>
                <select
                  value={state.newDestType}
                  onChange={e => update({ newDestType: e.target.value })}
                  className="w-full bg-white text-slate-900 text-xs font-bold rounded-xl border border-blue-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="GOOGLE_REVIEW">⭐ ثبت نظر گوگل (Google Review) — پیش‌فرض و پیشنهادی</option>
                  <option value="GOOGLE_MAPS">📍 گوگل مپس (Google Maps)</option>
                  <option value="INSTAGRAM">📸 صفحه اینستاگرام (Instagram)</option>
                  <option value="WEBSITE">🌐 وب‌سایت اختصاصی (Website)</option>
                  <option value="WHATSAPP">💬 واتساپ پشتیبانی (WhatsApp)</option>
                  <option value="CUSTOM_URL">🔗 لینک سفارشی (Custom Link)</option>
                </select>
              </div>

              {/* URL Input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  آدرس اینترنتی نهایی مقصد (URL) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  value={state.newDestUrl}
                  onChange={e => update({ newDestUrl: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleCreateDestination()}
                  placeholder={DEST_TYPE_META[state.newDestType]?.placeholder || 'https://...'}
                  dir="ltr"
                  autoFocus
                  className="w-full bg-white text-slate-900 text-xs font-mono rounded-xl border border-blue-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-xs"
                />
                <p className="text-[10px] text-slate-500">
                  {DEST_TYPE_META[state.newDestType]?.desc}
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateDestination}
                  isLoading={isCreatingDest}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  ثبت مقصد و ادامه
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => update({ showNewDestForm: false })}
                >
                  انصراف
                </Button>
              </div>
            </div>
          )}

          {state.selectedDestination && !state.showNewDestForm && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2 min-w-0">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold shrink-0">مقصد انتخاب‌شده:</span>
                <span className="shrink-0">{DEST_TYPE_META[state.selectedDestination.type]?.emoji}</span>
                <span className="font-mono text-slate-800 truncate">{state.selectedDestination.source_url || state.selectedDestination.url}</span>
              </div>
              <button
                type="button"
                onClick={() => update({ selectedDestination: null })}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline shrink-0 ms-2"
              >
                تغییر
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP 4: REVIEW & CONFIRM (FAST SALE VS NORMAL ORDER)
          ═══════════════════════════════════════════════════════════════ */}
      {state.step === 4 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-1">
              <Check className="w-4 h-4 text-blue-600" />
              مرحله ۴ — بررسی مشخصات و ثبت نهایی
            </h3>
            <p className="text-xs text-slate-500">مشخصات سفارش را بازبینی کرده و شیوه صدور کارت‌ها را انتخاب نمایید.</p>
          </div>

          {/* Order Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            {/* Product Type & Quantity */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  {state.productType === 'NFC_QR' ? <QrCode className="w-5 h-5" /> : <Radio className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-medium">نوع محصول فیزیکی</p>
                  <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    {state.productType === 'NFC_QR' ? (
                      <>
                        <span className="text-blue-700">📡 NFC</span>
                        <span className="text-slate-400">+</span>
                        <span className="text-indigo-700">▣ QR اختصاصی</span>
                      </>
                    ) : (
                      <span className="text-blue-700">📡 فقط NFC (NFC Only)</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="text-end">
                <p className="text-[10px] text-slate-500 font-medium">تعداد کارت</p>
                <p className="text-xs font-black text-blue-700 font-mono">{state.quantity} عدد</p>
              </div>
            </div>

            {/* Business */}
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 font-medium">کسب‌وکار مشتری</p>
                <p className="text-xs font-black text-slate-900 truncate">{state.selectedBusiness?.name}</p>
              </div>
            </div>

            {/* Final Destination */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-lg">
                {DEST_TYPE_META[state.selectedDestination?.type || '']?.emoji || '⭐'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 font-medium">مقصد نهایی (صفحه ثبت نظر)</p>
                <p className="text-xs font-bold text-slate-900">
                  {DEST_TYPE_META[state.selectedDestination?.type || '']?.label || 'Google Review'}
                </p>
                <p className="text-[10px] font-mono text-slate-500 truncate" dir="ltr">
                  {state.selectedDestination?.source_url || state.selectedDestination?.url}
                </p>
              </div>
            </div>
          </div>

          {/* Dual Action Buttons */}
          <div className="space-y-2.5 pt-1">
            {/* Option A: Fast Sale Mode */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="w-full flex items-center justify-between py-3.5 px-4 rounded-2xl bg-gradient-to-l from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-300 group-hover:scale-110 transition-transform shrink-0" />
                <div className="text-start">
                  <div className="text-sm font-black">🚀 ثبت سفارش و تولید کارت‌ها (فروش فوری حضوری)</div>
                  <div className="text-[11px] text-blue-100 font-normal">سفارش ثبت و کارت‌ها بلافاصله صادر شده و لینک‌های NFC و QR جهت رایت و چاپ آماده می‌شوند</div>
                </div>
              </div>
              {isSubmitting && generateCardsMutation.isPending && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              )}
            </button>

            {/* Option B: Normal Mode */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="w-full flex items-center justify-between py-3 px-4 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-all disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Save className="w-4 h-4 text-slate-600 group-hover:scale-110 transition-transform shrink-0" />
                <div className="text-start">
                  <div className="text-xs font-black text-slate-900">💾 فقط ثبت سفارش (تولید کارت در آینده)</div>
                  <div className="text-[10px] text-slate-500 font-normal">اطلاعات سفارش ذخیره می‌شود؛ کارت‌ها بعداً از داخل پنل تولید خواهند شد</div>
                </div>
              </div>
              {isSubmitting && createOrderMutation.isPending && !generateCardsMutation.isPending && (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin shrink-0" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Navigation Buttons ── */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={state.step === 1 ? handleClose : goBack}
          icon={<ChevronRight className="w-4 h-4" />}
        >
          {state.step === 1 ? 'انصراف' : 'مرحله قبل'}
        </Button>

        {state.step < 4 && (
          <Button
            variant="primary"
            size="sm"
            onClick={goNext}
            disabled={!canGoNext()}
            icon={<ArrowRight className="w-4 h-4 rotate-180" />}
          >
            مرحله بعد
          </Button>
        )}
      </div>
    </Modal>
  );
};
