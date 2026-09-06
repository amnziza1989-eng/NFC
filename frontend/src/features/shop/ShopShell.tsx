import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { ShoppingBag, Radio, Languages, Sparkles, User } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from './context/CartContext';
import { useAuth } from './context/AuthContext';
import { AuthModal } from '../../components/AuthModal';

export const ShopShell: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { totalItems } = useCart();
  const { isAuthenticated, login } = useAuth();
  const isFa = language === 'fa';
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          const token = localStorage.getItem('tapnow_customer_token');
          const customerId = localStorage.getItem('tapnow_customer_id');
          if (token && customerId) {
            login(token, customerId);
          }
        }}
      />
      {/* Top Banner Notice */}
      <div className="bg-blue-600 text-white text-[12px] font-medium py-2 px-4 text-center shadow-xs">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          {isFa
            ? 'فروشگاه رسمی تپ‌ناو — سخت‌افزار هوشمند NFC و QR ویژه دریافت نظر گوگل و تعامل با مشتری'
            : 'TapNow Official Shop — Smart NFC & QR Review Cards for Businesses'}
        </span>
      </div>

      {/* Public Storefront Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Brand Logo - Navigates to Landing Page ('/') */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none"
            title={isFa ? 'بازگشت به صفحه اصلی تپ‌ناو' : 'TapNow — Home'}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Radio className="w-5 h-5 text-blue-600 group-hover:animate-pulse" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  TapNow
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {isFa ? 'تپ‌ناو' : 'Store'}
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-500 hidden sm:inline">
                {isFa ? 'کارت هوشمند تعامل و رشد کسب‌وکار' : 'Smart NFC & QR Review Hardware'}
              </span>
            </div>
          </Link>

          {/* Navigation Links & Customer Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <NavLink
              to="/"
              className="text-xs font-bold px-3 py-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors hidden md:inline-block"
            >
              {isFa ? 'معرفی محصول' : 'Home'}
            </NavLink>

            <NavLink
              to="/shop"
              end
              className={({ isActive }) =>
                `text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
                  isActive ? 'text-blue-700 bg-blue-50 font-black' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`
              }
            >
              {isFa ? 'کاتالوگ محصولات' : 'Products'}
            </NavLink>

            <NavLink
              to="/shop/track"
              className={({ isActive }) =>
                `text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
                  isActive ? 'text-blue-700 bg-blue-50 font-black' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`
              }
            >
              {isFa ? 'پیگیری سفارش' : 'Track Order'}
            </NavLink>

            <NavLink
              to="/activate"
              className={({ isActive }) =>
                `text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
                  isActive ? 'text-blue-700 bg-blue-50 font-black' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`
              }
            >
              {isFa ? 'فعال‌سازی کارت' : 'Activate'}
            </NavLink>

            {/* Cart Icon Link */}
            <NavLink
              to="/shop/cart"
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm shadow-blue-500/25'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs'
                }`
              }
            >
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">{isFa ? 'سبد خرید' : 'Cart'}</span>
              {totalItems > 0 && (
                <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </NavLink>

            {/* User Auth state */}
            {!isAuthenticated ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isFa ? 'ورود / حساب کاربری' : 'Login'}</span>
              </button>
            ) : (
              <NavLink
                to="/shop/my-orders"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`
                }
              >
                <User className="w-3.5 h-3.5" />
                <span>{isFa ? 'حساب کاربری' : 'Account'}</span>
              </NavLink>
            )}

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="تغییر زبان / Switch Language"
            >
              <Languages className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Store Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Store Footer */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Radio className="w-4 h-4" />
            </Link>
            <span>
              {isFa
                ? '© ۲۰۲۶ پلتفرم تپ‌ناو (TapNow). تمامی حقوق محفوظ است.'
                : '© 2026 TapNow Platform. All rights reserved.'}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              {isFa ? 'صفحه اصلی' : 'Home'}
            </Link>
            <Link to="/shop" className="hover:text-blue-600 transition-colors">
              {isFa ? 'کاتالوگ' : 'Products'}
            </Link>
            <Link to="/shop/track" className="hover:text-blue-600 transition-colors">
              {isFa ? 'پیگیری سفارش' : 'Track Order'}
            </Link>
            <Link to="/activate" className="hover:text-blue-600 transition-colors">
              {isFa ? 'فعال‌سازی کارت' : 'Card Activation'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
