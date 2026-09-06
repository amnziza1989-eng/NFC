import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  ShoppingBag,
  Menu,
  X,
  User,
  Search,
  KeyRound,
} from 'lucide-react';
import { AuthModal } from '../../components/AuthModal';
import { useAuth } from '../shop/context/AuthContext';

export const TapNowNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'چرا تپ‌ناو؟', href: '#why-tapnow' },
    { label: 'نحوه کارکرد', href: '#how-it-works' },
    { label: 'انعطاف مقصد', href: '#key-advantage' },
    { label: 'محصولات', href: '#products' },
    { label: 'ثبت نظر گوگل', href: '#google-reviews' },
    { label: 'سوالات متداول', href: '#faq' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
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
    <>
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

      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-3'
            : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Brand Logo & Shop Button */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="flex items-center gap-3 group focus:outline-none"
                title="TapNow — صفحه اصلی"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-0.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                    <Radio className="w-5 h-5 text-blue-600 group-hover:animate-pulse" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xl tracking-tight text-slate-900">TapNow</span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      تپ‌ناو
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 hidden sm:inline">
                    کارت هوشمند تعامل و رشد کسب‌وکار
                  </span>
                </div>
              </Link>

              {/* Shop Button Placed to the Left of Logo */}
              <Link
                to="/shop"
                className="hidden sm:flex px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all items-center gap-2 group"
                title="مشاهده محصولات و فروشگاه تپ‌ناو"
              >
                <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>فروشگاه و محصولات</span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60 shadow-xs">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-blue-700 hover:bg-white rounded-xl transition-all select-none"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Customer Navigation & Action Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/shop/track"
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>پیگیری سفارش</span>
              </Link>

              <Link
                to="/activate"
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>فعال‌سازی کارت</span>
              </Link>

              {/* Customer Account */}
              {!isAuthenticated ? (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-3 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>ورود / حساب کاربری</span>
                </button>
              ) : (
                <Link
                  to="/shop/my-orders"
                  className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>حساب کاربری</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex items-center gap-2 lg:hidden">
              <Link
                to="/shop"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white flex items-center gap-1.5 shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>فروشگاه</span>
              </Link>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                aria-label="باز کردن منو"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-2 pt-2 border-b border-slate-100 pb-3">
              <Link
                to="/shop"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>کاتالوگ محصولات</span>
              </Link>
              <Link
                to="/shop/track"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-slate-500" />
                <span>پیگیری سفارش</span>
              </Link>
              <Link
                to="/activate"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4 text-slate-500" />
                <span>فعال‌سازی کارت</span>
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="p-2.5 rounded-xl bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 text-start cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>{isAuthenticated ? 'حساب کاربری' : 'ورود مشتری'}</span>
              </button>
            </div>

            <div className="space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="block px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
