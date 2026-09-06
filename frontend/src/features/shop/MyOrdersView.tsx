import React, { useEffect, useState } from 'react';
import { Package, Truck, Calendar, CheckCircle, ExternalLink, ShieldCheck, LogOut } from 'lucide-react';
import { api } from '../../services/apiClient';
import { useLanguage } from '../../i18n/LanguageContext';
import { ShopCheckoutResponse } from '../../types/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { LoginMethodsCard } from './LoginMethodsCard';
import { useAuth } from './context/AuthContext';
import { AuthModal } from '../../components/AuthModal';

export const MyOrdersView: React.FC = () => {
  const { language } = useLanguage();
  const isFa = language === 'fa';
  const navigate = useNavigate();
  const { isAuthenticated, logout, login } = useAuth();

  const [orders, setOrders] = useState<ShopCheckoutResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setError(isFa ? 'لطفا ابتدا وارد حساب کاربری خود شوید' : 'Please log in to view your orders');
      setIsLoading(false);
      return;
    }

    loadOrders();
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getMyOrders();
      setOrders(data);
    } catch (err: any) {
      if (err.message?.includes('401')) {
        setError(isFa ? 'نشست شما منقضی شده است. لطفا دوباره وارد شوید.' : 'Session expired. Please log in again.');
        logout();
      } else {
        setError(err.message || (isFa ? 'خطا در دریافت سفارشات' : 'Error loading orders'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/shop');
  };

  if (isLoading && isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto space-y-8" dir={isFa ? 'rtl' : 'ltr'}>
        <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center shadow-sm">
          <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            {isFa ? 'ورود به حساب کاربری' : 'Login Required'}
          </h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            {isFa 
              ? 'برای مشاهده تاریخچه سفارشات و مدیریت حساب خود، لطفا وارد شوید.' 
              : 'Please log in to view your order history and manage your account.'}
          </p>
          <Button 
            variant="primary" 
            size="lg"
            className="w-full sm:w-auto px-12"
            onClick={() => setIsAuthModalOpen(true)}
          >
            {isFa ? 'ورود / ثبت‌نام' : 'Log In / Sign Up'}
          </Button>
        </div>

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
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8" dir={isFa ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {isFa ? 'سفارشات من' : 'My Orders'}
            </h1>
            <p className="text-slate-500">
              {isFa ? 'پیگیری و سوابق خرید شما' : 'Track and manage your past purchases'}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
          <LogOut className="w-4 h-4 mr-2" />
          {isFa ? 'خروج از حساب' : 'Log Out'}
        </Button>
      </div>

      <LoginMethodsCard />

      {error ? (
        <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center">
          <ShieldCheck className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">{error}</h3>
          <Button variant="primary" onClick={() => navigate('/shop')} className="mt-4">
            {isFa ? 'بازگشت به فروشگاه' : 'Back to Shop'}
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100 p-12 rounded-3xl text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {isFa ? 'هیچ سفارشی یافت نشد' : 'No orders found'}
          </h3>
          <p className="text-slate-500 mb-6">
            {isFa ? 'شما هنوز سفارشی ثبت نکرده‌اید.' : 'You have not placed any orders yet.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/shop')}>
            {isFa ? 'شروع خرید' : 'Start Shopping'}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.shop_order_number} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-500">
                      {isFa ? 'شماره سفارش:' : 'Order No:'}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {order.shop_order_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {new Date(order.created_at).toLocaleDateString(isFa ? 'fa-IR' : 'en-US')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      {order.payment_status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${
                    order.status === 'SHIPPED' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    {order.status === 'SHIPPED' ? <Truck className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                    {order.status === 'SHIPPED' ? (isFa ? 'ارسال شده' : 'Shipped') : (isFa ? 'در حال آماده‌سازی' : 'Processing')}
                  </div>
                  <div className="font-bold text-slate-900">
                    {order.total_amount.toLocaleString()} {isFa ? 'تومان' : 'IRT'}
                  </div>
                </div>
              </div>

              {/* Shipping Tracking info if SHIPPED */}
              {order.status === 'SHIPPED' && (
                <div className="mb-6 p-4 bg-slate-50 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-500 shadow-sm border border-slate-100">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {order.shipping_method === 'COURIER'
                          ? isFa
                            ? 'روش ارسال: پیک موتوری تهران 🛵'
                            : 'Method: Tehran Courier 🛵'
                          : isFa
                          ? 'کد رهگیری مرسوله پستی:'
                          : 'Postal Tracking Code:'}
                      </div>
                      {order.shipping_tracking_code && (
                        <div className="font-mono font-bold text-blue-600">
                          {order.shipping_tracking_code}
                        </div>
                      )}
                      {order.shipping_method === 'COURIER' && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {isFa ? 'مرسوله با پیک تحویل داده شده است.' : 'Dispatched via same-day courier in Tehran.'}
                        </div>
                      )}
                    </div>
                  </div>
                  {order.shipping_tracking_code && order.shipping_method !== 'COURIER' && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(`https://tracking.post.ir/?traking_code=${order.shipping_tracking_code}`, '_blank')
                      }
                    >
                      {isFa ? 'پیگیری در پست' : 'Track Package'}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              )}

              {/* Items */}
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
                    <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={`/images/products/${item.product_type.toLowerCase()}-thumb.png`} alt={item.product_title} className="w-12 h-12 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{item.product_title}</h4>
                      <p className="text-sm text-slate-500 truncate">
                        {item.destination_configured ? (
                          isFa ? 'لینک تنظیم شده' : 'Link Configured'
                        ) : (
                          isFa ? 'نیاز به تنظیم لینک' : 'Setup Required'
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{item.quantity} {isFa ? 'عدد' : 'pcs'}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
