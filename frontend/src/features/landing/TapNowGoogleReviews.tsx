import React from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

export const TapNowGoogleReviews: React.FC = () => {
  return (
    <section id="google-reviews" className="py-20 bg-gradient-to-b from-white via-blue-50/30 to-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-xs">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>راهکار ویژه بازخورد و امتیاز گوگل</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            گرفتن نظر از مشتری نباید سخت باشد
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            مشتریان راضی دوست دارند به شما ۵ ستاره بدهند؛ اما مراحل طولانی و سردرگمی در جستجو مانع آن‌ها می‌شود. با TapNow تمام موانع را از سر راه بردارید.
          </p>
        </div>

        {/* Comparison: The Old Way vs The TapNow Way */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mb-16">
          
          {/* Old Traditional Friction Flow */}
          <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  روش سنتی و پر از اصطکاک
                </span>
                <span className="text-xs text-slate-400 font-mono">۴ تا ۵ مرحله</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                درخواست شفاهی یا کاغذ یادداشت
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                مشتری از شما راضی است، اما وقتی می‌گویید «لطفاً در گوگل به ما امتیاز دهید»:
              </p>

              {/* Steps List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600">
                  <span className="w-6 h-6 rounded-full bg-slate-100 font-bold flex items-center justify-center text-slate-500 shrink-0 text-[11px]">۱</span>
                  <span>باید گوگل مپ یا مرورگر خود را باز کند.</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600">
                  <span className="w-6 h-6 rounded-full bg-slate-100 font-bold flex items-center justify-center text-slate-500 shrink-0 text-[11px]">۲</span>
                  <span>نام دقیق کسب‌وکار شما را جستجو و در نتایج پیدا کند.</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600">
                  <span className="w-6 h-6 rounded-full bg-slate-100 font-bold flex items-center justify-center text-slate-500 shrink-0 text-[11px]">۳</span>
                  <span>بین گزینه‌ها، تب «نظرات» و دکمه «ثبت نظر» را بیابد.</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/60 text-xs text-rose-800 font-medium">
              ⚠️ نتیجه: بیشتر از ۸۰٪ مشتریان در میان مراحل منصرف می‌شوند یا بعداً فراموش می‌کنند.
            </div>
          </div>

          {/* New TapNow Flow */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-blue-50/80 to-white border-2 border-blue-500/40 shadow-xl shadow-blue-500/5 space-y-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 end-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  روش هوشمند TapNow
                </span>
                <span className="text-xs text-blue-700 font-bold font-mono">فقط ۱ ثانیه</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                یک لمس ساده یا اسکن روی میز
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                کارت را روی میز یا پیشخوان قرار دهید؛ مشتری بدون هیچ اصطکاکی ثبت نظر می‌کند:
              </p>

              {/* Single Step Banner */}
              <div className="p-5 rounded-2xl bg-white border border-blue-200 shadow-md space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">تماس گوشی با کارت (NFC) یا اسکن QR</h4>
                    <p className="text-[11px] text-slate-500">مستقیماً فرم امتیاز و نوشتن نظر گوگل باز می‌شود</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1 py-2 bg-amber-50 rounded-xl border border-amber-100">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-5 h-5 text-amber-500 fill-amber-500" />
                  ))}
                  <span className="text-xs font-bold text-amber-900 me-2 font-mono">5.0</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>نتیجه: تبدیل مشتریان راضی حاضر در محل به نظرات معتبر و ماندگار در گوگل مپ.</span>
            </div>
          </div>

        </div>

        {/* Section Bottom CTA */}
        <div className="text-center pt-4">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all group"
          >
            <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>شروع دریافت نظرات با تهیه کارت هوشمند</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
};
