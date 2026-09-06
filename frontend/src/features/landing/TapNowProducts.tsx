import React from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  QrCode,
  ShoppingBag,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

export const TapNowProducts: React.FC = () => {
  return (
    <section id="products" className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs">
            <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
            <span>محصولات فیزیکی TapNow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            انتخاب کارت مناسب برای کسب‌وکار شما
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            هر دو مدل از بالاترین کیفیت ساخت صنعتی، ماندگاری بالا و سیستم هدایت ابری هوشمند بهره می‌برند.
          </p>
        </div>

        {/* 2 Product Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
          
          {/* Product 1: NFC Only Card */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all flex flex-col justify-between space-y-8 group">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                  مدل لمسی لوکس
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">NFC ONLY</span>
              </div>

              {/* Product Visual Mockup */}
              <div className="h-44 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-blue-950 p-6 text-white flex flex-col justify-between shadow-md border border-slate-700/50 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm tracking-tight text-white">TapNow NFC</span>
                  <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-400">چیپ هوشمند پرسرعت با امنیت بالا</p>
                  <p className="text-xs font-bold text-blue-200">فقط با لمس تلفن همراه مشتری</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">کارت هوشمند NFC</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  طراحی مینیمال و شیک، مناسب برای محیط‌های لوکس مانند کافه‌های مدرن، کلینیک‌ها و دفاتر خدماتی که به ظاهر یکدست و خاص اهمیت می‌دهند.
                </p>
              </div>

              {/* Feature Bullet Points */}
              <ul className="space-y-3 pt-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>چیپست صنعتی با ماندگاری طولانی و ضدآب</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>پاسخگویی سریع به لمس تمام گوشی‌های اندروید و آیفون</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>امکان تغییر لینک مقصد در هر زمان بدون تعویض کارت</span>
                </li>
              </ul>
            </div>

            <Link
              to="/shop"
              className="w-full py-4 rounded-2xl text-center text-sm font-bold bg-white hover:bg-blue-50 text-blue-700 border-2 border-blue-600 shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>مشاهده و خرید کارت NFC</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Product 2: NFC + QR Dual Card */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-blue-50/50 to-white border-2 border-blue-600/60 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:border-blue-600 transition-all flex flex-col justify-between space-y-8 relative overflow-hidden group">
            
            {/* Best Choice Ribbon */}
            <div className="absolute top-4 end-4">
              <span className="text-[11px] font-black px-3 py-1 rounded-full bg-blue-600 text-white shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                پرفروش‌ترین و کامل‌ترین
              </span>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                  مدل دوگانه (Dual Action)
                </span>
              </div>

              {/* Product Visual Mockup */}
              <div className="h-44 rounded-2xl bg-gradient-to-tr from-slate-950 via-indigo-950 to-blue-900 p-6 text-white flex flex-col justify-between shadow-md border border-indigo-700/50 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm tracking-tight text-white">TapNow NFC + QR</span>
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
                    <QrCode className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-indigo-300 font-mono">100% پوشش تمام گوشی‌ها</p>
                  <p className="text-xs font-bold text-white">هم تماس لمسی NFC، هم اسکن بارکد QR</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">کارت هوشمند NFC + QR</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  پوشش کامل ۱۰۰ درصدی تمام مشتریان؛ کاربر هم می‌تواند با لمس NFC اقدام کند و هم با اسکن بارکد چاپ‌شده با دوربین گوشی وارد شود.
                </p>
              </div>

              {/* Feature Bullet Points */}
              <ul className="space-y-3 pt-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ترکیب چیپست NFC و بارکد داینامیک ضدخش</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تفکیک و مشاهده آمار اسکن QR و لمس NFC در پنل</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>مناسب برای روی میز، استند پیشخوان و دیوار</span>
                </li>
              </ul>
            </div>

            <Link
              to="/shop"
              className="w-full py-4 rounded-2xl text-center text-sm font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>مشاهده و خرید کارت NFC + QR</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};
