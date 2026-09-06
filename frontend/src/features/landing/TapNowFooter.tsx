import React from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  ShoppingBag,
  ArrowLeft,
  Sparkles,
  Zap,
} from 'lucide-react';

export const TapNowFooter: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-white relative overflow-hidden">
      
      {/* ── Final Conversion CTA Banner ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-12 border border-blue-500/30 shadow-2xl relative overflow-hidden text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>آماده شروع رشد تعامل مشتریان هستید؟</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight max-w-2xl mx-auto leading-tight">
            تعامل حضوری مشتری را به یک فرصت برای رشد تبدیل کنید
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed font-normal">
            همین امروز با تهیه کارت‌های هوشمند TapNow، دریافت نظر ۵ ستاره در گوگل و اتصال مشتریان به مقصدهای ارزشمند را آسان‌تر کنید.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/shop"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-black bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl transition-all flex items-center justify-center gap-2.5 group"
            >
              <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>🛒 مشاهده و خرید کارت‌ها</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/activate"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl text-xs font-bold text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>فعال‌سازی کارت خریداری‌شده</span>
            </Link>
          </div>

        </div>
      </div>

      {/* ── Main Footer Bottom Bar ─────────────────────────────────────── */}
      <div className="border-t border-slate-850 bg-slate-950/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-850">
            
            {/* Brand Info */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 p-0.5 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-xl text-white tracking-tight">TapNow | تپ‌ناو</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md font-normal">
                پلتفرم هوشمند کارت‌های فیزیکی NFC و QR برای تسهیل ثبت نظر گوگل و هدایت داینامیک مشتریان حضوری به مقاصد دیجیتال کسب‌وکار.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                دسترسی سریع
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="#how-it-works" className="hover:text-blue-400 transition-colors">نحوه کارکرد</a>
                </li>
                <li>
                  <a href="#key-advantage" className="hover:text-blue-400 transition-colors">مزیت کلیدی</a>
                </li>
                <li>
                  <a href="#products" className="hover:text-blue-400 transition-colors">محصولات هوشمند</a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-blue-400 transition-colors">سوالات متداول</a>
                </li>
              </ul>
            </div>

            {/* Platform Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                بخش‌های سامانه
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link to="/shop" className="hover:text-blue-400 transition-colors">فروشگاه آنلاین کارت‌ها</Link>
                </li>
                <li>
                  <Link to="/shop/track" className="hover:text-blue-400 transition-colors">پیگیری سفارش</Link>
                </li>
                <li>
                  <Link to="/activate" className="hover:text-blue-400 transition-colors">فعال‌سازی و مدیریت کارت</Link>
                </li>
                <li>
                  <Link to="/shop/my-orders" className="hover:text-blue-400 transition-colors">حساب کاربری مشتری</Link>
                </li>
              </ul>
            </div>

          </div>

          {/* Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-normal">
            <p>© {new Date().getFullYear()} TapNow. تمامی حقوق برای پلتفرم تپ‌ناو محفوظ است.</p>
            <p className="flex items-center gap-1">
              <span>طراحی شده برای رشد کسب‌وکارهای حضوری</span>
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            </p>
          </div>
        </div>
      </div>

    </footer>
  );
};
