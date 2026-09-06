import React from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const TapNowKeyAdvantage: React.FC = () => {
  return (
    <section id="key-advantage" className="py-24 bg-white relative overflow-hidden">
      
      {/* Background Accent */}
      <div className="absolute top-1/2 end-0 translate-y-[-50%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span>مزیت کلیدی و ماندگار</span>
          </div>
          {/* EXACT USER REQUIREMENT HEADLINE */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            کارت شما ثابت است،{' '}
            <span className="bg-gradient-to-l from-emerald-600 via-teal-600 to-blue-700 bg-clip-text text-transparent">
              اما مقصد آن هر زمان قابل تغییر است
            </span>
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            دارایی فیزیکی هوشمندی که با تغییر لینک‌ها، انتقال شعب، معرفی خدمات جدید یا برگزاری کمپین‌ها، ارزش خود را تا همیشه حفظ می‌کند.
          </p>
        </div>

        {/* Dynamic Comparison Card */}
        <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-800 space-y-8 relative overflow-hidden">
          
          {/* Top Headline Inside Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                هدایت داینامیک هوشمند (Smart Cloud Routing)
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                هنگام تغییر لینک، آدرس کسب‌وکار یا کمپین فروش:
              </h3>
            </div>
            <span className="self-start sm:self-auto text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              💎 سرمایه‌گذاری یک‌باره و ماندگار
            </span>
          </div>

          {/* 2 Column Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Traditional Card Limitation */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-rose-500/30 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-400">
                <XCircle className="w-5 h-5 shrink-0" />
                <span>کارت‌ها و استندهای سنتی بارکد ثابت</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">❌</span>
                  <span>کارت‌های قبلی با تغییر لینک منقضی و غیرقابل استفاده شده و باید دور ریخته شوند.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">❌</span>
                  <span>نیاز به صرف هزینه مالی و زمان مجدد برای طراحی، چاپ و توزیع کارت‌های جدید.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">❌</span>
                  <span>قطع شدن ارتباط مشتریان با صفحه معتبر در مدت زمان تعویض و چاپ.</span>
                </li>
              </ul>
            </div>

            {/* TapNow Smart Advantage */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/40 space-y-4 shadow-inner">
              <div className="flex items-center gap-2 text-sm font-black text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>کارت هوشمند TapNow</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-200 leading-relaxed font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span>تنها با چند کلیک در بخش فعال‌سازی یا پنل، لینک جدید را در چند ثانیه جایگزین می‌کنید.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span>کارت فیزیکی روی میز پذیرش یا صندوق بدون نیاز به هیچ تغییری فعال باقی می‌ماند.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✅</span>
                  <span>امکان تغییر هدف به نظر گوگل، وب‌سایت، اینستاگرام، منوی آنلاین یا واتساپ.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Summary Bar */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-center sm:text-start">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>امروز برای دریافت نظر ۵ ستاره گوگل؛ فردا برای هر هدفی که کسب‌وکار شما نیاز داشته باشد.</span>
            </div>
            <Link
              to="/shop"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>سفارش کارت هوشمند</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};
