import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  QrCode,
  Radio,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from './context/CartContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui/Button';

export const CartView: React.FC = () => {
  const { items, updateQuantity, removeItem, clearCart, totalItems, totalAmount } = useCart();
  const { language } = useLanguage();
  const isFa = language === 'fa';
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-xl mx-auto space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isFa ? 'سبد خرید شما خالی است' : 'Your Shopping Cart is Empty'}
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            {isFa
              ? 'شما هنوز هیچ محصولی را به سبد خرید خود اضافه نکرده‌اید.'
              : 'You have not added any products to your cart yet.'}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/shop')}
          icon={isFa ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        >
          {isFa ? 'مشاهده کاتالوگ و خرید' : 'Browse Catalog'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
            {isFa ? 'سبد خرید شما' : 'Your Shopping Cart'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isFa
              ? `شما ${totalItems} قلم کالا در سبد خرید خود دارید`
              : `You have ${totalItems} items in your shopping cart`}
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 self-start sm:self-auto transition-colors font-semibold cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {isFa ? 'خالی کردن سبد خرید' : 'Clear Cart'}
        </button>
      </div>

      {/* Cart Layout: Items + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const isNfcQr = item.productType === 'NFC_QR';
            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Product Info */}
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                    {isNfcQr ? <QrCode className="w-6 h-6" /> : <Radio className="w-6 h-6" />}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{item.productTitle}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {isNfcQr ? 'NFC + QR' : 'NFC Only'}
                      </span>
                    </div>

                    {/* Destination Status Pill */}
                    <div className="flex items-center gap-2 text-xs">
                      {item.destinationConfigured ? (
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{item.destinationType}</span>:
                          <span className="font-mono text-[10px] truncate max-w-[180px]" dir="ltr">
                            {item.destinationUrl}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          🛡️ {isFa ? 'تنظیم مقصد بعداً (کارت خام)' : 'Destination Setup Later'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price & Quantity Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold text-sm text-slate-900 w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line Price */}
                  <div className="text-end min-w-[100px]">
                    <p className="text-sm font-black text-slate-900">
                      {(item.unitPrice * item.quantity).toLocaleString('fa-IR')}{' '}
                      <span className="text-[10px] font-normal text-slate-500">{isFa ? 'تومان' : 'Toman'}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {item.quantity} × {item.unitPrice.toLocaleString('fa-IR')}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="حذف قلم"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <Link
              to="/shop"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <span>+</span>
              <span>{isFa ? 'افزودن محصولات بیشتر به سبد' : 'Add more products to cart'}</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-6 sticky top-24 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4">
            {isFa ? 'خلاصه فاکتور سفارش' : 'Order Summary'}
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{isFa ? 'تعداد کل اقلام' : 'Total Items'}</span>
              <span className="font-mono font-bold text-slate-900">{totalItems}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>{isFa ? 'مجموع قیمت محصولات' : 'Subtotal'}</span>
              <span className="font-bold text-slate-900">
                {totalAmount.toLocaleString('fa-IR')} {isFa ? 'تومان' : 'Toman'}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>{isFa ? 'هزینه ارسال' : 'Shipping Fee'}</span>
              <span className="text-slate-500 font-medium text-[11px]">
                {isFa ? 'محاسبه در مرحله پرداخت بر اساس استان' : 'Calculated at checkout'}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
              <span className="text-sm font-extrabold text-slate-900">{isFa ? 'مبلغ قابل پرداخت' : 'Total Payable'}</span>
              <span className="text-xl font-black text-blue-600">
                {totalAmount.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-500">{isFa ? 'تومان' : 'Toman'}</span>
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => navigate('/shop/checkout')}
            icon={isFa ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          >
            {isFa ? 'ادامه فرآیند ثبت و پرداخت' : 'Proceed to Checkout'}
          </Button>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              {isFa ? 'تضمین اصالت سخت‌افزار' : 'Certified Hardware Quality'}
            </p>
            <p>
              {isFa
                ? 'کارت‌ها بلافاصله پس از ثبت سفارش وارد چرخه تولید کارخانه و کنترل کیفیت QC می‌شوند.'
                : 'Orders enter factory provisioning and QC pipeline immediately upon placement.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
