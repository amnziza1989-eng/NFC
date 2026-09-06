import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Link2,
  Package,
  CreditCard,
  CheckCircle2,
  Languages,
  Radio,
  ShoppingBag,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { clsx } from 'clsx';

export const Sidebar: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();

  const navItems = [
    { to: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { to: '/auth', label: language === 'fa' ? 'احراز هویت' : 'Authentication', icon: ShieldCheck },
    { to: '/businesses', label: t.nav.businesses, icon: Building2 },
    { to: '/destinations', label: t.nav.destinations, icon: Link2 },
    { to: '/orders', label: language === 'fa' ? 'صدور و سفارش کارت' : 'Card Orders', icon: Package },
    { to: '/shop-orders', label: language === 'fa' ? 'سفارش‌های مشتریان' : 'Customer Orders', icon: ShoppingBag },
    { to: '/shipping-rules', label: language === 'fa' ? 'تعرفه ارسال و پیک' : 'Shipping Rates', icon: Sliders },
    { to: '/cards', label: t.nav.cards, icon: CreditCard },
    { to: '/qc', label: t.nav.qc, icon: CheckCircle2 },
  ];

  return (
    <aside className="w-64 bg-white border-e border-slate-200 flex flex-col h-screen shrink-0 select-none shadow-xs">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-sm shadow-blue-500/20">
          <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
            <Radio className="w-5 h-5 text-blue-600 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-lg tracking-tight text-slate-900">{t.appName}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              MVP
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{t.appTagline}</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          منوی ناوبری
        </div>

        {/* Public Storefront Link */}
        <NavLink
          to="/shop"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-700 transition-all shadow-xs mb-3 group"
        >
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>{language === 'fa' ? 'فروشگاه آنلاین (تست مشتری)' : 'Public Shop (Customer Test)'}</span>
          </div>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
            NEW
          </span>
        </NavLink>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Landing Page Link */}
        <NavLink
          to="/"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all border border-dashed border-slate-200 mt-2"
        >
          <Radio className="w-4 h-4 text-slate-400" />
          <span>{language === 'fa' ? 'مشاهده لندینگ پیج اصلی' : 'View Public Landing'}</span>
        </NavLink>
      </nav>

      {/* Footer / Utilities */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        {/* Language switch */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-slate-500" />
            <span>زبان / Language</span>
          </div>
          <button
            onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}
            className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-mono text-[11px] font-bold transition-colors cursor-pointer"
          >
            {language === 'fa' ? 'FA | EN' : 'EN | FA'}
          </button>
        </div>

        {/* Server status pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>پورت ۸۳۰۰ — متصل به هسته</span>
        </div>
      </div>
    </aside>
  );
};
