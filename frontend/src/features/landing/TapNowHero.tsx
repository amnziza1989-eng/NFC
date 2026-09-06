import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowLeft,
  Star,
  Sparkles,
  Radio,
  Smartphone,
  ChevronDown,
} from 'lucide-react';

export const TapNowHero: React.FC = () => {
  const handleScrollToHowItWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.querySelector('#how-it-works');
    if (element) {
      const navHeight = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - navHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 start-10 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 end-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Business Value Messaging */}
          <div className="lg:col-span-7 space-y-7 text-center lg:text-start">
            
            {/* Top Value Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
              <span>سخت‌افزار هوشمند رشد فروش، اعتبار و ثبت نظر مشتریان</span>
            </div>

            {/* Main Headline - EXACT USER REQUIREMENT */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black text-slate-900 leading-[1.25] tracking-tight">
              یک لمس ساده،{' '}
              <span className="bg-gradient-to-l from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
                یک قدم بزرگ
              </span>
              <br />
              برای رشد کسب‌وکار شما
            </h1>

            {/* Supporting Copy - EXACT USER REQUIREMENT */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              مشتری را دقیقاً در لحظه مناسب به جایی هدایت کنید که برای کسب‌وکارتان ارزش ایجاد می‌کند؛ از دریافت نظر گوگل تا معرفی خدمات و ارتباط مستقیم.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                to="/shop"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-3 group"
              >
                <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>سفارش و خرید کارت‌ها</span>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </Link>

              <a
                href="#how-it-works"
                onClick={handleScrollToHowItWorks}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex items-center justify-center gap-2"
              >
                <span>مشاهده مراحل و نحوه کار</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            {/* Value Highlights Chips */}
            <div className="pt-6 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-start">
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 bg-white/90 p-3 rounded-2xl border border-slate-200/70 shadow-xs">
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 fill-amber-500" />
                </div>
                <span>ثبت سریع نظر ۵ ستاره گوگل</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 bg-white/90 p-3 rounded-2xl border border-slate-200/70 shadow-xs">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <span>تغییر مقصد بدون تعویض کارت</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 bg-white/90 p-3 rounded-2xl border border-slate-200/70 shadow-xs">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span>فوری و بدون نصب برنامه</span>
              </div>
            </div>

          </div>

          {/* Right Column: Premium Visual Composition */}
          <div className="lg:col-span-5 relative flex justify-center">
            
            {/* Ambient Lighting Glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/25 via-indigo-600/20 to-amber-500/20 rounded-3xl blur-2xl -z-10" />

            <div className="w-full max-w-lg rounded-3xl p-2 bg-gradient-to-b from-white via-slate-50 to-slate-100 shadow-2xl border border-slate-200/80 relative overflow-hidden group">
              
              {/* Image Container */}
              <div className="relative rounded-2xl overflow-hidden shadow-sm">
                <img
                  src="/images/tapnow-hero-interaction.webp"
                  alt="TapNow Smart Review Card Interaction"
                  className="w-full h-auto object-cover rounded-2xl group-hover:scale-[1.02] transition-transform duration-500"
                  loading="eager"
                />
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
