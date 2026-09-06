import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/apiClient';
import { CardActivationVerifyResponse } from '../../types/api';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

export const CardActivationView: React.FC = () => {
  const { code: urlCode } = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const urlOrderNum = searchParams.get('num') || '';

  // Form Step
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 Fields
  const [cardCode, setCardCode] = useState(urlCode || '');
  const [orderNumber, setOrderNumber] = useState(urlOrderNum);
  const [verificationContact, setVerificationContact] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Verification Result
  const [activationData, setActivationData] = useState<CardActivationVerifyResponse | null>(null);

  // Step 2 Fields
  const [destinationUrl, setDestinationUrl] = useState('');
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  // Step 3 Success
  const [successUrl, setSuccessUrl] = useState('');
  const [isPerfectLink, setIsPerfectLink] = useState(false);

  useEffect(() => {
    if (urlCode) {
      setCardCode(urlCode);
    }
  }, [urlCode]);

  // Step 1: Verify Ownership
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardCode.trim() || !orderNumber.trim() || !verificationContact.trim()) {
      setVerifyError('لطفاً تمامی فیلدهای الزامی را تکمیل فرمایید.');
      return;
    }

    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await api.verifyCardActivation(
        cardCode.trim(),
        orderNumber.trim(),
        verificationContact.trim()
      );
      setActivationData(res);
      setStep(2);
    } catch (err: any) {
      setVerifyError(err.message || 'اطلاعات وارد شده نامعتبر است.');
    } finally {
      setVerifying(false);
    }
  };

  // Step 2: Configure Destination
  const handleConfigure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationData) return;

    if (!destinationUrl.trim()) {
      setActivateError('لطفاً آدرس اینترنتی مقصد را وارد نمایید.');
      return;
    }

    // URL validation
    try {
      const u = new URL(destinationUrl.trim());
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        setActivateError('پروتکل آدرس باید http یا https باشد.');
        return;
      }
    } catch {
      setActivateError('آدرس اینترنتی نامعتبر است. نمونه: https://example.com');
      return;
    }

    setActivating(true);
    setActivateError(null);
    try {
      const res = await api.configureCardActivation(
        activationData.activation_token,
        'GOOGLE_REVIEW',
        destinationUrl.trim()
      );
      setSuccessUrl(res.destination_url);
      setIsPerfectLink(res.is_perfect_link || false);
      setStep(3);
    } catch (err: any) {
      setActivateError(err.message || 'خطا در فعال‌سازی کارت.');
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          سامانه فعال‌سازی و اتصال مقصد هوشمند
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">فعال‌سازی کارت هوشمند تپ‌ناو</h1>
        <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
          کارت فیزیکی دریافت شده را به صفحه ثبت نظرات گوگل مپ، پیج اینستاگرام یا وب‌سایت خود متصل کنید.
        </p>
      </div>

      {/* Progress Indicators */}
      <div className="flex items-center justify-center gap-3">
        <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-blue-700' : 'text-slate-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs ${step >= 1 ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-slate-300 bg-white text-slate-400'}`}>
            ۱
          </div>
          <span>احراز مالکیت</span>
        </div>
        <div className="w-8 h-0.5 bg-slate-200" />
        <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-blue-700' : 'text-slate-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs ${step >= 2 ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-slate-300 bg-white text-slate-400'}`}>
            ۲
          </div>
          <span>تنظیم مقصد</span>
        </div>
        <div className="w-8 h-0.5 bg-slate-200" />
        <div className={`flex items-center gap-2 text-xs font-bold ${step >= 3 ? 'text-emerald-700' : 'text-slate-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs ${step >= 3 ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold' : 'border-slate-300 bg-white text-slate-400'}`}>
            ۳
          </div>
          <span>تکمیل و تست</span>
        </div>
      </div>

      {/* STEP 1: VERIFY OWNERSHIP */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              مرحله ۱: احراز مشخصات سفارش و کارت
            </h2>
            <p className="text-xs text-slate-500">
              جهت امنیت کارت و جلوگیری از دسترسی غیرمجاز، کد پشت کارت و مشخصات خریدار را تأیید فرمایید.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                کد ۸ رقمی کارت <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: xasuhg4t"
                value={cardCode}
                onChange={(e) => setCardCode(e.target.value)}
                dir="ltr"
                maxLength={20}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
                required
              />
              <span className="text-[11px] text-slate-500 mt-1 block leading-relaxed">
                کافیست گوشی خود را به کارت نزدیک کنید؛ این فیلد به طور خودکار پُر می‌شود. (در صورت وجود بارکد QR، کد در زیر آن چاپ شده است.)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                شماره سفارش خرید <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: SHOP-20260828-XXXX یا ORD-..."
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                dir="ltr"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                شماره تماس یا ایمیل خریدار <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="شماره موبایل یا ایمیلی که هنگام ثبت سفارش وارد کردید"
                value={verificationContact}
                onChange={(e) => setVerificationContact(e.target.value)}
                dir="ltr"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
                required
              />
            </div>

            {verifyError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{verifyError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {verifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>در حال اعتبارسنجی مالکیت...</span>
                </>
              ) : (
                <>
                  <span>تأیید و ادامه به تنظیم مقصد</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: CONFIGURE DESTINATION */}
      {step === 2 && activationData && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
            <div className="text-xs text-blue-800 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              کارت شناسایی شد: {activationData.business_name} ({activationData.product_title})
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              کد کارت: {activationData.card_code} • مهلت نشست فعال‌سازی: ۱۵ دقیقه
            </div>
          </div>

          <form onSubmit={handleConfigure} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                آدرس اینترنتی مقصد (Target URL) <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                placeholder="https://g.page/r/..."
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                dir="ltr"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
                required
              />
              <span className="text-[11px] text-slate-500">
                لینک گوگل مپ خود را قرار دهید. در صورتی که لینک مستقیم 5-ستاره قرار دهید کارت فوراً فعال می‌شود. در غیر این صورت، تیم ما در کمتر از ۲۴ ساعت آن را به لینک 5-ستاره بهینه‌سازی خواهد کرد.
              </span>
            </div>

            {activateError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{activateError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={activating}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {activating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>در حال بررسی و تنظیم کارت...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>بررسی و ثبت لینک</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* STEP 3: CELEBRATION & SUCCESS */}
      {step === 3 && (
        <div className="bg-white border border-emerald-200 rounded-3xl p-8 sm:p-10 shadow-sm text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">
              {!isPerfectLink 
                ? 'لینک شما با موفقیت ثبت شد!' 
                : 'کارت هوشمند شما با موفقیت فعال شد!'}
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {!isPerfectLink 
                ? 'لینک گوگل مپ شما دریافت گردید. تیم پشتیبانی ما در کمتر از ۲۴ ساعت آینده آن را به لینک مستقیم ۵ ستاره تبدیل کرده و کارت شما را به طور کامل فعال خواهد کرد. از شکیبایی شما سپاسگزاریم.' 
                : 'تنظیمات با موفقیت ذخیره گردید. از این لحظه، هرگونه تماس گوشی با کارت یا اسکن بارکد QR، کاربر را به آدرس زیر هدایت می‌نماید:'}
            </p>
          </div>

          { isPerfectLink && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-emerald-800 break-all text-center font-bold">
              {successUrl}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href={`/n/${activationData?.card_code}`}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-blue-500/25 flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              <span>تست شبیه‌سازی لمس NFC</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-200" />
            </a>

            <Link
              to="/shop"
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              بازگشت به فروشگاه
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
