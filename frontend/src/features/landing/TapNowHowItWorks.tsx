import React from 'react';
import {
  QrCode,
  Radio,
  Sliders,
  Smartphone,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TapNowHowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background decor */}
      <div className="absolute top-1/2 start-0 w-72 h-72 bg-blue-100/50 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 end-0 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>ساده، شفاف و منعطف</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            فرآیند کار با تپ‌ناو چگونه است؟
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            از انتخاب کارت تا آغاز تعامل هوشمند با مشتریان، تنها در چند گام ساده و با آزادی کامل در تنظیم مقصد.
          </p>
        </div>

        {/* 4 Steps Showcase */}
        <div className="space-y-8">
          
          {/* Step 1 & Step 2 Showcase Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Step 1: Select Card Type (4 Cols) */}
            <div className="lg:col-span-5 p-7 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm shadow-blue-500/30 font-mono">
                    ۱
                  </span>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                    گام اول: انتخاب محصول
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900">
                  کارت موردنظر خود را انتخاب کنید
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  بر اساس نیاز کسب‌وکار خود، کارت متناسب را سفارش دهید:
                </p>

                {/* Sub Options in Step 1 */}
                <div className="space-y-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">مدل اختصاصی NFC (لمسی)</h4>
                      <p className="text-[10px] text-slate-500">حداکثر زیبایی و طراحی لوکس مینیمال</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">مدل ترکیبی NFC + بارکد QR</h4>
                      <p className="text-[10px] text-slate-500">پوشش ۱۰۰٪ تمام گوشی‌ها (لمسی + اسکن دوربین)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>متریال ضدخش با کیفیت صنعتی و چاپ ماندگار</span>
              </div>
            </div>

            {/* Step 2: Choose Preparation Pathway (7 Cols) - 2 DISTINCT PATHWAYS */}
            <div className="lg:col-span-7 p-7 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-sm shadow-indigo-500/30 font-mono">
                    ۲
                  </span>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                    گام دوم: شیوه آماده‌سازی کارت
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900">
                  مشخص کنید کارت چگونه آماده شود
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  تپ‌ناو این آزادی عمل را به شما می‌دهد که نحوه آماده‌سازی کارت را خودتان تعیین کنید:
                </p>

                {/* 2 DISTINCT PATHWAYS BOXES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  
                  {/* Pathway A: Ready to Use */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-50/70 to-blue-50/30 border-2 border-blue-200 space-y-2.5 relative">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-blue-600 text-white w-fit block">
                      مسیر اول (سریع‌ترین)
                    </span>
                    <h4 className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-blue-600" />
                      کارت آماده استفاده
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      لینک صفحه گوگل مپ یا وبسایت خود را در زمان خرید وارد می‌کنید؛ کارت‌ها در کارخانه تپ‌ناو برنامه‌ریزی، تست کیفیت و کاملاً آماده استفاده تحویل می‌شوند.
                    </p>
                    <div className="pt-2 text-[10px] font-bold text-blue-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      آماده به محض باز کردن جعبه
                    </div>
                  </div>

                  {/* Pathway B: Raw Card Configured Later */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-50/70 to-purple-50/30 border-2 border-purple-200 space-y-2.5 relative">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-purple-600 text-white w-fit block">
                      مسیر دوم (انعطاف‌پذیر)
                    </span>
                    <h4 className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      کارت خام؛ تنظیم در زمان دلخواه
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      اگر هنوز لینک نهایی کسب‌وکار را آماده ندارید یا برای شعب مختلف کارت تهیه می‌کنید، کارت خام دریافت کنید و هر زمان خواستید از بخش «فعال‌سازی کارت» آن را لینک دهید.
                    </p>
                    <div className="pt-2 text-[10px] font-bold text-purple-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                      تنظیم خودخدمت در هر زمان
                    </div>
                  </div>

                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>هر دو مسیر تحت پوشش گارانتی سلامت عملکرد سخت‌افزاری هستند.</span>
                <Link to="/shop" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                  ثبت سفارش <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

          {/* Step 3 & Step 4 Showcase Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Step 3: Fast Delivery & Instant Tap */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-black flex items-center justify-center text-sm shadow-sm shadow-amber-500/30 font-mono">
                  ۳
                </span>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  گام سوم: تحویل و شروع کار
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-500" />
                کارت را تحویل بگیرید و تعامل را آغاز کنید
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                کارت را روی میز پذیرش، کنار صندوق یا در سالن قرار دهید. مشتری در لحظه خشنودی، گوشی خود را به کارت نزدیک می‌کند و فوراً صفحه ثبت نظر ۵ ستاره یا خدمات شما برای او باز می‌شود.
              </p>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>بدون نیاز به نصب اپلیکیشن، سازگار با آیفون و اندروید</span>
              </div>
            </div>

            {/* Step 4: Change Destination Anytime */}
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-sm shadow-emerald-500/30 font-mono">
                  ۴
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  گام چهارم: انعطاف‌پذیری دائمی
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                مقصد کارت را هر زمان بدون هزینه تغییر دهید
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                آدرس شعبه تغییر کرد؟ کمپین جدیدی دارید یا می‌خواهید مشتری را به صفحه اینستاگرام یا منوی دیجیتال هدایت کنید؟ لینک مقصد را در پنل یا بخش فعال‌سازی تغییر دهید؛ کارت فیزیکی همان می‌ماند.
              </p>
              <div className="pt-3 border-t border-slate-100 text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>بدون نیاز به تعویض فیزیکی کارت یا هزینه چاپ مجدد</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
