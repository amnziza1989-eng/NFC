import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  Printer,
  ExternalLink,
  Building2,
  Truck,
  LayoutDashboard,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ShopCheckoutResponse } from '../../types/api';
import { Button } from '../../components/ui/Button';

export const OrderSuccessView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isFa = language === 'fa';

  const orderData = location.state?.orderData as ShopCheckoutResponse | undefined;

  if (!orderData) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-xl mx-auto space-y-6 shadow-sm">
        <Package className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">
          {isFa ? 'اطلاعات سفارش یافت نشد' : 'Order Information Not Found'}
        </h2>
        <Button variant="primary" onClick={() => navigate('/shop')}>
          {isFa ? 'بازگشت به فروشگاه' : 'Back to Shop'}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Celebration Header */}
      <div className="text-center space-y-4 p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          {isFa ? 'سفارش شما با موفقیت ثبت و پرداخت شد!' : 'Order Successfully Placed & Paid!'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          {isFa
            ? 'سفارش شما وارد چرخه تولید کارخانه شد و کارت‌های هوشمند در صف آماده‌سازی قرار گرفتند.'
            : 'Your order has entered factory queue and smart review cards are scheduled for batch production.'}
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-blue-700">
            {isFa ? 'کد رهگیری فروشگاه:' : 'Shop Order:'} {orderData.shop_order_number}
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
            ✓ {orderData.payment_status}
          </span>
        </div>
      </div>

      {/* Order Details Receipt Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">{isFa ? 'رسید پرداخت و جزئیات بسته' : 'Payment Receipt'}</h2>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5">
              Ref: {orderData.payment_reference} • {new Date(orderData.created_at).toLocaleString('fa-IR')}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{isFa ? 'چاپ فاکتور' : 'Print'}</span>
          </button>
        </div>

        {/* Customer & Shipping Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              {isFa ? 'مشخصات خریدار' : 'Customer Details'}
            </p>
            <p className="font-bold text-slate-900">{orderData.customer_name}</p>
            {orderData.company_name && <p className="text-slate-600">{orderData.company_name}</p>}
            <p className="text-slate-500 font-mono" dir="ltr">{orderData.customer_phone}</p>
            <p className="text-slate-500 font-mono" dir="ltr">{orderData.customer_email}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                {isFa ? 'آدرس تحویل گیرنده' : 'Shipping Details'}
              </p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {orderData.shipping_method === 'COURIER'
                  ? isFa
                    ? '🛵 پیک تهران'
                    : 'Tehran Courier'
                  : isFa
                  ? '📦 پست پیشتاز'
                  : 'Postal Shipping'}
              </span>
            </div>
            <p className="font-semibold text-slate-900">{orderData.shipping_city} — {orderData.shipping_address}</p>
            <p className="text-slate-500 font-mono">{isFa ? 'کد پستی:' : 'Postal Code:'} {orderData.shipping_postal_code}</p>
            {orderData.shipping_notes && <p className="text-slate-500 italic text-[11px]">{orderData.shipping_notes}</p>}
          </div>
        </div>

        {/* Items & Factory Order Linkage */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {isFa ? 'اقلام خریداری شده و سفارشات تولید متناظر در کارخانه' : 'Purchased Items & Factory Linkage'}
          </h3>

          <div className="space-y-2.5">
            {orderData.items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.product_title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {item.product_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{item.quantity} عدد</span>
                    <span>•</span>
                    {item.destination_configured ? (
                      <span className="text-emerald-700 font-medium">✓ {item.destination_type}</span>
                    ) : (
                      <span className="text-amber-700 font-medium">🛡️ {isFa ? 'تنظیم بعداً (کارت خام)' : 'Configured Later'}</span>
                    )}
                  </div>
                </div>

                {/* Factory order connection tag */}
                {item.fulfillment_order_number && (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[10px] text-slate-500">{isFa ? 'کد سفارش کارخانه:' : 'Factory Order:'}</span>
                    <Link
                      to="/orders"
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold text-xs hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      <span>{item.fulfillment_order_number}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Total Price footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
          <span className="text-sm font-bold text-slate-900">{isFa ? 'مبلغ کل پرداخت شده' : 'Total Paid'}</span>
          <span className="text-xl font-black text-blue-600">
            {orderData.total_amount.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-500">{isFa ? 'تومان' : 'Toman'}</span>
          </span>
        </div>
      </div>

      {/* Next Actions Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <Link
          to="/shop"
          className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors font-medium"
        >
          <span>←</span>
          <span>{isFa ? 'بازگشت به صفحه کاتالوگ فروشگاه' : 'Back to Shop Catalog'}</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to={`/shop/track?num=${orderData.shop_order_number}`}
            className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <span>{isFa ? 'سامانه رهگیری سفارش' : 'Track Order'}</span>
          </Link>

          <Button
            variant="primary"
            onClick={() => navigate('/orders')}
            icon={<LayoutDashboard className="w-4 h-4" />}
          >
            {isFa ? 'پنل کارخانه' : 'Factory Panel'}
          </Button>
        </div>
      </div>
    </div>
  );
};
